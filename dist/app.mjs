import {parseCSV,csv,display} from './engine.mjs';
const $=id=>document.getElementById(id);
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
   MT32 integer core is verified; SAS RAND sequences are unverified. */
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
function lines(){let n=$('code').value.split('\n').length;$('lines').textContent=Array.from({length:n},(_,i)=>i+1).join('\n');$('linecount').textContent=n+' lines'}
function render(){let list=$('datasets');list.replaceChildren();$('datasetcount').textContent=Object.keys(datasets).length;for(let [name,ds]of Object.entries(datasets)){let b=el('button',undefined,'dataset'+(name===selected?' active':''));b.append(el('strong',name),el('small',`${ds.rows.length.toLocaleString()} rows · ${ds.columns.length} variables`));b.onclick=()=>{selected=name;page=0;render()};list.append(b)}
 let ds=datasets[selected];$('resulttitle').textContent=ds?selected:'Results';$('export').disabled=!ds;$('rowcount').textContent=ds?`${ds.rows.length.toLocaleString()} observations · ${ds.columns.length} variables`:'';$('table').replaceChildren();if(!ds||!ds.rows.length){$('table').append(el('div',ds?'This dataset has no observations.':'Run a program to see results.','empty'))}else{let table=el('table'),head=el('thead'),tr=el('tr');tr.append(el('th','#'));for(let c of ds.columns)tr.append(el('th',c));head.append(tr);table.append(head);let body=el('tbody');for(let [idx,r]of ds.rows.slice(page*50,page*50+50).entries()){let tr=el('tr');tr.append(el('td',page*50+idx+1,'rownum'));for(let c of ds.columns){let val=r[c],td=el('td',display(val,$('formatted').checked?ds.formats[c]:null),typeof val==='number'?'numeric':undefined);td.title='Raw: '+(val??'.');tr.append(td)}body.append(tr)}table.append(body);$('table').append(table)}let total=ds?.rows.length||0;$('pageinfo').textContent=total?`${page*50+1}–${Math.min(page*50+50,total)} of ${total.toLocaleString()}`:'0 observations';$('prev').disabled=page===0;$('next').disabled=(page+1)*50>=total;
}
function log(msg,error=false){$('log').textContent=msg;$('log').classList.toggle('error',error);$('status').textContent=error?'Error':'Ready';$('status').style.color=error?'#b33c47':'#137e72'}
function execute(code=$('code').value){if(busy)return Promise.reject(new Error('A program is already running'));busy=true;$('run').disabled=true;$('status').textContent='Running…';let start=performance.now();return new Promise((resolve,reject)=>{let w=new Worker('worker.mjs',{type:'module'}),timer;const finish=()=>{clearTimeout(timer);w.terminate();busy=false;$('run').disabled=false};const error=message=>{finish();log('ERROR: '+message+'\nNo dataset changes were committed.',true);reject(new Error(message))};timer=setTimeout(()=>error('Execution exceeded 8 seconds. Reduce the data or loop size.'),8000);w.onerror=()=>error('The execution worker could not run. Try reopening the page.');w.onmessage=({data})=>{if(data.expanded!==undefined)$('expandedview').textContent=data.expanded;if(!data.ok){error(data.error);return}finish();$('expandedview').textContent=data.result.expanded;datasets=data.result.datasets;selected=data.result.written.at(-1)||selected;page=0;render();let elapsed=((performance.now()-start)/1000).toFixed(2);log(data.result.logs.join('\n')+`\nNOTE: Completed in ${elapsed}s. All processing stayed in this browser.`);resolve({written:data.result.written,observations:Object.fromEntries(data.result.written.map(n=>[n,datasets[n].rows.length]))})};w.postMessage({code,datasets})})}
function view(expanded){$('codeview').hidden=expanded;$('expandedview').hidden=!expanded;$('programtab').setAttribute('aria-selected',String(!expanded));$('expandedtab').setAttribute('aria-selected',String(expanded));$('programtab').tabIndex=expanded?-1:0;$('expandedtab').tabIndex=expanded?0:-1;}
$('programtab').onclick=()=>view(false);$('expandedtab').onclick=()=>view(true);for(let id of ['programtab','expandedtab'])$(id).onkeydown=e=>{if(['ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();let expanded=id==='programtab';view(expanded);$(expanded?'expandedtab':'programtab').focus()}};
$('run').onclick=()=>execute().catch(()=>{});$('load').onclick=()=>{$('code').value=examples[$('examples').value];lines();view(false);log('Example loaded. Run the program to update results.')};$('code').oninput=lines;$('code').onscroll=()=>{$('lines').scrollTop=$('code').scrollTop};$('code').onkeydown=e=>{if(e.key==='Tab'){e.preventDefault();let a=e.target.selectionStart,b=e.target.selectionEnd;e.target.setRangeText('    ',a,b,'end');lines()}};document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key==='Enter'){e.preventDefault();execute().catch(()=>{})}});
$('prev').onclick=()=>{page--;render()};$('next').onclick=()=>{page++;render()};$('formatted').onchange=render;
$('help').onclick=()=>$('helpdialog').showModal();$('closehelp').onclick=()=>$('helpdialog').close();$('import').onclick=()=>$('file').click();$('file').onchange=()=>{let file=$('file').files[0];if(!file)return;pendingFile=file;$('filename').textContent=file.name;$('importname').value=file.name.replace(/\.csv$/i,'').replace(/[^a-z0-9_]/gi,'_').replace(/^(?=\d)/,'_').toLowerCase()||'imported';$('importdialog').showModal();$('file').value=''};$('closeimport').onclick=()=>$('importdialog').close();$('importform').onsubmit=async e=>{e.preventDefault();if(busy){log('ERROR: Wait for the program to finish before importing.',true);return}try{if(pendingFile.size>20000000)throw new Error('CSV import limit is 20 MB');let name=$('importname').value.toLowerCase();if(!/^[a-z_]\w*$/.test(name))throw new Error('Use a valid SAS dataset name');let ds=parseCSV(await pendingFile.text());datasets[name]=ds;selected=name;page=0;render();$('importdialog').close();log(`NOTE: Imported WORK.${name.toUpperCase()}: ${ds.rows.length} observations, ${ds.columns.length} variables.`)}catch(e){log('ERROR: '+e.message,true)}};
$('export').onclick=()=>{let blob=new Blob([csv(datasets[selected])],{type:'text/csv;charset=utf-8'}),url=URL.createObjectURL(blob),a=el('a');a.href=url;a.download=selected+'.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)};
$('code').value=examples.flags;lines();render();execute().catch(()=>{});
if(document.modelContext?.registerTool){try{Promise.resolve(document.modelContext.registerTool({name:'run_data_step',title:'Run DATA step',description:'Replace the visible program and execute the supported SAS DATA step subset against the current WORK datasets. Updates datasets and results on success.',inputSchema:{type:'object',properties:{code:{type:'string'}},required:['code'],additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:true},execute:async input=>{if(!input||typeof input.code!=='string'||Object.keys(input).some(k=>k!=='code'))throw new Error('Provide code as a string');$('code').value=input.code;lines();return await execute(input.code)}})).catch(()=>{})}catch{}}
