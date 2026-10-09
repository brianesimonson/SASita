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
 const code="data results; set inputs; cube=x**3; root=sqrt(x); run; proc sort data=results; by descending x; run;",inputs={inputs:parseCSV('x\n4\n9')};
 const folder=await packageFor(code,inputs),p=python([join(folder,'run.py')]);assert.equal(p.status,0,p.stderr);
 const result=JSON.parse(p.stdout),rows=JSON.parse(result.tables.results).rows;
 assert.deepEqual(rows,run(code,inputs).datasets.results.rows);
 const direct=spawnSync('node',[join(folder,'run.mjs')],{encoding:'utf8',cwd:tmpdir()});assert.equal(direct.status,0,direct.stderr);assert.deepEqual(JSON.parse(direct.stdout),result);
 // Exact RAND fixture path and signed-zero table strings survive the wrapper.
 const randomCode="data draws; call streaminit('MT32',12345); do i=1 to 100; u=rand('uniform'); hex=put(u,hex16.); output; end; run;";
 const randomFolder=await packageFor(randomCode,{zero:{columns:['x'],rows:[{x:-0}],formats:{}}});const random=python([join(randomFolder,'run.py')]);assert.equal(random.status,0,random.stderr);const randomResult=JSON.parse(random.stdout);
 assert.deepEqual(JSON.parse(randomResult.tables.draws).rows,run(randomCode).datasets.draws.rows);assert.ok(Object.is(JSON.parse(randomResult.tables.zero).rows[0].x,-0));
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
