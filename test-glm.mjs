import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runFileProgram} from './dist/file-program.mjs';
import {parseCSV} from './dist/engine.mjs';
import {glmFProbability,glmTProbability} from './dist/glm.mjs';
import {readTable} from './dist/table-storage.mjs';
const close=(a,b,eps=1e-10)=>assert.ok(Math.abs(a-b)<=eps*Math.max(1,Math.abs(b)),`${a} != ${b}`);
// Published SAS GLM example, printed pp. 2989–2990 of user-supplied glm.pdf.
const frame=parseCSV('a,b,y\nA1,B1,12\nA1,B1,14\nA1,B2,11\nA1,B2,9\nA2,B1,20\nA2,B1,18\nA2,B2,17');
const fit=async(terms='a|b',options='solution')=>runFileProgram(`ods output OverallANOVA=anova ModelANOVA=tests ParameterEstimates=parameters FitStatistics=fit; proc glm data=f; class a b; model y=${terms} / ${options}; output out=scored p=predicted r=residual; run; quit; ods output close;`,{f:frame});
let r=await fit();
for(const [source,one,three,p3] of [['A',80.047619047619,67.6,.0101],['B',11.266666666667,10,.1114],['A*B',.4,.4,.6850]]){
 const tests=r.datasets.tests.rows.filter(row=>row.source===source);close(tests.find(x=>x.hypothesistype===1).ss,one);close(tests.find(x=>x.hypothesistype===3).ss,three);close(tests.find(x=>x.hypothesistype===3).probf,p3,5e-5);
}
close(r.datasets.anova.rows[1].ss,6);close(r.datasets.anova.rows[1].ms,2);assert.equal(r.datasets.anova.rows[1].df,3);
close(r.datasets.fit.rows[0].rsquare,.9385964912280702);
assert.equal(r.datasets.parameters.rows.length,9);close(r.datasets.parameters.rows[0].estimate,17);close(r.datasets.parameters.rows[1].estimate,-7);close(r.datasets.parameters.rows[3].estimate,2);close(r.datasets.parameters.rows[5].estimate,1);
for(const row of r.datasets.parameters.rows.filter(x=>x.stderr!==null)){close(row.tvalue,row.estimate/row.stderr);close(row.probt,glmFProbability(row.tvalue**2,1,3));}
assert.ok(r.datasets.parameters.rows.every(x=>x.biased==='B'));assert.ok(r.datasets.parameters.rows.filter(x=>x.estimate===0).every(x=>x.stderr===null));
for(const [i,p] of [13,13,10,10,19,19,17].entries())close(r.datasets.scored.rows[i].predicted,p);
const reversed=await fit('b a b*a');for(const row of r.datasets.tests.rows.filter(x=>x.hypothesistype===3)){const rr=reversed.datasets.tests.rows.find(x=>x.source===row.source&&x.hypothesistype===3);close(rr.ss,row.ss);}
assert.notEqual(reversed.datasets.tests.rows.find(x=>x.source==='A'&&x.hypothesistype===1).ss,r.datasets.tests.rows.find(x=>x.source==='A'&&x.hypothesistype===1).ss);
// Independent full-rank effect coding with multiple levels and class-by-x terms.
const reference=JSON.parse(readFileSync('fixtures/glm-independent.json'));
const independent={columns:['a','b','x','y'],rows:reference.rows,types:{a:'char',b:'char',x:'num',y:'num'},formats:{},lengths:{a:2,b:2}};
r=await runFileProgram(`ods output ModelANOVA=tests OverallANOVA=anova; proc glm data=f; class a b; model y=${reference.model} / solution; output out=scored p=predicted; run; quit; ods output close;`,{f:independent});
for(const expected of reference.tests){const rows=r.datasets.tests.rows.filter(x=>x.source===expected.source);assert.equal(rows[0].df,expected.df);close(rows.find(x=>x.hypothesistype===1).ss,expected.ss1);const three=rows.find(x=>x.hypothesistype===3);close(three.ss,expected.ss3);close(three.fvalue,expected.f3);close(three.probf,expected.p3,1e-11);}
close(r.datasets.anova.rows[1].ss,reference.sse);assert.equal(r.datasets.anova.rows[1].df,reference.df_error);for(const [i,p] of reference.predicted.entries())close(r.datasets.scored.rows[i].predicted,p);
for(const x of reference.probabilities.f)close(glmFProbability(x.f,x.df1,x.df2),x.p,x.df2>10000?1e-9:1e-12);
for(const x of reference.probabilities.t)close(glmTProbability(x.t,x.df),x.p,1e-12);
// Three-way crossed expansion and balanced orthogonality.
r=await runFileProgram('data f; do a=1 to 2; do b=1 to 2; do c=1 to 2; do k=1 to 3; y=a+2*b+3*c+a*b+b*c+.1*k; output; end; end; end; end; run; ods output ModelANOVA=tests; proc glm data=f; class a b c; model y=a|b|c / solution; run; quit;');
assert.equal(r.datasets.tests.rows.length,14);for(const row of r.datasets.tests.rows.filter(x=>x.hypothesistype===1))close(row.ss,r.datasets.tests.rows.find(x=>x.source===row.source&&x.hypothesistype===3).ss);
// Numeric regression; SOLUTION is opt-in, output predicts missing responses.
r=await runFileProgram('data f; do x=1 to 5; y=2+3*x; output; end; x=6; y=.; output; run; ods output ParameterEstimates=params NObs=obs; proc glm data=f; model y=x / solution; output out=pred p=p r=r; run; quit;');close(r.datasets.params.rows[0].estimate,2);close(r.datasets.params.rows[1].estimate,3);assert.equal(r.datasets.obs.rows[0].nobsused,5);close(r.datasets.pred.rows.at(-1).p,20);assert.equal(r.datasets.pred.rows.at(-1).r,null);
r=await runFileProgram('proc glm data=f; class a b; model y=a b a*b / ss3; run; quit;',{f:frame});assert.ok(!r.reports.some(x=>x.title.includes('parameterestimates')));assert.ok(r.reports.find(x=>x.title.includes('modelanova')).dataset.rows.every(x=>x.hypothesistype===3));
const formatted=parseCSV('g,y\n1.1,1\n1.2,3\n2.1,5\n2.2,7');formatted.formats={g:'2.0'};
r=await runFileProgram('proc glm data=f; class g; model y=g / solution; run; quit;',{f:formatted});assert.equal(r.reports.find(x=>x.title.includes('classlevels')).dataset.rows[0].levels,2);
// A tiny but genuine residual variance must not be rounded away by a fit cutoff.
r=await runFileProgram('data f; x=1; y=1; output; x=2; y=2+1e-12; output; x=3; y=3; output; run; ods output OverallANOVA=small; proc glm data=f; model y=x; run; quit;');
assert.ok(r.datasets.small.rows[1].ss>1e-25&&r.datasets.small.rows[1].ss<1e-24);
// Native output and same-run reread use the existing file transaction protocol.
r=await runFileProgram("libname saved 'tables'; ods output ModelANOVA=saved.tests; proc glm data=f; class a b; model y=a|b / solution; output out=saved.scored p=p; run; quit; ods output close; data copied; set saved.tests; run;",{f:frame},undefined,{checkDirectory:async()=>true});assert.equal(r.exports.length,2);assert.deepEqual(readTable(r.exports[0].text).rows,r.datasets['saved.scored'].rows);assert.deepEqual(r.datasets.copied.rows,r.datasets['saved.tests'].rows);
for(const code of ['proc glm data=f; class a b; model y=a*b; run;','proc glm data=f; model y=y x / noint; run;','proc glm data=f; model y=a; run;','proc glm data=f; class a b; model y=a|b / ss2; run;','proc glm data=f; class a b; model y=a|b; random a; run;','ods output ParameterEstimates=p; proc glm data=f; class a b; model y=a|b; run;','ods output ModelANOVA=p; proc glm data=f noprint; class a b; model y=a|b; run;','proc glm data=f; class a b; model y=a|b; output out=p p=y; run;'])await assert.rejects(runFileProgram(code,{f:frame}));
await assert.rejects(runFileProgram('proc glm data=f; class a b; model y=a|b; run;',{f:{...frame,rows:frame.rows.slice(0,-1)}}),/complete CLASS interaction cells/);
await assert.rejects(runFileProgram('data f; do x=1 to 10; z=2*x; y=x+.1; output; end; run; proc glm data=f; model y=x z / solution; run;'),/rank-deficient/);
await assert.rejects(runFileProgram('data f; do a=1 to 32; do b=1 to 32; do c=1 to 2; y=a+b+c; output; end; end; end; run; proc glm data=f; class a b c; model y=a|b|c; run;'),/matrix budget/);
console.log('GLM: published unbalanced SAS Type I/III example, independent interaction/ANCOVA numerics, SOLUTION, F/t tails, three-way expansion, prediction/missing rows, formats, native outputs and unsupported-design checks passed.');

await import('./scripts/check-glm-reference.mjs');
