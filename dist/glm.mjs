import {formatValue,parseFormat} from './formats.mjs';
// First GLM: one response, intercept, hierarchical crossed fixed effects.
export function parseGLM(tokens,start){
 let i=start;const take=()=>{if(!tokens[i])throw new Error('Incomplete PROC GLM');return tokens[i++];},need=v=>{if(take().v!==v)throw new Error('Expected '+v+' in PROC GLM');};
 const name=(dataset=false)=>{const t=take();if(t.type!=='id'||!(dataset?/^(?:[a-z_]\w{0,7}\.)?[a-z_]\w{0,31}$/:/^[a-z_]\w{0,31}$/).test(t.v))throw new Error('Invalid GLM name');return dataset?t.v.replace(/^work\./,''):t.v;};
 need('proc');need('glm');const spec={source:null,classes:[],terms:[],response:null,solution:false,ss:[1,3],order:'formatted',outputs:[],noprint:false,weight:null};const seen=new Set();
 while(tokens[i]?.v!==';'){const k=take().v;if(seen.has(k))throw new Error('Repeated PROC GLM option '+k);seen.add(k);if(k==='noprint'){spec.noprint=true;continue;}need('=');if(k==='data')spec.source=name(true);else if(k==='order'){spec.order=take().v;if(!['formatted','internal','data'].includes(spec.order))throw new Error('GLM ORDER supports FORMATTED, INTERNAL or DATA');}else throw new Error('Unsupported PROC GLM option '+k);}
 need(';');if(!spec.source)throw new Error('PROC GLM requires DATA=');
 const weight=()=>{need('weight');if(spec.weight)throw new Error('Only one GLM WEIGHT statement');spec.weight=name();need(';');};
 if(tokens[i]?.v==='weight')weight();
 if(tokens[i]?.v==='class'){take();while(tokens[i]?.v!==';'){const v=name();if(spec.classes.includes(v))throw new Error('Repeated CLASS variable');spec.classes.push(v);}need(';');if(!spec.classes.length||spec.classes.length>8)throw new Error('GLM supports 1–8 CLASS variables');}
 if(tokens[i]?.v==='weight')weight();
 need('model');spec.response=name();need('=');
 const canonical=term=>[...term.filter(v=>spec.classes.includes(v)).sort((a,b)=>spec.classes.indexOf(a)-spec.classes.indexOf(b)),...term.filter(v=>!spec.classes.includes(v)).sort()];
 const add=term=>{term=canonical(term);if(term.length>3)throw new Error('GLM supports effects through degree 3');if(term.some((v,j)=>spec.classes.includes(v)&&term.indexOf(v)!==j))throw new Error('Repeated CLASS variable in effect');if(!spec.terms.some(t=>t.join('*')===term.join('*')))spec.terms.push(term);if(spec.terms.length>20)throw new Error('GLM supports at most 20 effects');};
 while(!['/',';'].includes(tokens[i]?.v)){
  const factors=[[name()]];while(tokens[i]?.v==='*'){take();factors[0].push(name());}
  while(tokens[i]?.v==='|'){take();factors.push([name()]);while(tokens[i]?.v==='*'){take();factors.at(-1).push(name());}if(factors.length>3)throw new Error('GLM bar expansion supports at most 3 factors');}
  for(let last=0;last<factors.length;last++)for(let mask=0;mask<2**last;mask++){const term=[];for(let j=0;j<last;j++)if(mask&(1<<j))term.push(...factors[j]);term.push(...factors[last]);add(term);}
 }
 if(tokens[i]?.v==='/'){take();const options=new Set();while(tokens[i]?.v!==';'){const k=take().v;if(options.has(k))throw new Error('Repeated GLM MODEL option');options.add(k);if(k==='solution')spec.solution=true;else if(!['ss1','ss3'].includes(k))throw new Error('Unsupported GLM MODEL option '+k);}if(options.has('ss1')||options.has('ss3'))spec.ss=[...(options.has('ss1')?[1]:[]),...(options.has('ss3')?[3]:[])];}
 need(';');
 // Sum-contrast partial hypotheses match standard Type III for hierarchical models.
 for(const term of spec.terms)if(term.some(v=>spec.classes.includes(v))&&term.length>1){for(let mask=1;mask<2**term.length-1;mask++){const subset=canonical(term.filter((_,j)=>mask&(1<<j)));if(!spec.terms.some(t=>t.join('*')===subset.join('*')))throw new Error('GLM categorical interactions require their lower-order effects; use A|B or A B A*B');}}
 if(tokens[i]?.v==='weight')weight();
 if(tokens[i]?.v==='output'){
  take();need('out');need('=');const out={name:name(true)};
  while(tokens[i]?.v!==';'){let k=take().v;k=({predicted:'p',residual:'r'})[k]||k;if(!['p','r'].includes(k)||out[k])throw new Error('OUTPUT supports distinct P= and R= names');need('=');out[k]=name();}
  need(';');if(!out.p&&!out.r)throw new Error('GLM OUTPUT requires P= or R=');if(out.p&&out.p===out.r)throw new Error('Distinct prediction/residual names required');spec.outputs.push(out);
 }
 if(tokens[i]?.v==='weight')weight();
 need('run');need(';');if(tokens[i]?.v==='quit'){take();need(';');}
 return {spec,next:i};
}
function glmSum(values){let s=0,c=0;for(const x of values){const t=s+x;c+=Math.abs(s)>=Math.abs(x)?(s-t)+x:(x-t)+s;s=t;}const out=s+c;if(!Number.isFinite(out))throw new Error('GLM numeric overflow; rescale variables');return out;}
function glmDot(a,b){return glmSum(Array.from(a,(x,i)=>x*b[i]));}
function glmSolveUpper(R,b){const x=Array(b.length).fill(0);for(let j=x.length-1;j>=0;j--){let v=b[j];for(let k=j+1;k<x.length;k++)v-=R[j][k]*x[k];x[j]=v/R[j][j];if(!Number.isFinite(x[j]))throw new Error('GLM unstable solve; rescale variables');}return x;}
function glmFit(columns,y){
 const q=[],R=[],chosen=[],contribution=[],nonunique=Array(columns.length).fill(false),norms=columns.map(c=>Math.sqrt(glmDot(c,c)));
 for(let j=0;j<columns.length;j++){
  const v=Float64Array.from(columns[j]),projection=Array(q.length).fill(0);
  for(let pass=0;pass<2;pass++)for(let k=0;k<q.length;k++){const d=glmDot(q[k],v);projection[k]+=d;for(let r=0;r<v.length;r++)v[r]-=d*q[k][r];}
  const norm=Math.sqrt(glmDot(v,v));
  if(norm<=1e-10*norms[j]||norm===0){
   contribution.push(0);nonunique[j]=true;
   const relation=glmSolveUpper(R,projection);for(let k=0;k<chosen.length;k++)if(Math.abs(relation[k])*norms[chosen[k]]>1e-8*norms[j])nonunique[chosen[k]]=true;
   continue;
  }
  for(let r=0;r<v.length;r++)v[r]/=norm;
  for(let k=0;k<R.length;k++)R[k].push(projection[k]);R.push([...Array(q.length).fill(0),norm]);q.push(v);chosen.push(j);contribution.push(glmDot(v,y)**2);
 }
 const qty=q.map(c=>glmDot(c,y)),beta=glmSolveUpper(R,qty),residual=Float64Array.from(y);
 for(let k=0;k<q.length;k++)for(let r=0;r<residual.length;r++)residual[r]-=q[k][r]*qty[k];
 const inverse=R.map(()=>Array(R.length).fill(0));
 for(let j=0;j<R.length;j++){const column=glmSolveUpper(R,Array.from({length:R.length},(_,k)=>k===j?1:0));for(let k=0;k<R.length;k++)inverse[k][j]=column[k];}
 const covariance=inverse.map(a=>inverse.map(b=>glmDot(a,b)));
 return {beta,chosen,nonunique,contribution,covariance,sse:glmDot(residual,residual),residual};
}
function glmSolvePositive(A,b){const L=A.map(()=>Array(A.length).fill(0));for(let j=0;j<A.length;j++)for(let k=0;k<=j;k++){let v=A[j][k];for(let r=0;r<k;r++)v-=L[j][r]*L[k][r];if(j===k){if(v<=0||!Number.isFinite(v))throw new Error('GLM Type III hypothesis is numerically singular');L[j][k]=Math.sqrt(v);}else L[j][k]=v/L[k][k];}const z=Array(b.length).fill(0),x=[...z];for(let j=0;j<z.length;j++){let v=b[j];for(let k=0;k<j;k++)v-=L[j][k]*z[k];z[j]=v/L[j][j];}for(let j=x.length-1;j>=0;j--){let v=z[j];for(let k=j+1;k<x.length;k++)v-=L[k][j]*x[k];x[j]=v/L[j][j];}return x;}
function glmLogGamma(z){const coefficients=[676.5203681218851,-1259.1392167224028,771.32342877765313,-176.61502916214059,12.507343278686905,-0.13857109526572012,9.9843695780195716e-6,1.5056327351493116e-7];if(z<.5)return Math.log(Math.PI)-Math.log(Math.sin(Math.PI*z))-glmLogGamma(1-z);z--;let x=.99999999999980993;for(let j=0;j<coefficients.length;j++)x+=coefficients[j]/(z+j+1);const t=z+7.5;return .5*Math.log(2*Math.PI)+(z+.5)*Math.log(t)-t+Math.log(x);}
function glmBetaFraction(a,b,x){let c=1,d=1-(a+b)*x/(a+1);if(Math.abs(d)<1e-30)d=1e-30;d=1/d;let h=d;for(let m=1;m<=1000;m++){let aa=m*(b-m)*x/((a+2*m-1)*(a+2*m));d=1+aa*d;if(Math.abs(d)<1e-30)d=1e-30;c=1+aa/c;if(Math.abs(c)<1e-30)c=1e-30;d=1/d;h*=d*c;aa=-(a+m)*(a+b+m)*x/((a+2*m)*(a+2*m+1));d=1+aa*d;if(Math.abs(d)<1e-30)d=1e-30;c=1+aa/c;if(Math.abs(c)<1e-30)c=1e-30;d=1/d;const delta=d*c;h*=delta;if(Math.abs(delta-1)<3e-14)return h;}throw new Error('GLM probability calculation did not converge');}
function glmBeta(x,a,b){if(x<=0)return 0;if(x>=1)return 1;const bt=Math.exp(glmLogGamma(a+b)-glmLogGamma(a)-glmLogGamma(b)+a*Math.log(x)+b*Math.log1p(-x));const value=x<(a+1)/(a+b+2)?bt*glmBetaFraction(a,b,x)/a:1-bt*glmBetaFraction(b,a,1-x)/b;return Math.max(0,Math.min(1,value));}
export function glmFProbability(f,df1,df2){return f>=0&&df1>0&&df2>0?glmBeta(df2/(df2+df1*f),df2/2,df1/2):null;}
export function glmTProbability(t,df){return df>0?glmBeta(df/(df+t*t),df/2,.5):null;}
function glmMissing(v){return v===null||v===undefined||typeof v==='string'&&v.trim()==='';}
function glmCompare(a,b){return a<b?-1:a>b?1:0;}
export function prepareGLM(spec,ds){
 if(!ds)throw new Error('GLM dataset '+spec.source+' was not found');
 const predictors=[...new Set(spec.terms.flat())],numeric=predictors.filter(v=>!spec.classes.includes(v));
 for(const v of [spec.response,...spec.classes,...predictors,...(spec.weight?[spec.weight]:[])])if(!ds.columns.includes(v))throw new Error('GLM variable '+v+' was not found');
 const types=Object.fromEntries(ds.columns.map(c=>[c,ds.types?.[c]||(ds.rows.some(r=>typeof r[c]==='string')?'char':'num')]));
 if(spec.weight&&types[spec.weight]!=='num')throw new Error('GLM WEIGHT variable must be numeric');
 if(types[spec.response]!=='num'||numeric.some(v=>types[v]!=='num'))throw new Error('GLM response and non-CLASS predictors must be numeric');
 const complete=row=>[...spec.classes,...numeric].every(v=>!glmMissing(row[v])&&(types[v]==='char'||Number.isFinite(row[v])));
 const used=ds.rows.filter(r=>complete(r)&&typeof r[spec.response]==='number'&&Number.isFinite(r[spec.response])&&(!spec.weight||(typeof r[spec.weight]==='number'&&Number.isFinite(r[spec.weight])&&r[spec.weight]>0)));
 if(!used.length)throw new Error('GLM has no complete observations');
 if(used.length>100000)throw new Error('GLM is limited to 100000 observations');
 const levels={},key=(row,v)=>ds.formats?.[v]?formatValue(row[v],parseFormat(ds.formats[v]),{padded:false}):typeof row[v]==='string'?row[v].trimEnd():row[v];
 for(const v of spec.classes){const entries=new Map();for(const r of used){const k=key(r,v);if(!entries.has(k))entries.set(k,r[v]);else if(glmCompare(r[v],entries.get(k))<0)entries.set(k,r[v]);}levels[v]=[...entries.keys()];if(spec.order!=='data')levels[v].sort((a,b)=>glmCompare(spec.order==='internal'?entries.get(a):a,spec.order==='internal'?entries.get(b):b));if(levels[v].length>32||levels[v].some(k=>String(k).length>128))throw new Error('GLM CLASS supports at most 32 levels, labels up to 128 characters');}
 let rawCount=1,codedCount=1;
 for(const variables of spec.terms){const cats=variables.filter(v=>spec.classes.includes(v));rawCount+=cats.reduce((n,v)=>n*levels[v].length,1);codedCount+=cats.reduce((n,v)=>n*(levels[v].length-1),1);}
 if(rawCount>200||codedCount>80||used.length*(rawCount**2+codedCount**2)>50000000)throw new Error('GLM matrix budget exceeded (200 raw/80 independent columns, 50 million work units)');
 const full=[],coded=[],labels=[],owners=[],codedOwners=[];
 const append=(columns,description,owner)=>{for(const desc of description){columns.push(desc.values);if(columns===full){labels.push(desc.label);owners.push(owner);}else codedOwners.push(owner);}};
 append(full,[{values:used.map(()=>1),label:'Intercept'}],-1);append(coded,[{values:used.map(()=>1)}],-1);
 const terms=spec.terms.map((variables,index)=>{
  const cats=variables.filter(v=>spec.classes.includes(v)),nums=variables.filter(v=>!spec.classes.includes(v));
  if(cats.length>1){const expected=cats.reduce((n,v)=>n*levels[v].length,1),cells=new Set(used.map(r=>JSON.stringify(cats.map(v=>key(r,v)))));if(cells.size!==expected)throw new Error('GLM Type III first version requires complete CLASS interaction cells');}
  const products=used.map(row=>{const value=nums.reduce((n,v)=>n*row[v],1);if(!Number.isFinite(value))throw new Error('GLM interaction overflow');return value;});
  let raw=[{values:products,label:variables.join('*').toUpperCase()}],contrast=[{values:products}];
  for(const v of cats){raw=raw.flatMap(desc=>levels[v].map(level=>({values:desc.values.map((n,j)=>n*(key(used[j],v)===level?1:0)),label:desc.label+' '+String(level)})));
   contrast=contrast.flatMap(desc=>levels[v].slice(0,-1).map(level=>({values:desc.values.map((n,j)=>n*(key(used[j],v)===level?1:key(used[j],v)===levels[v].at(-1)?-1:0))})));}
  append(full,raw,index);append(coded,contrast,index);return {name:variables.join('*').toUpperCase(),variables};
 });
 if(full.length>200||coded.length>80||used.length*full.length**2+used.length*coded.length**2>50000000)throw new Error('GLM matrix budget exceeded (200 raw/80 independent columns, 50 million work units)');
 const y=used.map(r=>r[spec.response]),weights=used.map(r=>spec.weight?r[spec.weight]:1),weightScale=weights.reduce((a,b)=>Math.max(a,b),0),normalized=weights.map(w=>w/weightScale);
 if(normalized.some(w=>w===0))throw new Error('GLM weights span an unsupported numeric range; rescale weights');
 const rootWeights=normalized.map(Math.sqrt),sumWeights=glmSum(normalized),anchor=y[0],mean=anchor+glmSum(y.map((v,i)=>(v-anchor)*normalized[i]))/sumWeights,centered=y.map((v,i)=>(v-mean)*rootWeights[i]),sstNormalized=glmDot(centered,centered),sst=sstNormalized*weightScale;
 const weighted=columns=>spec.weight?columns.map(c=>c.map((v,i)=>v*rootWeights[i])):columns;
 const fit=glmFit(weighted(full),centered),contrastFit=glmFit(weighted(coded),centered);
 if(contrastFit.chosen.length!==coded.length)throw new Error('GLM model is rank-deficient or poorly conditioned beyond CLASS coding; rescale predictors or simplify the model');
 if(fit.chosen.length!==coded.length)throw new Error('GLM coding rank mismatch; rescale predictors');
 const rank=fit.chosen.length,dfError=y.length-rank,sse=fit.sse*weightScale,mse=dfError>0?sse/dfError:null,dfModel=rank-1,modelSS=glmSum(fit.contribution.slice(1))*weightScale;
 if(![sse,sst,modelSS].every(Number.isFinite))throw new Error('Weighted GLM sums of squares overflow; rescale values/weights');
 const dependent=spec.response.toUpperCase();
 const finite=v=>Number.isFinite(v)?v:null;
 function test(source,df,ss,type){const ms=df>0?ss/df:null,f=df>0&&mse>0?ms/mse:null;return {dependent,source,...(type?{hypothesistype:type}:{}),df,ss,ms,fvalue:finite(f),probf:f===null?null:glmFProbability(f,df,dfError)};}
 const overall=[test('Model',dfModel,modelSS),{dependent,source:'Error',df:dfError,ss:sse,ms:mse,fvalue:null,probf:null},{dependent,source:'Corrected Total',df:y.length-1,ss:sst,ms:null,fvalue:null,probf:null}];
 const tests=[];
 for(let j=0;j<terms.length;j++){
  if(spec.ss.includes(1)){const indices=owners.flatMap((owner,k)=>owner===j?[k]:[]),df=indices.filter(k=>fit.chosen.includes(k)).length,ss=glmSum(indices.map(k=>fit.contribution[k]))*weightScale;tests.push(test(terms[j].name,df,ss,1));}
  if(spec.ss.includes(3)){const indices=codedOwners.flatMap((owner,k)=>owner===j?[k]:[]),b=indices.map(k=>contrastFit.beta[k]),cov=indices.map(k=>indices.map(l=>contrastFit.covariance[k][l])),ss=indices.length?Math.max(0,glmDot(b,glmSolvePositive(cov,b)))*weightScale:0;tests.push(test(terms[j].name,indices.length,ss,3));}
 }
 // SAS-style g2 convention: preceding independent columns retained; aliases zero.
 const coefficients=Array(full.length).fill(0),parameters=[];for(let j=0;j<rank;j++)coefficients[fit.chosen[j]]=fit.beta[j];coefficients[0]+=mean;
 if(spec.solution)for(let j=0;j<full.length;j++){const pos=fit.chosen.indexOf(j),se=pos>=0&&mse!==null?Math.sqrt(Math.max(0,(fit.sse/dfError)*fit.covariance[pos][pos])):null,t=se>0?coefficients[j]/se:null;parameters.push({dependent,parameter:labels[j],estimate:coefficients[j],stderr:se,tvalue:finite(t),probt:t===null?null:glmTProbability(t,dfError),biased:fit.nonunique[j]?'B':''});}
 const asTable=rows=>{const columns=rows.length?Object.keys(rows[0]):[],t={columns,rows,formats:{},types:{},lengths:{}};for(const c of columns){t.types[c]=rows.some(r=>typeof r[c]==='string')?'char':'num';if(t.types[c]==='char')t.lengths[c]=Math.max(1,...rows.map(r=>String(r[c]??'').length));}return t;};
 const tables={overallanova:asTable(overall),modelanova:asTable(tests),fitstatistics:asTable([{dependent,rsquare:sst>0?Math.max(0,Math.min(1,1-fit.sse/sstNormalized)):null,coeffvar:mse!==null&&mean!==0?finite(100*Math.sqrt(mse)/mean):null,rootmse:mse===null?null:Math.sqrt(mse),depmean:mean}]),nobs:asTable([{nobsread:ds.rows.length,nobsused:used.length}])};
 if(spec.classes.length)tables.classlevels=asTable(spec.classes.map(v=>({class:v.toUpperCase(),levels:levels[v].length,values:levels[v].join(' ')})));
 if(spec.solution)tables.parameterestimates=asTable(parameters);
 const reportOrder=['classlevels','nobs','overallanova','fitstatistics','modelanova','parameterestimates'],reports=spec.noprint?[]:reportOrder.filter(k=>tables[k]?.rows.length).map(k=>({title:'PROC GLM · '+k,dataset:tables[k]}));
 const outputs=[];
 for(const out of spec.outputs){const columns=[...ds.columns,...[out.p,out.r].filter(Boolean)];if(new Set(columns).size!==columns.length)throw new Error('GLM OUTPUT names must not overwrite source columns');
  const rows=ds.rows.map(row=>{let predicted=null;if(complete(row)&&spec.classes.every(v=>levels[v].includes(key(row,v)))){
   const values=[1];for(const term of terms){const cats=term.variables.filter(v=>spec.classes.includes(v)),nums=term.variables.filter(v=>!spec.classes.includes(v));let termValues=[nums.reduce((n,v)=>n*row[v],1)];for(const v of cats)termValues=termValues.flatMap(n=>levels[v].map(level=>n*(key(row,v)===level?1:0)));values.push(...termValues);}predicted=finite(glmDot(values,coefficients));}
   return {...row,...(out.p?{[out.p]:predicted}:{}),...(out.r?{[out.r]:predicted!==null&&typeof row[spec.response]==='number'?finite(row[spec.response]-predicted):null}:{})};});
  outputs.push({name:out.name,dataset:{columns,rows,formats:{...ds.formats},types:{...types,...Object.fromEntries([out.p,out.r].filter(Boolean).map(v=>[v,'num']))},lengths:{...ds.lengths}}});
 }
 return {tables,reports,outputs,logs:[`NOTE: PROC GLM used ${used.length} of ${ds.rows.length} observations; model rank ${rank}, error DF ${dfError}.`,...(spec.solution&&fit.nonunique.some(Boolean)?['NOTE: GLM B flags identify nonunique coefficients under the redundant CLASS parameterization; aliased columns are set to zero.']:[]),...(dfError===0||mse===0?['NOTE: Zero error degrees of freedom or variance: some GLM inferential statistics are missing.']:[])]};
}
