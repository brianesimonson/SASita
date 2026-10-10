import {formatValue,parseFormat} from './formats.mjs';
// Unweighted PROC MEANS subset. Dataset shape follows SAS OUTPUT, not report layout.
const meansStats=['n','nmiss','sum','mean','min','max','range','var','std','stderr','css','uss','cv'];
const meansDefault=['n','mean','std','min','max'];
function meansStat(name){return name==='stddev'?'std':meansStats.includes(name)?name:null;}
export function parseMeans(tokens,start){
 let i=start;const take=()=>{if(!tokens[i])throw new Error('Incomplete PROC MEANS');return tokens[i++];},need=v=>{const t=take();if(t.v!==v)throw new Error('Expected '+v+' in PROC MEANS');return t;};
 const name=()=>{const t=take();if(t.type!=='id'||!/^(?:[a-z_]\w{0,7}\.)?[a-z_]\w{0,31}$/.test(t.v))throw new Error('Invalid PROC MEANS name');return t.v.replace(/^work\./,'');};
 need('proc');need('means');const spec={source:null,stats:[],classes:[],by:[],variables:null,outputs:[],nway:false,missing:false,noprint:false,vardef:'df',maxdec:7};
 const seen=new Set();
 while(tokens[i]?.v!==';'){
  const t=take().v,s=meansStat(t);if(s){if(spec.stats.includes(s))throw new Error('Repeated statistic '+t);spec.stats.push(s);continue;}
  if(seen.has(t))throw new Error('Repeated PROC MEANS option '+t);seen.add(t);
  if(['nway','missing','noprint'].includes(t))spec[t]=true;
  else if(t==='data'){need('=');spec.source=name();}
  else if(t==='vardef'){need('=');spec.vardef=take().v;if(!['df','n'].includes(spec.vardef))throw new Error('PROC MEANS supports VARDEF=DF or N');}
  else if(t==='maxdec'){need('=');spec.maxdec=take().v;if(!Number.isInteger(spec.maxdec)||spec.maxdec<0||spec.maxdec>15)throw new Error('MAXDEC must be 0–15');}
  else throw new Error('Unsupported PROC MEANS option '+t);
 }
 need(';');if(!spec.source)throw new Error('PROC MEANS requires DATA=');if(!spec.stats.length)spec.stats=[...meansDefault];
 while(tokens[i]?.v!=='run'){
  const statement=take().v;
  if(['var','class','by'].includes(statement)){
   if(seen.has(statement))throw new Error('Only one '+statement.toUpperCase()+' statement is supported');seen.add(statement);const values=[];
   while(tokens[i]?.v!==';'){let descending=false;if(statement==='by'&&tokens[i]?.v==='descending'){take();descending=true;}const variable=name();if(variable.includes('.'))throw new Error('Use explicit variable names in PROC MEANS');if(values.some(v=>(v.name||v)===variable))throw new Error('Repeated variable '+variable);values.push(statement==='by'?{name:variable,descending}:variable);}
   need(';');if(!values.length)throw new Error('Empty '+statement.toUpperCase());spec[statement==='var'?'variables':statement==='class'?'classes':'by']=values;
  }else if(statement==='output'){
   need('out');need('=');const out={name:name(),requests:[],autoname:false};
   while(tokens[i]?.v!==';'&&tokens[i]?.v!=='/'){
    const keyword=take().v,stat=meansStat(keyword);if(!stat)throw new Error('Unsupported OUTPUT statistic '+keyword);
    let variables=null;if(tokens[i]?.v==='('){take();variables=[];while(tokens[i]?.v!==')')variables.push(name());need(')');if(!variables.length)throw new Error('Empty OUTPUT variable list');}
    need('=');const names=[];while(tokens[i]?.type==='id'&&!(meansStat(tokens[i].v)&&['=','('].includes(tokens[i+1]?.v)))names.push(name());
    out.requests.push({stat,keyword,variables,names});
   }
   if(tokens[i]?.v==='/'){take();need('autoname');out.autoname=true;}
   need(';');spec.outputs.push(out);if(spec.outputs.length>10)throw new Error('At most 10 OUTPUT statements');
  }else throw new Error('Unsupported PROC MEANS statement '+statement);
 }
 need('run');need(';');if(spec.classes.length>8)throw new Error('PROC MEANS supports at most 8 CLASS variables');
 if(spec.vardef!=='df'&&spec.stats.includes('stderr'))throw new Error('STDERR requires VARDEF=DF');
 return {spec,next:i};
}
function meansCompare(a,b){if(typeof a==='string')a=a.trimEnd();if(typeof b==='string')b=b.trimEnd();const am=a===null||a===undefined||a==='',bm=b===null||b===undefined||b==='';return am?bm?0:-1:bm?1:a<b?-1:a>b?1:0;}
function meansMissing(v){return v===null||v===undefined||typeof v==='string'&&v.trim()==='';}
// Neumaier accumulation and shifted two-pass second moments avoid subtracting x^2 - mean^2.
function meansSum(values){let sum=0,correction=0;for(const x of values){const t=sum+x;correction+=Math.abs(sum)>=Math.abs(x)?(sum-t)+x:(x-t)+sum;sum=t;}return sum+correction;}
function meansMoments(values,total,vardef){
 const n=values.length;const result={n,nmiss:total-n,sum:n?meansSum(values):0,mean:null,min:null,max:null,range:null,var:null,std:null,stderr:null,css:null,uss:0,cv:null};
 if(!n)return result;
 const anchor=values[0],offset=meansSum(values.map(x=>x-anchor))/n;
 result.mean=Number.isFinite(offset)?anchor+offset:meansSum(values.map(x=>x/n));let min=values[0],max=min;for(const x of values){if(x<min)min=x;if(x>max)max=x;}result.min=min;result.max=max;result.range=max-min;
 result.css=meansSum(values.map(x=>{const d=(x-anchor)-offset;return d*d;}));result.uss=meansSum(values.map(x=>x*x));
 const divisor=vardef==='n'?n:n-1;if(divisor>0){result.var=result.css/divisor;result.std=Math.sqrt(result.var);if(vardef==='df')result.stderr=result.std/Math.sqrt(n);if(result.mean!==0)result.cv=100*result.std/result.mean;}
 for(const key of Object.keys(result))if(typeof result[key]==='number'&&!Number.isFinite(result[key]))result[key]=null;
 return result;
}
export function prepareMeans(spec,ds){
 if(!ds)throw new Error('PROC MEANS dataset '+spec.source+' was not found');
 const types=Object.fromEntries(ds.columns.map(c=>[c,ds.types?.[c]|| (ds.rows.some(r=>typeof r[c]==='string')?'char':'num')]));
 const vars=spec.variables||ds.columns.filter(c=>types[c]==='num'&&!spec.classes.includes(c)&&!spec.by.some(b=>b.name===c));
 if(!vars.length)throw new Error('PROC MEANS requires numeric analysis variables');
 for(const v of [...vars,...spec.classes,...spec.by.map(b=>b.name)])if(!ds.columns.includes(v))throw new Error('PROC MEANS variable '+v+' was not found');
 for(const v of vars)if(types[v]!=='num')throw new Error('VAR requires numeric variables: '+v);
 if([...spec.classes,...spec.by.map(b=>b.name)].some(v=>['_type_','_freq_','_stat_'].includes(v)))throw new Error('CLASS/BY names conflict with reserved summary columns');
 if(spec.classes.some(c=>spec.by.some(b=>b.name===c)))throw new Error('A variable cannot be both CLASS and BY in this subset');
 const maskMax=2**spec.classes.length-1,typeList=spec.nway?[maskMax]:Array.from({length:maskMax+1},(_,i)=>i);
 if(ds.rows.length*Math.max(1,typeList.length)*vars.length>10000000)throw new Error('PROC MEANS grouping limit exceeded; use NWAY or fewer variables');
 const byGroups=[];for(const row of ds.rows){let cmp=0;if(byGroups.length){const previous=byGroups.at(-1).last;for(const b of spec.by){cmp=meansCompare(previous[b.name],row[b.name])*(b.descending?-1:1);if(cmp)break;}if(cmp>0)throw new Error('PROC MEANS BY input is not sorted');}
  if(!byGroups.length||cmp!==0)byGroups.push({last:row,rows:[]});byGroups.at(-1).rows.push(row);
 }
 if(!byGroups.length&&!spec.by.length)byGroups.push({last:{},rows:[]});
 const levels=[];
 for(const by of byGroups){
  const eligible=by.rows.filter(r=>spec.missing||spec.classes.every(c=>!meansMissing(r[c])));
  const classLevels=Object.fromEntries(spec.classes.map(c=>[c,new Map()]));
  const classKey=(row,c)=>{const value=meansMissing(row[c])?(types[c]==='char'?'':null):row[c],f=ds.formats?.[c];return f?formatValue(value,parseFormat(f),{padded:false}):typeof value==='string'?value.trimEnd():value;};
  for(const row of eligible)for(const c of spec.classes){const key=classKey(row,c),value=meansMissing(row[c])?(types[c]==='char'?'':null):row[c];if(!classLevels[c].has(key)||meansCompare(value,classLevels[c].get(key))<0)classLevels[c].set(key,value);}
  for(const type of typeList){const groups=new Map();if(type===0)groups.set('[]',{values:{},rows:[]});
   for(const row of eligible){const keys=[],values={};for(let j=0;j<spec.classes.length;j++){const c=spec.classes[j];if(type&(2**(spec.classes.length-1-j))){const key=classKey(row,c);values[c]=classLevels[c].get(key);keys.push(key);}}
    const key=JSON.stringify(keys);if(!groups.has(key))groups.set(key,{values,rows:[]});const g=groups.get(key);for(const c of Object.keys(values))if(meansCompare(values[c],g.values[c])<0)g.values[c]=values[c];g.rows.push(row);
   }
   const ordered=[...groups.values()].sort((a,b)=>{for(const c of spec.classes){const d=meansCompare(a.values[c],b.values[c]);if(d)return d;}return 0;});
   for(const g of ordered){const row={};for(const b of spec.by)row[b.name]=by.last[b.name];for(const c of spec.classes)row[c]=Object.hasOwn(g.values,c)?g.values[c]:types[c]==='char'?'':null;row._type_=type;row._freq_=g.rows.length;
    const stats=Object.fromEntries(vars.map(v=>[v,meansMoments(g.rows.map(r=>r[v]).filter(x=>typeof x==='number'&&Number.isFinite(x)),g.rows.length,spec.vardef)]));levels.push({row,stats});if(levels.length>100000)throw new Error('PROC MEANS output exceeds 100,000 levels');
   }
  }
 }
 const base=[...spec.by.map(b=>b.name),...spec.classes];
 function dataset(columns,rows,formats={}){if(new Set(columns).size!==columns.length)throw new Error('Duplicate PROC MEANS output columns');if(rows.length>100000)throw new Error('PROC MEANS output exceeds 100,000 rows');return {columns,rows,formats,types:Object.fromEntries(columns.map(c=>[c,base.includes(c)?types[c]:(c==='_stat_'||c==='variable'?'char':'num')])),lengths:Object.fromEntries(columns.filter(c=>(types[c]==='char'||c==='_stat_')).map(c=>[c,c==='_stat_'?8:ds.lengths?.[c]??null]))};}
 const outputs=[];
 for(const out of spec.outputs){
  const columns=[...base,'_type_','_freq_'],formats=Object.fromEntries(base.filter(c=>ds.formats?.[c]).map(c=>[c,ds.formats[c]])),requests=[];
  if(!out.requests.length){columns.push('_stat_',...vars);for(const v of vars)if(ds.formats?.[v])formats[v]=ds.formats[v];const rows=[];for(const level of levels)for(const stat of ['n','min','max','mean','std'])rows.push({...level.row,_stat_:stat.toUpperCase(),...Object.fromEntries(vars.map(v=>[v,level.stats[v][stat]]))});outputs.push({name:out.name,dataset:dataset(columns,rows,formats)});continue;}
  for(const request of out.requests){if(request.stat==='stderr'&&spec.vardef!=='df')throw new Error('STDERR requires VARDEF=DF');const variables=request.variables||vars;for(const v of variables)if(!vars.includes(v))throw new Error('OUTPUT variable must be in VAR: '+v);
   if(request.names.length>variables.length)throw new Error('Too many OUTPUT names');
   for(let j=0;j<variables.length;j++){const v=variables[j];if(request.names.length&&j>=request.names.length)break;let name=request.names[j]||v;if(out.autoname&&!request.names[j]){const suffix='_'+request.keyword;name=name.slice(0,32-suffix.length)+suffix;}if(out.autoname&&columns.includes(name)){const baseName=name;let serial=2;while(columns.includes(name)){const suffix=String(serial++);name=baseName.slice(0,32-suffix.length)+suffix;}}if(name.includes('.')||columns.includes(name))throw new Error('Conflicting OUTPUT name '+name);columns.push(name);requests.push({name,v,stat:request.stat});if(ds.formats?.[v]&&!['n','nmiss','css','uss','var','cv'].includes(request.stat))formats[name]=ds.formats[v];}
  }
  outputs.push({name:out.name,dataset:dataset(columns,levels.map(level=>({...level.row,...Object.fromEntries(requests.map(r=>[r.name,level.stats[r.v][r.stat]]))})),formats)});
 }
 if(spec.noprint)return {outputs,report:null};
 const reportColumns=[...base,'n_obs','variable',...spec.stats],reportRows=[];
 for(const level of levels.filter(l=>l.row._type_===maskMax))for(const v of vars)reportRows.push({...Object.fromEntries(base.map(c=>[c,level.row[c]])),n_obs:level.row._freq_,variable:v,...Object.fromEntries(spec.stats.map(s=>[s,level.stats[v][s]]))});
 const report=dataset(reportColumns,reportRows,Object.fromEntries(spec.stats.filter(s=>!['n','nmiss'].includes(s)).map(s=>[s,'f32.'+spec.maxdec])));
 return {outputs,report:spec.noprint?null:report};
}
