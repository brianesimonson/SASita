import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {runFileProgram,filePlan} from './dist/file-program.mjs';
import {readTable,writeTable,tableDocument} from './dist/table-storage.mjs';
import {run} from './dist/engine.mjs';
const disk=new Map(),checked=[],options={checkDirectory:async path=>{checked.push(path);if(path==='missing')throw new Error('Directory missing')}};
const read=async path=>{if(!disk.has(path))throw new Error('File missing: '+path);return disk.get(path)};
const code=`libname saved 'tables';data saved.base;length label $ 4;format x comma12.2;do id=1 to 3;x=id/3;label='abcdef';output;end;run;data copied;set saved.base;label='longer';run;`;
let result=await runFileProgram(code,{},read,options);
assert.deepEqual(checked,['tables']);assert.equal(result.exports.length,1);assert.equal(result.exports[0].path,'tables/base.sassy-table.json');assert.equal(result.exports[0].replace,true);
assert.equal(result.datasets.copied.rows[0].label,'long');assert.equal(result.datasets.copied.lengths.label,4);
for(const item of result.exports)disk.set(item.path,item.text);
const loaded=readTable(disk.get('tables/base.sassy-table.json'));assert.equal(loaded.rows[0].x,1/3);assert.equal(loaded.formats.x,'comma12.2');assert.equal(loaded.lengths.label,4);
// A new run reads the disk again, rather than using stale session datasets.
const altered=readTable(result.exports[0].text);altered.rows[0].x=99;disk.set(result.exports[0].path,writeTable(altered,'base'));
result=await runFileProgram('data reloaded;set saved.base;run;',result.datasets,read,{...options,libraries:result.libraries});assert.equal(result.datasets.reloaded.rows[0].x,99);
const aliases=await runFileProgram("libname a 'tables';libname b 'tables';data a.base;x=7;run;data through_alias;set b.base;run;",{},read,options);assert.equal(aliases.datasets.through_alias.rows[0].x,7);
const aliasReload=await runFileProgram("libname a 'tables';libname b 'tables';data previous;set b.base;run;data a.base;x=123;run;data latest;set b.base;run;",{},read,options);assert.equal(aliasReload.datasets.latest.rows[0].x,123);
await assert.rejects(runFileProgram("libname a 'tables';libname b 'Tables';data a.base;x=1;run;data b.base;x=2;run;",{},read,options),/Conflicting export/);
const rewrittenAlias=await runFileProgram("libname a 'tables';libname b 'tables';data b.base;x=1;run;data a.base;x=2;run;",{},read,options);assert.equal(rewrittenAlias.exports.length,1);assert.equal(rewrittenAlias.datasets['b.base'].rows[0].x,2);
const repeat=await runFileProgram("libname saved 'tables';data saved.same;x=1;run;data saved.same;set saved.same;x=x+1;run;",{},read,options);assert.equal(repeat.exports.length,1);assert.equal(readTable(repeat.exports[0].text).rows[0].x,2);
const sorted=await runFileProgram("libname saved 'tables';proc sort data=saved.base out=saved.sorted;by descending id;run;",{},read,options);assert.equal(readTable(sorted.exports[0].text).rows[0].id,3);
const imported=await runFileProgram("libname saved 'tables';proc import datafile='x.csv' out=saved.csv dbms=csv replace;run;proc export data=saved.csv outfile='copy.csv' dbms=csv replace;run;",{},async path=>'id,value\n1,12',options);assert.equal(imported.exports.length,2);assert.equal(readTable(imported.exports[0].text).rows[0].value,12);
const cleared=await runFileProgram('libname saved clear;',result.datasets,read,{...options,libraries:{saved:'tables'}});assert.equal(cleared.libraries.saved,undefined);assert.ok(!Object.keys(cleared.datasets).some(n=>n.startsWith('saved.')));
for(const code of ["libname work 'tables';","libname excessive 'tables';","libname saved '../escape';","libname saved '/absolute';","libname saved 'tables' access=readonly;"])assert.throws(()=>filePlan(code));
await assert.rejects(runFileProgram("libname saved 'tables';"),/Choose a project/);
await assert.rejects(runFileProgram("libname saved 'missing';",{},read,options),/Directory missing/);
await assert.rejects(runFileProgram('data never;set unknown.base;run;',{},read,options),/not assigned/);
await assert.rejects(runFileProgram("libname saved 'tables';data saved.new;x=1;run;data bad;unsupported;run;",{},read,options),/Unsupported/);
await assert.rejects(runFileProgram("libname saved 'tables';data saved.new;x=1;run;libname saved clear;",{},read,options),/after writing/);
// All finite doubles, including signed zero, retain their exact binary values.
const numeric={columns:['x'],types:{x:'num'},formats:{},rows:[0,-0,Number.MIN_VALUE,Number.MAX_VALUE,1/3,Number.MAX_SAFE_INTEGER,0.1,null].map(x=>({x}))};
const roundtrip=readTable(writeTable(numeric,'numbers'));roundtrip.rows.forEach((row,i)=>assert.ok(Object.is(row.x,numeric.rows[i].x)));
const empty=run('data empty;length s $ 5;x=.;stop;run;').datasets.empty;const savedEmpty=readTable(writeTable(empty,'empty'));assert.equal(savedEmpty.rows.length,0);assert.equal(savedEmpty.types.s,'char');assert.equal(savedEmpty.lengths.s,5);
for(const mutate of [d=>d.version=2,d=>d.columns.push(d.columns[0]),d=>d.rows[0].x='text',d=>d.rows[0].extra=1,d=>d.columns[0].length=4]){const d=tableDocument(numeric,'numbers');mutate(d);assert.throws(()=>readTable(JSON.stringify(d)));}
assert.throws(()=>readTable('{bad json'),/Invalid/);assert.throws(()=>writeTable({...numeric,rows:[{x:Infinity}]},'numbers'));
const demo=await runFileProgram(await readFile('examples/project-demo/library-demo.sas','utf8'),{},path=>readFile('examples/project-demo/'+path,'utf8'),{checkDirectory:async path=>assert.equal(path,'tables')});assert.equal(demo.datasets.restored.rows.length,6);assert.equal(demo.exports.length,1);assert.equal(readTable(demo.exports[0].text).formats.paid_amount,'dollar12.2');
console.log('Library checks passed: scoped assignments, versioned descriptors, exact double round trips, disk reloads, staged aliases/replacements, sort, CSV interchange, clear, malformed schemas and rollback.');
