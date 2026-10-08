import {expandMacros} from './macros.mjs';
import {parseFormat,formatValue,readFormatted} from './formats.mjs';
import {createRandomStream} from './random.mjs';
// Deliberately scoped SAS DATA step interpreter. No eval or generated JavaScript.
const epoch=Date.UTC(1960,0,1), day=86400000;
function fail(msg,t){throw new Error(`${msg}${t?` (line ${t.line})`:''}`)}
export function tokenize(code){
 const ts=[];let i=0,line=1;
 while(i<code.length){let c=code[i];if(/\s/.test(c)){if(c==='\n')line++;i++;continue}
 if(code.slice(i,i+2)==='/*'){let end=code.indexOf('*/',i+2);if(end<0)fail('Unclosed comment',{line});line+=(code.slice(i,end).match(/\n/g)||[]).length;i=end+2;continue}
 if(c==='*'&&(!ts.length||ts.at(-1).v===';')){let end=code.indexOf(';',i);if(end<0)fail('Unclosed statement comment',{line});line+=(code.slice(i,end).match(/\n/g)||[]).length;i=end+1;continue}
 let l=line;if(c==='"'||c==="'"){let quote=c,s='';i++;let closed=false;while(i<code.length){c=code[i++];if(c===quote){if(code[i]===quote){s+=quote;i++}else{closed=true;break}}else{s+=c;if(c==='\n')line++}}if(!closed)fail('Unclosed string',{line:l});if(/[dD]/.test(code[i]||' ')){i++;let m=s.match(/^(\d{1,2})([a-z]{3})(\d{4})$/i),months=['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];if(!m||!months.includes(m[2].toLowerCase()))fail('Use date literals such as \'01JAN2026\'d',{line:l});ts.push({v:(Date.UTC(+m[3],months.indexOf(m[2].toLowerCase()),+m[1])-epoch)/day,type:'num',line:l})}else ts.push({v:s,type:'str',line:l});continue}
 let m=code.slice(i).match(/^(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?/i);if(m){ts.push({v:+m[0],raw:m[0],type:'num',line:l});i+=m[0].length;continue}
 m=code.slice(i).match(/^[a-z_]\w*(?:\.[a-z_]\w*)?/i);if(m){ts.push({v:m[0].toLowerCase(),type:'id',line:l});i+=m[0].length;continue}
 let two=code.slice(i,i+2);if(['>=','<=','^=','~=','ne','**','||'].includes(two)){ts.push({v:two,type:'op',line:l});i+=2;continue}
 if(';(),=+-*/<>.^~$?'.includes(c)){ts.push({v:c,type:'op',line:l});i++;continue}fail(`Unsupported character ${c}`,{line:l});
 }return ts;
}
class Parser{
 constructor(code){this.ts=tokenize(code);this.i=0}
 byList(){let keys=[];while(!this.peek(';')){let desc=this.eat('descending'),name=this.name();if(keys.some(k=>k.name===name))fail('Repeated BY variable '+name);keys.push({name,desc})}this.need(';');if(!keys.length)fail('BY requires variables');return keys}
 inputSpec(){let name=this.name(),indicator=null,keep=null,drop=[],rename=Object.create(null);if(this.eat('(')){while(!this.peek(')')){let opt=this.take();this.need('=');if(opt.v==='in'){indicator=this.name()}else if(opt.v==='keep'||opt.v==='drop'){let list=[];while(!this.peek(')')&&!(this.peek()?.type==='id'&&this.ts[this.i+1]?.v==='='))list.push(this.name());if(!list.length)fail('Empty '+opt.v+' option',opt);if(opt.v==='keep')keep=list;else drop=list}else if(opt.v==='rename'){this.need('(');while(!this.peek(')')){let from=this.name();this.need('=');rename[from]=this.name()}this.need(')')}else fail('Unsupported input dataset option '+opt.v,opt)}this.need(')')}return{name,indicator,keep,drop,rename}}
 peek(v){return v===undefined?this.ts[this.i]:this.ts[this.i]?.v===v}
 take(){let t=this.ts[this.i++];if(!t)fail('Unexpected end of program');return t}
 eat(v){if(this.peek(v)){this.i++;return true}return false}
 need(v){let t=this.take();if(t.v!==v)fail(`Expected ${v}, found ${t.v}`,t);return t}
 name(){let t=this.take();if(t.type!=='id'||t.v.startsWith('first.')||t.v.startsWith('last.'))fail('Expected a variable or dataset name',t);return t.v}
 formatSpec(mode='format', allowAlignment=false){
  let t=this.take(),spec='';
  if(t.v==='$'){spec='$';t=this.take()}
  if(t.type==='num')spec+=t.raw;
  else if(t.type==='id'){
    spec+=t.v;
    if(this.peek('.') )spec+=this.take().v;
    else if(this.peek()?.type==='num' && this.peek().raw.startsWith('.'))spec+=this.take().raw;
  }else fail('Expected a literal '+mode+' specification',t);
  if(!spec.includes('.'))fail('Format/informat specification requires a period',t);
  const parsed=parseFormat(spec,mode);
  let alignment=null;
  if(allowAlignment && this.peek('-') && ['l','c','r'].includes(this.ts[this.i+1]?.v)){this.take();alignment=this.take().v}
  return {spec,parsed,alignment};
 }
 expr(min=0){let t=this.take(),a;if(t.type==='num'||t.type==='str')a={k:'lit',v:t.v};else if(t.v==='.')a={k:'lit',v:null};else if(['-','+','not','^','~'].includes(t.v))a={k:'unary',op:t.v,a:this.expr(7)};else if(t.v==='('){a=this.expr();this.need(')')}else if(t.type==='id'){if(this.eat('(')){
 if(t.v==='input'||t.v==='put'){
  let source=this.expr();this.need(',');let quiet=0;
  if(t.v==='input'){while(this.eat('?'))quiet++;if(quiet>2)fail('INPUT accepts ? or ??',t)}
  let format=this.formatSpec(t.v==='input'?'informat':'format',t.v==='put');this.need(')');
  a={k:'convert',name:t.v,source,format,quiet};
 }else{let args=[];if(!this.peek(')')){do{args.push(this.expr())}while(this.eat(','))}this.need(')');if(t.v!=='rand'&&!Object.hasOwn(funcs,t.v))fail(`Unsupported function ${t.v}`,t);a={k:'call',name:t.v,args}}
 }else a={k:'var',name:t.v}}else fail('Expected an expression',t);
 const prec={or:1,and:2,'=':3,eq:3,ne:3,'^=':3,'~=':3,'>':3,gt:3,'<':3,lt:3,'>=':3,ge:3,'<=':3,le:3,in:3,'||':4,'+':5,'-':5,'*':6,'/':6,'**':8};
 while(this.peek()&&prec[this.peek().v]>=min){let op=this.take().v,p=prec[op];if(op==='in'){this.need('(');let args=[];do{args.push(this.expr(4))}while(this.eat(','));this.need(')');a={k:'in',a,args};continue}let b=this.expr(p+(op==='**'?0:1));a={k:'bin',op,a,b}}
 return a;
 }
 stmt(){let t=this.peek(),w=t?.v;if(!t)fail('Expected statement');if(this.eat(';'))return{k:'noop'};
 if(this.eat('if')){let test=this.expr();if(this.eat('then')){let yes=this.stmt(),no=this.eat('else')?this.stmt():null;return{k:'if',test,yes,no}}this.need(';');return{k:'filter',test}}
 if(this.eat('do')){if(this.eat(';')){let body=[];while(!this.peek('end'))body.push(this.stmt());this.need('end');this.need(';');return{k:'block',body}}let name=this.name();this.need('=');let from=this.expr();this.need('to');let to=this.expr(),by=this.eat('by')?this.expr():{k:'lit',v:1};this.need(';');let body=[];while(!this.peek('end'))body.push(this.stmt());this.need('end');this.need(';');return{k:'loop',name,from,to,by,body}}
 if(['delete','stop'].includes(w)){this.take();this.need(';');return{k:w}}
 if(this.eat('output')){let names=[];while(!this.peek(';'))names.push(this.name());this.need(';');return{k:'output',names}}
 if(['keep','drop','retain'].includes(w)){this.take();let items=[];while(!this.peek(';')){let name=this.name(),init=null;if(w==='retain'&&(this.peek()?.type==='num'||this.peek()?.type==='str'||this.peek('.'))){init=this.peek('.')?(this.take(),null):this.take().v}items.push({name,init})}this.need(';');return{k:w,items}}
 if(this.eat('length')){let items=[];while(!this.peek(';')){let name=this.name(),type=this.eat('$')?'char':'num';let n=this.take();if(n.type!=='num'||!Number.isInteger(n.v)||n.v<1||n.v>32767)fail('Character LENGTH must be an integer from 1 to 32767',n);if(type==='num')fail('Numeric LENGTH is not supported; omit it',t);items.push({name,n:n.v})}this.need(';');return{k:'length',items}}
 if(this.eat('format')){let items=[];while(!this.peek(';')){let name=this.name(),format=this.formatSpec();items.push({name,fmt:format.spec})}this.need(';');return{k:'format',items}}
 if(this.eat('call')){let t=this.take();if(t.v!=='streaminit')fail('Unsupported CALL routine '+t.v,t);this.need('(');let args=[];if(!this.peek(')')){do{args.push(this.expr())}while(this.eat(','))}this.need(')');this.need(';');return{k:'streaminit',args}}
 if(this.eat('by'))return{k:'by',keys:this.byList()};
 if(w==='set'||w==='merge'){this.take();let inputs=[];while(!this.peek(';'))inputs.push(this.inputSpec());this.need(';');if(w==='set'&&inputs.length!==1)fail('SET supports one input dataset per step',t);if(!inputs.length)fail(w.toUpperCase()+' requires input datasets',t);return{k:w,inputs}}
 if(t.type==='id'){let name=this.name();if(this.eat('=')){let value=this.expr();this.need(';');return{k:'assign',name,value}}if(this.eat('+')){let value=this.expr();this.need(';');return{k:'sumstmt',name,value}}}
 fail(`Unsupported statement ${w}`,t);
 }
 parse(){let steps=[];while(this.peek()){
 if(this.eat('proc')){this.need('sort');let data=null,out=null,nodupkey=false;while(!this.peek(';')){let t=this.take();if(t.v==='data'||t.v==='out'){this.need('=');let n=this.name();if(t.v==='data')data=n;else out=n}else if(t.v==='nodupkey')nodupkey=true;else if(t.v!=='equals')fail('Unsupported PROC SORT option '+t.v,t)}this.need(';');if(!data)fail('PROC SORT requires DATA= in this version');this.need('by');let keys=this.byList();this.need('run');this.need(';');steps.push({k:'sort',data,out:out||data,nodupkey,keys});continue}
 this.need('data');let names=[];while(!this.peek(';'))names.push(this.name());this.need(';');if(!names.length)fail('DATA requires an output name');if(new Set(names).size!==names.length)fail('Repeated DATA output name');let body=[];while(!this.peek('run')){if(!this.peek())fail('Missing RUN;');body.push(this.stmt())}this.need('run');this.need(';');steps.push({k:'data',names,body})}return steps}

}
const miss=v=>v===null||v===undefined||v===''||Number.isNaN(v);
const num=v=>miss(v)?null:(typeof v==='number'?v:null);
const truth=v=>!miss(v)&&v!==0;
const numeric=f=>(...a)=>a.some(x=>num(x)===null)?null:f(...a);
const text=v=>miss(v)?'':String(v);
const funcs=Object.assign(Object.create(null),{
 abs:numeric(Math.abs),sqrt:numeric(x=>x<0?null:Math.sqrt(x)),ceil:numeric(Math.ceil),floor:numeric(Math.floor),int:numeric(Math.trunc),round:(x,u=1)=>miss(x)||!u?null:Math.round(x/u)*u,
 sum:(...a)=>{let n=a.filter(x=>num(x)!==null);return n.length?n.reduce((s,v)=>s+v,0):null},mean:(...a)=>{let n=a.filter(x=>num(x)!==null);return n.length?n.reduce((s,v)=>s+v,0)/n.length:null},min:(...a)=>{let n=a.filter(x=>num(x)!==null);return n.length?Math.min(...n):null},max:(...a)=>{let n=a.filter(x=>num(x)!==null);return n.length?Math.max(...n):null},
 missing:x=>+miss(x),n:(...a)=>a.filter(x=>num(x)!==null).length,nmiss:(...a)=>a.filter(miss).length,coalesce:(...a)=>a.find(x=>!miss(x))??null,coalescec:(...a)=>a.find(x=>!miss(x))??'',
 upcase:x=>text(x).toUpperCase(),lowcase:x=>text(x).toLowerCase(),strip:x=>text(x).trim(),trim:x=>text(x).trimEnd(),left:x=>text(x).trimStart(),length:x=>Math.max(1,text(x).trimEnd().length),lengthn:x=>text(x).trimEnd().length,
 substr:(x,s,n)=>s<1?null:text(x).substring(s-1,n==null?undefined:s-1+n),index:(x,s)=>text(x).indexOf(text(s))+1,cats:(...a)=>a.map(x=>text(x).trim()).join(''),catx:(sep,...a)=>a.map(x=>text(x).trim()).filter(Boolean).join(text(sep)),
 mod:numeric((a,b)=>b===0?null:a%b),today:()=>Math.floor((Date.now()-epoch)/day),mdy:(m,d,y)=>{let v=new Date(Date.UTC(y,m-1,d));return v.getUTCMonth()===m-1&&v.getUTCDate()===d?(+v-epoch)/day:null},year:x=>miss(x)?null:new Date(epoch+x*day).getUTCFullYear(),month:x=>miss(x)?null:new Date(epoch+x*day).getUTCMonth()+1,day:x=>miss(x)?null:new Date(epoch+x*day).getUTCDate()
});
function cmp(a,b){if(typeof a==='string'&&typeof b==='string'){a=a.trimEnd();b=b.trimEnd()}if(miss(a)&&miss(b))return 0;if(miss(a))return-1;if(miss(b))return 1;return a<b?-1:a>b?1:0}
function evaluate(e,p,context){if(e.k==='lit')return e.v;if(e.k==='var')return Object.hasOwn(p,e.name)?p[e.name]:null;if(e.k==='convert'){
 const source=evaluate(e.source,p,context);
 if(e.name==='put')return formatValue(source,e.format.parsed,{padded:true,alignment:e.format.alignment});
 const result=readFormatted(source,e.format.parsed);
 if(typeof result==='string')return result;
 if(result.invalid){if(e.quiet<2)p._error_=1;if(!e.quiet)context.logs.push('NOTE: Invalid INPUT value for '+e.format.spec+'; returned numeric missing.');}
 return result.value;
 }
 if(e.k==='call'){const args=e.args.map(x=>evaluate(x,p,context));return e.name==='rand'?context.random.sample(args):funcs[e.name](...args)};
if(e.k==='in')return +e.args.some(x=>cmp(evaluate(e.a,p,context),evaluate(x,p,context))===0);let a=evaluate(e.a,p,context);if(e.k==='unary')return ['not','^','~'].includes(e.op)?+!truth(a):miss(a)?null:e.op==='-'?-a:+a;let b=evaluate(e.b,p,context);switch(e.op){case'and':return +(truth(a)&&truth(b));case'or':return +(truth(a)||truth(b));case'=':case'eq':return +(cmp(a,b)===0);case'ne':case'^=':case'~=':return +(cmp(a,b)!==0);case'>':case'gt':return +(cmp(a,b)>0);case'<':case'lt':return +(cmp(a,b)<0);case'>=':case'ge':return +(cmp(a,b)>=0);case'<=':case'le':return +(cmp(a,b)<=0);case'||':return text(a)+text(b)}if(num(a)===null||num(b)===null)return null;switch(e.op){case'+':return a+b;case'-':return a-b;case'*':return a*b;case'/':return b===0?null:a/b;case'**':return a**b}}
function walk(body,fn){for(let s of body){fn(s);if(s.body)walk(s.body,fn);if(s.yes)walk([s.yes],fn);if(s.no)walk([s.no],fn)}}
const key=name=>name.replace(/^work\./,'');
function compareKeys(a,b,keys){for(let k of keys){let c=cmp(a[k.name],b[k.name]);if(c)return k.desc?-c:c}return 0}
function typesOf(ds){let types=Object.assign(Object.create(null),ds.types||{});for(let c of ds.columns)if(!types[c]){let v=ds.rows.find(r=>!miss(r[c]))||ds.rows.find(r=>typeof r[c]==='string');types[c]=v&&typeof v[c]==='string'?'char':'num'}return types}
function inputView(spec,datasets){let ds=datasets[key(spec.name)];if(!ds)fail('Dataset '+spec.name+' was not found');for(let n of [...(spec.keep||[]),...spec.drop,...Object.keys(spec.rename)])if(!ds.columns.includes(n))fail('Input variable '+n+' not found in '+spec.name);
 let raw=ds.columns.filter(c=>(!spec.keep||spec.keep.includes(c))&&!spec.drop.includes(c)),columns=raw.map(c=>spec.rename[c]||c);if(new Set(columns).size!==columns.length)fail('RENAME creates duplicate columns in '+spec.name);let types=typesOf(ds),formats=Object.create(null),newtypes=Object.create(null);for(let c of raw){newtypes[spec.rename[c]||c]=types[c];if(ds.formats?.[c])formats[spec.rename[c]||c]=ds.formats[c]}
 return{...spec,columns,types:newtypes,formats,rows:ds.rows.map(r=>Object.fromEntries(raw.map(c=>[spec.rename[c]||c,r[c]])))};
}
function validateOrder(ds,keys){for(let k of keys)if(!ds.columns.includes(k.name))fail('BY variable '+k.name+' not found in '+ds.name);for(let i=1;i<ds.rows.length;i++)if(compareKeys(ds.rows[i-1],ds.rows[i],keys)>0)fail('Input '+ds.name+' must be sorted by '+keys.map(k=>(k.desc?'DESCENDING ':'')+k.name).join(' ')+'. Use PROC SORT first.')}
function* frames(inputs,by,merge,tick){
 if(!inputs.length){yield{reads:[],keyrow:{},newgroup:true};return}
 if(!merge){let ds=inputs[0];for(let i=0;i<ds.rows.length;i++){tick();yield{reads:[{source:ds,row:ds.rows[i]}],keyrow:ds.rows[i],newgroup:i===0||by.length&&compareKeys(ds.rows[i-1],ds.rows[i],by)!==0}}return}
 let pos=inputs.map(()=>0);while(inputs.some((ds,j)=>pos[j]<ds.rows.length)){tick();let head=null;for(let j=0;j<inputs.length;j++){let r=inputs[j].rows[pos[j]];if(r&&(head===null||compareKeys(r,head,by)<0))head=r}
 let groups=inputs.map((ds,j)=>{let group=[];while(pos[j]<ds.rows.length&&compareKeys(ds.rows[pos[j]],head,by)===0){tick();group.push(ds.rows[pos[j]++])}return group});let size=Math.max(...groups.map(g=>g.length));
 for(let i=0;i<size;i++){tick();yield{reads:groups.flatMap((g,j)=>i<g.length?[{source:inputs[j],row:g[i]}]:[]),keyrow:head,newgroup:i===0}}
 }
}
export function run(code,input={}){
 let macro=expandMacros(code),steps=new Parser(macro.code).parse(),datasets=Object.create(null),logs=[...macro.logs],written=[];for(let [k,v]of Object.entries(input))datasets[key(k.toLowerCase())]=v;
 let ops=0;const tick=()=>{if(++ops>4000000)fail('Execution limit reached. Reduce the data or loop size.')};
 for(let step of steps){
 if(step.k==='sort'){let ds=datasets[key(step.data)];if(!ds)fail('Dataset '+step.data+' was not found');for(let k of step.keys)if(!ds.columns.includes(k.name))fail('Sort variable '+k.name+' was not found');let rows=ds.rows.map(r=>({...r}));rows.sort((a,b)=>{tick();return compareKeys(a,b,step.keys)});let removed=0;if(step.nodupkey){let all=rows;rows=[];for(let r of all){tick();if(!rows.length||compareKeys(rows.at(-1),r,step.keys)!==0)rows.push(r);else removed++}}let name=key(step.out);datasets[name]={...ds,rows,columns:[...ds.columns],formats:{...ds.formats}};written.push(name);logs.push('NOTE: PROC SORT wrote WORK.'+name.toUpperCase()+': '+rows.length+' observations'+(step.nodupkey?', '+removed+' duplicate keys removed':'')+'.');continue}
 let readers=step.body.filter(s=>s.k==='set'||s.k==='merge');if(readers.length>1)fail('Use one SET or MERGE statement per DATA step');let reader=readers[0],merge=reader?.k==='merge',inputs=reader?reader.inputs.map(s=>inputView(s,datasets)):[];
 const context={logs,random:createRandomStream(tick,logs)};
 const retained=Object.create(null),lengths=Object.create(null),formats=Object.create(null),sourceTypes=Object.create(null);let keep=null,drop=[],by=[],explicit=false,columns=[],auto=new Set(['_n_','_error_']);
 for(let ds of inputs){for(let c of ds.columns){if(!columns.includes(c))columns.push(c);if(sourceTypes[c]&&sourceTypes[c]!==ds.types[c])fail('MERGE variable '+c+' is character in one input and numeric in another');sourceTypes[c]=ds.types[c];if(!Object.hasOwn(formats,c)&&ds.formats[c])formats[c]=ds.formats[c]}if(ds.indicator){if(auto.has(ds.indicator))fail('IN= indicators must have unique names');auto.add(ds.indicator)}}
 for(let ds of inputs)if(ds.indicator&&columns.includes(ds.indicator))fail('IN= indicator '+ds.indicator+' conflicts with an input variable');
 for(let s of step.body){if(s.k==='keep')keep=s.items.map(x=>x.name);if(s.k==='drop')drop.push(...s.items.map(x=>x.name));if(s.k==='by'){if(by.length)fail('Use one BY statement per step');by=s.keys}if(s.k==='retain')for(let x of s.items)retained[x.name]=x.init;if(s.k==='length')for(let x of s.items)lengths[x.name]=x.n;if(s.k==='format')for(let x of s.items)formats[x.name]=x.fmt}
 walk(step.body,s=>{if(['set','merge','by','retain','keep','drop','length','format'].includes(s.k)&&!step.body.includes(s))fail('Declarations and input statements must be at the top level');if(['assign','sumstmt','loop'].includes(s.k)&&!columns.includes(s.name)&&!auto.has(s.name))columns.push(s.name);if(s.k==='sumstmt')retained[s.name]=retained[s.name]??0;if(s.k==='output'){explicit=true;for(let n of s.names)if(!step.names.includes(n))fail('OUTPUT '+n+' is not declared in DATA')}});
 for(let n of [...Object.keys(retained),...Object.keys(lengths)])if(!columns.includes(n)&&!auto.has(n))columns.push(n);
 if(by.length&&!reader)fail('BY requires SET or MERGE');if(merge&&!by.length)fail('MERGE requires BY in this version');for(let ds of inputs)if(by.length)validateOrder(ds,by);
 if(merge){for(let c of columns){let occurrences=inputs.filter(ds=>ds.columns.includes(c)).length;if(occurrences>1&&!by.some(b=>b.name===c))logs.push('NOTE: Shared MERGE variable '+c+' is overwritten by each input actually read, in MERGE order. Use RENAME= to keep separate values.')}}
 const defaults=Object.fromEntries(columns.map(n=>[n,Object.hasOwn(lengths,n)||sourceTypes[n]==='char'?'':null])),held=Object.create(null),outs=Object.create(null);for(let n of step.names)outs[n]=[];let stop=false,count=0,previous=null;
 let gen=frames(inputs,by,merge,tick),current=gen.next();while(!current.done&&!stop){tick();let frame=current.value,next=gen.next(),i=count++;
 if(merge&&frame.newgroup){for(let c of Object.keys(sourceTypes))held[c]=defaults[c];for(let ds of inputs)if(ds.indicator)held[ds.indicator]=0}
 let p=Object.assign(Object.create(null),defaults,retained,held,{_n_:i+1,_error_:0}),deleted=false;
 for(let j=0;j<by.length;j++){let b=by[j].name;p['first.'+b]=+(previous===null||by.slice(0,j+1).some(k=>cmp(previous[k.name],frame.keyrow[k.name])!==0));p['last.'+b]=+(next.done||by.slice(0,j+1).some(k=>cmp(next.value.keyrow[k.name],frame.keyrow[k.name])!==0))}
 const assign=(n,v)=>{p[n]=Object.hasOwn(lengths,n)?text(v).slice(0,lengths[n]):(Number.isFinite(v)||typeof v!=='number'?v:null)};
 const output=names=>{let row=Object.create(null);for(let n of columns)if(!auto.has(n)&&(!keep||keep.includes(n))&&!drop.includes(n))row[n]=p[n]??null;for(let n of names.length?names:step.names){if(n==='_null_')continue;if(outs[n].length>=100000)fail('Output limit is 100,000 rows per dataset');outs[n].push({...row})}};
 const exec=s=>{tick();if(deleted||stop)return;switch(s.k){case'set':case'merge':for(let read of frame.reads){for(let c of read.source.columns)assign(c,read.row[c]);if(read.source.indicator)p[read.source.indicator]=1}break;case'streaminit':context.random.initialize(s.args.map(x=>evaluate(x,p,context)));break;case'assign':assign(s.name,evaluate(s.value,p,context));break;case'sumstmt':assign(s.name,(p[s.name]??0)+(evaluate(s.value,p,context)??0));break;case'if':if(truth(evaluate(s.test,p,context)))exec(s.yes);else if(s.no)exec(s.no);break;case'filter':if(!truth(evaluate(s.test,p,context)))deleted=true;break;case'delete':deleted=true;break;case'stop':stop=true;break;case'output':output(s.names);break;case'block':for(let q of s.body)exec(q);break;case'loop':{let a=evaluate(s.from,p,context),z=evaluate(s.to,p,context),b=evaluate(s.by,p,context);if(num(a)===null||num(z)===null||num(b)===null||b===0)fail('DO requires numeric bounds and a nonzero BY');let v=a;for(;b>0?v<=z:v>=z;v+=b){tick();assign(s.name,v);for(let q of s.body)exec(q);if(deleted||stop)break}assign(s.name,v);break}}};
 for(let s of step.body)exec(s);for(let n of Object.keys(retained))retained[n]=p[n];for(let n of Object.keys(sourceTypes))held[n]=p[n];for(let ds of inputs)if(ds.indicator)held[ds.indicator]=p[ds.indicator];if(!deleted&&!stop&&!explicit)output([]);previous=frame.keyrow;current=next;
 }
 for(let n of step.names){let cols=columns.filter(c=>!auto.has(c)&&(!keep||keep.includes(c))&&!drop.includes(c));if(n==='_null_')continue;let name=key(n),ds={rows:outs[n],columns:cols,formats,types:{}};ds.types={...typesOf(ds),...Object.fromEntries(cols.filter(c=>sourceTypes[c]).map(c=>[c,sourceTypes[c]])),...Object.fromEntries(cols.filter(c=>Object.hasOwn(lengths,c)).map(c=>[c,'char']))};for(let c of cols){if(ds.formats[c]){const char=parseFormat(ds.formats[c]).name.startsWith('$');if(char!==(ds.types[c]==='char'))fail('Format type does not match variable '+c)}}datasets[name]=ds;written.push(name);logs.push('NOTE: WORK.'+name.toUpperCase()+' has '+outs[n].length+' observations and '+cols.length+' variables.')}for(let ds of inputs)logs.push('NOTE: Input '+ds.name.toUpperCase()+': '+ds.rows.length+' observations.');if(merge)logs.push('NOTE: MERGE processed '+count+' matched observations; repeated keys are paired, not multiplied.');
 }return{datasets,written,logs,expanded:macro.code};
}
export function parseCSV(textValue){let rows=[],row=[],cell='',quoted=false;let s=textValue.replace(/^\uFEFF/,'');for(let i=0;i<s.length;i++){let c=s[i];if(c==='"'){if(quoted&&s[i+1]==='"'){cell+='"';i++}else if(!quoted&&cell==='')quoted=true;else if(quoted)quoted=false;else fail('Invalid CSV quote')}else if(c===','&&!quoted){row.push(cell);cell=''}else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&s[i+1]==='\n')i++;row.push(cell);rows.push(row);row=[];cell=''}else cell+=c}if(quoted)fail('Unclosed CSV quote');if(row.length||cell){row.push(cell);rows.push(row)}if(!rows.length)fail('CSV is empty');let columns=rows.shift().map(x=>x.trim().toLowerCase());if(columns.some(x=>!/^[_a-z]\w*$/.test(x))||new Set(columns).size!==columns.length)fail('CSV headers must be unique SAS variable names');rows=rows.filter(r=>r.some(x=>x!==''));if(rows.length>100000)fail('Import limit is 100,000 rows');if(rows.some(r=>r.length!==columns.length))fail('CSV rows must match the header column count');let numeric=columns.map((c,j)=>rows.every(r=>!r[j].trim()||/^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i.test(r[j].trim())));return{columns,formats:{},types:Object.fromEntries(columns.map((c,j)=>[c,numeric[j]?'num':'char'])),rows:rows.map(r=>Object.fromEntries(columns.map((c,j)=>[c,numeric[j]?(r[j].trim()?+r[j]:null):r[j]])))};}
export function csv(ds){let quote=x=>'"'+text(x).replaceAll('"','""')+'"';return[ds.columns.map(quote).join(','),...ds.rows.map(r=>ds.columns.map(c=>quote(r[c])).join(','))].join('\r\n')}
export function display(v,fmt){if(!fmt)return miss(v)?(typeof v==='string'?'':'.'):String(v);return formatValue(v,fmt)}
