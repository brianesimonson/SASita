// Editor metadata only: never execute a program, inspect observations or open files.
function completionLex(source){
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
 for(const [name,ds] of Object.entries(state.datasets||{}))schemas.set(completionTable(name),describe(ds));
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
export function completionContext(code,caret,state={}){
 if(typeof code!=='string'||code.length>100000||!Number.isInteger(caret)||caret<0||caret>code.length)return null;
 const before=code.slice(0,caret),lex=completionLex(before);if(lex.inside)return null;
 const match=lex.mask.match(/(?<![\w.&%])([a-z_]\w*(?:\.[a-z_]\w*)?)\.([a-z_]\w*|)$/i);if(!match)return null;
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
export function createCompletionView(editor,getState){
 const popup=document.createElement('div');popup.id='codecompletion';popup.className='codecompletion';popup.hidden=true;popup.setAttribute('role','listbox');popup.setAttribute('aria-label','Dataset and variable suggestions');document.body.append(popup);
 editor.setAttribute('aria-autocomplete','list');editor.setAttribute('aria-controls',popup.id);
 let context=null,index=0,composing=false,timer;
 const hide=()=>{clearTimeout(timer);context=null;popup.hidden=true;editor.removeAttribute('aria-activedescendant');};
 function position(){
  const rect=editor.getBoundingClientRect(),style=getComputedStyle(editor),mirror=document.createElement('div');
  for(const property of ['font','lineHeight','letterSpacing','padding','border','boxSizing','tabSize'])mirror.style[property]=style[property];
  Object.assign(mirror.style,{position:'fixed',visibility:'hidden',whiteSpace:'pre',left:rect.left+'px',top:rect.top+'px',width:rect.width+'px'});
  mirror.textContent=editor.value.slice(0,editor.selectionStart);const marker=document.createElement('span');marker.textContent='\u200b';mirror.append(marker);document.body.append(mirror);const caret=marker.getBoundingClientRect();mirror.remove();
  const top=caret.top-editor.scrollTop,left=caret.left-editor.scrollLeft;if(top<rect.top||top>rect.bottom){hide();return;}
  popup.style.left=Math.max(8,Math.min(left,innerWidth-popup.offsetWidth-8))+'px';popup.style.top=Math.max(8,Math.min(top+(parseFloat(style.lineHeight)||20),innerHeight-popup.offsetHeight-8))+'px';
 }
 function select(){if(!context||index>=context.items.length)return;const label=context.items[index].label,fresh=completionContext(editor.value,editor.selectionStart,getState());if(!fresh||editor.selectionStart!==editor.selectionEnd){hide();return;}const item=fresh.items.find(item=>item.label===label)||fresh.items[0],start=fresh.start,end=fresh.end;hide();editor.setRangeText(item.insert,start,end,'end');editor.dispatchEvent(new Event('input',{bubbles:true}));editor.focus();hide();}
 function paint(){popup.replaceChildren();context.items.forEach((item,i)=>{const option=document.createElement('div');option.id='completion-option-'+i;option.className='completionoption';option.setAttribute('role','option');option.setAttribute('aria-selected',String(i===index));const label=document.createElement('strong'),detail=document.createElement('small');label.textContent=item.label;detail.textContent=item.detail;option.append(label,detail);option.onmousedown=e=>{e.preventDefault();index=i;select();};popup.append(option);});const hint=document.createElement('small');hint.className='completionhint';hint.textContent=(context.kind==='variables'?'Inserts variable name only. ':'')+'↑↓ select · Tab/Enter insert · Esc close'+(context.total>200?' · Type more to filter':'');popup.append(hint);editor.setAttribute('aria-activedescendant','completion-option-'+index);}
 function update(){clearTimeout(timer);if(composing||editor.disabled||document.activeElement!==editor||editor.selectionStart!==editor.selectionEnd){hide();return;}const next=completionContext(editor.value,editor.selectionStart,getState());if(!next){hide();return;}context=next;index=0;paint();popup.hidden=false;position();}
 editor.addEventListener('input',e=>{if(e.isComposing)return;clearTimeout(timer);timer=setTimeout(update,50);});
 editor.addEventListener('keydown',e=>{if(composing||e.isComposing||!context||popup.hidden||e.ctrlKey||e.metaKey||e.altKey)return;if(['ArrowDown','ArrowUp','Tab','Enter','Escape'].includes(e.key)){e.preventDefault();e.stopImmediatePropagation();if(e.key==='Escape')hide();else if(e.key==='Tab'||e.key==='Enter')select();else{index=(index+(e.key==='ArrowDown'?1:-1)+context.items.length)%context.items.length;paint();popup.querySelector('[aria-selected="true"]')?.scrollIntoView({block:'nearest'});}}else if(['ArrowLeft','ArrowRight','Home','End'].includes(e.key))hide();},true);
 editor.addEventListener('compositionstart',()=>{composing=true;hide();});editor.addEventListener('compositionend',()=>{composing=false;update();});
 for(const event of ['blur','scroll','click'])editor.addEventListener(event,hide);
 window.addEventListener('resize',hide);document.addEventListener('pointerdown',e=>{if(e.target!==editor&&!popup.contains(e.target))hide();});
 return {close:hide};
}
