// Generate a SAS investigation kit from the existing, verified Sassy MT32 engine.
// This does not implement SURVEYSELECT or predict its selected records.
import assert from 'node:assert/strict';
import {readFileSync, writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {run, parseCSV} from '../dist/engine.mjs';
import {portableZip} from '../dist/portable-export.mjs';

const dir = new URL('../examples/surveyselect-validation/', import.meta.url);
const program = `data uniform_probe;
  call streaminit('MT32',12345);
  do draw=1 to 400;
    uniform=rand('uniform');
    uniform_hex=put(uniform,hex16.);
    output;
  end;
run;`;
const actual = run(program).datasets.uniform_probe.rows;
const prior = parseCSV(readFileSync(new URL('../fixtures/sas/mt32-seed12345.csv', import.meta.url), 'utf8'));
for (let i = 0; i < actual.length; i++) {
  const expected = prior.rows[Math.floor(i / 2)][i % 2 ? 'random_y_hex' : 'random_x_hex'];
  assert.equal(actual[i].uniform_hex, expected, `Existing SAS fixture: draw ${i + 1}`);
}
assert.equal(actual.length, 400);
writeFileSync(new URL('sassy_mt32_uniform.csv', dir),
  'draw,uniform_hex\n' + actual.map(r => `${r.draw},${r.uniform_hex}`).join('\n') + '\n');
const names = ['01-surveyselect-reference.sas', 'sassy_mt32_uniform.csv', 'README.md'];
const manifest = Object.fromEntries(names.map(name => {
  const bytes = readFileSync(new URL(name, dir));
  return [name, {bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex')}];
}));
writeFileSync(new URL('manifest.json', dir), JSON.stringify({
  purpose: 'SAS-only SURVEYSELECT reference collection; procedure not implemented in Sassy',
  sassyVersion: JSON.parse(readFileSync(new URL('../package.json', import.meta.url))).version,
  uniformFixture: {seed: 12345, generator: 'MT32', draws: 400,
    verifiedAgainst: 'fixtures/sas/mt32-seed12345.csv'},
  files: manifest
}, null, 2) + '\n');
console.log('Reference kit: 400 exact uniform hex values checked against the prior SAS fixture.');
const files = Object.fromEntries([...names, 'manifest.json'].map(name =>
  [name, readFileSync(new URL(name, dir), 'utf8')]));
const zip = portableZip(files);
writeFileSync(new URL('surveyselect-reference.zip', dir), zip);
console.log(`Downloadable reference ZIP: ${zip.length} bytes.`);
