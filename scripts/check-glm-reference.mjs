import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {runFileProgram} from '../dist/file-program.mjs';
const fixture=JSON.parse(await readFile(new URL('../fixtures/sas/glm-seven-row-printed.json',import.meta.url),'utf8'));
const code=await readFile(new URL('../examples/catalog/10-glm.sas',import.meta.url),'utf8');
assert.equal(createHash('sha256').update(code).digest('hex'),fixture.provenance.program_sha256,'Reference program changed; inspect provenance before updating fixture');
const result=await runFileProgram(code);
let numeric=0,missing=0,flags=0;
function displayed(actual,printed){
 if(printed===''||printed==='.'){assert.equal(actual,null);missing++;return;}
 assert.equal(typeof actual,'number');assert.ok(Number.isFinite(actual));
 const decimals=(printed.split('.')[1]||'').length;
 assert.ok(Math.abs(actual-Number(printed))<=.50001*10**(-decimals),`${actual} does not round to SAS ${printed}`);numeric++;
}
const tables=Object.fromEntries(fixture.tables.map(t=>[t.label,t.rows]));
function anova(label,rows){
 const sas=tables[label].slice(1);assert.equal(rows.length,sas.length);
 for(const cells of sas){const row=rows.find(r=>r.source.toUpperCase()===cells[0].toUpperCase());assert.ok(row);for(const [i,column] of ['df','ss','ms','fvalue','probf'].entries())displayed(row[column],cells[i+1]);}
}
anova('Overall ANOVA',result.datasets.glm_anova.rows);
for(const type of [1,3])anova(type===1?'Type I Model ANOVA':'Type III Model ANOVA',result.datasets.glm_tests.rows.filter(r=>r.hypothesistype===type));
for(const [i,column] of ['rsquare','coeffvar','rootmse','depmean'].entries())displayed(result.datasets.glm_fit.rows[0][column],tables['Fit Statistics'][1][i]);
const parameters=result.datasets.glm_parameters.rows;
assert.equal(parameters.length,tables.Solution.length-1);
for(const cells of tables.Solution.slice(1)){
 const row=parameters.find(r=>r.parameter.toUpperCase()===cells[0].toUpperCase());assert.ok(row);
 displayed(row.estimate,cells[1]);assert.equal(row.biased,cells[2]);flags++;
 for(const [i,column] of ['stderr','tvalue','probt'].entries())displayed(row[column],cells[i+3]);
}
const nobs=result.reports.find(r=>r.title.endsWith('nobs')).dataset.rows[0];
for(const [i,column] of ['nobsread','nobsused'].entries())displayed(nobs[column],tables['Number of Observations'][i][1]);
const classes=result.reports.find(r=>r.title.endsWith('classlevels')).dataset.rows;
for(const cells of tables['Class Levels'].slice(2)){const row=classes.find(r=>r.class.toLowerCase()===cells[0]);assert.ok(row);displayed(row.levels,cells[1]);assert.equal(row.values,cells[2]);}
console.log(`Actual SAS GLM seven-row HTML: ${numeric} numeric cells agree at printed precision, ${missing} missing cells and ${flags} B flags match. Full-precision/ANCOVA comparison remains pending.`);
