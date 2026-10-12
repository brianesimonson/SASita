import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {runFileProgram} from '../dist/file-program.mjs';
const fixture=JSON.parse(await readFile(new URL('../fixtures/sas/glm-two-model-comparison.json',import.meta.url),'utf8'));
let numeric=0,missing=0,flags=0,labelDifferences=0;
function check(value,printed){
 if(printed===''||printed==='.'){assert.equal(value,null);missing++;return;}
 assert.ok(Number.isFinite(value));
 if(printed.startsWith('<')){assert.ok(value<Number(printed.slice(1)));numeric++;return;}
 assert.ok(Math.abs(value-Number(printed))<=.50001*10**(-(printed.split('.')[1]||'').length),`${value} vs SAS ${printed}`);numeric++;
}
// This mapping permits checking the numbers; it deliberately does not claim label parity.
const normalize=s=>s.toUpperCase().replace(/^X\*A(?= |$)/,'A*X');
for(const name of ['published','ancova']){
 const code=await readFile(new URL('../examples/glm-validation/'+name+'-model.sas',import.meta.url),'utf8');
 const r=await runFileProgram(code),tables=Object.fromEntries(fixture[name+'_tables'].map(t=>[t.label,t.rows]));
 for(const [label,ds,type] of [['Overall ANOVA','glm_anova',null],['Type I Model ANOVA','glm_tests',1],['Type III Model ANOVA','glm_tests',3]]){
  const actual=r.datasets[ds].rows.filter(row=>type===null||row.hypothesistype===type),sas=tables[label].slice(1);assert.equal(actual.length,sas.length);
  for(const cells of sas){const row=actual.find(v=>normalize(v.source)===normalize(cells[0]));assert.ok(row);if(row.source.toUpperCase()!==cells[0].toUpperCase())labelDifferences++;for(const [i,column] of ['df','ss','ms','fvalue','probf'].entries())check(row[column],cells[i+1]);}
 }
 const sasParameters=tables.Solution.slice(1);assert.equal(r.datasets.glm_parameters.rows.length,sasParameters.length);
 for(const cells of sasParameters){const row=r.datasets.glm_parameters.rows.find(v=>normalize(v.parameter)===normalize(cells[0]));assert.ok(row);if(row.parameter.toUpperCase()!==cells[0].toUpperCase())labelDifferences++;check(row.estimate,cells[1]);assert.equal(row.biased,cells[2]);flags++;for(const [i,column] of ['stderr','tvalue','probt'].entries())check(row[column],cells[i+3]);}
 // Displayed fit numbers are evidence only; the fit PROC COMPARE groups did not run.
 for(const [i,column] of ['rsquare','coeffvar','rootmse','depmean'].entries())check(r.datasets.glm_fit.rows[0][column],tables['Fit Statistics'][1][i]);
}
assert.equal(Object.keys(fixture.comparisons).length,8);
assert.equal(fixture.comparisons['ancova_glm_scored vs app_ancova_scored']['Number of Observations in Common'],'33');
assert.equal(fixture.comparisons['ancova_glm_scored vs app_ancova_scored']['Total Number of Values which Compare Unequal'],'0');
console.log(`Actual two-model SAS HTML: ${numeric} printed numeric cells, ${missing} missing cells and ${flags} displayed flags agree after explicitly mapping ${labelDifferences} mixed-interaction labels. Recorded full-precision comparison summaries retain failures/unmatched rows and absent fit checks.`);
// Preserve the subsequent actual full-precision SAS pass and its exact helper provenance.
const passed=JSON.parse(await readFile(new URL('../fixtures/sas/glm-validation-v2-pass.json',import.meta.url),'utf8'));
const {createHash}=await import('node:crypto');
const helper=await readFile(new URL('../examples/glm-validation/01-sas-glm-comparison.sas',import.meta.url),'utf8');
assert.equal(createHash('sha256').update(helper).digest('hex'),passed.provenance.program_sha256);
assert.equal(Object.keys(passed.comparisons).length,10);
const counts={published:{anova:3,tests:6,parameters:9,fit:1,scored:7},ancova:{anova:3,tests:10,parameters:16,fit:1,scored:33}};
for(const [model,tables] of Object.entries(counts))for(const [table,count] of Object.entries(tables)){
 const group=passed.comparisons[`${model}_glm_${table} vs app_${model}_${table}`];assert.ok(group);
 assert.equal(Number(group['Number of Observations in Common']),count);
 assert.equal(group['Total Number of Values which Compare Unequal'],'0');
 assert.ok(!group['Number of Observations in WORK.SAS_CHECK but not in WORK.APP_CHECK']);
 assert.ok(!group['Number of Observations in WORK.APP_CHECK but not in WORK.SAS_CHECK']);
}
assert.equal(passed.outcome.errors,0);assert.equal(passed.outcome.warnings,0);
console.log('Actual revision-2 SAS comparison: all ten groups / 89 matched records pass their documented tolerances; no SAS errors or warnings. Original metadata/bit identity remain outside this certification.');
