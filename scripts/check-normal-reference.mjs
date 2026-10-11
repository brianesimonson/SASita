// Research prototype only. Sassy v0.4.9's deployed NORMAL behavior is unchanged.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createUniformGenerator} from '../dist/random.mjs';
const fixture=JSON.parse(readFileSync(new URL('../fixtures/sas/normal-method-probe.json',import.meta.url)));
function pairedPolar(uniform){
 let cached=null;
 return ()=>{
  if(cached!==null){const value=cached;cached=null;return value;}
  let x,y,s;
  do{x=2*uniform()-1;y=2*uniform()-1;s=x*x+y*y;}while(s<=0||s>=1);
  const factor=Math.sqrt(-2*Math.log(s)/s);
  cached=y*factor;
  return x*factor;
 };
}
function hex(x){const b=Buffer.alloc(8);b.writeDoubleBE(x);return b.toString('hex').toUpperCase();}
let normals=0,uniforms=0,exact=0,maxAbs=0;
for(const context of fixture.contexts){
 const uniform=createUniformGenerator(context.seed,context.generator==='DEFAULT'?'MTHYBRID':context.generator);
 const normal=pairedPolar(uniform),printed=new Map(context.printed_rows.map(r=>[r.id,r]));
 for(let id=1;id<=context.draws;id++){
  const z=normal(),next=context.mode==='MIXED'||id===context.draws?hex(uniform()):'';
  const ref=printed.get(id);if(!ref)continue;
  const actual=Buffer.from(ref.z_hex,'hex').readDoubleBE();
  const error=Math.abs(z-actual);maxAbs=Math.max(maxAbs,error);
  assert.ok(error<=1e-14*Math.max(1,Math.abs(actual)),`${context.generator}/${context.mode} id=${id}: normal accuracy`);
  normals++;if(hex(z)===ref.z_hex)exact++;
  if(ref.next_u_hex){assert.equal(next,ref.next_u_hex,`${context.generator}/${context.mode} id=${id}: stream consumption`);uniforms++;}
 }
 const score=fixture.summaries.find(s=>s.generator===context.generator&&s.mode===context.mode&&s.candidate==='polar_pair_x');
 assert.equal(score.draws,512);assert.equal(score.close_z,512);assert.equal(score.exact_uniform,score.uniform_checks);
 console.log(`${context.generator}/${context.mode}: printed normals and subsequent uniform values match; SAS candidate ${score.exact_z}/512 normals exactly equal, 512/512 within tolerance.`);
}
assert.equal(normals,52);assert.equal(uniforms,28);
console.log(`JavaScript paired-polar prototype: ${normals} printed normals checked, ${exact} bit-identical, max absolute error ${maxAbs}; ${uniforms}/${uniforms} uniform witnesses exact.`);
console.log('Full 512-value JavaScript normal fixtures, additional seeds/parameters/tails and app integration remain future work.');
