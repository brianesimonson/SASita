import {procedureStatementTemplates,procedureEditorOptions} from './syntax-help.mjs';
// Editor metadata only: never execute a program, inspect observations or open files.
export function completionLex(source){
 let mask='',i=0,start=true,inside=false;
 const blank=s=>s.replace(/[^\n]/g,' ');
 while(i<source.length){const c=source[i];
  if(source.slice(i,i+2)==='/*'){const end=source.indexOf('*/',i+2);if(end<0){mask+=blank(source.slice(i));inside=true;break;}mask+=blank(source.slice(i,end+2));i=end+2;continue;}
  if(source.slice(i,i+2)==='%*'||c==='*'&&start){const end=source.indexOf(';',i);if(end<0){mask+=blank(source.slice(i));inside=true;break;}mask+=blank(source.slice(i,end+1));i=end+1;start=true;continue;}
  if(c==='"'||c==="'"){const quote=c,begin=i++;let closed=false;while(i<source.length){if(source[i++]===quote){if(source[i]===quote)i++;else{closed=true;break;}}}mask+=blank(source.slice(begin,i));if(!closed){inside=true;break;}start=false;continue;}
  mask+=c;i++;if(c===';')start=true;else if(!/\s/.test(c))start=false;
 }return {mask,inside};
}
const completionName=/^[a-z_]\w{0,31}$/i;
function completionTable(name){return name.toLowerCase().replace(/^work\./,'');}
function completionSchemas(mask,state){
 const schemas=new Map(),libraries=new Set(['work',...Object.keys(state.libraries||{}),...Object.keys(state.members||{})]);
 const describe=(ds,inferred=false)=>({columns:(ds.columns||[]).filter(c=>completionName.test(c)),types:ds.types||{},inferred});
 for(const [name,ds] of Object.entries({...state.datasets,...state.descriptors}))schemas.set(completionTable(name),describe(ds));
 for(const m of mask.matchAll(/\blibname\s+([a-z_]\w{0,7})\b/gi))libraries.add(m[1].toLowerCase());
 let targets=[],columns=null,types={},valid=false;
 function publish(){if(valid&&columns)for(const target of targets)schemas.set(target,{columns:[...columns],types:{...types},inferred:true});}
 for(const part of mask.split(';')){
  const text=part.trim().toLowerCase();
  if(/^data\s/.test(text)){
   targets=[];columns=null;types={};valid=false;
   const names=text.slice(4).trim();if(/^(?:[a-z_]\w{0,7}\.)?[a-z_]\w{0,31}(?:\s+(?:[a-z_]\w{0,7}\.)?[a-z_]\w{0,31})*$/.test(names))targets=names.split(/\s+/).filter(n=>n!=='_null_').map(completionTable);
   continue;
  }
  if(/^(?:run|proc)\b/.test(text)){publish();targets=[];columns=null;valid=false;continue;}
  if(!targets.length)continue;
  if(/^(?:set|merge)\s/.test(text)){
   const names=text.replace(/^(?:set|merge)\s+/,'');
   // Dataset options/macro-generated names require the runtime's real descriptor.
   if(!/^(?:[a-z_]\w{0,7}\.)?[a-z_]\w{0,31}(?:\s+(?:[a-z_]\w{0,7}\.)?[a-z_]\w{0,31})*$/.test(names)){valid=false;for(const target of targets)schemas.delete(target);continue;}
   const sources=names.split(/\s+/).map(n=>schemas.get(completionTable(n)));valid=sources.every(Boolean);
   if(valid){columns=[...new Set(sources.flatMap(ds=>ds.columns))];types=Object.assign({},...sources.map(ds=>ds.types));publish();}
   else for(const target of targets)schemas.delete(target);
  }else if(valid&&/^(?:keep|drop)\s/.test(text)){
   const [op,...names]=text.split(/\s+/);if(names.every(n=>completionName.test(n))){columns=columns.filter(c=>op==='keep'?names.includes(c):!names.includes(c));publish();}else{valid=false;for(const target of targets)schemas.delete(target);}
  }else if(valid&&/^rename\s/.test(text)){
   const pairs=text.slice(6).trim();if(/^[a-z_]\w*\s*=\s*[a-z_]\w*(?:\s+[a-z_]\w*\s*=\s*[a-z_]\w*)*$/.test(pairs)){for(const m of pairs.matchAll(/([a-z_]\w*)\s*=\s*([a-z_]\w*)/g)){columns=columns.map(c=>c===m[1]?m[2]:c);types[m[2]]=types[m[1]];delete types[m[1]];}publish();}else{valid=false;for(const target of targets)schemas.delete(target);}
  }else if(valid){const assignment=text.match(/^([a-z_]\w*)\s*=(?!=)/);if(assignment&&!columns.includes(assignment[1])){columns.push(assignment[1]);publish();}}
 }
 publish();return {schemas,libraries};
}
function completionProcedure(mask){
 let procedure=null,header='',statements=[],headerStart=0,offset=0;
 for(const part of mask.split(';')){const text=part.trim(),proc=text.match(/^proc\s+([a-z_]\w*)\b/i);if(proc){procedure=proc[1].toLowerCase();header=text;headerStart=offset;statements=[];}else if(/^(?:data|run|quit)\b|^%mend\b/i.test(text)){procedure=null;header='';statements=[];}else if(procedure&&text)statements.push(text);offset+=part.length+1;}
 return {procedure,header,statements,headerStart};
}
function completionHeader(text,procedure){
 const catalog=procedureEditorOptions(procedure),used=new Set(),tokens=text.replace(/\/\*[\s\S]*?\*\//g,' ').toLowerCase().match(/'(?:''|[^'])*'|"(?:""|[^"])*"|[a-z_]\w*(?:\.[a-z_]\w*)?|[-+]?(?:\d+(?:\.\d*)?|\.\d+)|=/g)||[];let source=null,vardef='df';const values={};
 const canonical=k=>k==='stddev'?'std':k==='exclnpwgts'?'exclnpwgt':procedure==='surveyselect'?({n:'sampsize',size:'sampsize',rate:'samprate'})[k]||k:k;
 for(let i=2;i<tokens.length;i++){const key=canonical(tokens[i]);if(catalog.assignments.includes(key)&&tokens[i+1]==='='){used.add(key);const value=tokens[i+3]==='='?undefined:tokens[i+2];values[key]=value;if(key==='data')source=value&&/^[a-z_]\w*(?:\.[a-z_]\w*)?$/.test(value)?value:null;if(key==='vardef')vardef=value||'df';i+=value?2:1;}else if(catalog.flags.includes(key)||catalog.statistics.includes(key))used.add(key);}
 if(/[&%]/.test(text))source=null;
 return {used,source,vardef,values};
}
function completionProcedureAssist(code,caret,lex,state){
 const mask=lex.mask,statementStart=mask.lastIndexOf(';')+1,tail=mask.slice(statementStart),scope=completionProcedure(mask.slice(0,statementStart));
 const headerMatch=tail.match(/^\s*proc\s+([a-z_]\w*)\b/i),currentHeader=!!headerMatch,procedure=(headerMatch?.[1]||scope.procedure||'').toLowerCase(),catalog=procedureEditorOptions(procedure);if(!catalog)return null;
 const fullMask=completionLex(code).mask,endStatement=fullMask.indexOf(';',statementStart),fullStatement=fullMask.slice(statementStart,endStatement<0?undefined:endStatement),headerStart=currentHeader?statementStart:scope.headerStart,headerEnd=fullMask.indexOf(';',headerStart),header=code.slice(headerStart,headerEnd<0?undefined:headerEnd),info=completionHeader(header,procedure);
 const prefix=tail.match(/([a-z_]\w*)$/i)?.[1]||'',start=caret-prefix.length,end=caret+(code.slice(caret).match(/^\w*/)?.[0].length||0);
 const result=(items,from=start,to=end,kind='fragments')=>items.length?{start:from,end:to,kind,qualifier:procedure,automatic:true,items:items.slice(0,200),total:items.length}:null;
 const fragment=(label,insert,detail='PROC '+procedure.toUpperCase(),more=true)=>({label,insert,detail,followUp:more});
 const schema=()=>completionSchemas(mask.slice(0,currentHeader?statementStart:scope.headerStart),state);
 const optionGap=from=>from>0&&!/\s/.test(code[from-1])?' ':'';
 if(currentHeader){
  const rest=tail.replace(/^\s*proc\s+[a-z_]\w*\b/i,'');if(/[&%]/.test(rest))return null;
  if(procedure==='print'){
   const options=rest.match(/\bdata\s*=\s*(?:[a-z_]\w*\.)?[a-z_]\w*\s*\(([^)]*)$/i);
   if(options){const text=options[1],slot=text.match(/\b(obs|firstobs)\s*=\s*(\d*|max)$/i),used=new Set([...text.matchAll(/\b(obs|firstobs)\s*=/gi)].map(m=>m[1].toLowerCase()));
    if(slot){const values=slot[1].toLowerCase()==='obs'?[10,100,'max']:[1,10];return result(values.filter(v=>String(v).startsWith(slot[2].toLowerCase())).map(v=>fragment(String(v).toUpperCase(),String(v)+' ','Observation index')),caret-slot[2].length,end);}
    const optionsPrefix=text.match(/([a-z_]\w*)$/i)?.[1]||'',from=caret-optionsPrefix.length,items=['obs','firstobs'].filter(k=>!used.has(k)&&k.startsWith(optionsPrefix.toLowerCase())).map(k=>fragment(k.toUpperCase()+'=',k+'=','PRINT dataset option'));
    if(!optionsPrefix&&used.size)items.push(fragment(') — finish dataset options',') ','Finish DATA= options'));return result(items,from);
   }
  }
  let slot=rest.match(new RegExp('(?:^|\\s)('+catalog.assignments.join('|')+')\\s*=\\s*([a-z_]\\w*(?:\\.[a-z_]\\w*)?\\.?|[-+]?\\d*(?:\\.\\d*)?)$','i'));
  if(slot&&/['"]\s*$/.test(code.slice(statementStart,caret))){if(catalog.quoted.includes(slot[1].toLowerCase()))slot=null;else return null;}
  if(slot){const key=slot[1].toLowerCase(),value=slot[2].toLowerCase(),from=caret-slot[2].length,to=caret+(code.slice(caret).match(/^[\w.]*/)?.[0].length||0);
   if(catalog.input.includes(key)){
    const {schemas}=schema(),names=new Set([...schemas.keys()].map(n=>n.includes('.')?n:'work.'+n));for(const [alias,members] of Object.entries(state.members||{}))for(const member of members)if(completionName.test(member))names.add(alias+'.'+member);
    return result([...names].filter(n=>n.toLowerCase().startsWith(value)||!value.includes('.')&&n.split('.').at(-1).toLowerCase().startsWith(value)).sort().map(n=>fragment(n,n+' ','Input dataset')),from,to,'datasets');
   }
   if(catalog.output.includes(key))return result(['summary'].filter(n=>n.startsWith(value)).map(n=>fragment(n,n+' ','New output dataset')),from,to);
   if(catalog.quoted.includes(key))return value?null:result([{...fragment("'"+(key==='datafile'?'inputs.csv':'results.csv')+"'","'"+(key==='datafile'?'inputs.csv':'results.csv')+"' ",'Sample project-relative path')}],from,to);
   const values=key==='vardef'&&info.used.has('stderr')?['df']:catalog.values[key]||[];
   return result(values.filter(v=>String(v).startsWith(value)).map(v=>fragment(String(v).toUpperCase(),String(v)+' ',key.toUpperCase()+' value')),from,to);
  }
  if(/[();]/.test(rest)&&procedure!=='print')return null;
  if(rest&&!/\s$/.test(rest)&&!/(?:^|\s)[a-z_]\w*$/i.test(rest))return null;
  if(/^\w*=/.test(code.slice(caret)))return null;
  const activePrefix=rest?prefix:'',from=rest?start:caret,gap=optionGap(from),items=[];
  for(const key of [...catalog.assignments,...catalog.flags,...catalog.statistics])if(!info.used.has(key)&&key.startsWith(activePrefix.toLowerCase())&&!(key==='stderr'&&info.vardef!=='df')&&!(procedure==='surveyselect'&&(key==='sampsize'&&info.used.has('samprate')||key==='samprate'&&(info.used.has('sampsize')||info.values.method==='sys')||key==='outhits'&&info.values.method!=='urs'||key==='outseed'&&info.values.stratumseed==='none')))items.push(fragment(key.toUpperCase()+(catalog.assignments.includes(key)?'=':''),gap+key+(catalog.assignments.includes(key)?'=':' '),'PROC '+procedure.toUpperCase()+' header'));
  if(!activePrefix&&catalog.required.every(k=>k==='data'?!!info.source:!!info.values[k])&&(procedure!=='surveyselect'||info.used.has('sampsize')||info.used.has('samprate')))items.push(fragment('; — begin statements',';\n','Finish header'));
  return result(items,from);
 }
 if(procedure==='sql'){
  const tables=schema().schemas,names=new Set([...tables.keys()].map(n=>n.includes('.')?n:'work.'+n));
  for(const [alias,members] of Object.entries(state.members||{}))for(const member of members)if(completionName.test(member))names.add(alias+'.'+member);
  const sourceSlot=tail.match(/\b(?:from|join)\s+([a-z_]\w*(?:\.[a-z_]\w*)?\.?|)$/i);
  if(sourceSlot)return result([...names].filter(n=>n.startsWith(sourceSlot[1].toLowerCase())).sort().map(n=>fragment(n,n+' ','SQL source table')),caret-sourceSlot[1].length,end,'datasets');
  const sqlAliases=new Map(),reserved=new Set(['as','where','group','having','order','inner','left','right','full','outer','cross','join','on','quit']);
  for(const match of fullStatement.matchAll(/\b(?:from|join)\s+([a-z_]\w*(?:\.[a-z_]\w*)?)(?:\s+(?:as\s+)?([a-z_]\w*))?/gi)){
   const name=match[1].toLowerCase(),alias=match[2]&&!reserved.has(match[2].toLowerCase())?match[2].toLowerCase():name.split('.').at(-1),ds=tables.get(completionTable(name));if(ds)sqlAliases.set(alias,ds);
  }
  const qualified=tail.match(/\b([a-z_]\w*)\.([a-z_]\w*|)$/i);
  if(qualified&&sqlAliases.has(qualified[1].toLowerCase())){
   const ds=sqlAliases.get(qualified[1].toLowerCase());return result(ds.columns.filter(c=>c.startsWith(qualified[2].toLowerCase())).map(c=>fragment(c,c,'SQL alias '+qualified[1]+(ds.types[c]==='num'?' · numeric':' · character'),false)),caret-qualified[2].length,end,'variables');
  }
  const fieldSlot=tail.match(/(?:\bselect(?:\s+distinct)?|\bwhere|\bon|\bgroup\s+by|\bhaving|\border\s+by|[,=+*/<>-]|\b(?:count|sum|mean|avg|std|var|min|max)\(\s*(?:distinct\s+)?)\s*([a-z_]\w*|)$/i);
  if(fieldSlot&&sqlAliases.size){
   const prefix=fieldSlot[1].toLowerCase(),numeric=/\b(?:sum|mean|avg|std|var)\(\s*[a-z_]*$/i.test(tail),items=[];
   for(const [alias,ds] of sqlAliases)for(const c of ds.columns)if(c.startsWith(prefix)&&(!numeric||ds.types[c]!=='char')){const name=sqlAliases.size>1?alias+'.'+c:c;items.push(fragment(name,name,'SQL '+alias+' field',false));}
   return result(items.sort((a,b)=>a.label.localeCompare(b.label)),caret-prefix.length,end,'variables');
  }
  if(/^\s*[a-z_]*$/i.test(tail))return result(procedureStatementTemplates('sql').filter(item=>item.keyword.startsWith(tail.trim().toLowerCase())).map(item=>({...item,followUp:false})),caret-tail.trim().length,end,'statements');
  // Query clauses outside these bounded contexts remain free-form.
  return null;
 }
 const rawTail=code.slice(statementStart,caret);
 const fieldItems=(role='any',exclude=new Set())=>{const ds=schema().schemas.get(completionTable(info.source||''));return ds?ds.columns.filter(c=>!exclude.has(c.toLowerCase())&&c.toLowerCase().startsWith(prefix.toLowerCase())&&(role!=='numeric'||ds.types[c]!=='char')).map(c=>fragment(c,c+' ',(ds.types[c]==='num'?'numeric':ds.types[c]==='char'?'character':'variable')+(ds.inferred?' · inferred':''))):[];};
 if(procedure==='import'){
  const setting=tail.match(/^\s*(getnames|guessingrows)\s*=\s*([a-z_]\w*)?$/i);if(setting){const value=setting[1].toLowerCase()==='getnames'?'yes':'max',partial=setting[2]||'';return value.startsWith(partial.toLowerCase())?result([fragment(value.toUpperCase()+';',value+';\n','Complete import setting')],caret-partial.length,end):null;}
 }
 const lead=tail.match(/^\s*([a-z_]\w*)\s+/i),keyword=lead?.[1].toLowerCase();
 if(['var','class','weight','by','strata'].includes(keyword)){
  const remainder=tail.slice(lead[0].length);if(!/^[\w\s]*$/.test(remainder))return null;
  const ds=schema().schemas.get(completionTable(info.source||''));if(!ds)return null;
  const from=prefix?start:caret,actualEnd=prefix?end:caret,withoutCurrent=fullStatement.slice(lead[0].length,from-statementStart)+fullStatement.slice(actualEnd-statementStart),used=new Set((withoutCurrent.toLowerCase().match(/[a-z_]\w*/g)||[]).filter(n=>n!=='descending'));
  const items=keyword==='weight'&&used.size?[]:ds.columns.filter(c=>!used.has(c.toLowerCase())&&c.toLowerCase().startsWith(prefix.toLowerCase())&&(!(keyword==='weight'||keyword==='var'&&procedure==='means')||ds.types[c]!=='char')).map(c=>fragment(c,c+' ',(ds.types[c]==='num'?'numeric':ds.types[c]==='char'?'character':'variable')+(ds.inferred?' · inferred':'')));
  if(keyword==='by'&&'descending'.startsWith(prefix.toLowerCase())&&!/\bdescending\s*$/i.test(remainder.slice(0,remainder.length-prefix.length)))items.push(fragment('DESCENDING','descending ','Next BY variable'));
  if(!prefix&&used.size)items.push(fragment('; — finish '+keyword.toUpperCase(),';\n','Finish statement'));
  return result(items,from,actualEnd,'variables');
 }
 if(procedure==='glm'&&keyword==='model'){
  const remainder=tail.slice(lead[0].length);if(/[.&%()]/.test(remainder))return null;
  const slash=remainder.indexOf('/');if(slash>=0){const options=remainder.slice(slash+1),used=new Set((fullStatement.split('/')[1]||'').toLowerCase().match(/[a-z_]\w*/g)||[]),items=['solution','ss1','ss3'].filter(k=>!used.has(k)&&k.startsWith(prefix.toLowerCase())).map(k=>fragment(k.toUpperCase(),k+' ','MODEL option'));if(!prefix)items.push(fragment('; — finish MODEL',';\n','Finish statement'));return result(items);}
  const equal=remainder.indexOf('=');if(equal<0){if(/^[a-z_]\w*\s+$/.test(remainder.trimStart()))return result([fragment('= predictors','= ','Begin model effects')],caret,caret);return result(fieldItems('numeric'));}
  const response=remainder.slice(0,equal).trim().toLowerCase(),rhs=remainder.slice(equal+1),ds=schema().schemas.get(completionTable(info.source||''));if(!ds)return null;
  const classes=new Set(scope.statements.filter(t=>/^class\s/i.test(t)).flatMap(t=>t.replace(/^class\s+/i,'').toLowerCase().match(/[a-z_]\w*/g)||[]));
  const used=new Set((rhs.slice(0,Math.max(0,rhs.length-prefix.length)).toLowerCase().match(/[a-z_]\w*/g)||[]));if(/[*|]\s*$/.test(rhs.slice(0,Math.max(0,rhs.length-prefix.length))))used.clear();used.add(response);
  const items=fieldItems('any',used).filter(item=>ds.types[item.label]!=='char'||classes.has(item.label.toLowerCase()));
  if(!prefix&&/[a-z_]\w*\s*$/i.test(rhs))items.push(fragment('/ — model options','/ ','MODEL options'),fragment('; — finish MODEL',';\n','Finish statement'));return result(items);
 }
 if(['sgplot','sgpie'].includes(procedure)&&keyword){
  if(['xaxis','yaxis'].includes(keyword)){
   if(/\blabel\s*=\s*(['"])[\s\S]*\1\s*$/i.test(rawTail))return result([fragment('; — finish axis',';\n','Finish statement')],caret,caret);
   if(/\blabel\s*=\s*$/i.test(tail)){const text=keyword==='xaxis'?'X axis':'Y axis';return result([{...fragment("'"+text+"'","'"+text+"';\n",'Editable axis label')}],caret,caret);}
   if(/^\s*(?:l(?:a(?:b(?:e(?:l)?)?)?)?)?$/i.test(tail.slice(lead[0].length)))return result([fragment('LABEL=','label=','Axis label')]);return null;
  }
  if(['scatter','hbar','vbar','histogram','pie'].includes(keyword)){
   const remainder=tail.slice(lead[0].length),slash=remainder.indexOf('/'),optionPart=slash<0?remainder:remainder.slice(slash+1),allowed=slash<0?(keyword==='scatter'?['x','y']:[]):keyword==='scatter'?['group']:keyword==='histogram'?['nbins','scale']:keyword==='pie'?['response','stat']:['response','stat','group','groupdisplay'];
   if(slash<0&&keyword!=='scatter'){
    if(/^[a-z_]\w*\s+$/.test(remainder.trimStart()))return result([fragment('/ — plot options','/ ','Plot options'),fragment('; — finish plot',';\n','Finish statement')],caret,caret);
    if(/^[\w\s]*$/.test(remainder))return result(fieldItems(keyword==='histogram'?'numeric':'any'));return null;
   }
   const used=new Set([...optionPart.matchAll(/\b([a-z_]\w*)\s*=/g)].map(m=>m[1].toLowerCase())),slot=optionPart.match(/\b([a-z_]\w*)\s*=\s*([a-z_]\w*|\d*)$/i);
   if(slot){const key=slot[1].toLowerCase();if(!allowed.includes(key))return null;if(['x','y','response','group'].includes(key))return result(fieldItems(key==='group'?'any':'numeric'),caret-slot[2].length,end,'variables');
    const values=key==='nbins'?[10,20]:key==='scale'?['count','percent','proportion']:key==='groupdisplay'?['cluster','stack']:key==='stat'?(used.has('response')?['sum','mean','freq']:['freq']):[];
    return result(values.filter(v=>String(v).startsWith(slot[2].toLowerCase())).map(v=>fragment(String(v).toUpperCase(),String(v)+' ',key.toUpperCase()+' value')),caret-slot[2].length,end);
   }
   if(!/^[\w\s=]*$/.test(optionPart))return null;
   if(!/\s$/.test(tail)&&prefix&&optionPart.slice(0,optionPart.length-prefix.length).trimEnd().endsWith('='))return null;
   const items=allowed.filter(k=>!used.has(k)&&k.startsWith(prefix.toLowerCase())).map(k=>fragment(k.toUpperCase()+'=',k+'=','Plot option'));
   if(!prefix&&(slash>=0||used.has('x')&&used.has('y'))){if(slash<0)items.push(fragment('/ — plot options','/ ','Plot options'));items.push(fragment('; — finish plot',';\n','Finish statement'));}return result(items);
  }
 }
 if(keyword==='output'&&['means','glm'].includes(procedure)){
  const remainder=tail.slice(lead[0].length);if(/[&%]/.test(remainder))return null;
  const slash=remainder.indexOf('/');if(slash>=0&&procedure==='means'){const after=remainder.slice(slash+1).trim().toLowerCase();if(after==='autoname'&&/\s$/.test(remainder))return result([fragment('; — finish OUTPUT',';\n','Finish statement')],caret,caret);return /^[a-z_]*$/.test(after)&&'autoname'.startsWith(after)?result([fragment('AUTONAME;','autoname;\n','Generate output column names')],caret-after.length,end):null;}
  const assignments=[...fullStatement.matchAll(/\b([a-z_]\w*)(?:\([^)]*\))?\s*=/gi)].map(m=>m[1].toLowerCase()),used=new Set(assignments.map(k=>k==='stddev'?'std':procedure==='glm'?({predicted:'p',residual:'r'})[k]||k:k));
  if(!used.has('out'))return /^(?:[a-z_]\w*)?$/i.test(remainder.trim())&&'out'.startsWith(remainder.trim().toLowerCase())?result([fragment('OUT=','out=','Output dataset')],caret-remainder.trim().length):null;
  if(procedure==='glm'&&/\b(?:p|predicted|r|residual)\s*=\s*$/i.test(tail)){const name=/\b(?:p|predicted)\s*=\s*$/i.test(tail)?'predicted':'residual';return result([fragment(name,name+' ','New output variable')],caret,caret);}
  if(/\bout\s*=\s*$/i.test(tail))return result([fragment('summary','summary ','New output dataset')],caret,caret);
  if(!/\s$/.test(tail)&&(!prefix||!/\s$/.test(code.slice(0,start))))return null;
  if(/^\w*=/.test(code.slice(caret)))return null;
  const statistics=procedure==='glm'?['p','r']:catalog.statistics;
  const items=statistics.filter(k=>!used.has(k)&&k.startsWith(prefix.toLowerCase())&&!(k==='stderr'&&info.vardef!=='df')).map(k=>fragment(k.toUpperCase()+'=',k+'=','Output statistic'));
  if(!prefix&&[...used].some(k=>statistics.includes(k))){if(procedure==='means')items.push(fragment('/ AUTONAME;','/ autoname;\n','Generate output names'));items.push(fragment('; — finish OUTPUT',';\n','Finish statement'));}
  return result(items);
 }
 // A new statement/partial keyword: use the existing small starter catalog.
 if(!/^\s*(?:[a-z_]\w*)?$/i.test(tail))return null;
 const later=[],plotKinds=['scatter','hbar','vbar','histogram','pie'];let laterRun=false;
 for(const part of fullMask.slice(caret).split(';')){const next=part.trim().match(/^([a-z_]\w*)\b/i)?.[1]?.toLowerCase();if(['run','quit','data','proc'].includes(next)){laterRun=next==='run'||next==='quit';break;}if(next)later.push(next);}
 const unique=new Map();for(const item of procedureStatementTemplates(procedure,scope.statements,scope.header)){if(unique.has(item.keyword)||!item.keyword.startsWith(tail.trim().toLowerCase())||item.keyword!=='output'&&later.includes(item.keyword)||plotKinds.includes(item.keyword)&&later.some(k=>plotKinds.includes(k))||item.keyword==='run'&&(later.length||laterRun)||procedure==='glm'&&item.keyword==='model'&&later.includes('class'))continue;const insert=item.keyword==='run'?'run;':['getnames','guessingrows'].includes(item.keyword)?item.keyword+'=':item.keyword+' ';unique.set(item.keyword,fragment(item.keyword.toUpperCase()+(item.keyword==='run'?';':''),(tail.trim()?optionGap(start):'')+insert,'PROC '+procedure.toUpperCase()+' statement',item.keyword!=='run'));}
 return result([...unique.values()],tail.trim()?start:caret);
}
export function completionContext(code,caret,state={}){
 if(typeof code!=='string'||code.length>100000||!Number.isInteger(caret)||caret<0||caret>code.length)return null;
 const before=code.slice(0,caret),lex=completionLex(before);if(lex.inside)return null;
 const statementStart=lex.mask.lastIndexOf(';')+1,tail=lex.mask.slice(statementStart),marker=tail.match(/^\s*\?\?([a-z_]\w*)?$/i);
 if(marker){
  const start=statementStart+tail.indexOf('??'),prefix=(marker[1]||'').toLowerCase();let procedure=null,header='',statements=[];
  for(const part of lex.mask.slice(0,statementStart).split(';')){const text=part.trim(),proc=text.match(/^proc\s+([a-z_]\w*)\b/i);if(proc){procedure=proc[1].toLowerCase();header=text;statements=[];}else if(/^(?:data|run|quit)\b|^%mend\b/i.test(text)){procedure=null;header='';statements=[];}else if(procedure&&text)statements.push(text);}
  const indent=before.slice(before.lastIndexOf('\n')+1,start).match(/^[ \t]*/)?.[0]||'',items=procedureStatementTemplates(procedure,statements,header).filter(item=>item.keyword.startsWith(prefix)).map(item=>({...item,insert:item.insert.replaceAll('\n','\n'+indent)}));
  return items.length?{start,end:caret+(code.slice(caret).match(/^\w*/)?.[0].length||0),kind:'statements',qualifier:procedure,items,total:items.length}:null;
 }
 const assisted=completionProcedureAssist(code,caret,lex,state);if(assisted)return assisted;
 const match=lex.mask.match(/(?<![\w.&%])([a-z_]\w*(?:\.[a-z_]\w*)?)\.([a-z_]\w*|)$/i);if(!match)return completionProcedureAssist(code,caret,lex,state);
 const qualifier=match[1].toLowerCase(),prefix=match[2].toLowerCase(),{schemas,libraries}=completionSchemas(lex.mask.slice(0,match.index),state),end=caret+(code.slice(caret).match(/^\w*/)?.[0].length||0);
 let items=[],start=match.index,kind='variables';
 if(!qualifier.includes('.')&&libraries.has(qualifier)){
  kind='datasets';start=match.index+match[1].length+1;
  const names=new Set();for(const name of schemas.keys()){if(qualifier==='work'&&!name.includes('.'))names.add(name);else if(name.startsWith(qualifier+'.'))names.add(name.slice(qualifier.length+1));}
  for(const name of state.members?.[qualifier]||[])names.add(name);
  items=[...names].filter(n=>completionName.test(n)&&n.toLowerCase().startsWith(prefix)).map(n=>({label:n,insert:n,detail:qualifier.toUpperCase()+' dataset'}));
 }else{
  const ds=schemas.get(completionTable(qualifier));if(!ds)return null;
  items=ds.columns.filter(c=>c.toLowerCase().startsWith(prefix)).map(c=>({label:c,insert:c,detail:(ds.types[c]==='char'?'character':ds.types[c]==='num'?'numeric':'variable')+(ds.inferred?' · inferred from source':'')}));
 }
 items.sort((a,b)=>a.label.toLowerCase().localeCompare(b.label.toLowerCase()));
 return items.length?{start,end,kind,qualifier,items:items.slice(0,200),total:items.length}:null;
}
export function createCompletionView(editor,getState,prepareMetadata=null){
 const popup=document.createElement('div');popup.id='codecompletion';popup.className='codecompletion';popup.hidden=true;popup.setAttribute('role','listbox');popup.setAttribute('aria-label','Dataset, variable and statement suggestions');document.body.append(popup);
 editor.setAttribute('aria-autocomplete','list');editor.setAttribute('aria-controls',popup.id);
 let context=null,index=0,composing=false,navigated=false,timer,revision=0;
 const hide=()=>{revision++;clearTimeout(timer);context=null;popup.hidden=true;editor.removeAttribute('aria-activedescendant');};
 function position(){
  const rect=editor.getBoundingClientRect(),style=getComputedStyle(editor),mirror=document.createElement('div');
  for(const property of ['font','lineHeight','letterSpacing','padding','border','boxSizing','tabSize'])mirror.style[property]=style[property];
  Object.assign(mirror.style,{position:'fixed',visibility:'hidden',whiteSpace:'pre',left:rect.left+'px',top:rect.top+'px',width:rect.width+'px'});
  mirror.textContent=editor.value.slice(0,editor.selectionStart);const marker=document.createElement('span');marker.textContent='\u200b';mirror.append(marker);document.body.append(mirror);const caret=marker.getBoundingClientRect();mirror.remove();
  const top=caret.top-editor.scrollTop,left=caret.left-editor.scrollLeft;if(top<rect.top||top>rect.bottom){hide();return;}
  popup.style.left=Math.max(8,Math.min(left,innerWidth-popup.offsetWidth-8))+'px';popup.style.top=Math.max(8,Math.min(top+(parseFloat(style.lineHeight)||20),innerHeight-popup.offsetHeight-8))+'px';
 }
 function select(){if(!context||index>=context.items.length)return;const label=context.items[index].label,fresh=completionContext(editor.value,editor.selectionStart,getState());if(!fresh||editor.selectionStart!==editor.selectionEnd){hide();return;}const item=fresh.items.find(item=>item.label===label)||fresh.items[0],start=fresh.start,end=fresh.end;hide();editor.setRangeText(item.insert,start,end,'end');if(item.selectText){const offset=item.insert.indexOf(item.selectText);if(offset>=0)editor.setSelectionRange(start+offset,start+offset+item.selectText.length);}editor.dispatchEvent(new Event('input',{bubbles:true}));editor.focus();hide();if(item.followUp)timer=setTimeout(update,0);}
 function paint(){popup.replaceChildren();context.items.forEach((item,i)=>{const option=document.createElement('div');option.id='completion-option-'+i;option.className='completionoption';option.title=item.insert;option.setAttribute('role','option');option.setAttribute('aria-selected',String(i===index));const label=document.createElement('strong'),detail=document.createElement('small');label.textContent=item.label;detail.textContent=item.detail;option.append(label,detail);option.onmousedown=e=>{e.preventDefault();index=i;select();};popup.append(option);});const hint=document.createElement('small');hint.className='completionhint';hint.textContent=(context.automatic?'Insert only this piece. ':context.kind==='statements'?'Edit the selected placeholder after insertion. ':context.kind==='variables'?'Inserts variable name only. ':'')+(context.automatic?'↑↓ select · Tab insert · Esc close':'↑↓ select · Tab/Enter insert · Esc close')+(context.total>200?' · Type more to filter':'');popup.append(hint);editor.setAttribute('aria-activedescendant','completion-option-'+index);}
 function update(){clearTimeout(timer);if(composing||editor.disabled||document.activeElement!==editor||editor.selectionStart!==editor.selectionEnd){hide();return;}
  const code=editor.value,caret=editor.selectionStart,next=completionContext(code,caret,getState());
  if(!next)hide();else{context=next;index=0;navigated=false;paint();popup.hidden=false;position();}
  const request=++revision;
  if(prepareMetadata)Promise.resolve(prepareMetadata(code,caret)).then(changed=>{if(changed&&request===revision&&editor.value===code&&editor.selectionStart===caret&&document.activeElement===editor)update();}).catch(()=>{});
 }
 editor.addEventListener('input',e=>{if(e.isComposing)return;clearTimeout(timer);timer=setTimeout(update,50);});
 editor.addEventListener('keydown',e=>{if(composing||e.isComposing||!context||popup.hidden||e.ctrlKey||e.metaKey||e.altKey)return;if(e.key==='Enter'&&context.automatic&&!navigated){hide();return;}if(['ArrowDown','ArrowUp','Tab','Enter','Escape'].includes(e.key)){e.preventDefault();e.stopImmediatePropagation();if(e.key==='Escape')hide();else if(e.key==='Tab'||e.key==='Enter')select();else{navigated=true;index=(index+(e.key==='ArrowDown'?1:-1)+context.items.length)%context.items.length;paint();popup.querySelector('[aria-selected="true"]')?.scrollIntoView({block:'nearest'});}}else if(['ArrowLeft','ArrowRight','Home','End'].includes(e.key))hide();},true);
 editor.addEventListener('compositionstart',()=>{composing=true;hide();});editor.addEventListener('compositionend',()=>{composing=false;update();});
 for(const event of ['blur','scroll','click'])editor.addEventListener(event,hide);
 window.addEventListener('resize',hide);document.addEventListener('pointerdown',e=>{if(e.target!==editor&&!popup.contains(e.target))hide();});
 return {close:hide};
}
