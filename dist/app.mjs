import {parseCSV,csv,display} from './engine.mjs';
import {readTable} from './table-storage.mjs';
import {createProjectFiles} from './project-files.mjs';
import {projectCSV} from './file-program.mjs';
const $=id=>document.getElementById(id);
const project=createProjectFiles();
let programHandle=null,programBaseline='',programDirty=false,projectFolderPath='';
const examples={
conversions:`/* INPUT reads text; PUT produces a character result. */
data converted;
    sale = '2,115,353';
    sale_number = input(sale, comma9.);
    chardate = put(122591, z6.);
    sasdate = input(chardate, mmddyy6.);
    iso_date = put(sasdate, e8601da10.);
    padded_id = put(1350, z8.);
    bad = input('not a number', ?? 12.);
    format sale_number comma12. sasdate date9.;
run;`,
formats:`/* Width changes zeros/date text; the table omits alignment padding. */
data format_gallery;
    day = input('03/15/2018', mmddyy10.);
    amount = input('$1,234.50', comma12.);
    rate = input('23.48%', percent7.2);
    clock = input('12:59:56', time8.);
    iso_date = put(day, e8601da10.);
    month_label = put(day, monyy7.);
    padded_id = put(1350, z8.);
    fixed_text = put(23.45, 6.3);
    format day date11. amount dollar12.2 rate percent8.2 clock hhmm8.2;
run;`,
random:`/* Re-running produces the same results in this app.
   Uniform draws match the seed-12345 SAS fixture; normal sequences remain unverified. */
data random_sample;
    call streaminit('MT32', 12345);
    do id = 1 to 8;
        uniform = rand('uniform');
        normal = rand('normal', 10, 2);
        uniform_hex = put(uniform, hex16.);
        output;
    end;
    format uniform 10.6 normal 10.4;
run;`,
flags:`/* Flag claims and calculate excess payment. */\ndata flagged;\n    set claims;\n    if paid_amount > 1000;\n    excess = paid_amount - allowed_amount;\n    length review $ 12;\n    if excess > 500 then review = 'Priority';\n    else review = 'Routine';\n    format paid_amount dollar12.2\n           excess dollar12.2;\n    keep claim_id provider paid_amount excess review;\nrun;`,
groups:`/* CLAIMS is already sorted by provider. */\ndata provider_totals;\n    set claims;\n    by provider;\n    if first.provider then do;\n        total_paid = 0;\n        claim_count = 0;\n    end;\n    total_paid + paid_amount;\n    claim_count + 1;\n    if last.provider then output;\n    format total_paid dollar12.2;\n    keep provider total_paid claim_count;\nrun;`,
loop:`/* No SET: create observations from a loop. */\ndata squares;\n    do number = 1 to 12;\n        square = number ** 2;\n        root = sqrt(number);\n        output;\n    end;\nrun;`,
merge:`/* Sort each input before a match merge. */\nproc sort data=claims out=claims_sorted;\n    by provider;\nrun;\n\nproc sort data=providers out=providers_sorted;\n    by provider;\nrun;\n\ndata enriched;\n    merge claims_sorted(in=a) providers_sorted(in=b);\n    by provider;\n    if a;\n    matched_provider = b;\n    keep claim_id provider specialty paid_amount matched_provider;\nrun;`,
macro:`/* Generate a DATA step with parameters. */\n%let threshold = 1000;\n\n%macro flag(source, out, limit=500);\n    data &out;\n        set &source;\n        if paid_amount > &limit;\n        excess = paid_amount - allowed_amount;\n        format excess dollar12.2;\n    run;\n%mend flag;\n\n%flag(claims, macro_flagged, limit=&threshold);`,
macroloop:`/* Generate three separate DATA steps. */\n%macro thresholds;\n    %local i cutoff;\n    %do i = 1 %to 3;\n        %let cutoff = %eval(&i * 1000);\n        data above_&cutoff.;\n            set claims;\n            if paid_amount > &cutoff;\n        run;\n    %end;\n%mend thresholds;\n\n%thresholds;`,
split:`/* Explicit OUTPUT controls which dataset gets a row. */\ndata paid missing_payment;\n    set claims;\n    if missing(paid_amount) then output missing_payment;\n    else output paid;\nrun;`};
const sample='claim_id,provider,paid_amount,allowed_amount,service_date\nC001,Alpha Medical,1200,900,24380\nC002,Alpha Medical,750,750,24381\nC003,Alpha Medical,2400,1500,24382\nC004,Beacon Care,1800,1700,24383\nC005,Beacon Care,300,300,24384\nC006,Beacon Care,,0,24385\nC007,Cedar Health,4500,3200,24386\nC008,Cedar Health,1100,800,24387\nC009,Cedar Health,600,600,24388\nC010,Cedar Health,2100,1450,24389';
let datasets=Object.assign(Object.create(null),{claims:parseCSV(sample),providers:parseCSV('provider,specialty\nCedar Health,Rehabilitation\nAlpha Medical,Internal medicine\nBeacon Care,Home health\nDelta Clinic,Cardiology')}),selected='claims',page=0,busy=false,pendingFile=null;datasets.claims.formats={paid_amount:'dollar12.2',allowed_amount:'dollar12.2',service_date:'date9'};
function el(tag,txt,cls){let n=document.createElement(tag);if(txt!==undefined)n.textContent=txt;if(cls)n.className=cls;return n}
function highlight(){const code=$('code').value; $('highlight').innerHTML=code.length<=100000&&globalThis.Prism?Prism.highlight(code,Prism.languages.sas,'sas')+'\n': ''; if(code.length>100000)$('highlight').textContent=code+'\n';syncEditor();}
function syncEditor(){$('lines').scrollTop=$('code').scrollTop;$('highlight').style.transform=`translate(${-$('code').scrollLeft}px,${-$('code').scrollTop}px)`;}
function lines(){highlight();let n=$('code').value.split('\n').length;$('lines').textContent=Array.from({length:n},(_,i)=>i+1).join('\n');$('linecount').textContent=n+' lines'}
let outputHistory=[],outputSnapshot=null,runNumber=0,libraries=Object.create(null),libraryMembers=Object.create(null);
async function refreshLibraries(){libraryMembers=Object.create(null);for(const [alias,path] of Object.entries(libraries)){try{libraryMembers[alias]=(await project.list(path==='.'?'':path)).filter(e=>e.kind==='file'&&/^[a-z_]\w{0,31}\.sassy-table\.json$/.test(e.name)).map(e=>e.name.replace(/\.sassy-table\.json$/,''));}catch(e){log('WARNING: Could not list '+alias.toUpperCase()+': '+e.message,true);}}render();}
function resetLibraries(){libraries=Object.create(null);libraryMembers=Object.create(null);for(const name of Object.keys(datasets))if(name.includes('.'))delete datasets[name];if(selected.includes('.'))selected='';outputSnapshot=null;renderHistory();render();}
$('refreshlibraries').onclick=()=>userAction(refreshLibraries);
function shownDataset(){return outputSnapshot?.dataset||datasets[selected]}
function showWorkspace(name){for(const pane of ['program','output','log']){const active=pane===name;$(pane+'pane').hidden=!active;$('workspace'+pane+'tab').setAttribute('aria-selected',String(active));$('workspace'+pane+'tab').tabIndex=active?0:-1;}if(name==='program')syncEditor();}
for(const name of ['program','output','log']){$('workspace'+name+'tab').onclick=()=>showWorkspace(name);$('workspace'+name+'tab').onkeydown=e=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){e.preventDefault();const names=['program','output','log'],index=e.key==='Home'?0:e.key==='End'?2:(names.indexOf(name)+(e.key==='ArrowRight'?1:2))%3;showWorkspace(names[index]);$('workspace'+names[index]+'tab').focus();}}}
function renderHistory(){$('outputhistory').replaceChildren(el('option','Current WORK dataset'));$('outputhistory').firstChild.value='';for(const item of outputHistory){const option=el('option',`Run ${item.run} · ${item.program} · ${item.name} (${item.dataset.rows.length.toLocaleString()} rows)`);option.value=item.id;$('outputhistory').append(option);}$('outputhistory').value=outputSnapshot?.id||'';}
$('outputhistory').onchange=()=>{outputSnapshot=outputHistory.find(x=>x.id===$('outputhistory').value)||null;page=0;render();};
$('clearoutput').onclick=()=>{outputHistory=[];outputSnapshot=null;selected='';page=0;renderHistory();render();};
$('clearlog').onclick=()=>{$('log').replaceChildren();};
function render(){let list=$('datasets');list.replaceChildren();$('datasetcount').textContent=Object.keys(datasets).filter(n=>!n.includes('.')).length+Object.values(libraryMembers).reduce((n,m)=>n+m.length,0);list.append(el('h3','WORK','libraryheading'));
 function datasetButton(name,ds,open){let b=el('button',undefined,'dataset'+(name===selected&&!outputSnapshot?' active':''));b.disabled=busy;b.append(el('strong',name),el('small',ds?`${ds.rows.length.toLocaleString()} rows · ${ds.columns.length} variables`:'Saved table'));b.onclick=open;list.append(b);}
 function selectDataset(name){selected=name;outputSnapshot=null;page=0;renderHistory();render();showWorkspace('output');}
 for(const [name,ds] of Object.entries(datasets))if(!name.includes('.'))datasetButton(name,ds,()=>selectDataset(name));
 for(const [alias,path] of Object.entries(libraries)){list.append(el('h3',alias.toUpperCase(),'libraryheading'));const folder=el('small',path,'librarypath');folder.title=path;list.append(folder);for(const member of libraryMembers[alias]||[]){const name=alias+'.'+member;datasetButton(name,datasets[name],()=>userAction(async()=>{datasets[name]=readTable(await project.read((path==='.'?'':path+'/')+member+'.sassy-table.json'));selectDataset(name);}));}if(!(libraryMembers[alias]||[]).length)list.append(el('small','No saved tables','librarypath'));}

 let ds=shownDataset();$('resulttitle').textContent=ds?(outputSnapshot?.name||selected):'Results';$('export').disabled=!ds||busy;$('savecsvproject').disabled=!ds||busy||!project.directory;$('rowcount').textContent=ds?`${ds.rows.length.toLocaleString()} observations · ${ds.columns.length} variables`:'';$('table').replaceChildren();if(!ds||!ds.rows.length){$('table').append(el('div',ds?'This dataset has no observations.':'Run a program to see results.','empty'))}else{let table=el('table'),head=el('thead'),tr=el('tr');tr.append(el('th','#'));for(let c of ds.columns)tr.append(el('th',c));head.append(tr);table.append(head);let body=el('tbody');for(let [idx,r]of ds.rows.slice(page*50,page*50+50).entries()){let tr=el('tr');tr.append(el('td',page*50+idx+1,'rownum'));for(let c of ds.columns){let val=r[c],td=el('td',display(val,$('formatted').checked?ds.formats[c]:null),typeof val==='number'?'numeric':undefined);td.title='Raw: '+(val??'.');tr.append(td)}body.append(tr)}table.append(body);$('table').append(table)}let total=ds?.rows.length||0;$('pageinfo').textContent=total?`${page*50+1}–${Math.min(page*50+50,total)} of ${total.toLocaleString()}`:'0 observations';$('prev').disabled=page===0;$('next').disabled=(page+1)*50>=total;
}
function log(msg,error=false){const pane=$('log'),bottom=pane.scrollHeight-pane.scrollTop-pane.clientHeight<40;const entry=el('span',`[${new Date().toLocaleTimeString()}] ${msg}\n\n`,error?'error':'logentry');pane.append(entry);if(pane.textContent.length>1000000){while(pane.childNodes.length>1&&pane.textContent.length>1000000)pane.firstChild.remove();}if(bottom)pane.scrollTop=pane.scrollHeight;$('status').textContent=error?'Error':'Ready';$('status').style.color=error?'#b33c47':'#137e72'}
function lockWorkspace(value) {
 busy=value;
 for(const id of ['run','newprogram','openprogram','saveprogram','saveasprogram','import','chooseproject','programname','code'])$(id).disabled=value;
 updateProjectUI();render();
}
function execute(code=$('code').value){
 if(busy)return Promise.reject(new Error('A program is already running'));
 lockWorkspace(true);const run=++runNumber,program=$('programname').value;log(`Run ${run} · ${program} started.`);$('status').textContent='Running…';const start=performance.now();
 return new Promise((resolve,reject)=>{
  const worker=new Worker('worker.mjs',{type:'module'});let ended=false;
  const timer=setTimeout(()=>error('Execution exceeded 8 seconds. Reduce the data or loop size.'),8000);
  const finish=()=>{clearTimeout(timer);worker.terminate();ended=true;lockWorkspace(false)};
  const error=message=>{if(ended)return;finish();log('ERROR: '+message+'\nNo dataset changes were committed.',true);showWorkspace('log');reject(new Error(message))};
  worker.onerror=()=>error('The execution worker could not run. Try reopening the page.');
  worker.onmessage=async({data})=>{
   if(ended)return;
   if(data.kind==='check-directory'){try{const value=await project.checkDirectory(data.path);if(!ended)worker.postMessage({kind:'file-response',id:data.id,value});}catch(e){if(!ended)worker.postMessage({kind:'file-response',id:data.id,error:e.message});}return;}
   if(data.kind==='read-file'){
    try{log('Reading project file: '+data.path);$('status').textContent='Running…';const text=await project.read(data.path);if(!ended)worker.postMessage({kind:'file-response',id:data.id,text});}
    catch(e){if(!ended)worker.postMessage({kind:'file-response',id:data.id,error:e.message});}
    return;
   }
   if(data.expanded!==undefined)$('expandedview').textContent=data.expanded;
   if(!data.ok){error(data.error);return;}
   clearTimeout(timer);worker.terminate();
   try{
    const saved=await project.saveExports(data.result.exports);
    $('expandedview').textContent=data.result.expanded;datasets=data.result.datasets;libraries=data.result.libraries||libraries;
    for(const name of new Set(data.result.written)){outputHistory.push({id:`${run}:${name}`,run,program,name,dataset:datasets[name]});}let retained=outputHistory.reduce((n,x)=>n+x.dataset.rows.length,0),trimmed=0;while(outputHistory.length>1&&(outputHistory.length>100||retained>250000)){retained-=outputHistory.shift().dataset.rows.length;trimmed++;}if(trimmed)log('NOTE: Older output snapshots removed (session limit: 100 datasets / 250,000 rows).');outputSnapshot=outputHistory.at(-1)||null;renderHistory();selected=data.result.written.at(-1)||selected;page=0;await refreshLibraries();finish();showWorkspace('output');
    const elapsed=((performance.now()-start)/1000).toFixed(2);
    log(data.result.logs.join('\n')+(saved.length?'\nNOTE: Saved project files: '+saved.join(', '):'')+`\nNOTE: Completed in ${elapsed}s. All processing stayed in this browser.`);
    resolve({written:data.result.written,observations:Object.fromEntries(data.result.written.map(name=>[name,datasets[name].rows.length]))});
   }catch(e){error(e.message)}
  };
  worker.postMessage({code,datasets,libraries});
 });
}
function view(expanded){$('codeview').hidden=expanded;$('expandedview').hidden=!expanded;$('programtab').setAttribute('aria-selected',String(!expanded));$('expandedtab').setAttribute('aria-selected',String(expanded));$('programtab').tabIndex=expanded?-1:0;$('expandedtab').tabIndex=expanded?0:-1;}
$('programtab').onclick=()=>view(false);$('expandedtab').onclick=()=>view(true);for(let id of ['programtab','expandedtab'])$(id).onkeydown=e=>{if(['ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();let expanded=id==='programtab';view(expanded);$(expanded?'expandedtab':'programtab').focus()}};
$('run').onclick=()=>execute().catch(()=>{});$('code').oninput=()=>{lines();programDirty=$('code').value!==programBaseline;updateProgramUI();rememberDraft()};$('code').onscroll=syncEditor;$('code').onkeydown=e=>{if(e.key==='Tab'){e.preventDefault();let a=e.target.selectionStart,b=e.target.selectionEnd;e.target.setRangeText('    ',a,b,'end');e.target.dispatchEvent(new Event('input'))}};document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key==='Enter'){e.preventDefault();execute().catch(()=>{})}});
$('prev').onclick=()=>{page--;render()};$('next').onclick=()=>{page++;render()};$('formatted').onchange=render;
$('help').onclick=()=>$('helpdialog').showModal();$('closehelp').onclick=()=>$('helpdialog').close();$('import').onclick=()=>$('file').click();$('file').onchange=()=>{let file=$('file').files[0];if(!file)return;pendingFile=file;$('filename').textContent=file.name;$('importname').value=file.name.replace(/\.csv$/i,'').replace(/[^a-z0-9_]/gi,'_').replace(/^(?=\d)/,'_').toLowerCase()||'imported';$('importdialog').showModal();$('file').value=''};$('closeimport').onclick=()=>$('importdialog').close();$('importform').onsubmit=async e=>{e.preventDefault();if(busy){log('ERROR: Wait for the program to finish before importing.',true);return}try{if(pendingFile.size>20000000)throw new Error('CSV import limit is 20 MB');let name=$('importname').value.toLowerCase();if(!/^[a-z_]\w*$/.test(name))throw new Error('Use a valid SAS dataset name');let ds=parseCSV(await pendingFile.text());datasets[name]=ds;selected=name;outputSnapshot=null;page=0;renderHistory();render();showWorkspace('output');$('importdialog').close();log(`NOTE: Imported WORK.${name.toUpperCase()}: ${ds.rows.length} observations, ${ds.columns.length} variables.`)}catch(e){log('ERROR: '+e.message,true)}};
function downloadLocalFile(name,text,type='text/plain;charset=utf-8') {
 const url=URL.createObjectURL(new Blob([text],{type})),anchor=el('a');anchor.href=url;anchor.download=name;anchor.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
$('export').onclick=()=>{try{downloadLocalFile((outputSnapshot?.name||selected)+'.csv',projectCSV(shownDataset()),'text/csv;charset=utf-8')}catch(e){log(e.message,true)}};
function programFilename() {
 const name=$('programname').value.trim();
 if(!/^[^\/\\:\x00-\x1f<>"|?*]+\.(sas|txt)$/i.test(name)||/[. ]$/.test(name))throw new Error('Use a program filename ending in .sas or .txt');
 return name;
}
function updateProgramUI(){ $('programstate').textContent=programDirty?'Unsaved changes':programHandle?'Saved file':'Editor draft'; }
function rememberDraft(){try{localStorage.setItem('sasita-program-draft',JSON.stringify({name:$('programname').value,code:$('code').value}));}catch{}}
function setProgram(code,name='untitled.sas',handle=null){$('code').value=code;$('programname').value=name;programHandle=handle;programBaseline=code;programDirty=false;lines();view(false);updateProgramUI();rememberDraft();showWorkspace('program');}
function canReplaceProgram(){return !programDirty||confirm('This program has unsaved edits. Replace them? Your recovery draft will also be replaced.');}
async function openProgramFile(file,handle=null){
 if(file.size>1000000)throw new Error('Program files are limited to 1 MB');
 setProgram(await file.text(),file.name,handle);log('Opened '+file.name+'. Click Run program to execute it.');
}
async function userAction(action){
 if(busy){log('Wait for the current operation to finish.',true);return;}
 lockWorkspace(true);
 try{await action();}catch(e){if(e.name!=='AbortError')log(e.message,true);}finally{lockWorkspace(false);}
}
$('newprogram').onclick=()=>{if(canReplaceProgram())setProgram('')};
$('openprogram').onclick=()=>userAction(async()=>{
 if(!canReplaceProgram())return;
 if(globalThis.showOpenFilePicker){const [handle]=await showOpenFilePicker({types:[{description:'SAS programs',accept:{'text/plain':['.sas','.txt']}}],multiple:false});await openProgramFile(await handle.getFile(),handle);}
 else $('programfile').click();
});
$('programfile').onchange=()=>userAction(async()=>{const file=$('programfile').files[0];$('programfile').value='';if(file)await openProgramFile(file)});
async function saveProgram(saveAs=false){
 const name=programFilename(),text=$('code').value;
 if(new TextEncoder().encode(text).length>1000000)throw new Error('Program files are limited to 1 MB');
 let handle=saveAs?null:programHandle;
 if(!handle&&globalThis.showSaveFilePicker)handle=await showSaveFilePicker({suggestedName:name,...(project.directory?{startIn:project.directory}:{}),types:[{description:'SAS program',accept:{'text/plain':['.sas']}}]});
 if(handle){
  if(await handle.queryPermission({mode:'readwrite'})!=='granted'&&await handle.requestPermission({mode:'readwrite'})!=='granted')throw new Error('Program save permission was not granted.');
  lockWorkspace(true);try{const writer=await handle.createWritable();try{await writer.write(text);await writer.close()}catch(e){await writer.abort().catch(()=>{});throw e}}finally{lockWorkspace(false)}
  programHandle=handle;$('programname').value=handle.name;programBaseline=text;programDirty=$('code').value!==text;updateProgramUI();rememberDraft();log('Saved '+handle.name+'.');
 }else{downloadLocalFile(name,text);log('Downloaded '+name+'. Your editor remains a draft; use Open program to reopen the saved copy.');}
}
$('saveprogram').onclick=()=>userAction(()=>saveProgram());$('saveasprogram').onclick=()=>userAction(()=>saveProgram(true));
$('programname').oninput=()=>{programHandle=null;programDirty=true;updateProgramUI();rememberDraft()};
document.addEventListener('keydown',event=>{if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='s'){event.preventDefault();userAction(()=>saveProgram(event.shiftKey))}});
window.addEventListener('beforeunload',event=>{rememberDraft();if(programDirty){event.preventDefault();event.returnValue=''}});
function updateProjectUI(){
 $('chooseproject').disabled=busy||!project.supported();
 $('reconnectproject').hidden=!project.remembered||!!project.directory;$('reconnectproject').disabled=busy;
 $('forgetproject').disabled=busy||!project.remembered;$('projectbrowse').disabled=busy||!project.directory;
 $('projectstatus').textContent=project.directory?'Project: '+project.directory.name+(project.notice?' · '+project.notice:' · read/write access'):project.remembered?'Remembered: '+project.remembered.name+' · reconnect to grant access':!project.supported()?'Folder access unavailable here. Program upload/download and manual CSV import/download still work.':project.notice||'Choose a folder for programmatic imports and exports.';
 $('savecsvproject').disabled=busy||!project.directory||!shownDataset();$('refreshlibraries').disabled=busy||!project.directory||!Object.keys(libraries).length;
}
$('chooseproject').onclick=()=>userAction(async()=>{await project.connect();resetLibraries();projectFolderPath='';updateProjectUI();log('Project folder connected: '+project.directory.name+'. Relative CSV paths now use this folder.')});
$('reconnectproject').onclick=()=>userAction(async()=>{await project.reconnect();updateProjectUI();log('Project folder reconnected.')});
$('forgetproject').onclick=()=>userAction(async()=>{await project.forget();resetLibraries();$('projectdialog').close();updateProjectUI();log(project.notice||'Project disconnected and forgotten. Browser permissions can also be revoked in browser settings.')});
async function browseProject(){
 const entries=await project.list(projectFolderPath);$('projectentries').replaceChildren();$('projectpath').textContent=project.directory.name+(projectFolderPath?'/'+projectFolderPath:'');$('projectup').disabled=!projectFolderPath;
 for(const entry of entries){
  if(entry.kind!=='directory'&&!/\.(sas|txt|csv)$/i.test(entry.name))continue;
  const button=el('button',(entry.kind==='directory'?'Folder: ':'')+entry.name,'projectentry');
  button.onclick=()=>userAction(async()=>{
   const path=projectFolderPath?projectFolderPath+'/'+entry.name:entry.name;
   if(entry.kind==='directory'){projectFolderPath=path;await browseProject();return;}
   const file=await entry.handle.getFile();
   if(/\.csv$/i.test(entry.name)){$('projectdialog').close();pendingFile=file;$('filename').textContent=file.name;$('importname').value=file.name.replace(/\.csv$/i,'').replace(/[^a-z0-9_]/gi,'_').replace(/^(?=\d)/,'_').toLowerCase();$('importdialog').showModal();}
   else if(canReplaceProgram()){await openProgramFile(file,entry.handle);$('projectdialog').close();}
  });$('projectentries').append(button);
 }
 if(!$('projectentries').children.length)$('projectentries').append(el('p','No folders, programs or CSV files here.'));
}
$('projectbrowse').onclick=()=>userAction(async()=>{await browseProject();$('projectdialog').showModal()});
$('closeproject').onclick=()=>$('projectdialog').close();$('refreshproject').onclick=()=>userAction(browseProject);
$('projectup').onclick=()=>userAction(async()=>{projectFolderPath=projectFolderPath.split('/').slice(0,-1).join('/');await browseProject()});
$('savecsvproject').onclick=()=>userAction(async()=>{
 const name=(outputSnapshot?.name||selected)+'.csv',text=projectCSV(shownDataset(),19999998)+'\r\n';lockWorkspace(true);
 try{await project.saveExports([{path:name,text,replace:true}]);log('Saved '+name+' to '+project.directory.name+'.');}finally{lockWorkspace(false)}
});
let recovered=false;
try{const draft=JSON.parse(localStorage.getItem('sasita-program-draft'));if(draft&&typeof draft.code==='string'&&draft.code.length<=1000000&&typeof draft.name==='string'){setProgram(draft.code,draft.name);programDirty=true;updateProgramUI();recovered=true;}}catch{}
if(!recovered)setProgram('');
updateProjectUI();project.restore().then(updateProjectUI);
render();log(recovered?'NOTE: Recovered your editor draft; it has not been run or saved to disk.':'Ready. Open a program or start typing.');
if(document.modelContext?.registerTool){try{Promise.resolve(document.modelContext.registerTool({name:'run_data_step',title:'Run DATA step',description:'Replace the visible program and execute the supported SAS DATA step subset against the current WORK datasets. Updates datasets and results on success.',inputSchema:{type:'object',properties:{code:{type:'string'}},required:['code'],additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:true},execute:async input=>{if(!input||typeof input.code!=='string'||Object.keys(input).some(k=>k!=='code'))throw new Error('Provide code as a string');$('code').value=input.code;lines();programDirty=input.code!==programBaseline;updateProgramUI();rememberDraft();return await execute(input.code)}})).catch(()=>{})}catch{}}
