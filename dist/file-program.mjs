import {tokenize,run,parseCSV,csv,datasetReferences} from './engine.mjs';
import {parsePlot,preparePlot} from './charts.mjs';
import {readTable,writeTable} from './table-storage.mjs';
import {expandMacros} from './macros.mjs';
// Files are relative to the folder selected by the user. No OS paths or URLs.
export function projectPath(value) {
 if(typeof value!=='string'||!value||value.length>500||/[\\\x00-\x1f:]/.test(value)||value.startsWith('/'))throw new Error('Use a relative project path, such as inputs/claims.csv; absolute paths and URLs are unavailable.');
 const parts=value.split('/');
 if(parts.some(p=>!p||p==='.'||p==='..'||/[<>"|?*]/.test(p)||/[. ]$/.test(p)))throw new Error('Invalid project path: '+value);
 return parts;
}
export function projectCSV(ds,limit=20000000) {
 let minimum=ds.columns.reduce((n,c)=>n+c.length+3,2);
 for(const row of ds.rows)for(const column of ds.columns){const value=row[column];minimum+=(value===null||value===undefined?'':String(value)).length+3;if(minimum>limit)throw new Error('CSV export limit is 20 MB');}
 const text=csv(ds);if(new TextEncoder().encode(text).length>limit)throw new Error('CSV export limit is 20 MB');return text;
}
function datasetName(token) {
 if(token?.type!=='id'||!/^(?:[a-z_]\w{0,7}\.)?[a-z_]\w{0,31}$/.test(token.v))throw new Error('File procedures require a valid WORK or named-library dataset name.');
 return token.v.replace(/^work\./,'');
}
function serialize(tokens) {
 let code='',line=1;
 for(const t of tokens){if(t.line>line){code+='\n'.repeat(t.line-line);line=t.line}else code+=' ';code+=t.type==='str'?"'"+t.v.replaceAll("'","''")+"'":t.raw??String(t.v)}
 return code;
}
export function filePlan(expanded) {
 const tokens=tokenize(expanded),plan=[];let i=0;
 const need=v=>{const t=tokens[i++];if(t?.v!==v)throw new Error('Expected '+v+' in file procedure');return t};
 const take=()=>{if(!tokens[i])throw new Error('Incomplete file procedure');return tokens[i++]};
 while(i<tokens.length) {
  const start=i,t=take();
  if(t.v==='title'){
   let value='';if(tokens[i]?.v!==';'){const title=take();if(title.type!=='str'||title.v.length>200)throw new Error('TITLE requires quoted text of at most 200 characters');value=title.v;}need(';');plan.push({kind:'title',value});continue;
  }
  if(t.v==='proc'&&['sgplot','sgpie'].includes(tokens[i]?.v)){const parsed=parsePlot(tokens,start);i=parsed.next;plan.push({kind:'plot',plot:parsed.plot});continue;}
  if(t.v==='libname'){
   const alias=take(),path=take();if(alias.type!=='id'||!/^[a-z_]\w{0,7}$/.test(alias.v)||['work','sashelp','sasuser'].includes(alias.v))throw new Error('LIBNAME requires a nonreserved library name of at most 8 characters');
   if(path.type!=='str'&&path.v!=='clear')throw new Error('LIBNAME requires a quoted relative folder or CLEAR');
   if(path.type==='str'&&path.v!=='.')projectPath(path.v);
   need(';');plan.push({kind:'libname',alias:alias.v,path:path.type==='str'?path.v:null});continue;
  }
  if(t.v==='filename') {
   const alias=take(),path=take();if(alias.type!=='id'||!/^[a-z_]\w*$/.test(alias.v))throw new Error('Invalid FILENAME alias');
   if(path.type!=='str'&&path.v!=='clear')throw new Error('FILENAME requires a quoted relative path or CLEAR');
   if(path.type==='str')projectPath(path.v);
   need(';');plan.push({kind:'filename',alias:alias.v,path:path.type==='str'?path.v:null});continue;
  }
  if(t.v==='proc'&&['import','export'].includes(tokens[i]?.v)) {
   const kind=take().v,opts={};
   while(tokens[i]?.v!==';') {
    const name=take().v;
    if(name==='replace'){if(opts.replace)throw new Error('Repeated REPLACE');opts.replace=true;continue;}
    if(!['datafile','outfile','out','data','dbms'].includes(name)||Object.hasOwn(opts,name))throw new Error('Unsupported or repeated PROC '+kind.toUpperCase()+' option '+name);
    need('=');opts[name]=take();
   }
   need(';');
   if(opts.dbms?.v!=='csv')throw new Error('File procedures require DBMS=CSV');
   const allowed=kind==='import'?['datafile','out','dbms','replace']:['outfile','data','dbms','replace'];
   if(Object.keys(opts).some(k=>!allowed.includes(k)))throw new Error('Invalid PROC '+kind.toUpperCase()+' option');
   const path=opts[kind==='import'?'datafile':'outfile'];
   if(!path||!['str','id'].includes(path.type))throw new Error('Specify a quoted project path or FILENAME alias');
   if(path.type==='str')projectPath(path.v);
   const name=datasetName(opts[kind==='import'?'out':'data']);
   while(tokens[i]?.v!=='run') {
    const setting=take().v;if(kind!=='import'||!['getnames','guessingrows'].includes(setting))throw new Error('Unsupported statement in file procedure: '+setting);
    need('=');const value=take();need(';');
    if(setting==='getnames'&&value.v!=='yes')throw new Error('GETNAMES=YES is required');
    if(setting==='guessingrows'&&value.v!=='max')throw new Error('Use GUESSINGROWS=MAX; CSV typing considers every row');
   }
   need('run');need(';');plan.push({kind,path,name,replace:!!opts.replace});continue;
  }
  // Preserve complete DATA/PROC SORT blocks; RUN inside strings is not a boundary.
  if(t.v!=='data'&&t.v!=='proc')throw new Error('Unsupported top-level statement '+t.v);
  while(i<tokens.length&&!(tokens[i].type==='id'&&tokens[i].v==='run'&&tokens[i-1]?.v===';'&&tokens[i+1]?.v===';'))i++;
  if(i>=tokens.length)throw new Error('Missing RUN;');i+=2;
  plan.push({kind:'code',code:serialize(tokens.slice(start,i))});
  if(plan.length>200)throw new Error('Project programs are limited to 200 steps');
 }
 if(plan.length>200)throw new Error('Project programs are limited to 200 steps');
 return plan;
}
export async function runFileProgram(code,input={},readFile,options={}) {
 const macro=expandMacros(code);
 // Keep the original synchronous engine and global execution limit for ordinary programs.
 const tokens=tokenize(macro.code);
 let hasFiles=tokens.some(t=>t.type==='id'&&/^[a-z_]\w*\.[a-z_]\w*$/.test(t.v)&&!/^(work|first|last)\./.test(t.v)),inBlock=false;
 for(let i=0;i<tokens.length;i++){const t=tokens[i];if(t.type!=='id')continue;if(inBlock){if(t.v==='run'&&tokens[i-1]?.v===';'&&tokens[i+1]?.v===';')inBlock=false;continue;}if(['libname','filename','title'].includes(t.v))hasFiles=true;if(t.v==='proc'){if(['import','export','sgplot','sgpie'].includes(tokens[i+1]?.v))hasFiles=true;inBlock=true;}else if(t.v==='data')inBlock=true;}

 if(!hasFiles){const result=run(macro.code,input,{expanded:true});result.logs.unshift(...macro.logs);return result;}
 const plan=filePlan(macro.code),aliases=new Map(),exports=[],logs=[...macro.logs],written=[],libraries=Object.assign(Object.create(null),options.libraries||{}),fresh=new Set(),libraryWrites=new Set(),plots=[];let chartTitle=options.chartTitle||'';
 let datasets=Object.assign(Object.create(null),input),exportBytes=0;
 function location(name){
  if(!/^[a-z_]\w{0,7}\.[a-z_]\w{0,31}$/.test(name))throw new Error('Invalid library table name '+name);
  const [library,member]=name.split('.'),folder=libraries[library];if(typeof folder!=='string')throw new Error('Library '+library.toUpperCase()+' is not assigned; use LIBNAME first.');if(folder!=='.')projectPath(folder);
  return (folder==='.'?'':folder+'/')+member+'.sassy-table.json';
 }
 async function load(name){if(!name.includes('.')||name.startsWith('work.'))return;if(fresh.has(name))return;const path=location(name),pending=exports.find(e=>e.path===path);if(!pending&&!readFile)throw new Error('Choose a project folder before reading library tables');datasets[name]=readTable(pending?pending.text:await readFile(path));fresh.add(name);logs.push('NOTE: Read '+name.toUpperCase()+' from '+path+'.');}
 function stage(name){if(!name.includes('.'))return;const path=location(name),text=writeTable(datasets[name],name.split('.')[1]),prior=exports.findIndex(e=>e.path.toLowerCase()===path.toLowerCase());if(prior>=0&&(!exports[prior].native||exports[prior].path!==path))throw new Error('Conflicting export path '+path);if(prior>=0)exports.splice(prior,1);exports.push({path,text,replace:true,native:true});libraryWrites.add(name.split('.')[0]);for(const other of fresh)if(other!==name&&location(other)===path){datasets[other]=datasets[name];}fresh.add(name);logs.push('NOTE: Prepared permanent table '+name.toUpperCase()+' at '+path+'.');}
 function checkExportLimit(){if(exports.reduce((n,e)=>n+new TextEncoder().encode(e.text).length,0)>50000000)throw new Error('Total program exports are limited to 50 MB');}
 for(const step of plan) {
  if(step.kind==='title'){chartTitle=step.value;continue;}
  if(step.kind==='plot'){if(plots.length>=20)throw new Error('Programs are limited to 20 charts');const source=step.plot.source;await load(source);const chart=preparePlot(step.plot,datasets[source],chartTitle);plots.push(chart);if(plots.reduce((n,p)=>n+p.pointCount,0)>100000)throw new Error('Programs are limited to 100,000 chart points');logs.push(`NOTE: Prepared ${chart.kind} chart from ${chart.source.toUpperCase()}: ${chart.used} used, ${chart.omitted} omitted observations.`);continue;}
  if(step.kind==='libname'){
   if(libraryWrites.has(step.alias))throw new Error('Cannot clear or reassign a library after writing to it in this run');
   for(const name of Object.keys(datasets))if(name.startsWith(step.alias+'.')){delete datasets[name];fresh.delete(name);}
   if(step.path===null){delete libraries[step.alias];logs.push('NOTE: Library '+step.alias.toUpperCase()+' cleared.');}
   else{if(!options.checkDirectory)throw new Error('Choose a project folder before assigning LIBNAME');await options.checkDirectory(step.path);libraries[step.alias]=step.path;logs.push('NOTE: Library '+step.alias.toUpperCase()+' assigned to '+step.path+'.');}continue;
  }
  if(step.kind==='filename'){if(step.path===null)aliases.delete(step.alias);else aliases.set(step.alias,step.path);continue;}
  if(step.kind==='code'){const refs=datasetReferences(step.code);for(const name of [...refs.reads,...refs.writes])if(name.includes('.')&&!name.startsWith('work.'))location(name);for(const name of refs.reads)await load(name);const result=run(step.code,datasets,{expanded:true});datasets=result.datasets;logs.push(...result.logs);written.push(...result.written);for(const name of result.written)stage(name);checkExportLimit();continue;}
  const path=step.path.type==='str'?step.path.v:aliases.get(step.path.v);
  if(!path)throw new Error('Unknown FILENAME alias '+step.path.v);projectPath(path);
  if(!/\.csv$/i.test(path))throw new Error('File procedures support .csv files only');
  if(step.kind==='import') {
   if(step.name.includes('.'))location(step.name);
   if((Object.hasOwn(datasets,step.name)||step.name.includes('.'))&&!step.replace)throw new Error(step.name.includes('.')?'PROC IMPORT into a permanent library requires REPLACE':step.name+' already exists; use REPLACE');
   const pending=exports.find(item=>item.path===path);
   if(!pending&&!readFile)throw new Error('Choose a project folder before importing files from a program.');
   const text=pending?pending.text:await readFile(path);
   if(new TextEncoder().encode(text).length>20000000)throw new Error('CSV import limit is 20 MB');
   const ds=parseCSV(text);datasets[step.name]=ds;written.push(step.name);logs.push(`NOTE: Imported ${path} into ${step.name.includes('.')?'':'WORK.'}${step.name.toUpperCase()}: ${ds.rows.length} observations.`);stage(step.name);checkExportLimit();
  } else {
   await load(step.name);const ds=datasets[step.name];if(!ds)throw new Error('Unknown dataset WORK.'+step.name);
   if(exports.some(e=>e.path.toLowerCase()===path.toLowerCase()))throw new Error('Export each project path only once per run: '+path);
   const text=projectCSV(ds,19999998)+'\r\n';exportBytes+=new TextEncoder().encode(text).length;if(exportBytes>50000000)throw new Error('Total program exports are limited to 50 MB');
   exports.push({path,text,replace:step.replace});checkExportLimit();logs.push(`NOTE: Prepared export ${step.name.includes('.')?'':'WORK.'}${step.name.toUpperCase()} to ${path}.`);
  }
 }
 return {datasets,written,logs,expanded:macro.code,exports,libraries,plots,chartTitle};
}
