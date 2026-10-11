import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {run,parseCSV} from './dist/engine.mjs';
import {runFileProgram} from './dist/file-program.mjs';
import {readTable} from './dist/table-storage.mjs';
const dir='fixtures/sas/surveyselect-9.4m8/';
const manifest=JSON.parse(readFileSync(dir+'manifest.json'));
const fixtures={};
for(const [name,info] of Object.entries(manifest.files)){
 const bytes=readFileSync(dir+name);assert.equal(createHash('sha256').update(bytes).digest('hex'),info.sha256);
 fixtures[name.replace('.csv','')]=parseCSV(bytes.toString());
}
const input={ss_frame:fixtures.ss_frame};
const cases=[
 ['ss_srs','method=srs seed=12345 n=7'],['ss_srs_second_seed','method=srs seed=24680 n=7'],
 ['ss_srs_rate','method=srs seed=12345 rate=0.3'],['ss_srs_census','method=srs seed=12345 n=20'],
 ['ss_urs_collapsed','method=urs seed=12345 n=40'],['ss_urs_hits','method=urs seed=12345 n=40 outhits'],
 ['ss_urs_reps','method=urs seed=12345 n=7 reps=2 outhits'],
 ['ss_sys_integer','method=sys seed=12345 n=5'],['ss_sys_fractional','method=sys seed=12345 n=6'],
 ['ss_strata_srs','method=srs seed=12345 n=2 outseed','strata stratum;'],
 ['ss_strata_single_stream','method=srs seed=12345 n=2 stratumseed=none','strata stratum;'],
 ['ss_strata_sys','method=sys seed=12345 n=2 outseed','strata stratum;']
];
for(const [name,opts,statement=''] of cases){
 const result=await runFileProgram(`proc surveyselect data=ss_frame out=${name} ${opts} stats outsize; ${statement} run;`,input);
 const actual=result.datasets[name],ref=fixtures[name];assert.deepEqual(actual.columns,ref.columns,name+' schema');assert.equal(actual.rows.length,ref.rows.length);
 for(let i=0;i<ref.rows.length;i++)for(const c of ref.columns){if(c==='samplingweight')assert.ok(Math.abs(actual.rows[i][c]-ref.rows[i][c])<1e-13);else assert.equal(actual.rows[i][c],ref.rows[i][c],name+' row '+i+' '+c);}
 assert.equal(result.reports.length,1);assert.ok(actual.columns.every(c=>actual.types[c]==='num'));
}
const probe=JSON.parse(readFileSync(dir+'stratum-seed-probe.json'));
for(const test of probe.cases){
 const result=await runFileProgram(`data frame; do stratum=1 to 5; do unit=1 to 5; id=(stratum-1)*5+unit; output; end; end; run;
 proc surveyselect data=frame out=sample method=${test.method} seed=${test.seed} n=${test.sample_size} outseed; strata stratum; run;`);
 assert.deepEqual(result.datasets.sample.rows.map(({stratum,initialseed,id})=>({stratum,initialseed,id})),test.rows);
}
for(const [initialization,name] of [["call streaminit('MT32',12345)",'ss_uniform_mt32'],['call streaminit(12345)','ss_uniform_default']]){
 const rows=run(`data uniforms; ${initialization}; do draw=1 to 400; x=rand('uniform'); uniform_hex=put(x,hex16.); output; end; run;`).datasets.uniforms.rows;
 assert.deepEqual(rows.map(r=>r.uniform_hex),fixtures[name].rows.map(r=>r.uniform_hex));
}
const automatic=run("data auto; x=rand('uniform'); call streaminit(12345); y=rand('uniform'); run;");assert.ok(automatic.datasets.auto.rows[0].x>=0&&automatic.datasets.auto.rows[0].x<1);assert.match(automatic.logs.join('\n'),/seed \d+/);
const simple=opts=>runFileProgram(`proc surveyselect data=ss_frame out=s ${opts}; run;`,input);
assert.equal((await simple('seed=12345 n=7 noprint')).reports.length,0);
assert.equal((await simple('seed=12345 n=7')).datasets.s.columns.length,3);
assert.deepEqual((await simple('seed=12345 rate=30')).datasets.s.rows,(await simple('seed=12345 rate=0.3')).datasets.s.rows);
for(const opts of ['n=1 method=pps','n=1 ranuni','n=1 stratumseed=restore','n=1 outhits','n=1 rate=.2','n=0','n=21','n=1 n=2','method=sys rate=.3','n=1 size id','n=(2 3)','n=1 seed=1.5','n=1 seed=4294967296','n=100000 method=urs reps=2'])await assert.rejects(simple(opts));
await assert.rejects(runFileProgram('proc surveyselect data=ss_frame out=s n=2 reps=2; strata stratum; run;',input),/Stratified REPS/);
await assert.rejects(runFileProgram('proc surveyselect data=ss_frame out=s n=2 stratumseed=none outseed; strata stratum; run;',input),/OUTSEED/);
const chars=parseCSV('g,id\n,1\n,2\nA,3\nA,4\nB,5\nB,6');
let r=await runFileProgram('proc surveyselect data=f out=s n=1 seed=12345; strata g; run;',{f:chars});assert.equal(r.datasets.s.rows.length,3);assert.equal(r.datasets.s.types.g,'char');
await assert.rejects(runFileProgram('proc surveyselect data=f out=s n=1 seed=12345; strata g; run;',{f:{...chars,rows:[...chars.rows].reverse()}}),/not sorted/);
await assert.rejects(runFileProgram('proc surveyselect data=f out=s n=1 seed=12345; strata g; run;',{f:{...chars,formats:{g:'$8.'}}}),/Formatted STRATA/);
await assert.rejects(runFileProgram('proc surveyselect data=f out=s n=1 seed=12345 stats; run;',{f:parseCSV('samplingweight,id\n1,1')}),/conflict/);
r=await runFileProgram("libname saved 'tables'; proc surveyselect data=ss_frame out=saved.sample n=7 seed=12345 stats; run; data loaded; set saved.sample; run;",input,undefined,{checkDirectory:async()=>true});
assert.deepEqual(readTable(r.exports[0].text).rows,r.datasets.loaded.rows);assert.equal(input.ss_frame.rows.length,20);
console.log('Actual SURVEYSELECT runtime: twelve SAS CSVs, 35 automatic-stratum probe rows, 800 RNG hex values, metadata, limits, errors and native outputs passed.');
