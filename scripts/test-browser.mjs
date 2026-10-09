// Exercise the real UI and worker in Chromium without third-party packages.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {run,csv} from '../dist/engine.mjs';
import {spawn,spawnSync} from 'node:child_process';
import {mkdtemp, readFile, rm, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join, resolve, extname} from 'node:path';
import {createServer} from 'node:http';
import {setTimeout as delay} from 'node:timers/promises';

const root=resolve('dist');
const server=createServer(async(req,res)=>{
  try {
    const path=resolve(root,'.'+new URL(req.url,'http://localhost').pathname);
    if(!path.startsWith(root+'/')) {res.writeHead(403).end();return;}
    const data=await readFile(path);
    res.setHeader('Content-Type',({'.html':'text/html','.mjs':'text/javascript','.js':'text/javascript','.css':'text/css','.png':'image/png'})[extname(path)]||'application/octet-stream');
    res.end(data);
  } catch {res.writeHead(404).end();}
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const profile=await mkdtemp(join(tmpdir(),'sasita-browser-'));
const browser=spawn(process.env.CHROME_BIN||'chromium',[
  '--headless','--no-sandbox','--disable-dev-shm-usage','--no-first-run',
  '--remote-debugging-address=127.0.0.1','--remote-debugging-port=0',`--user-data-dir=${profile}`,'about:blank'
],{stdio:['ignore','ignore','pipe']});
let launchError; browser.on('error',e=>{launchError=e;});
let diagnostics='';browser.stderr.on('data',b=>{diagnostics=(diagnostics+b).slice(-4000);});
let socket;
try {
  let port;
  for(let i=0;i<100;i++) {
    if(launchError)throw launchError;
    if(browser.exitCode!==null)throw new Error('Chromium exited: '+diagnostics);
    try {port=(await readFile(join(profile,'DevToolsActivePort'),'utf8')).split('\n')[0];break;}catch{}
    await delay(100);
  }
  assert.ok(port,'Chromium debugging endpoint did not start');
  const target=await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`,{method:'PUT'})).json();
  socket=new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((r,j)=>{socket.addEventListener('open',r,{once:true});socket.addEventListener('error',j,{once:true});});
  let next=0;const pending=new Map();
  socket.addEventListener('message',event=>{
    const msg=JSON.parse(event.data),task=pending.get(msg.id);
    if(msg.method==='Page.javascriptDialogOpening')send('Page.handleJavaScriptDialog',{accept:true}).catch(()=>{});
    if(task){pending.delete(msg.id);clearTimeout(task.timer);msg.error?task.reject(new Error(JSON.stringify(msg.error))):task.resolve(msg.result);}
  });
  function send(method,params={}) {return new Promise((resolve,reject)=>{
    const id=++next,timer=setTimeout(()=>{pending.delete(id);reject(new Error('CDP timeout: '+method));},20000);
    pending.set(id,{resolve,reject,timer});socket.send(JSON.stringify({id,method,params}));
  });}
  async function evaluate(expression) {
    const r=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});
    if(r.exceptionDetails)throw new Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);
    return r.result.value;
  }
  async function waitFor(expression) {
    for(let i=0;i<120;i++){if(await evaluate(expression))return;await delay(100);}
    throw new Error('UI condition timed out: '+expression+'; page: '+JSON.stringify(await evaluate("({url:location.href,state:document.readyState,log:document.querySelector('#log')?.textContent,status:document.querySelector('#status')?.textContent})")));
  }
  await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride',{width:1400,height:900,deviceScaleFactor:1,mobile:false});
  const appSource=await readFile('dist/app.mjs','utf8');
  const samples=Function('return ('+appSource.match(/const examples=(\{[\s\S]*?\});/)[1]+')')();
  const expected={conversions:['converted',1],formats:['format_gallery',1],random:['random_sample',8],flags:['flagged',6],groups:['provider_totals',3],loop:['squares',12],split:['missing_payment',1],merge:['enriched',10],macro:['macro_flagged',6],macroloop:['above_3000',1]};
  for(const [label,url] of [
    ['modular',`http://127.0.0.1:${server.address().port}/index.html`],
    ['standalone',`http://127.0.0.1:${server.address().port}/data-step-lab.html`],
    ...(process.argv.includes('--file') ? [['offline file','file://'+resolve('dist/data-step-lab.html')]] : [])
  ]) {
    const navigation=await send('Page.navigate',{url});assert.ok(!navigation.errorText, JSON.stringify(navigation));
    await waitFor("document.querySelector('#run') && !document.querySelector('#run').disabled && document.querySelector('#status').textContent==='Ready' && document.querySelector('#log').textContent.length>0");
    for(const [example,[dataset,rows]] of Object.entries(expected)) {
      await evaluate(`document.querySelector('#code').value=${JSON.stringify(samples[example])};document.querySelector('#code').dispatchEvent(new Event('input'));document.querySelector('#run').click()`);
      await waitFor("document.querySelector('#run') && !document.querySelector('#run').disabled");
      const result=await evaluate("({name:document.querySelector('#resulttitle').textContent,count:document.querySelector('#rowcount').textContent,log:document.querySelector('#log').textContent})");
      assert.equal(result.name,dataset,`${label} ${example}: ${result.log}`);
      assert.ok(result.count.startsWith(`${rows} observations`),`${label} ${example}: ${result.count}`);
      assert.ok(result.log.includes('Completed'),result.log);
    }
    assert.ok((await evaluate("document.querySelector('#expandedview').textContent")).includes('data above_3000'));
    // Full-size panes, colored code, independent rolling histories and immutable snapshots.
    assert.equal(await evaluate("document.querySelectorAll('.workspacepane:not([hidden])').length"),1);
    assert.equal(await evaluate("document.querySelector('#workspaceoutputtab').getAttribute('aria-selected')"),'true');
    assert.ok((await evaluate("document.querySelector('#log').textContent")).includes('Run 1'));
    assert.ok(await evaluate("document.querySelector('#outputhistory').options.length>10"));
    await evaluate("document.querySelector('#workspaceprogramtab').click();document.querySelector('#programtab').click();document.querySelector('#code').value=\"data color; /* note */ text='<img src=x onerror=alert(1)>'; x=12; run;\";document.querySelector('#code').dispatchEvent(new Event('input'))");
    assert.ok(await evaluate("document.querySelector('#highlight .token.keyword')!==null && document.querySelector('#highlight .token.string')!==null && document.querySelector('#highlight .token.comment')!==null"));
    assert.equal(await evaluate("document.querySelector('#highlight img')!==null"),false);
    assert.ok(await evaluate("document.querySelector('#code').getBoundingClientRect().width>900"));
    assert.ok(await evaluate("document.querySelector('header .filebar #help')!==null && document.querySelector('main .filebar')===null"));
    assert.ok(await evaluate("document.querySelector('#code').getBoundingClientRect().height>650"));
    // Context follows the caret; browsing and insertion preserve surrounding source.
    await evaluate("document.querySelector('#code').value='proc sort data=claims; by provider; run;';document.querySelector('#code').setSelectionRange(20,20);document.querySelector('#syntaxhelp').click()");
    assert.equal(await evaluate("document.querySelector('#syntaxentry').value"),'sort');
    assert.ok(await evaluate("document.querySelector('#syntaxspec').textContent.includes('NODUPKEY')"));
    await evaluate("document.querySelector('#code').value='data x; y=sqrt(sum(';document.querySelector('#code').setSelectionRange(19,19);document.querySelector('#code').dispatchEvent(new Event('input'))");
    await waitFor("document.querySelector('#syntaxentry').value==='fn-sum'");
    await evaluate("document.querySelector('#syntaxsearch').value='substr';document.querySelector('#syntaxsearch').dispatchEvent(new Event('input'))");
    assert.equal(await evaluate("document.querySelector('#syntaxentry').options.length"),1);
    assert.equal(await evaluate("document.querySelector('#syntaxfollow').checked"),false);
    await evaluate("document.querySelector('#code').value='data x; value=; run;';document.querySelector('#code').setSelectionRange(14,14);document.querySelector('#syntaxinsert').click()");
    assert.equal(await evaluate("document.querySelector('#code').value"),'data x; value=substr("abcd",2,2); run;');
    assert.equal(await evaluate("document.querySelector('#programstate').textContent"),'Unsaved changes');
    await evaluate("document.querySelector('#syntaxsearch').value='';document.querySelector('#syntaxsearch').dispatchEvent(new Event('input'))");
    assert.equal(await evaluate("document.querySelector('#syntaxentry').options.length"),66);
    await evaluate("document.querySelector('#syntaxclose').click();document.querySelector('#code').value='proc sgplot data=x; histogram x /';document.querySelector('#code').setSelectionRange(32,32);document.querySelector('#code').dispatchEvent(new KeyboardEvent('keydown',{ctrlKey:true,code:'Space',key:' ',bubbles:true}))");
    assert.equal(await evaluate("document.querySelector('#syntaxentry').value"),'sgplot');
    assert.ok(await evaluate("!document.querySelector('#syntaxpanel').hidden && document.querySelector('#syntaxfollow').checked"));
    if(process.argv.includes('--screenshots')){const capture=await send('Page.captureScreenshot');await writeFile('/tmp/sassy-syntax-'+label+'.png',Buffer.from(capture.data,'base64'));}
    await evaluate("document.querySelector('#syntaxclose').click()");
    assert.ok(await evaluate("document.querySelector('#syntaxpanel').hidden && document.querySelector('#code').getBoundingClientRect().width>900"));
    if(process.argv.includes('--screenshots')){await send('Emulation.setDeviceMetricsOverride',{width:1400,height:900,deviceScaleFactor:1,mobile:false});const capture=await send('Page.captureScreenshot');await writeFile('/tmp/sassy-'+label+'.png',Buffer.from(capture.data,'base64'));}
    await evaluate("document.querySelector('#code').value='data snapshot; x=1; run;';document.querySelector('#run').click()");
    await waitFor("document.querySelector('#run') && !document.querySelector('#run').disabled");
    const firstSnapshot=await evaluate("document.querySelector('#outputhistory').value");
    await evaluate("document.querySelector('#code').value='data snapshot; x=2; run;';document.querySelector('#run').click()");
    await waitFor("document.querySelector('#run') && !document.querySelector('#run').disabled");
    await evaluate(`document.querySelector('#outputhistory').value=${JSON.stringify(firstSnapshot)};document.querySelector('#outputhistory').dispatchEvent(new Event('change'))`);
    assert.equal(await evaluate("document.querySelector('#table tbody td:nth-child(2)').textContent"),'1');
    const historyCount=await evaluate("document.querySelector('#outputhistory').options.length");
    await evaluate("document.querySelector('#workspacelogtab').click();document.querySelector('#clearlog').click()");
    assert.equal(await evaluate("document.querySelector('#log').textContent"),'');
    assert.equal(await evaluate("document.querySelector('#outputhistory').options.length"),historyCount);
    const workBeforeClear=await evaluate("document.querySelector('#datasets').textContent");
    await evaluate("document.querySelector('#workspaceoutputtab').click();document.querySelector('#clearoutput').click()");
    assert.equal(await evaluate("document.querySelector('#outputhistory').options.length"),1);
    assert.equal(await evaluate("document.querySelector('#datasets').textContent"),workBeforeClear);
    await evaluate("document.querySelector('#code').value='data snapshot; x=3; run;';document.querySelector('#run').click()");
    await waitFor("document.querySelector('#run') && !document.querySelector('#run').disabled");
    assert.match(await evaluate("document.querySelector('#log').textContent"),/Completed/);
    assert.equal(await evaluate("document.querySelector('#outputhistory').options.length"),2);
    console.log(`${label}: tabbed workspace, offline SAS colors, rolling output/log, independent clears and snapshot preservation passed`);
    // Export from the REAL browser build, extract, and execute the Python bridge.
    await evaluate("document.querySelector('#code').value='data portable_result; set snapshot; square=x*x; run;';document.querySelector('#codeexport').click();document.querySelector('#portablefile').value='runtime/engine.mjs';document.querySelector('#portablefile').dispatchEvent(new Event('change'))");
    assert.equal(await evaluate("document.querySelector('#portablesource').textContent"),await readFile('dist/engine.mjs','utf8'));
    await evaluate("window.__portableZip=null;window.__portableClick=HTMLAnchorElement.prototype.click;HTMLAnchorElement.prototype.click=function(){if(this.download==='Sassy-portable-v0.4.6.zip'){fetch(this.href).then(r=>r.blob()).then(blob=>{const reader=new FileReader();reader.onload=()=>window.__portableZip=reader.result;reader.readAsDataURL(blob);});}else window.__portableClick.call(this);};document.querySelector('#downloadportable').click()");
    await waitFor("window.__portableZip!==null");
    const portableDownload=await evaluate("window.__portableZip");
    const zipPath=join(profile,'portable-'+label+'.zip'),packagePath=join(profile,'portable-'+label);
    await writeFile(zipPath,Buffer.from(portableDownload.split(',')[1],'base64'));
    const extracted=spawnSync('python3',['-c','import sys,zipfile; z=zipfile.ZipFile(sys.argv[1]); assert z.testzip() is None; z.extractall(sys.argv[2])',zipPath,packagePath],{encoding:'utf8'});
    assert.equal(extracted.status,0,extracted.stderr);
    const wrapped=spawnSync('python3',[join(packagePath,'run.py')],{encoding:'utf8',maxBuffer:10000000,timeout:35000});assert.equal(wrapped.status,0,wrapped.stderr);
    assert.deepEqual(JSON.parse(JSON.parse(wrapped.stdout).tables.portable_result).rows,[{x:3,square:9}]);
    assert.ok(await evaluate("document.querySelector('#portablestatus').textContent.includes('Downloaded')"));
    if(process.argv.includes('--screenshots')){const shot=await send('Page.captureScreenshot');await writeFile('/tmp/sassy-portable-'+label+'.png',Buffer.from(shot.data,'base64'));}
    await evaluate("HTMLAnchorElement.prototype.click=window.__portableClick;document.querySelector('#closeportable').click()");
    console.log(`${label}: actual-source viewer and downloaded ZIP executed through Python/Node passed`);
    // Chart.js renders all five types; history keeps data snapshots and PNG export.
    const chartCode=await readFile('examples/project-demo/charts-demo.sas','utf8');
    await evaluate(`document.querySelector('#code').value=${JSON.stringify(chartCode)};document.querySelector('#code').dispatchEvent(new Event('input'));document.querySelector('#run').click()`);
    await waitFor("document.querySelector('#run') && !document.querySelector('#run').disabled && document.querySelector('#chartcanvas canvas') && Chart.getChart(document.querySelector('#chartcanvas canvas'))?.width>500");
    assert.equal(await evaluate("document.querySelector('#status').textContent"),'Ready');
    assert.equal(await evaluate("Chart.getChart(document.querySelector('#chartcanvas canvas')).config.type"),'pie');
    assert.equal(await evaluate("Chart.getChart(document.querySelector('#chartcanvas canvas')).data.labels.length"),3);
    assert.equal(await evaluate("document.querySelector('#export').hidden"),true);
    const options=await evaluate("Array.from(document.querySelector('#outputhistory').options).map(o=>({id:o.value,label:o.textContent}))");
    const chooseChart=async text=>{const item=options.find(o=>o.label.includes(text));assert.ok(item,text);await evaluate(`document.querySelector('#outputhistory').value=${JSON.stringify(item.id)};document.querySelector('#outputhistory').dispatchEvent(new Event('change'))`);await waitFor("Chart.getChart(document.querySelector('#chartcanvas canvas'))?.width>500");return item.id;};
    await chooseChart('Distribution of calculated values');
    assert.equal(await evaluate("Chart.getChart(document.querySelector('#chartcanvas canvas')).data.datasets[0].data.reduce((n,v)=>n+v,0)"),120);
    assert.equal(await evaluate("Chart.getChart(document.querySelector('#chartcanvas canvas')).data.labels.length"),12);
    await chooseChart('Total amount by category');
    assert.equal(await evaluate("Chart.getChart(document.querySelector('#chartcanvas canvas')).options.indexAxis"),'y');
    await chooseChart('Mean amount by category');
    assert.equal(await evaluate("Chart.getChart(document.querySelector('#chartcanvas canvas')).options.indexAxis"),'x');
    const scatterId=await chooseChart('Values by category');
    assert.equal(await evaluate("Chart.getChart(document.querySelector('#chartcanvas canvas')).config.type"),'scatter');
    assert.equal(await evaluate("Chart.getChart(document.querySelector('#chartcanvas canvas')).data.datasets.reduce((n,s)=>n+s.data.length,0)"),120);
    const png=await evaluate("(()=>{let href='';const click=HTMLAnchorElement.prototype.click;HTMLAnchorElement.prototype.click=function(){href=this.href};try{document.querySelector('#downloadchart').click();return href;}finally{HTMLAnchorElement.prototype.click=click;}})()");
    assert.ok(png.startsWith('data:image/png;base64,'));assert.ok(png.length>10000);assert.equal(Buffer.from(png.split(',')[1],'base64').subarray(0,8).toString('hex'),'89504e470d0a1a0a');
    assert.ok(Buffer.from(png.split(',')[1],'base64').readUInt32BE(20)>await evaluate("document.querySelector('#chartcanvas canvas').height"));
    if(process.argv.includes('--screenshots'))await writeFile('/tmp/sassy-chart-export-'+label+'.png',Buffer.from(png.split(',')[1],'base64'));
    if(process.argv.includes('--screenshots')){const capture=await send('Page.captureScreenshot');await writeFile('/tmp/sassy-charts-'+label+'.png',Buffer.from(capture.data,'base64'));}
    await evaluate("document.querySelector('#code').value='data chart_sample;x=999;y=999;run;';document.querySelector('#run').click()");
    await waitFor("document.querySelector('#run') && !document.querySelector('#run').disabled");
    await evaluate(`document.querySelector('#outputhistory').value=${JSON.stringify(scatterId)};document.querySelector('#outputhistory').dispatchEvent(new Event('change'))`);
    assert.equal(await evaluate("Chart.getChart(document.querySelector('#chartcanvas canvas')).data.datasets.reduce((n,s)=>n+s.data.length,0)"),120);
    const chartHistoryBeforeFailure=await evaluate("document.querySelector('#outputhistory').options.length");
    const workBeforeChartFailure=await evaluate("document.querySelector('#datasets').textContent");
    await evaluate("document.querySelector('#code').value='data chart_should_not_commit;x=1;run;proc sgplot data=chart_should_not_commit;scatter x=x y=missing_variable;run;';document.querySelector('#run').click()");
    await waitFor("document.querySelector('#run') && !document.querySelector('#run').disabled");
    assert.equal(await evaluate("document.querySelector('#status').textContent"),'Error');
    assert.equal(await evaluate("document.querySelector('#outputhistory').options.length"),chartHistoryBeforeFailure);
    assert.equal(await evaluate("document.querySelector('#datasets').textContent"),workBeforeChartFailure);
    const chartLogBeforeClear=await evaluate("document.querySelector('#log').textContent");
    await evaluate("document.querySelector('#workspaceoutputtab').click();document.querySelector('#clearoutput').click()");
    assert.equal(await evaluate("Object.keys(Chart.instances).length"),0);
    assert.equal(await evaluate("document.querySelector('#outputhistory').options.length"),1);
    assert.equal(await evaluate("document.querySelector('#log').textContent"),chartLogBeforeClear);
    console.log(`${label}: five Chart.js plots, bin counts, PNG export, chart snapshots, instance cleanup and failed-chart rollback passed`);
    // Open the reference in the real browser, including new conversion/RAND help.
    await evaluate("document.querySelector('#help').click()");
    assert.ok((await evaluate("document.querySelector('#helpdialog').textContent")).includes('CALL STREAMINIT'));
    await evaluate("document.querySelector('#closehelp').click()");
    await evaluate("document.querySelector('#workspaceprogramtab').click();document.querySelector('#expandedtab').click()");
    assert.equal(await evaluate("document.querySelector('#expandedview').hidden"),false);
    if(process.argv.includes('--validation')||process.argv.includes('--large-numbers')) {
      for(const [folder,file] of [
        ...(process.argv.includes('--validation')?['01-calculations.sas','02-merge.sas'].map(file=>['validation',file]):[]),
        ...(process.argv.includes('--large-numbers')?[['large-numbers','04-large-numbers.sas']]:[])
      ]) {
        const code=await readFile(`examples/${folder}/${file}`,'utf8');
        const reference=run(code,{});
        await evaluate(`document.querySelector('#code').value=${JSON.stringify(code)};document.querySelector('#run').click()`);
        await waitFor("document.querySelector('#run') && !document.querySelector('#run').disabled");
        assert.match(await evaluate("document.querySelector('#log').textContent"),/Completed/);
        const names=folder==='large-numbers'?['big_number_results','big_integer_edges']:file.startsWith('01')?['numeric_inputs','numeric_results','numeric_summary']:['merge_results','merge_summary','shared_results'];
        for(const name of names) {
          await evaluate(`Array.from(document.querySelectorAll('#datasets button')).find(b=>b.querySelector('strong').textContent===${JSON.stringify(name)}).click()`);
          const hash=await evaluate(`(async()=>{let blob;const original=URL.createObjectURL,click=HTMLAnchorElement.prototype.click;URL.createObjectURL=value=>{blob=value;return original(value)};HTMLAnchorElement.prototype.click=function(){};try{document.querySelector('#export').click();return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',await blob.arrayBuffer()))).map(x=>x.toString(16).padStart(2,'0')).join('');}finally{URL.createObjectURL=original;HTMLAnchorElement.prototype.click=click;}})()`);
          assert.equal(hash,createHash('sha256').update(csv(reference.datasets[name])).digest('hex'),`${label} ${name}: full CSV export`);
        }
        console.log(`${label}: ${file} completed within app timeout; all result CSVs match engine`);
      }
    }
    // Native browser sandbox handles stand in for an OS picker. This exercises
    // actual streams/IndexedDB; OS picker and grant dialogs require manual testing.
    await evaluate(`(async()=>{
      const root=await navigator.storage.getDirectory();
      const folder=await root.getDirectoryHandle('sasita-project-test',{create:true});
      const inputs=await folder.getDirectoryHandle('inputs',{create:true});
      await folder.getDirectoryHandle('outputs',{create:true});
      const file=await inputs.getFileHandle('source.csv',{create:true});
      let writer=await file.createWritable();await writer.write('id,amount\\n1,10\\n2,20');await writer.close();
      const program=await folder.getFileHandle('saved.sas',{create:true});
      writer=await program.createWritable();await writer.write('data opened; x=1; run;');await writer.close();
      window.__projectTest=folder;window.__programTest=program;
      window.showDirectoryPicker=async()=>folder;
      window.showOpenFilePicker=async()=>[program];
      document.querySelector('#chooseproject').click();
    })()`);
    await waitFor("document.querySelector('#run') && !document.querySelector('#run').disabled && document.querySelector('#projectstatus').textContent.includes('Project: sasita-project-test')");
    await evaluate("document.querySelector('#openprogram').click()");
    await waitFor("document.querySelector('#run') && !document.querySelector('#run').disabled && document.querySelector('#programname').value==='saved.sas'");
    assert.equal(await evaluate("document.querySelector('#code').value"),'data opened; x=1; run;');
    await evaluate("document.querySelector('#code').value='data opened; x=2; run;';document.querySelector('#code').dispatchEvent(new Event('input'));document.querySelector('#saveprogram').click()");
    await waitFor("document.querySelector('#run') && !document.querySelector('#run').disabled && document.querySelector('#log').textContent.includes('Saved saved.sas')");
    assert.equal(await evaluate("(async()=>await (await window.__programTest.getFile()).text())()"),'data opened; x=2; run;');
    const projectCode="filename source 'inputs/source.csv';proc import datafile=source out=project_input dbms=csv replace;getnames=yes;guessingrows=max;run;data project_result;set project_input;doubled=amount*2;run;proc export data=project_result outfile='outputs/result.csv' dbms=csv replace;run;";
    await evaluate(`document.querySelector('#code').value=${JSON.stringify(projectCode)};document.querySelector('#code').dispatchEvent(new Event('input'));document.querySelector('#run').click()`);
    await waitFor("document.querySelector('#run') && !document.querySelector('#run').disabled");
    assert.match(await evaluate("document.querySelector('#log').textContent"),/Completed/);
    const savedProjectCSV=await evaluate("(async()=>await (await (await (await window.__projectTest.getDirectoryHandle('outputs')).getFileHandle('result.csv')).getFile()).text())()");
    assert.equal(savedProjectCSV,'"id","amount","doubled"\r\n"1","10","20"\r\n"2","20","40"\r\n');
    // No REPLACE: existing disk output remains intact and WORK rolls back.
    const projectBefore=await evaluate("document.querySelector('#datasets').textContent");
    await evaluate(`document.querySelector('#code').value="data should_not_commit; x=3; run;proc export data=should_not_commit outfile='outputs/result.csv' dbms=csv;run;";document.querySelector('#run').click()`);
    await waitFor("document.querySelector('#run') && !document.querySelector('#run').disabled");
    assert.match(await evaluate("document.querySelector('#log').textContent"),/add REPLACE/);
    assert.equal(await evaluate("document.querySelector('#datasets').textContent"),projectBefore);
    assert.equal(await evaluate("(async()=>await (await (await (await window.__projectTest.getDirectoryHandle('outputs')).getFileHandle('result.csv')).getFile()).text())()"),savedProjectCSV);
    // A later program error must not create an earlier prepared export.
    await evaluate(`document.querySelector('#code').value="data pending; x=1; run;proc export data=pending outfile='outputs/not_written.csv' dbms=csv;run;data broken;bad_statement;run;";document.querySelector('#run').click()`);
    await waitFor("document.querySelector('#run') && !document.querySelector('#run').disabled");
    assert.equal(await evaluate("(async()=>{try{await (await window.__projectTest.getDirectoryHandle('outputs')).getFileHandle('not_written.csv');return true}catch(e){if(e.name==='NotFoundError')return false;throw e}})()"),false);
    // Permanent native tables: real sandbox disk writes, metadata and later-session reads.
    await evaluate("(async()=>{await window.__projectTest.getDirectoryHandle('tables',{create:true})})()");
    const libraryCode="libname saved 'tables';data saved.persist;length label $ 4;format amount comma12.2;do id=1 to 2;amount=id/3;label='abcdef';output;end;run;";
    await evaluate(`document.querySelector('#code').value=${JSON.stringify(libraryCode)};document.querySelector('#code').dispatchEvent(new Event('input'));document.querySelector('#run').click()`);
    await waitFor("document.querySelector('#run') && !document.querySelector('#run').disabled");
    assert.equal(await evaluate("document.querySelector('#status').textContent"),'Ready');
    const nativeText=await evaluate("(async()=>await (await (await (await window.__projectTest.getDirectoryHandle('tables')).getFileHandle('persist.sassy-table.json')).getFile()).text())()");
    const native=JSON.parse(nativeText);assert.equal(native.format,'sassy-table');assert.equal(native.version,1);assert.equal(native.rows[0].amount,1/3);assert.equal(native.rows[0].label,'abcd');assert.equal(native.columns.find(c=>c.name==='label').length,4);assert.equal(native.columns.find(c=>c.name==='amount').format,'comma12.2');
    assert.ok(await evaluate("Array.from(document.querySelectorAll('#datasets strong')).some(n=>n.textContent==='saved.persist')"));
    if(process.argv.includes('--screenshots')){const capture=await send('Page.captureScreenshot');await writeFile('/tmp/sassy-libraries-'+label+'.png',Buffer.from(capture.data,'base64'));}
    assert.ok(await evaluate("document.querySelector('.brandlogo').complete && document.querySelector('.brandlogo').naturalWidth>0"));
    await evaluate("document.querySelector('#code').value='data restored_native;set saved.persist;run;';document.querySelector('#run').click()");
    await waitFor("document.querySelector('#run') && !document.querySelector('#run').disabled");
    assert.equal(await evaluate("document.querySelector('#resulttitle').textContent"),'restored_native');
    assert.ok((await evaluate("document.querySelector('#table').textContent")).includes('abcd'));
    // A failure after a native table has been prepared leaves its old disk file intact.
    await evaluate("document.querySelector('#code').value='data saved.persist;amount=999;run;data bad;unsupported;run;';document.querySelector('#run').click()");
    await waitFor("document.querySelector('#run') && !document.querySelector('#run').disabled");
    assert.equal(await evaluate("document.querySelector('#status').textContent"),'Error');
    assert.equal(await evaluate("(async()=>await (await (await (await window.__projectTest.getDirectoryHandle('tables')).getFileHandle('persist.sassy-table.json')).getFile()).text())()"),nativeText);
    console.log(`${label}: LIBNAME native writes, typed descriptors, later-run disk reads and failed-write rollback passed`);
    // Remembered native handle survives reload; cached code is not auto-executed.
    await send('Page.reload');
    await waitFor("document.querySelector('#run') && !document.querySelector('#run').disabled && document.querySelector('#log').textContent.includes('Recovered') && document.querySelector('#projectstatus').textContent.includes('Project: sasita-project-test')");
    assert.ok((await evaluate("document.querySelector('#code').value")).includes('unsupported'));
    await evaluate("document.querySelector('#code').value=\"libname saved 'tables';data from_new_session;set saved.persist;run;\";document.querySelector('#run').click()");
    await waitFor("document.querySelector('#run') && !document.querySelector('#run').disabled");
    assert.equal(await evaluate("document.querySelector('#resulttitle').textContent"),'from_new_session');
    assert.ok((await evaluate("document.querySelector('#table').textContent")).includes('abcd'));
    await evaluate("document.querySelector('#forgetproject').click()");
    await waitFor("document.querySelector('#run') && !document.querySelector('#run').disabled && document.querySelector('#projectstatus').textContent.includes('Choose a folder')");
    console.log(`${label}: program open/direct save, native project streams, staged export rollback, overwrite guard, remembered folder and draft recovery passed`);
    // Import through the actual file input and form.
    await evaluate(`(()=>{const transfer=new DataTransfer();transfer.items.add(new File(['id,amount\\n1,10\\n2,20'],'browser_input.csv',{type:'text/csv'}));const input=document.querySelector('#file');input.files=transfer.files;input.dispatchEvent(new Event('change'));document.querySelector('#importform').requestSubmit();})()`);
    await waitFor("document.querySelector('#log').textContent.includes('Imported WORK.BROWSER_INPUT')");
    assert.ok((await evaluate("document.querySelector('#rowcount').textContent")).startsWith('2 observations'));
    // Capture the browser-generated download and check raw CSV contents.
    const exported=await evaluate(`(async()=>{let blob;const original=URL.createObjectURL,click=HTMLAnchorElement.prototype.click;URL.createObjectURL=value=>{blob=value;return original(value)};HTMLAnchorElement.prototype.click=function(){};try{document.querySelector('#export').click();return await blob.text();}finally{URL.createObjectURL=original;HTMLAnchorElement.prototype.click=click;}})()`);
    assert.equal(exported, '\"id\",\"amount\"\r\n\"1\",\"10\"\r\n\"2\",\"20\"');
    const outputBeforeFailure=await evaluate("document.querySelector('#outputhistory').options.length");
    const before=await evaluate("document.querySelector('#datasets').textContent");
    await evaluate("document.querySelector('#code').value='data should_not_exist; x=1; run; data broken; unknown_statement; run;';document.querySelector('#run').click()");
    await waitFor("document.querySelector('#run') && !document.querySelector('#run').disabled");
    assert.match(await evaluate("document.querySelector('#log').textContent"),/No dataset changes were committed/);
    assert.equal(await evaluate("document.querySelector('#datasets').textContent"),before);
    assert.equal(await evaluate("document.querySelector('#outputhistory').options.length"),outputBeforeFailure);
    assert.equal(await evaluate("document.querySelector('#workspacelogtab').getAttribute('aria-selected')"),'true');
    console.log(`${label}: ten examples, expanded code, CSV import/export, failed-run rollback passed`);
  }
  console.log('Browser checks passed in '+await evaluate('navigator.userAgent'));
} finally {
  socket?.close();
  if(browser.exitCode===null&&!launchError){const exited=new Promise(r=>browser.once('exit',r));browser.kill();await exited;}
  await new Promise(r=>server.close(r));
  await rm(profile,{recursive:true,force:true,maxRetries:10,retryDelay:100});
}
