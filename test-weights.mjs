import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runFileProgram} from './dist/file-program.mjs';
const close=(a,b,eps=1e-10)=>assert.ok(Math.abs(a-b)<=eps*Math.max(1,Math.abs(b)),`${a} != ${b}`);
const code=`data f; x=1; w=1; output; x=3; w=3; output; x=100; w=0; output; x=-100; w=-2; output; x=999; w=.; output; x=.; w=2; output; run;`;
const means=(opts='',vardef='df')=>`${code} proc means data=f ${opts} vardef=${vardef}; var x; weight w; output out=s n=n nmiss=missing sum=total sumwgt=weights mean=avg var=variance std=sd stderr=se min=lo max=hi css=css uss=uss; run;`;
let r=await runFileProgram(means());let s=r.datasets.s.rows[0];assert.equal(s._freq_,6);assert.equal(s.n,4);assert.equal(s.missing,1);close(s.weights,4);close(s.total,10);close(s.avg,2.5);close(s.css,3);close(s.variance,1);close(s.se,.5);assert.equal(s.lo,-100);assert.equal(s.hi,100);close(s.uss,28);
r=await runFileProgram(means('exclnpwgt'));s=r.datasets.s.rows[0];assert.equal(s._freq_,6);assert.equal(s.n,2);close(s.variance,3);close(s.se,Math.sqrt(3)/2);assert.equal(s.lo,1);assert.equal(s.hi,3);
for(const [definition,v] of [['n',.75],['wdf',1],['weight',.75],['wgt',.75]]){r=await runFileProgram(means('',definition).replace('stderr=se',''));close(r.datasets.s.rows[0].variance,v);}
r=await runFileProgram('data f; x=2; w=0; output; x=3; w=-1; output; run; proc means data=f; var x; weight w; output out=s n=n mean=m sumwgt=sw; run;');assert.equal(r.datasets.s.rows[0].n,2);assert.equal(r.datasets.s.rows[0].sw,0);assert.equal(r.datasets.s.rows[0].m,null);
r=await runFileProgram('data f; g=1; x=1; w=1; output; g=2; x=3; w=3; output; run; proc means data=f; class g; var x; weight w; output out=s mean=m sumwgt=sw; run;');close(r.datasets.s.rows[0].m,2.5);assert.deepEqual(r.datasets.s.rows.map(v=>v._type_),[0,1,1]);
r=await runFileProgram('data f; x=2; w=1; output; x=4; w=3; output; run; proc means data=f; weight w; run;');assert.deepEqual(r.reports[0].dataset.rows.map(v=>v.variable),['x']);
const ref=JSON.parse(readFileSync('fixtures/weighted-glm-independent.json'));
// Original comparison expectations passed every requested statistic in SAS;
// only _FREQ_ below is taken directly from SAS's reported difference tables.
const sasWeights=JSON.parse(readFileSync('fixtures/sas/weights-validation-v1.json'));
for(const c of sasWeights.means){
 const actual=await runFileProgram(c.program),rows=actual.datasets[c.name].rows;
 assert.equal(rows.length,c.expected.length);
 for(const [i,expected] of c.expected.entries())for(const [key,value] of Object.entries(expected)){
  if(typeof value==='number')close(rows[i][key],value);else assert.equal(rows[i][key],value);
 }
 assert.deepEqual(actual.reports[0].dataset.rows.map(v=>v.n_obs),[4,4]);
}
// Keep CLASS/MISSING, BY and empty weighted analyses separate from source counts.
r=await runFileProgram(`data f;
 b=1; g='A'; x=1; w=1; output; x=3; w=.; output;
 g='B'; x=4; w=0; output; g=''; x=9; w=1; output;
 b=2; g='A'; x=7; w=-1; output;
 run; proc means data=f exclnpwgt; by b; class g; var x; weight w;
 output out=s n=n nmiss=nm mean=m; run;`);
