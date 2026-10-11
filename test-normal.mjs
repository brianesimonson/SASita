import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {run} from './dist/engine.mjs';
const fixture=JSON.parse(readFileSync('fixtures/sas/normal-method-probe.json'));
let compared=0,witnesses=0,exact=0,maxError=0;
for(const context of fixture.contexts){
 const init=context.generator==='DEFAULT'?'call streaminit(12345);':"call streaminit('MT32',12345);";
 const next=context.mode==='MIXED'?"next_u_hex=put(rand('uniform'),hex16.);":"next_u_hex=''; if id=512 then next_u_hex=put(rand('uniform'),hex16.);";
 const result=run(`data normal_probe; ${init} do id=1 to 512; z=rand('normal'); z_hex=put(z,hex16.); ${next} output; end; run;`);
 assert.equal(result.datasets.normal_probe.rows.length,512);
 for(const reference of context.printed_rows){
  const row=result.datasets.normal_probe.rows[reference.id-1];
  const expected=Buffer.from(reference.z_hex,'hex').readDoubleBE();
  const error=Math.abs(row.z-expected);maxError=Math.max(maxError,error);
  assert.ok(error<=1e-14*Math.max(1,Math.abs(expected)),context.generator+'/'+context.mode+' id '+reference.id);
  compared++;if(row.z_hex===reference.z_hex)exact++;
  if(reference.next_u_hex){assert.equal(row.next_u_hex,reference.next_u_hex);witnesses++;}
 }
}
assert.equal(compared,52);assert.equal(witnesses,28);
// The cached value is standard, not scaled using the previous call's parameters.
const init="call streaminit('MT32',12345);";
const standard=run(`data a; ${init} x=rand('normal'); y=rand('normal'); u=rand('uniform'); run;`).datasets.a.rows[0];
const scaled=run(`data a; ${init} x=rand('normal',10,2); y=rand('normal',-7,3); u=rand('uniform'); run;`).datasets.a.rows[0];
assert.equal(scaled.x,10+2*standard.x);assert.equal(scaled.y,-7+3*standard.y);assert.equal(scaled.u,standard.u);
const interrupted=run(`data a; ${init} x=rand('normal'); u=rand('uniform'); call streaminit(1); y=rand('normal'); run;`).datasets.a.rows[0];
assert.equal(interrupted.x,standard.x);assert.equal(interrupted.y,standard.y);assert.equal(interrupted.u,standard.u);
const reset=run(`data a; ${init} x=rand('normal'); run; data b; ${init} x=rand('normal'); run;`);assert.equal(reset.datasets.a.rows[0].x,reset.datasets.b.rows[0].x);
assert.equal(run(`data a; ${init} x=rand('normal',7,0); y=rand('normal'); run;`).datasets.a.rows[0].y,standard.y);
console.log(`Integrated NORMAL: ${compared} SAS printed values (${exact} exact), maximum absolute difference ${maxError}; ${witnesses} exact uniform witnesses; parameter scaling, cached-pair lifecycle and DATA-step reset passed.`);
