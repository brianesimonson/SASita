// Actual SAS fixture, with exact bits unaffected by decimal CSV export rounding.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {run,parseCSV} from './dist/engine.mjs';
import {createMT32} from './dist/random.mjs';
const bytes=readFileSync('fixtures/sas/mt32-seed12345.csv');
const meta=JSON.parse(readFileSync('fixtures/sas/mt32-seed12345.meta.json','utf8'));
assert.equal(createHash('sha256').update(bytes).digest('hex'),meta.source_sha256);
const reference=parseCSV(bytes.toString());
assert.deepEqual(reference.columns,['id','random_x','random_y','systematic_x','systematic_y','random_x_hex','random_y_hex']);
assert.equal(reference.rows.length,20000);
const program=readFileSync('examples/validation/01-calculations.sas','utf8');
const inputs=run(program.slice(0,program.indexOf('run;')+4)).datasets.numeric_inputs;
const core=createMT32(12345);
let checked=0;
for(let i=0;i<20000;i++) {
 const ref=reference.rows[i],actual=inputs.rows[i];
 assert.equal(ref.id,i+1);assert.equal(ref.systematic_x,i+1);assert.equal(ref.systematic_y,i+20001);
 for(const column of ['random_x','random_y']) {
  const expected=ref[column+'_hex'];
  assert.match(expected,/^[0-9A-F]{16}$/);
  assert.equal(actual[column+'_hex'],expected,`SAS id=${ref.id} ${column}: exact uniform bits`);
  // Recover the raw integer from the SAS bits independently of its shortened CSV decimal.
  const b=Buffer.from(expected,'hex');
  assert.equal(Math.round(b.readDoubleBE()*2**32),core.uint32(),`SAS id=${ref.id} ${column}: integer stream`);
  checked++;
 }
}
assert.equal(checked,40000);
console.log('SAS MT32 fixture: all 40,000 uniform draws and recovered core integers match exactly (seed 12345). Other seeds and normal sequences unverified.');