assert.deepEqual(r.datasets.s.rows.map(v=>[v.b,v.g,v._freq_,v.n,v.nm,v.m]),[
 [1,'',3,1,0,1],[1,'A',2,1,0,1],[1,'B',1,0,0,null],[2,'',1,0,0,null],[2,'A',1,0,0,null]
]);
const missingClass=await runFileProgram(`data f; g=''; x=1; w=.; output; run;
 proc means data=f missing; class g; var x; weight w; output out=s n=n; run;`);
assert.deepEqual(missingClass.datasets.s.rows.map(v=>[v._type_,v._freq_,v.n]),[[0,1,0],[1,1,0]]);
const ds={columns:['a','b','x','y','w'],rows:ref.rows,types:{a:'char',b:'char',x:'num',y:'num',w:'num'},formats:{},lengths:{a:2,b:2}};
const model='ods output ModelANOVA=tests OverallANOVA=anova FitStatistics=fit ParameterEstimates=params; proc glm data=f; class a b; model y=a b x a*b a*x / solution; weight w; output out=scored p=p r=r; run; quit; ods output close;';
r=await runFileProgram(model,{f:ds});close(r.datasets.anova.rows[1].ss,ref.sse);close(r.datasets.anova.rows[2].ss,ref.sst);assert.equal(r.datasets.anova.rows[1].df,24);close(r.datasets.fit.rows[0].depmean,ref.mean);
for(const t of ref.tests){const rows=r.datasets.tests.rows.filter(v=>v.source===t.source);close(rows.find(v=>v.hypothesistype===1).ss,t.ss1);const three=rows.find(v=>v.hypothesistype===3);close(three.ss,t.ss3);close(three.fvalue,t.f3);close(three.probf,t.p3);}
for(const [i,p] of ref.predicted.entries())close(r.datasets.scored.rows[i].p,p);
const scaled=await runFileProgram(model,{f:{...ds,rows:ds.rows.map(r=>({...r,w:r.w*10}))}});for(const [i,p] of r.datasets.params.rows.entries()){close(p.estimate,scaled.datasets.params.rows[i].estimate);if(p.stderr!==null)close(p.stderr,scaled.datasets.params.rows[i].stderr);}close(scaled.datasets.anova.rows[1].ss,r.datasets.anova.rows[1].ss*10);for(const [i,t] of r.datasets.tests.rows.entries())close(t.fvalue,scaled.datasets.tests.rows[i].fvalue);
r=await runFileProgram('data f; do x=1 to 5; y=2+3*x; w=x; output; end; x=99; y=-999; w=0; output; x=100; w=-1; output; x=101; w=.; output; run; ods output NObs=obs ParameterEstimates=params; proc glm data=f; weight w; model y=x / solution; output out=pred p=p r=r; run; quit;');assert.equal(r.datasets.obs.rows[0].nobsused,5);close(r.datasets.params.rows[0].estimate,2);close(r.datasets.params.rows[1].estimate,3);assert.equal(r.datasets.pred.rows.length,8);
for(const c of ['proc means data=f; var y; weight absent; run;','proc means data=f; weight w; weight w; run;','proc glm data=f; model y=x; weight w; weight w; run;','proc means data=f; var y; weight w / normalize; run;'])await assert.rejects(runFileProgram(c,{f:ds}));
await assert.rejects(runFileProgram('data f; x=1; y=2; w="bad"; run; proc glm data=f; model y=x; weight w; run;'),/numeric/);
await assert.rejects(runFileProgram('data f; x=1; y=2; w=0; run; proc glm data=f; model y=x; weight w; run;'),/no complete/);
console.log('WEIGHT: documented MEANS counts/missingness, EXCLNPWGT, SUMWGT/divisors/standard errors, CLASS totals, independent weighted GLM Type I/III/SOLUTION/predictions, scale invariance and exclusions passed. Actual SAS: ten GLM groups passed; five MEANS groups differed only in _FREQ_, corrected and locally replayed against recorded SAS counts. Fresh corrected SAS run pending.');
