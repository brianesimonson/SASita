import {createUniformGenerator,automaticRandomSeed} from './random.mjs';
// Equal-probability observation sampling. Unsupported designs fail before output.
export function parseSurveySelect(tokens,start) {
 let i=start;
 const take=()=>{if(!tokens[i])throw new Error('Incomplete PROC SURVEYSELECT');return tokens[i++];};
 const need=v=>{if(take().v!==v)throw new Error('Expected '+v+' in PROC SURVEYSELECT');};
 const name=()=>{const t=take();if(t.type!=='id'||!/^(?:[a-z_]\w{0,7}\.)?[a-z_]\w{0,31}$/.test(t.v))throw new Error('Invalid SURVEYSELECT name');return t.v.replace(/^work\./,'');};
 const number=()=>{let sign=1;if(tokens[i]?.v==='-'){take();sign=-1;}const t=take();if(t.type!=='num'||!Number.isFinite(t.v))throw new Error('SURVEYSELECT requires a scalar numeric option');return sign*t.v;};
 need('proc');need('surveyselect');
 const spec={source:null,out:null,method:'srs',seed:null,size:null,rate:null,reps:1,strata:[],stratumseed:'default',outhits:false,outseed:false,outsize:false,stats:false,noprint:false};
 const seen=new Set();
 while(tokens[i]?.v!==';') {
  let key=take().v;key=({n:'size',sampsize:'size',samprate:'rate'})[key]||key;
  if(seen.has(key))throw new Error('Repeated SURVEYSELECT option '+key);seen.add(key);
  if(['outhits','outseed','outsize','stats','noprint'].includes(key)){spec[key]=true;continue;}
  if(!['data','out','method','seed','size','rate','reps','stratumseed'].includes(key))throw new Error('Unsupported SURVEYSELECT option '+key);
  need('=');
  if(key==='data'||key==='out')spec[key==='data'?'source':'out']=name();
  else if(key==='method'||key==='stratumseed')spec[key]=take().v;
  else spec[key]=number();
 }
 need(';');
 if(tokens[i]?.v==='strata'){
  take();while(tokens[i]?.v!==';'){const v=name();if(v.includes('.')||spec.strata.includes(v))throw new Error('STRATA requires distinct variable names');spec.strata.push(v);}need(';');
  if(!spec.strata.length||spec.strata.length>8)throw new Error('STRATA supports 1–8 variables');
 }
 need('run');need(';');
 if(!spec.source||!spec.out)throw new Error('SURVEYSELECT requires DATA= and OUT=');
 if(!['srs','urs','sys'].includes(spec.method))throw new Error('SURVEYSELECT supports METHOD=SRS, URS or SYS');
 if((spec.size===null)===(spec.rate===null))throw new Error('Specify exactly one SAMPSIZE= (N=) or SAMPRATE= (RATE=)');
 if(spec.size!==null&&(!Number.isInteger(spec.size)||spec.size<1||spec.size>100000))throw new Error('SAMPSIZE must be 1–100000');
 if(spec.rate!==null){if(spec.rate<=0||spec.rate>100)throw new Error('SAMPRATE must be positive and at most 100');if(spec.rate>1)spec.rate/=100;}
 if(spec.method==='sys'&&spec.rate!==null)throw new Error('METHOD=SYS currently requires SAMPSIZE; rate-driven systematic sampling is not implemented');
 if(spec.seed!==null&&(!Number.isInteger(spec.seed)||spec.seed>0xffffffff))throw new Error('SEED must be an integer no greater than 4294967295');
 if(!Number.isInteger(spec.reps)||spec.reps<1||spec.reps>100)throw new Error('REPS must be 1–100');
 if(spec.strata.length&&spec.reps>1)throw new Error('Stratified REPS is not yet supported');
 if(!['default','none'].includes(spec.stratumseed))throw new Error('STRATUMSEED=RESTORE and other legacy modes are not implemented');
 if(spec.stratumseed!=='default'&&!spec.strata.length)throw new Error('STRATUMSEED requires STRATA');
 if(spec.outseed&&spec.stratumseed==='none')throw new Error('OUTSEED cannot be combined with STRATUMSEED=NONE');
 if(spec.outhits&&spec.method!=='urs')throw new Error('OUTHITS requires METHOD=URS');
 return {spec,next:i};
}
function surveyCompare(a,b){if(typeof a==='string')a=a.trimEnd();if(typeof b==='string')b=b.trimEnd();const am=a===null||a===undefined||a==='',bm=b===null||b===undefined||b==='';return am?bm?0:-1:bm?1:a<b?-1:a>b?1:0;}
function surveyIndices(N,n,method,uniform) {
 if(method==='srs'){
  if(n===N)return Array.from({length:N},(_,i)=>({index:i,hits:1}));
  const chosen=new Set();for(let j=N-n+1;j<=N;j++){const t=Math.floor(uniform()*j)+1;chosen.add(chosen.has(t)?j:t);}
  return [...chosen].sort((a,b)=>a-b).map(v=>({index:v-1,hits:1}));
 }
 if(method==='sys'){const interval=N/n,start=uniform()*interval;return Array.from({length:n},(_,j)=>({index:Math.floor(start+j*interval),hits:1}));}
 const hits=new Map();for(let j=0;j<n;j++){const index=Math.floor(uniform()*N);hits.set(index,(hits.get(index)||0)+1);}
 return [...hits].sort((a,b)=>a[0]-b[0]).map(([index,hits])=>({index,hits}));
}
export function prepareSurveySelect(spec,ds) {
 if(!ds)throw new Error('SURVEYSELECT dataset '+spec.source+' was not found');
 if(!ds.rows.length)throw new Error('SURVEYSELECT requires a nonempty sampling frame');
 if(ds.rows.length>100000)throw new Error('SURVEYSELECT frame limit is 100000 rows');
 for(const v of spec.strata){if(!ds.columns.includes(v))throw new Error('STRATA variable '+v+' was not found');if(ds.formats?.[v])throw new Error('Formatted STRATA variables are not yet supported; remove the format before sampling');}
 const groups=[];
 for(const row of ds.rows){let cmp=0;if(groups.length)for(const v of spec.strata){cmp=surveyCompare(groups.at(-1).last[v],row[v]);if(cmp)break;}
  if(cmp>0)throw new Error('SURVEYSELECT STRATA input is not sorted; use PROC SORT');
  if(!groups.length||cmp!==0)groups.push({last:row,rows:[]});groups.at(-1).rows.push(row);
 }
 if(groups.length>1000)throw new Error('SURVEYSELECT supports at most 1000 strata');
 const seed=spec.seed>0?spec.seed:automaticRandomSeed(),master=createUniformGenerator(seed),single=createUniformGenerator(seed);
 let draws=0,totalRows=0;
 for(let g=0;g<groups.length;g++){
  const group=groups[g],N=group.rows.length,n=spec.size??Math.ceil(N*spec.rate);
  if(spec.method!=='urs'&&n>N)throw new Error('SURVEYSELECT sample size exceeds stratum population');
  draws+=n*spec.reps;totalRows+=n*spec.reps;
  if(draws>1000000||totalRows>100000)throw new Error('SURVEYSELECT output/draw limit exceeded (100000 rows)');
  group.n=n;group.seed=spec.stratumseed==='none'?null:g===0?seed:Math.floor(master()*2147483647);
  if(group.seed===0)throw new Error('Derived zero stratum seed is outside the verified subset; use STRATUMSEED=NONE');
 }
 const metadata=[];
 if(spec.method==='urs')metadata.push('numberhits');
 if(spec.outsize)metadata.push('total',spec.rate===null?'samplesize':'samplingrate');
 if(spec.outseed)metadata.push('initialseed');
 if(spec.stats||spec.strata.length)metadata.push(spec.method==='urs'?'expectedhits':'selectionprob','samplingweight');
 const columns=[...(spec.reps>1?['replicate']:[]),...spec.strata,...ds.columns.filter(c=>!spec.strata.includes(c)),...metadata];
 if(new Set(columns).size!==columns.length)throw new Error('SURVEYSELECT generated columns conflict with input variables');
 const rows=[],summaries=[];
 for(let rep=1;rep<=spec.reps;rep++)for(const group of groups){
  const N=group.rows.length,n=group.n,uniform=spec.strata.length&&spec.stratumseed!=='none'?createUniformGenerator(group.seed):single;
  const stats={};if(spec.outsize){stats.total=N;stats[spec.rate===null?'samplesize':'samplingrate']=spec.rate===null?n:spec.rate;}if(spec.outseed)stats.initialseed=group.seed??seed;
  if(spec.stats||spec.strata.length){stats[spec.method==='urs'?'expectedhits':'selectionprob']=n/N;stats.samplingweight=N/n;}
  for(const hit of surveyIndices(N,n,spec.method,uniform))for(let k=0;k<(spec.outhits?hit.hits:1);k++)rows.push({...group.rows[hit.index],...stats,...(spec.method==='urs'?{numberhits:hit.hits}:{}),...(spec.reps>1?{replicate:rep}:{})});
  summaries.push({...Object.fromEntries(spec.strata.map(v=>[v,group.last[v]])),replicate:rep,method:spec.method.toUpperCase(),initialseed:group.seed??seed,total:N,samplesize:n});
 }
 const dataset={columns,rows,formats:{...ds.formats},types:{...ds.types},lengths:{...ds.lengths}};
 for(const c of [...metadata,...(spec.reps>1?['replicate']:[])])dataset.types[c]='num';
 const report=spec.noprint?null:{columns:[...spec.strata,'replicate','method','initialseed','total','samplesize'],rows:summaries,formats:{},types:{...Object.fromEntries(spec.strata.map(v=>[v,ds.types?.[v]||'num'])),replicate:'num',method:'char',initialseed:'num',total:'num',samplesize:'num'},lengths:{...ds.lengths,method:3}};
 return {dataset,report,seed};
}
