// Explicit observation reporting; datasets themselves are never written by PRINT.
export function parsePrint(tokens,start){
 let i=start;const take=()=>{if(!tokens[i])throw new Error('Incomplete PROC PRINT');return tokens[i++];},need=v=>{if(take().v!==v)throw new Error('Expected '+v+' in PROC PRINT');};
 const spec={source:null,firstobs:1,obs:null,noobs:false,variables:null},seen=new Set();
 const name=dataset=>{const t=take();if(t.type!=='id'||!(dataset?/^(?:[a-z_]\w{0,7}\.)?[a-z_]\w{0,31}$/:/^[a-z_]\w{0,31}$/).test(t.v))throw new Error('Invalid PROC PRINT name');return dataset?t.v.replace(/^work\./,''):t.v;};
 need('proc');need('print');
 while(tokens[i]?.v!==';'){
  const option=take().v;if(seen.has(option))throw new Error('Repeated PROC PRINT option '+option);seen.add(option);
  if(option==='noobs'){spec.noobs=true;continue;}
  if(option!=='data')throw new Error('Unsupported PROC PRINT option '+option);need('=');spec.source=name(true);
  if(tokens[i]?.v==='('){take();const options=new Set();while(tokens[i]?.v!==')'){
   const key=take().v;if(!['obs','firstobs'].includes(key)||options.has(key))throw new Error('PRINT dataset options support distinct OBS= and FIRSTOBS= only');options.add(key);need('=');const value=take();
   if(key==='obs'&&value.v==='max'){spec.obs=null;continue;}
   if(value.type!=='num'||!Number.isInteger(value.v)||value.v<(key==='obs'?0:1)||value.v>2147483647)throw new Error('PRINT '+key.toUpperCase()+' requires a valid nonnegative observation index (FIRSTOBS starts at 1)');spec[key]=value.v;
  }need(')');}
 }
 need(';');if(!spec.source)throw new Error('PROC PRINT requires DATA=');
 if(tokens[i]?.v==='var'){take();spec.variables=[];while(tokens[i]?.v!==';'){const v=name(false);if(spec.variables.includes(v))throw new Error('Repeated PRINT VAR variable');spec.variables.push(v);}need(';');if(!spec.variables.length)throw new Error('PRINT VAR requires explicit variable names');}
 if(tokens[i]?.v!=='run')throw new Error('Unsupported PROC PRINT statement '+(tokens[i]?.v||'(end)')+'; this subset supports VAR');need('run');need(';');
 return {spec,next:i};
}
export function preparePrint(spec,ds,title=''){
 if(!ds)throw new Error('PRINT dataset '+spec.source+' was not found');
 const columns=spec.variables||ds.columns;if(columns.some(v=>!ds.columns.includes(v)))throw new Error('PRINT VAR variable was not found');
 const start=Math.min(spec.firstobs-1,ds.rows.length),end=Math.max(start,Math.min(spec.obs??ds.rows.length,ds.rows.length)),count=end-start;
 if(count>1000||count*columns.length>100000)throw new Error('PROC PRINT is limited to 1,000 observations / 100,000 cells; use DATA=table(OBS=10) and VAR to restrict the listing');
 const pick=object=>Object.fromEntries(columns.filter(c=>Object.hasOwn(object||{},c)).map(c=>[c,object[c]]));
 const dataset={columns:[...columns],rows:ds.rows.slice(start,end).map(row=>Object.fromEntries(columns.map(c=>[c,row[c]]))),formats:pick(ds.formats),types:pick(ds.types),lengths:pick(ds.lengths)};
 return {report:{title:(title?title+' · ':'')+'PROC PRINT · '+spec.source,dataset,showObs:!spec.noobs,observationNumbers:Array.from({length:count},(_,i)=>start+i+1)},logs:[`NOTE: PROC PRINT displayed ${count} observations from ${spec.source.toUpperCase()}; source dataset unchanged.`]};
}
