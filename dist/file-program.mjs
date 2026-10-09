import {tokenize,run,parseCSV,csv} from './engine.mjs';
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
 if(token?.type!=='id'||!/^(?:work\.)?[_a-z]\w*$/.test(token.v))throw new Error('File procedures require a WORK dataset name.');
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
export async function runFileProgram(code,input={},readFile) {
 const macro=expandMacros(code);
 // Keep the original synchronous engine and global execution limit for ordinary programs.
 const tokens=tokenize(macro.code);
 const hasFiles=tokens.some((t,i)=>t.type==='id'&&((t.v==='filename'&&tokens[i+1]?.type==='id'&&(i===0||tokens[i-1]?.v===';'))||(t.v==='proc'&&['import','export'].includes(tokens[i+1]?.v))));
 if(!hasFiles){const result=run(macro.code,input,{expanded:true});result.logs.unshift(...macro.logs);return result;}
 const plan=filePlan(macro.code),aliases=new Map(),exports=[],logs=[...macro.logs],written=[];
 let datasets=Object.assign(Object.create(null),input),exportBytes=0;
 for(const step of plan) {
  if(step.kind==='filename'){if(step.path===null)aliases.delete(step.alias);else aliases.set(step.alias,step.path);continue;}
  if(step.kind==='code'){const result=run(step.code,datasets,{expanded:true});datasets=result.datasets;logs.push(...result.logs);written.push(...result.written);continue;}
  const path=step.path.type==='str'?step.path.v:aliases.get(step.path.v);
  if(!path)throw new Error('Unknown FILENAME alias '+step.path.v);projectPath(path);
  if(!/\.csv$/i.test(path))throw new Error('File procedures support .csv files only');
  if(step.kind==='import') {
   if(Object.hasOwn(datasets,step.name)&&!step.replace)throw new Error('WORK.'+step.name+' already exists; use REPLACE');
   const pending=exports.find(item=>item.path===path);
   if(!pending&&!readFile)throw new Error('Choose a project folder before importing files from a program.');
   const text=pending?pending.text:await readFile(path);
   if(new TextEncoder().encode(text).length>20000000)throw new Error('CSV import limit is 20 MB');
   const ds=parseCSV(text);datasets[step.name]=ds;written.push(step.name);logs.push(`NOTE: Imported ${path} into WORK.${step.name.toUpperCase()}: ${ds.rows.length} observations.`);
  } else {
   const ds=datasets[step.name];if(!ds)throw new Error('Unknown dataset WORK.'+step.name);
   if(exports.some(e=>e.path.toLowerCase()===path.toLowerCase()))throw new Error('Export each project path only once per run: '+path);
   const text=projectCSV(ds,19999998)+'\r\n';exportBytes+=new TextEncoder().encode(text).length;if(exportBytes>50000000)throw new Error('Total program exports are limited to 50 MB');
   exports.push({path,text,replace:step.replace});logs.push(`NOTE: Prepared export WORK.${step.name.toUpperCase()} to ${path}.`);
  }
 }
 return {datasets,written,logs,expanded:macro.code,exports};
}
