import assert from 'node:assert/strict';
import {mkdtemp,writeFile,readFile,mkdir,rm,symlink} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {spawnSync} from 'node:child_process';
import {portableFiles,portableZip} from './dist/portable-export.mjs';
import {runtimeAssets} from './dist/runtime-assets.mjs';
import {run,parseCSV} from './dist/engine.mjs';
import {writeTable} from './dist/table-storage.mjs';
const assets=runtimeAssets();
for(const [path,text] of Object.entries(assets))assert.equal(text,await readFile(path.startsWith('runtime/')?'dist/'+path.slice(8):'portable/'+path,'utf8'),'stale export source '+path);
const root=await mkdtemp(join(tmpdir(),'sassy-portable-'));
const python=(args)=>spawnSync('python3',args,{encoding:'utf8',cwd:tmpdir(),timeout:35000});
async function packageFor(code,datasets={},libraries={}){
 const packageRoot=await mkdtemp(join(root,'package-'));
 const files=portableFiles({code,datasets,libraries,chartTitle:''},assets);
 const archive=join(packageRoot,'package.zip');await writeFile(archive,portableZip(files));
 const unzip=python(['-c','import zipfile,sys; z=zipfile.ZipFile(sys.argv[1]); assert z.testzip() is None; z.extractall(sys.argv[2])',archive,packageRoot]);assert.equal(unzip.status,0,unzip.stderr);
 return packageRoot;
}
try{
 const code="data results; set inputs; cube=x**3; root=sqrt(x); run; proc sort data=results; by descending x; run; proc means data=results; var x; output out=statistics n=count mean=avg var=variance; run;",inputs={inputs:parseCSV('x\n4\n9')};
 const folder=await packageFor(code,inputs),p=python([join(folder,'run.py')]);assert.equal(p.status,0,p.stderr);
 const result=JSON.parse(p.stdout),rows=JSON.parse(result.tables.results).rows;
 assert.equal(JSON.parse(result.tables.statistics).rows[0].avg,6.5);assert.equal(result.reports.length,1);
 assert.deepEqual(rows,run(code.split('proc means')[0],inputs).datasets.results.rows);
 const surveyFolder=await packageFor(`data frame; call streaminit(12345); do stratum=1 to 5; do unit=1 to 5; id=(stratum-1)*5+unit; u=rand('uniform'); output; end; end; run;
 proc surveyselect data=frame out=sample method=srs seed=12345 n=2 outseed; strata stratum; run;`);
 const surveyProcess=python([join(surveyFolder,'run.py')]);assert.equal(surveyProcess.status,0,surveyProcess.stderr);
 const surveyEnvelope=JSON.parse(surveyProcess.stdout),sample=JSON.parse(surveyEnvelope.tables.sample);
 assert.deepEqual(sample.rows.map(r=>r.id),[3,5,6,9,12,13,17,19,23,24]);
 assert.equal(sample.rows.at(-1).initialseed,1841400341);
 assert.equal(surveyEnvelope.reports.length,1);
 assert.equal(JSON.parse(surveyEnvelope.tables.frame).rows[0].u,(await import('./dist/random.mjs')).createUniformGenerator(12345)());
 const direct=spawnSync('node',[join(folder,'run.mjs')],{encoding:'utf8',cwd:tmpdir()});assert.equal(direct.status,0,direct.stderr);assert.deepEqual(JSON.parse(direct.stdout),result);
 const glmFolder=await packageFor(await readFile('examples/catalog/10-glm.sas','utf8'));
 const glmProcess=python([join(glmFolder,'run.py')]);assert.equal(glmProcess.status,0,glmProcess.stderr);
 const glmEnvelope=JSON.parse(glmProcess.stdout),glmTests=JSON.parse(glmEnvelope.tables.glm_tests).rows;
 for(const [source,ss] of [['A',67.6],['B',10],['A*B',.4]])assert.ok(Math.abs(glmTests.find(r=>r.source===source&&r.hypothesistype===3).ss-ss)<1e-10);
 assert.ok(Math.abs(JSON.parse(glmEnvelope.tables.glm_anova).rows[1].ss-6)<1e-10);
 assert.ok(Math.abs(JSON.parse(glmEnvelope.tables.glm_parameters).rows[0].estimate-17)<1e-10);
 assert.ok(Math.abs(JSON.parse(glmEnvelope.tables.glm_scored).rows[0].predicted-13)<1e-10);
 const printFolder=await packageFor('data f; do id=1 to 20; output; end; run; proc print data=f(firstobs=5 obs=10) noobs; var id; run;');
 const printProcess=python([join(printFolder,'run.py')]);assert.equal(printProcess.status,0,printProcess.stderr);
 const printResult=JSON.parse(printProcess.stdout);assert.equal(printResult.reports[0].showObs,false);assert.deepEqual(printResult.reports[0].dataset.rows.map(r=>r.id),[5,6,7,8,9,10]);assert.equal(JSON.parse(printResult.tables.f).rows.length,20);
 // Exact RAND fixture path and signed-zero table strings survive the wrapper.
 const randomCode="data draws; call streaminit('MT32',12345); do i=1 to 100; u=rand('uniform'); hex=put(u,hex16.); output; end; run;";
 const randomFolder=await packageFor(randomCode,{zero:{columns:['x'],rows:[{x:-0}],formats:{}}});const random=python([join(randomFolder,'run.py')]);assert.equal(random.status,0,random.stderr);const randomResult=JSON.parse(random.stdout);
 assert.deepEqual(JSON.parse(randomResult.tables.draws).rows,run(randomCode).datasets.draws.rows);assert.ok(Object.is(JSON.parse(randomResult.tables.zero).rows[0].x,-0));
 const normalFixture=JSON.parse(await readFile('fixtures/sas/normal-method-probe.json','utf8'));
 const normalFolder=await packageFor(await readFile('examples/project-demo/normal-demo.sas','utf8'));
 const normalProcess=python([join(normalFolder,'run.py')]);assert.equal(normalProcess.status,0,normalProcess.stderr);
 const normalEnvelope=JSON.parse(normalProcess.stdout);
 for(const context of normalFixture.contexts){
  const ds=JSON.parse(normalEnvelope.tables['normal_'+context.generator.toLowerCase()+'_'+context.mode.toLowerCase()]);assert.equal(ds.rows.length,512);
  for(const reference of context.printed_rows){const row=ds.rows[reference.id-1],expected=Buffer.from(reference.z_hex,'hex').readDoubleBE();assert.ok(Math.abs(row.z-expected)<=1e-14*Math.max(1,Math.abs(expected)));if(reference.next_u_hex)assert.equal(row.next_u_hex,reference.next_u_hex);}
 }
 // LIBNAME and CSV adapters use existing folders, named native tables and final staged writes.
 const project=join(root,'external');await mkdir(join(project,'tables'),{recursive:true});await writeFile(join(project,'input.csv'),'x\n4\n9');
 const externalCode="libname saved 'tables'; proc import datafile='input.csv' out=base dbms=csv; run; data saved.results; set base; squared=x*x; run; proc export data=saved.results outfile='output.csv' dbms=csv replace; run; proc sgplot data=saved.results; scatter x=x y=squared; run;";
 const externalFolder=await packageFor(externalCode),external=python([join(externalFolder,'run.py'),'--project',project]);assert.equal(external.status,0,external.stderr);const er=JSON.parse(external.stdout);assert.equal(er.plots.length,1);assert.equal(er.saved.length,2);assert.ok((await readFile(join(project,'output.csv'),'utf8')).includes('81'));
 const reloadFolder=await packageFor('data reloaded; set saved.results; run;',{}, {saved:'tables'}),reload=python([join(reloadFolder,'run.py'),'--project',project]);assert.equal(reload.status,0,reload.stderr);assert.equal(JSON.parse(JSON.parse(reload.stdout).tables.reloaded).rows.length,2);
 // A missing external dependency is explicit; packages do not silently copy it.
 const absent=python([join(externalFolder,'run.py')]);assert.notEqual(absent.status,0);assert.ok(absent.stderr.includes('input.csv'));
 const before=await readFile(join(project,'output.csv'),'utf8');
 const failed=await packageFor("proc export data=inputs outfile='output.csv' dbms=csv replace; run; data bad; set absent; run;",inputs);assert.notEqual(python([join(failed,'run.py'),'--project',project]).status,0);assert.equal(await readFile(join(project,'output.csv'),'utf8'),before);
 const guarded=await packageFor("proc export data=inputs outfile='new.csv' dbms=csv; run; proc export data=inputs outfile='output.csv' dbms=csv; run;",inputs);const refusal=python([join(guarded,'run.py'),'--project',project]);assert.notEqual(refusal.status,0);assert.ok(refusal.stderr.includes('REPLACE'));await assert.rejects(readFile(join(project,'new.csv')));
 await symlink(root,join(project,'escape'),'dir');const escaping=await packageFor("libname bad 'escape'; data bad.test; x=1; run;");const denial=python([join(escaping,'run.py'),'--project',project]);assert.notEqual(denial.status,0);assert.ok(denial.stderr.includes('leaves'));
 assert.throws(()=>portableFiles({code:'',datasets:{}},assets),/program/);
 assert.throws(()=>portableZip({'../escape':'x'}),/entry/);
 console.log('Portable ZIP CRC/source fidelity, Node/Python calculations, RAND, signed zero, native libraries, CSV paths, charts, preflight and rollback checks passed.');
}finally{await rm(root,{recursive:true,force:true});}
