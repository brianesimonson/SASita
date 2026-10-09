// Demo filesystem host for the SAME Sassy interpreter used in the browser.
import {readFile,writeFile,stat,realpath,rename,unlink} from 'node:fs/promises';
import {resolve,dirname,join,relative,isAbsolute} from 'node:path';
import {fileURLToPath} from 'node:url';
import {runFileProgram,projectPath} from './runtime/file-program.mjs';
import {readTable} from './runtime/table-storage.mjs';
const home=dirname(fileURLToPath(import.meta.url));
try {
 const args=process.argv.slice(2);let projectFolder=join(home,'project');
 if(args.length){if(args.length!==2||args[0]!=='--project')throw new Error('Usage: node run.mjs [--project folder]');projectFolder=resolve(args[1]);}
 const root=await realpath(projectFolder);
 if(!(await stat(root)).isDirectory())throw new Error('Project must be a directory');
 async function scoped(path,directory=false,writing=false){
  const parts=path==='.'&&directory?[]:projectPath(path),target=join(root,...parts);
  const check=await realpath(writing?dirname(target):target),rel=relative(root,check);
  if(rel==='..'||rel.startsWith('..'+(process.platform==='win32'?'\\':'/'))||isAbsolute(rel))throw new Error('Path leaves the project folder: '+path);
  if(writing){try{const info=await stat(target);if(!info.isFile())throw new Error('Target is not a file: '+path);const actual=await realpath(target),r=relative(root,actual);if(r==='..'||r.startsWith('..'+(process.platform==='win32'?'\\':'/'))||isAbsolute(r))throw new Error('Target leaves project folder: '+path);}catch(e){if(e.code!=='ENOENT')throw e;}}
  return target;
 }
 const input=JSON.parse(await readFile(join(home,'inputs.json'),'utf8')),datasets=Object.create(null);
 for(const [name,path] of Object.entries(input.work)){
  if(!/^[a-z_]\w{0,31}$/.test(name)||path!=='work/'+name+'.sassy-table.json')throw new Error('Invalid packaged WORK input');
  const target=await realpath(join(home,path));if(relative(home,target).startsWith('..'))throw new Error('Input leaves package');
  datasets[name]=readTable(await readFile(target,'utf8'));
 }
 const result=await runFileProgram(await readFile(join(home,'program.sas'),'utf8'),datasets,async path=>{
  const target=await scoped(path);const info=await stat(target);if(!info.isFile()||info.size>20000000)throw new Error('Input must be a file of at most 20 MB: '+path);return readFile(target,'utf8');
 },{libraries:input.libraries,chartTitle:input.chartTitle,checkDirectory:async path=>{if(!(await stat(await scoped(path,true))).isDirectory())throw new Error('Not a directory: '+path);}});
 // Standard output is a machine-readable envelope; table strings preserve signed zero.
 const tables=Object.create(null);
 const {writeTable}=await import('./runtime/table-storage.mjs');
 for(const [name,ds] of Object.entries(result.datasets))tables[name]=writeTable(ds,name.split('.').at(-1));
 // Preflight EVERY target before writing. Separate files are not a single transaction.
 const targets=[];
 for(const item of result.exports||[]){
  if(!(item.native?/\.sassy-table\.json$/i:/\.csv$/i).test(item.path))throw new Error('Invalid export extension');
  const target=await scoped(item.path,false,true);let exists=false;try{await stat(target);exists=true;}catch(e){if(e.code!=='ENOENT')throw e;}
  if(exists&&!item.replace)throw new Error('Existing output requires REPLACE: '+item.path);
  targets.push({target,item});
 }
 const saved=[];
 for(const {target,item} of targets){
  const temporary=target+'.sassy-tmp-'+process.pid+'-'+Math.random().toString(16).slice(2);
  try{await writeFile(temporary,item.text,{encoding:'utf8',flag:'wx'});await rename(temporary,target);saved.push(item.path);}
  catch(e){await unlink(temporary).catch(()=>{});throw new Error(e.message+(saved.length?' Files already saved: '+saved.join(', '):''));}
 }
 process.stdout.write(JSON.stringify({version:'0.4.6',written:result.written,logs:result.logs,tables,plots:result.plots||[],saved},null,2)+'\n');
} catch(e){console.error('Sassy: '+e.message);process.exitCode=1;}
