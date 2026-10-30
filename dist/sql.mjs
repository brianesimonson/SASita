import {dataStepFunctionNames,evaluateDataStepFunction} from './engine.mjs';
import {meansMoments} from './means.mjs';
import {parseFormat,formatValue,readFormatted} from './formats.mjs';

// A deliberately bounded SAS-style SELECT engine, with no eval or external SQL service.
const sqlSummaries=new Set(['count','n','nmiss','sum','mean','avg','min','max','std','var']);
const sqlScalars=new Set(dataStepFunctionNames());
const sqlCharFunctions=new Set(['upcase','lowcase','strip','trim','left','substr','cats','catx','coalescec']);
const sqlReserved=new Set('from where group having order inner left right full outer cross join on as quit run union intersect except into create select when then else end asc desc'.split(' '));
const sqlPrecedence={or:1,and:2,'=':3,eq:3,ne:3,'^=':3,'~=':3,'>':3,gt:3,'<':3,lt:3,'>=':3,ge:3,'<=':3,le:3,in:3,between:3,is:3,like:3,'||':4,'+':5,'-':5,'*':6,'/':6,'**':8};
class SQLParser{
 constructor(tokens,start){this.tokens=tokens;this.i=start;this.nodes=0;this.depth=0;}
 peek(value){const t=this.tokens[this.i];return value===undefined?t:t?.type!=='str'&&t?.v===value;}
 eat(value){if(this.peek(value)){this.i++;return true;}return false;}
 take(){if(!this.peek())throw new Error('Incomplete PROC SQL');return this.tokens[this.i++];}
 need(value){if(!this.eat(value))throw new Error('Expected '+value.toUpperCase()+' in PROC SQL near '+String(this.peek()?.v??'(end)'));}
 name(table=false){const t=this.take();if(t.type!=='id'||!(table?/^(?:[a-z_]\w{0,7}\.)?[a-z_]\w{0,31}$/:/^[a-z_]\w{0,31}$/).test(t.v))throw new Error('Invalid SQL '+(table?'table':'column/alias')+' name');return table?t.v.replace(/^work\./,''):t.v;}
 expression(min=0){
  if(++this.depth>64||++this.nodes>2000)throw new Error('SQL expression nesting/size limit exceeded');
  const t=this.take();let e;
  if(t.type==='num'||t.type==='str')e={k:'lit',v:t.v};
  else if(['.','null'].includes(t.v))e={k:'lit',v:null};
  else if(['-','+','not','^','~'].includes(t.v))e={k:'unary',op:t.v,a:this.expression(t.v==='not'?3:7)};
  else if(t.v==='('){e=this.expression();this.need(')');}
  else if(t.v==='case'){
   const base=this.peek('when')?null:this.expression(),branches=[];
   while(this.eat('when')){const test=this.expression();this.need('then');branches.push({test,value:this.expression()});}
   if(!branches.length)throw new Error('CASE requires WHEN/THEN');const otherwise=this.eat('else')?this.expression():{k:'lit',v:null};this.need('end');e={k:'case',base,branches,otherwise};
  }else if(t.v==='calculated')e={k:'calculated',name:this.name()};
  else if(t.type==='id'){
   if(this.eat('(')){
    const args=[],distinct=this.eat('distinct');let star=false,format=null;
    if(this.eat('*'))star=true;
    else if(!this.peek(')')){args.push(this.expression());if(['input','put'].includes(t.v)){
     this.need(',');const f=this.take();let spec=f.raw??String(f.v);if(f.v==='$'){const next=this.take();spec='$'+(next.raw??String(next.v));}
     if(!spec.includes('.')){this.need('.');spec+='.';}format=parseFormat(spec,t.v==='input'?'informat':'format');
    }else while(this.eat(','))args.push(this.expression());}
    this.need(')');e={k:'call',name:t.v,args,distinct,star,format};
   }else e={k:'ref',name:t.v};
  }else throw new Error('Unsupported SQL expression near '+String(t.v));
  while(this.peek()){
   let op=this.peek().type==='str'?null:this.peek().v,negate=false;
   if(op==='not'&&['in','between','like'].includes(this.tokens[this.i+1]?.v)){op=this.tokens[this.i+1].v;negate=true;}
   const p=sqlPrecedence[op];if(p===undefined||p<min)break;this.take();if(negate)this.take();
   if(op==='is'){const not=this.eat('not');if(!this.eat('missing')&&!this.eat('null'))throw new Error('SQL IS supports MISSING/NULL only');e={k:'ismissing',a:e,not};}
   else if(op==='in'){this.need('(');const args=[this.expression()];while(this.eat(','))args.push(this.expression());this.need(')');e={k:'in',a:e,args,not:negate};}
   else if(op==='between'){const low=this.expression(4);this.need('and');const high=this.expression(4);e={k:'between',a:e,low,high,not:negate};}
   else{const right=this.expression(p+(op==='**'?0:1));e={k:'binary',op,a:e,b:right,not:negate};}
  }
  this.depth--;return e;
 }
 relation(){const name=this.name(true);let alias=name.split('.').at(-1);if(this.eat('as'))alias=this.name();else if(this.peek()?.type==='id'&&!sqlReserved.has(this.peek().v))alias=this.name();return {name,alias};}
 query(){
  let target=null;if(this.eat('create')){this.need('table');target=this.name(true);this.need('as');}
  this.need('select');const distinct=this.eat('distinct')||this.eat('unique'),columns=[];
  do{
   let expr,alias=null;
   if(this.eat('*'))expr={k:'star'};
   else if(this.peek()?.type==='id'&&this.tokens[this.i+1]?.v==='.'&&this.tokens[this.i+2]?.v==='*'){const qualifier=this.name();this.need('.');this.need('*');expr={k:'star',qualifier};}
   else expr=this.expression();
   if(this.eat('as'))alias=this.name();else if(this.peek()?.type==='id'&&!sqlReserved.has(this.peek().v)&&!['format','label','length'].includes(this.peek().v))alias=this.name();
   if(expr.k==='star'&&alias)throw new Error('SQL * cannot have an alias');columns.push({expr,alias});if(columns.length>256)throw new Error('SQL SELECT limit is 256 expressions');
  }while(this.eat(','));
  this.need('from');const source=this.relation(),joins=[];
  while(this.peek(',' )||['join','inner','left','right','full','cross'].some(k=>this.peek(k))){
   let kind='inner',on=null;if(this.eat(','))kind='cross';else{if(!this.peek('join'))kind=this.take().v;this.eat('outer');this.need('join');}
   const relation=this.relation();if(kind!=='cross'){this.need('on');on=this.expression();}joins.push({kind,relation,on});if(joins.length>7)throw new Error('SQL supports at most eight source tables');
  }
  const where=this.eat('where')?this.expression():null,group=[],order=[];
  if(this.eat('group')){this.need('by');do{group.push(this.expression());}while(this.eat(','));}
  const having=this.eat('having')?this.expression():null;
  if(this.eat('order')){this.need('by');do{const expr=this.expression(),descending=this.eat('desc');if(!descending)this.eat('asc');order.push({expr,descending});}while(this.eat(','));}
  this.need(';');return {target,distinct,columns,source,joins,where,group,having,order};
 }
}
export function parseSQL(tokens,start){
 const p=new SQLParser(tokens,start);p.need('proc');p.need('sql');let noprint=false,outobs=null;const seen=new Set();
 while(!p.peek(';')){const t=p.take();if(seen.has(t.v))throw new Error('Repeated PROC SQL option');seen.add(t.v);
  if(t.v==='noprint')noprint=true;else if(t.v==='outobs'){p.need('=');const value=p.take();if(value.type!=='num'||!Number.isInteger(value.v)||value.v<0||value.v>100000)throw new Error('SQL OUTOBS requires 0–100000');outobs=value.v;}else throw new Error('Unsupported PROC SQL option '+t.v);
 }p.need(';');const queries=[];
 while(!p.peek('quit')){queries.push(p.query());if(queries.length>100)throw new Error('PROC SQL supports at most 100 queries');}
 p.need('quit');p.need(';');return {spec:{queries,noprint,outobs},next:p.i};
}

