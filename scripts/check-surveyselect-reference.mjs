// Investigation only: no SURVEYSELECT support is installed in the Sassy app.
// Compare independently generated selections with the user's actual SAS CSVs.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {parseCSV} from '../dist/engine.mjs';
import {createMT32} from '../dist/random.mjs';

const home = new URL('../fixtures/sas/surveyselect-9.4m8/', import.meta.url);
const manifest = JSON.parse(readFileSync(new URL('manifest.json', home)));
const tables = {};
for (const [name, descriptor] of Object.entries(manifest.files)) {
  const bytes = readFileSync(new URL(name, home));
  assert.equal(createHash('sha256').update(bytes).digest('hex'), descriptor.sha256);
  const table = parseCSV(bytes.toString());
  assert.equal(table.rows.length, descriptor.rows);
  assert.deepEqual(table.columns, descriptor.columns.map(x => x.toLowerCase()));
  tables[name.replace('.csv', '')] = table.rows;
}

// Candidate MT19937 initialization: state[0]=seed; state[i]=69069*state[i-1].
// The modern MT32 implementation instead uses the 2002 initialization.
// This independently generates all 400 default RAND HEX16 values for seed 12345.
// It is not a claim to implement every SAS default/hybrid seed-selection rule.
function oldInitialization(seed) {
  const state = new Uint32Array(624);
  state[0] = seed >>> 0;
  for (let i = 1; i < 624; i++) state[i] = Math.imul(69069, state[i - 1]) >>> 0;
  let index = 624;
  return () => {
    if (index === 624) {
      for (let i = 0; i < 624; i++) {
        const y = (state[i] & 0x80000000) | (state[(i + 1) % 624] & 0x7fffffff);
        state[i] = state[(i + 397) % 624] ^ (y >>> 1) ^ ((y & 1) ? 0x9908b0df : 0);
      }
      index = 0;
    }
    let y = state[index++];
    y ^= y >>> 11;
    y ^= (y << 7) & 0x9d2c5680;
    y ^= (y << 15) & 0xefc60000;
    y ^= y >>> 18;
    return (y >>> 0) * 2.328306436538696e-10;
  };
}
function hex(value) {
  const buffer = Buffer.alloc(8);
  buffer.writeDoubleBE(value);
  return buffer.toString('hex').toUpperCase();
}
const mt32 = createMT32(12345), defaults = oldInitialization(12345);
for (let i = 0; i < 400; i++) {
  assert.equal(hex(mt32.uint32() * 2.328306436538696e-10), tables.ss_uniform_mt32[i].uniform_hex);
  assert.equal(hex(defaults()), tables.ss_uniform_default[i].uniform_hex);
}
console.log('Explicit MT32 and candidate default initialization: 400/400 exact hex values EACH.');

function srs(N, n, uniform) {
  const selected = new Set();
  for (let j = N - n + 1; j <= N; j++) {
    const t = Math.floor(uniform() * j) + 1;
    selected.add(selected.has(t) ? j : t);
  }
  return [...selected].sort((a, b) => a - b);
}
function sys(N, n, uniform) {
  const interval = N / n, start = uniform() * interval;
  return Array.from({length: n}, (_, j) => Math.floor(start + j * interval) + 1);
}
function urs(N, n, uniform, expanded) {
  const hits = new Map();
  for (let i = 0; i < n; i++) {
    const id = Math.floor(uniform() * N) + 1;
    hits.set(id, (hits.get(id) || 0) + 1);
  }
  return [...hits].sort((a, b) => a[0] - b[0]).flatMap(([id, numberhits]) =>
    Array.from({length: expanded ? numberhits : 1}, () => ({id, numberhits})));
}
let checked = 0;
function check(name, generated, fields = ['id']) {
  const project = rows => rows.map(row => Object.fromEntries(fields.map(f => [f, row[f]])));
  assert.deepEqual(project(generated), project(tables[name]), name);
  // Validate source identity and exposed design fields independently of selections.
  for (const row of tables[name]) {
    assert.equal(row.value, row.id * 10);
    assert.equal(row.stratum, Math.ceil(row.id / 5));
    const N = name.startsWith('ss_strata') ? 5 : 20;
    assert.equal(row.total, N);
    const n = row.samplesize ?? Math.ceil(N * row.samplingrate);
    if ('selectionprob' in row) assert.equal(row.selectionprob, n / N);
    if ('expectedhits' in row) assert.equal(row.expectedhits, n / N);
    assert.ok(Math.abs(row.samplingweight - N / n) <= 1e-13, name + ' CSV weight');
  }
  checked++;
  console.log(name + ': selected rows and checked design values match.');
}
const ids = a => a.map(id => ({id}));
check('ss_srs', ids(srs(20, 7, oldInitialization(12345))));
check('ss_srs_second_seed', ids(srs(20, 7, oldInitialization(24680))));
check('ss_srs_rate', ids(srs(20, 6, oldInitialization(12345))));
check('ss_srs_census', ids(Array.from({length: 20}, (_, i) => i + 1)));
check('ss_urs_collapsed', urs(20, 40, oldInitialization(12345), false), ['id', 'numberhits']);
check('ss_urs_hits', urs(20, 40, oldInitialization(12345), true), ['id', 'numberhits']);
const replicateStream = oldInitialization(12345);
check('ss_urs_reps', [1, 2].flatMap(replicate =>
  urs(20, 7, replicateStream, true).map(row => ({replicate, ...row}))),
  ['replicate', 'id', 'numberhits']);
check('ss_sys_integer', ids(sys(20, 5, oldInitialization(12345))));
check('ss_sys_fractional', ids(sys(20, 6, oldInitialization(12345))));
const singleStream = oldInitialization(12345);
check('ss_strata_single_stream', [1, 2, 3, 4].flatMap(stratum =>
  srs(5, 2, singleStream).map(id => ({id: id + (stratum - 1) * 5, stratum}))), ['stratum', 'id']);

// Derive candidate seeds from the one procedure seed, independently of the CSV.
// Both conversion scales fit all four observed strata. They differ at stratum 5,
// so the four-stratum fixture cannot yet establish which conversion SAS uses.
function stratumSeeds(seed, count, scale) {
  const master = oldInitialization(seed);
  return Array.from({length: count}, (_, i) => i === 0 ? seed : Math.floor(master() * scale));
}
const scale31 = 2 ** 31, scale31minus1 = scale31 - 1;
assert.deepEqual(stratumSeeds(12345, 4, scale31), stratumSeeds(12345, 4, scale31minus1));
const derivedSeeds = stratumSeeds(12345, 4, scale31);
for (const [name, sampler] of [['ss_strata_srs', srs], ['ss_strata_sys', sys]]) {
  const rows = [1, 2, 3, 4].flatMap(stratum => {
    const initialseed = derivedSeeds[stratum - 1];
    return sampler(5, 2, oldInitialization(initialseed)).map(id =>
      ({id: id + (stratum - 1) * 5, stratum, initialseed}));
  });
  check(name, rows, ['stratum', 'id', 'initialseed']);
}
assert.equal(checked, 12);
console.log('12 sampling cases replayed successfully, including seeds derived from the single procedure seed.');
console.log('Stratum-5 predictions: scale 2^31 = ' + stratumSeeds(12345, 5, scale31)[4] +
  '; scale 2^31-1 = ' + stratumSeeds(12345, 5, scale31minus1)[4] + '.');
console.log('Investigation only: seed conversion remains ambiguous; hybrid/default rules for other seeds and app integration remain unimplemented.');