function sqlMissing(v){return v===null||v===undefined||typeof v==='string'&&v.trimEnd()==='';}
function sqlCanonical(v){return sqlMissing(v)?null:typeof v==='string'?v.trimEnd():Object.is(v,-0)?0:v;}
function sqlCompare(a,b){a=sqlCanonical(a);b=sqlCanonical(b);return a===null?b===null?0:-1:b===null?1:a<b?-1:a>b?1:0;}
function sqlTruth(v){return !sqlMissing(v)&&v!==0;}
function sqlChildren(e){return e.k==='call'?e.args:e.k==='binary'?[e.a,e.b]:['unary','ismissing'].includes(e.k)?[e.a]:e.k==='in'?[e.a,...e.args]:e.k==='between'?[e.a,e.low,e.high]:e.k==='case'?[...(e.base?[e.base]:[]),...e.branches.flatMap(b=>[b.test,b.value]),e.otherwise]:e.k==='calculated'?[e.target]:[];}
function sqlHasSummary(e){if(e.hasSummary!==undefined)return e.hasSummary;return e.hasSummary=!!(e.aggregate||sqlChildren(e).some(sqlHasSummary));}

export function prepareSQL(query,datasets,options={}){
 query=structuredClone(query);
 let operations=0;const tick=(n=1)=>{operations+=n;if(operations>10000000)throw new Error('SQL execution limit exceeded; reduce rows/joins or simplify the query');};
 const relations=[query.source,...query.joins.map(j=>j.relation)],schema=[],aliases=new Set();
 for(const [tableIndex,r] of relations.entries()){
  if(aliases.has(r.alias))throw new Error('Duplicate SQL table alias '+r.alias);aliases.add(r.alias);const ds=datasets[r.name];if(!ds)throw new Error('SQL table '+r.name+' was not found');
  if(ds.rows.length>100000||ds.columns.length>1024||ds.rows.length*ds.columns.length>2000000)throw new Error('SQL source size limit exceeded');r.offset=schema.length;r.ds=ds;r.index=tableIndex;
  for(const name of ds.columns){const type=ds.types?.[name]||(ds.rows.some(row=>typeof row[name]==='string')?'char':'num');schema.push({name,alias:r.alias,tableIndex,slot:schema.length,type,length:ds.lengths?.[name],format:ds.formats?.[name]});}
 }
 if(schema.length>1024)throw new Error('SQL joined schema exceeds 1024 columns');
 const selected=[],calculated=new Map();let anonymous=0;
 const compatible=(a,b)=>{if(a!==b&&a!=='missing'&&b!=='missing')throw new Error('SQL character/numeric type mismatch; use INPUT/PUT explicitly');};
 const bind=(e,allowAliases=false,insideAggregate=false)=>{
  if(e.bound)return e;
  if(e.k==='lit')e.type=e.v===null?'missing':typeof e.v==='string'?'char':'num';
  else if(e.k==='ref'){
   const parts=e.name.split('.');let columns=parts.length===2?schema.filter(c=>c.alias===parts[0]&&c.name===parts[1]):schema.filter(c=>c.name===e.name);
   if(allowAliases&&parts.length===1&&calculated.has(e.name))columns=[];
   if(!columns.length&&allowAliases&&calculated.has(e.name)){e.k='calculated';e.target=calculated.get(e.name);e.type=e.target.type;}
   else{if(columns.length!==1)throw new Error(columns.length?'Ambiguous SQL column '+e.name:'Unknown SQL column '+e.name);e.column=columns[0];e.type=e.column.type;}
  }else if(e.k==='calculated'){if(!calculated.has(e.name))throw new Error('CALCULATED requires an earlier SELECT alias: '+e.name);e.target=calculated.get(e.name);e.type=e.target.type;}
  else if(e.k==='call'){
   if(e.name==='stddev')throw new Error('PROC SQL standard deviation uses STD(x); STDDEV(x) is not supported');
   e.aggregate=sqlSummaries.has(e.name)&&(e.star||e.args.length===1);if(e.aggregate&&insideAggregate)throw new Error('Nested SQL summary functions are unsupported');
   if(e.star&&(e.name!=='count'||e.distinct))throw new Error('Only COUNT(*) supports *');
   if(e.distinct&&(!e.aggregate||e.args.length!==1))throw new Error('DISTINCT requires a single summary-function argument');
   e.args=e.args.map(a=>bind(a,false,insideAggregate||e.aggregate));
   if(e.aggregate&&e.args.some(sqlHasSummary))throw new Error('Nested SQL summary functions are unsupported');
   if(e.aggregate){
    if(e.args.length!==1&&!e.star)throw new Error('SQL summary function requires one argument');
    if(!['count','n','nmiss','min','max'].includes(e.name)&&e.args[0]?.type==='char')throw new Error('SQL '+e.name.toUpperCase()+' requires numeric values');
    e.type=['min','max'].includes(e.name)?e.args[0].type:'num';
   }else{
    if(['input','put'].includes(e.name)){if(!e.format||e.args.length!==1)throw new Error('SQL INPUT/PUT requires value and format/informat');e.type=e.name==='put'||e.format.name.startsWith('$')?'char':'num';}
    else{if(!sqlScalars.has(e.name))throw new Error('Unsupported SQL function '+e.name);if(['exp','log','log10','log2'].includes(e.name)&&e.args.length!==1)throw new Error('SQL '+e.name+' requires one argument');e.type=sqlCharFunctions.has(e.name)?'char':e.name==='coalesce'?e.args.find(a=>a.type!=='missing')?.type||'num':'num';}
    if(e.name==='coalesce'||e.name==='coalescec')for(const a of e.args)compatible(e.type,a.type);
    if(['abs','sqrt','ceil','floor','int','round','mod','exp','log','log10','log2','mdy','year','month','day'].includes(e.name)&&e.args.some(a=>a.type==='char'))throw new Error('SQL '+e.name+' requires numeric arguments');
    if(['sum','mean','min','max'].includes(e.name)&&e.args.some(a=>a.type==='char'))throw new Error('SQL row statistic requires numeric arguments');
    if(['count','avg','std','var'].includes(e.name))throw new Error('SQL '+e.name+' requires a single column/expression');
   }
  }else if(e.k==='case'){
   if(e.base)bind(e.base,allowAliases,insideAggregate);for(const b of e.branches){bind(b.test,allowAliases,insideAggregate);bind(b.value,allowAliases,insideAggregate);if(e.base)compatible(e.base.type,b.test.type);else if(b.test.type==='char')throw new Error('SQL WHEN requires a numeric condition');}
   bind(e.otherwise,allowAliases,insideAggregate);const values=[...e.branches.map(b=>b.value),e.otherwise];e.type=values.find(a=>a.type!=='missing')?.type||'num';for(const a of values)compatible(e.type,a.type);
  }else{
   for(const child of sqlChildren(e))bind(child,allowAliases,insideAggregate);
   if(e.k==='binary'){
    if(['=','eq','ne','^=','~=','>','gt','<','lt','>=','ge','<=','le'].includes(e.op))compatible(e.a.type,e.b.type);
    else if(e.op==='like'){if(e.a.type==='num'||e.b.type==='num')throw new Error('SQL LIKE requires character expressions');}
    else if(['+','-','*','/','**'].includes(e.op)&&[e.a.type,e.b.type].includes('char'))throw new Error('SQL arithmetic requires numeric values');
    if(['and','or'].includes(e.op)&&[e.a.type,e.b.type].includes('char'))throw new Error('SQL boolean operators require numeric conditions');
    if(e.op==='||'&&[e.a.type,e.b.type].includes('num'))throw new Error('SQL concatenation requires character values; use PUT explicitly');
    e.type=e.op==='||'?'char':'num';
   }else{e.type='num';if(e.k==='unary'&&['+','-'].includes(e.op)&&e.a.type==='char')throw new Error('SQL arithmetic requires numeric values');if(e.k==='in')for(const a of e.args)compatible(e.a.type,a.type);if(e.k==='between'){compatible(e.a.type,e.low.type);compatible(e.a.type,e.high.type);}}
  }
  e.bound=true;return e;
 };
 for(const item of query.columns){
  if(item.expr.k==='star'){
   const fields=schema.filter(c=>!item.expr.qualifier||c.alias===item.expr.qualifier);if(!fields.length)throw new Error('Unknown SQL table qualifier '+item.expr.qualifier);
   for(const c of fields){const expr=bind({k:'ref',name:c.alias+'.'+c.name});if(selected.some(s=>s.name===c.name))throw new Error('Duplicate SQL output column '+c.name+'; select explicit aliases');selected.push({name:c.name,expr});}
  }else{const expr=bind(item.expr),name=item.alias||(expr.k==='ref'?expr.column.name:'_sql'+(++anonymous));if(selected.some(s=>s.name===name))throw new Error('Duplicate SQL output column '+name);selected.push({name,expr});if(item.alias)calculated.set(name,expr);}
 }
 if(selected.length>1024)throw new Error('SQL output exceeds 1024 columns');
 const expand=e=>{if(e.k==='lit'&&Number.isInteger(e.v)){if(e.v<1||e.v>selected.length)throw new Error('SQL column ordinal is outside SELECT list');return selected[e.v-1].expr;}return bind(e,true);};
 const group=query.group.map(expand),order=query.order.map(o=>({...o,expr:expand(o.expr)})),where=query.where?bind(query.where):null,having=query.having?bind(query.having,true):null;
 if(where&&sqlHasSummary(where))throw new Error('SQL summary functions are not allowed in WHERE; use HAVING');
 if(where?.type==='char'||having?.type==='char')throw new Error('SQL WHERE/HAVING requires a numeric condition');
 if(group.some(sqlHasSummary))throw new Error('SQL GROUP BY cannot contain summaries');
 const grouped=selected.some(s=>sqlHasSummary(s.expr))||order.some(o=>sqlHasSummary(o.expr))||having&&sqlHasSummary(having);
 if(having&&!grouped)throw new Error('This SQL subset requires a summary function when using HAVING');
 // Intern expression shapes rather than expanding CALCULATED alias DAGs into strings.
 const signatures=new WeakMap(),shapes=new Map();
 const signature=e=>{if(signatures.has(e))return signatures.get(e);tick();const key=e.k==='calculated'?null:JSON.stringify(e.k==='ref'?['ref',e.column.slot]:e.k==='lit'?['lit',e.v]:[e.k,e.op,e.name,e.not,e.distinct,e.star,e.format,sqlChildren(e).map(signature)]);if(key!==null&&!shapes.has(key))shapes.set(key,shapes.size);const id=key===null?signature(e.target):shapes.get(key);signatures.set(e,id);return id;};
 const groupSignatures=new Set(group.map(signature)),safeCache=new WeakMap();
 const groupSafe=e=>{if(safeCache.has(e))return safeCache.get(e);tick();const safe=groupSignatures.has(signature(e))||e.aggregate||e.k==='lit'||e.k!=='ref'&&sqlChildren(e).every(groupSafe);safeCache.set(e,safe);return safe;};
 if(grouped&&[...selected.map(s=>s.expr),...order.map(o=>o.expr),...(having?[having]:[])].some(e=>!groupSafe(e)))throw new Error('SQL query requires SAS automatic remerging; group all non-summary expressions or use an explicit join');
 if(query.distinct&&order.some(o=>!selected.some(s=>signature(s.expr)===signature(o.expr))))throw new Error('SELECT DISTINCT requires ORDER BY expressions in the SELECT list');
 const empty=schema.map(c=>c.type==='char'?'':null),width=schema.length;
 const rowValues=(r,row)=>r.ds.columns.map(name=>row[name]??(r.ds.types?.[name]==='char'?'':null));
 const boundRows=(rows,columns)=>{if(rows.length>100000||rows.length*Math.max(1,columns)>2000000)throw new Error('SQL intermediate/output limit is 100,000 rows / 2,000,000 cells');return rows;};
 const evaluate=(e,row,rows,cache)=>{
  tick();if(e.k==='lit')return e.v;if(e.k==='ref')return row?.[e.column.slot]??(e.type==='char'?'':null);if(e.k==='calculated')return evaluate(e.target,row,rows,cache);
  if(e.aggregate){
   if(cache.has(e))return cache.get(e);let values=e.star?null:rows.map(r=>evaluate(e.args[0],r,null,null)).filter(v=>!sqlMissing(v));
   if(e.distinct){const seen=new Set();values=values.filter(v=>{const key=JSON.stringify(sqlCanonical(v));if(seen.has(key))return false;seen.add(key);return true;});}
   let value;if(['count','n','nmiss'].includes(e.name))value=e.star?rows.length:e.name==='nmiss'?rows.length-values.length:values.length;
   else if(!values.length)value=null;
   else if(['min','max'].includes(e.name)){value=values[0];for(const v of values)if(sqlCompare(v,value)*(e.name==='min'?1:-1)<0)value=v;}
   else{const stats=meansMoments(values,values.length,'df');value=stats[e.name==='avg'?'mean':e.name];}
   if(typeof value==='number'&&!Number.isFinite(value))throw new Error('SQL summary overflow; rescale values');cache.set(e,value);return value;
  }
  const val=a=>evaluate(a,row,rows,cache);
  if(e.k==='case'){const base=e.base?val(e.base):null;for(const b of e.branches)if(e.base?sqlCompare(base,val(b.test))===0:sqlTruth(val(b.test)))return val(b.value);return val(e.otherwise);}
  if(e.k==='ismissing')return +(sqlMissing(val(e.a))!==e.not);
  if(e.k==='in')return +(e.args.some(a=>sqlCompare(val(e.a),val(a))===0)!==e.not);
  if(e.k==='between'){const a=val(e.a);return +((sqlCompare(a,val(e.low))>=0&&sqlCompare(a,val(e.high))<=0)!==e.not);}
  if(e.k==='unary'){const a=val(e.a);return ['not','^','~'].includes(e.op)?+!sqlTruth(a):sqlMissing(a)?null:e.op==='-'?-a:+a;}
  if(e.k==='call'){
   const args=e.args.map(val);if(e.name==='put')return formatValue(args[0],e.format,{padded:true});if(e.name==='input'){const parsed=readFormatted(args[0],e.format);return typeof parsed==='string'?parsed:parsed.value;}
   if(e.name==='coalesce'||e.name==='coalescec')return args.find(v=>!sqlMissing(v))??(e.type==='char'?'':null);
   if(e.name==='missing')return +sqlMissing(args[0]);
   const value=evaluateDataStepFunction(e.name,args);return typeof value==='number'&&!Number.isFinite(value)?null:value;
  }
  const a=val(e.a),b=val(e.b),cmp=sqlCompare(a,b);let value;
  switch(e.op){case'and':return +(sqlTruth(a)&&sqlTruth(b));case'or':return +(sqlTruth(a)||sqlTruth(b));case'=':case'eq':return +(cmp===0);case'ne':case'^=':case'~=':return +(cmp!==0);case'>':case'gt':return +(cmp>0);case'<':case'lt':return +(cmp<0);case'>=':case'ge':return +(cmp>=0);case'<=':case'le':return +(cmp<=0);case'||':return String(a??'')+String(b??'');case'like':{
   // Glob-style matching avoids regex backtracking on untrusted patterns.
   const text=String(a??'').trimEnd(),pattern=String(b??'').trimEnd();let i=0,j=0,star=-1,retry=0;
   while(i<text.length){tick();if(j<pattern.length&&(pattern[j]==='_'||pattern[j]===text[i])){i++;j++;}else if(pattern[j]==='%'){star=j++;retry=i;}else if(star>=0){j=star+1;i=++retry;}else return +e.not;}
   while(pattern[j]==='%')j++;return +((j===pattern.length)!==e.not);
  }}
  if(sqlMissing(a)||sqlMissing(b))return null;
  switch(e.op){case'+':value=a+b;break;case'-':value=a-b;break;case'*':value=a*b;break;case'/':value=b===0?null:a/b;break;case'**':value=a**b;break;default:throw new Error('Unsupported SQL operator '+e.op);}
  return typeof value==='number'&&!Number.isFinite(value)?null:value;
 };
 let rows=boundRows(query.source.ds.rows.map(row=>rowValues(query.source,row)),query.source.ds.columns.length);
 let usedWidth=query.source.ds.columns.length;
 for(const [j,join] of query.joins.entries()){
  const relation=relations[j+1],right=relation.ds.rows.map(row=>rowValues(relation,row)),on=join.on?bind(join.on):null;
  const allowed=e=>{if(e.k==='calculated')throw new Error('SQL CALCULATED is not supported in ON; repeat the expression');if(e.k==='ref'&&e.column.tableIndex>j+1)throw new Error('SQL ON cannot reference a later table');for(const c of sqlChildren(e))allowed(c);};
  if(on){if(sqlHasSummary(on))throw new Error('SQL ON cannot contain summaries');if(on.type==='char')throw new Error('SQL ON requires a numeric condition');allowed(on);}
  const keys=[];const collect=e=>{if(e.k==='binary'&&e.op==='and'){collect(e.a);collect(e.b);}else if(e.k==='binary'&&['=','eq'].includes(e.op)&&e.a.k==='ref'&&e.b.k==='ref'){
   const a=e.a.column,b=e.b.column;if(a.tableIndex===j+1&&b.tableIndex<=j)keys.push([b,a]);else if(b.tableIndex===j+1&&a.tableIndex<=j)keys.push([a,b]);
  }};if(on)collect(on);
  const hash=keys.length?new Map():null;
  if(hash)right.forEach((row,i)=>{tick();const key=JSON.stringify(keys.map(([,c])=>sqlCanonical(row[c.slot-relation.offset])));if(!hash.has(key))hash.set(key,[]);hash.get(key).push(i);});
  const output=[],matched=new Set();const add=row=>{output.push(row);boundRows(output,usedWidth+relation.ds.columns.length);};
  for(const left of rows){let found=false;const candidates=hash?hash.get(JSON.stringify(keys.map(([c])=>sqlCanonical(left[c.slot]))))||[]:right.keys();
   for(const index of candidates){tick();const row=[...left,...right[index]];if(!on||sqlTruth(evaluate(on,row,null,null))){found=true;matched.add(index);add(row);}}
   if(!found&&['left','full'].includes(join.kind))add([...left,...empty.slice(relation.offset,relation.offset+relation.ds.columns.length)]);
  }
  if(['right','full'].includes(join.kind))right.forEach((row,i)=>{tick();if(!matched.has(i))add([...empty.slice(0,usedWidth),...row]);});
  rows=output;usedWidth+=relation.ds.columns.length;
 }
 if(where)rows=rows.filter(row=>sqlTruth(evaluate(where,row,null,null)));
 const buckets=new Map();if(grouped){
  if(!group.length)buckets.set('[]',[]);
  for(const row of rows){const key=JSON.stringify(group.map(e=>sqlCanonical(evaluate(e,row,null,null))));if(!buckets.has(key))buckets.set(key,[]);buckets.get(key).push(row);}
 }
 const results=[],seenDistinct=new Set();let sequence=0;
 const produce=(row,members)=>{
  const cache=new Map();if(having&&!sqlTruth(evaluate(having,row,members,cache)))return;
  const values=selected.map(s=>{const value=evaluate(s.expr,row,members,cache);return sqlMissing(value)?s.expr.type==='char'?'':null:value;});
  if(query.distinct){const key=JSON.stringify(values.map(sqlCanonical));if(seenDistinct.has(key))return;seenDistinct.add(key);}
  const ordering=(order.length?order:!grouped&&group.length?group.map(expr=>({expr})):[]).map(o=>evaluate(o.expr,row,members,cache));
  results.push({values,ordering,index:sequence++});boundRows(results,selected.length+ordering.length);
 };
 if(grouped)for(const members of buckets.values())produce(members[0]||empty,members);else for(const row of rows)produce(row,null);
 const sorting=order.length?order:!grouped?group.map(expr=>({expr})):[];
 if(sorting.length)results.sort((a,b)=>{tick();for(let i=0;i<sorting.length;i++){const d=sqlCompare(a.ordering[i],b.ordering[i])*(sorting[i].descending?-1:1);if(d)return d;}return a.index-b.index;});
 const columns=selected.map(s=>s.name),chosen=options.outobs===null||options.outobs===undefined?results:results.slice(0,options.outobs);
 const types=Object.fromEntries(selected.map(s=>[s.name,s.expr.type==='char'?'char':'num'])),formats=Object.create(null),lengths=Object.create(null);
 for(const s of selected){const e=s.expr;if(e.k==='ref'){if(e.column.format)formats[s.name]=e.column.format;if(e.column.length)lengths[s.name]=e.column.length;}}
 const dataset={columns,types,formats,lengths,rows:chosen.map(r=>Object.fromEntries(columns.map((c,i)=>[c,r.values[i]])))};
 return {dataset,logs:[...(!grouped&&group.length?['NOTE: SQL GROUP BY without summary functions is treated as ORDER BY; duplicates are retained.']:[]),`NOTE: PROC SQL produced ${dataset.rows.length} rows${query.target?' in '+query.target.toUpperCase():''}.`]};
}
