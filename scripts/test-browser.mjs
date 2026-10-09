// Exercise the real UI and worker in Chromium without third-party packages.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {run,csv} from '../dist/engine.mjs';
import {spawn} from 'node:child_process';
import {mkdtemp, readFile, rm} from 'node:fs/promises';
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
    res.setHeader('Content-Type',({'.html':'text/html','.mjs':'text/javascript','.css':'text/css'})[extname(path)]||'application/octet-stream');
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
  const expected={conversions:['converted',1],formats:['format_gallery',1],random:['random_sample',8],flags:['flagged',6],groups:['provider_totals',3],loop:['squares',12],split:['missing_payment',1],merge:['enriched',10],macro:['macro_flagged',6],macroloop:['above_3000',1]};
  for(const [label,url] of [
    ['modular',`http://127.0.0.1:${server.address().port}/index.html`],
    ['standalone',`http://127.0.0.1:${server.address().port}/data-step-lab.html`],
    ...(process.argv.includes('--file') ? [['offline file','file://'+resolve('dist/data-step-lab.html')]] : [])
  ]) {
    const navigation=await send('Page.navigate',{url});assert.ok(!navigation.errorText, JSON.stringify(navigation));
    await waitFor("document.querySelector('#run') && !document.querySelector('#run').disabled && document.querySelector('#log').textContent.includes('Completed')");
    for(const [example,[dataset,rows]] of Object.entries(expected)) {
      await evaluate(`document.querySelector('#examples').value=${JSON.stringify(example)};document.querySelector('#load').click();document.querySelector('#run').click()`);
      await waitFor("!document.querySelector('#run').disabled");
      const result=await evaluate("({name:document.querySelector('#resulttitle').textContent,count:document.querySelector('#rowcount').textContent,log:document.querySelector('#log').textContent})");
      assert.equal(result.name,dataset,`${label} ${example}: ${result.log}`);
      assert.ok(result.count.startsWith(`${rows} observations`),`${label} ${example}: ${result.count}`);
      assert.ok(result.log.includes('Completed'),result.log);
    }
    assert.ok((await evaluate("document.querySelector('#expandedview').textContent")).includes('data above_3000'));
    // Open the reference in the real browser, including new conversion/RAND help.
    await evaluate("document.querySelector('#help').click()");
    assert.ok((await evaluate("document.querySelector('#helpdialog').textContent")).includes('CALL STREAMINIT'));
    await evaluate("document.querySelector('#closehelp').click()");
    await evaluate("document.querySelector('#expandedtab').click()");
    assert.equal(await evaluate("document.querySelector('#expandedview').hidden"),false);
    if(process.argv.includes('--validation')||process.argv.includes('--large-numbers')) {
      for(const [folder,file] of [
        ...(process.argv.includes('--validation')?['01-calculations.sas','02-merge.sas'].map(file=>['validation',file]):[]),
        ...(process.argv.includes('--large-numbers')?[['large-numbers','04-large-numbers.sas']]:[])
      ]) {
        const code=await readFile(`examples/${folder}/${file}`,'utf8');
        const reference=run(code,{});
        await evaluate(`document.querySelector('#code').value=${JSON.stringify(code)};document.querySelector('#run').click()`);
        await waitFor("!document.querySelector('#run').disabled");
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
    await waitFor("!document.querySelector('#run').disabled && document.querySelector('#projectstatus').textContent.includes('Project: sasita-project-test')");
    await evaluate("document.querySelector('#openprogram').click()");
    await waitFor("!document.querySelector('#run').disabled && document.querySelector('#programname').value==='saved.sas'");
    assert.equal(await evaluate("document.querySelector('#code').value"),'data opened; x=1; run;');
    await evaluate("document.querySelector('#code').value='data opened; x=2; run;';document.querySelector('#code').dispatchEvent(new Event('input'));document.querySelector('#saveprogram').click()");
    await waitFor("!document.querySelector('#run').disabled && document.querySelector('#log').textContent.includes('Saved saved.sas')");
    assert.equal(await evaluate("(async()=>await (await window.__programTest.getFile()).text())()"),'data opened; x=2; run;');
    const projectCode="filename source 'inputs/source.csv';proc import datafile=source out=project_input dbms=csv replace;getnames=yes;guessingrows=max;run;data project_result;set project_input;doubled=amount*2;run;proc export data=project_result outfile='outputs/result.csv' dbms=csv replace;run;";
    await evaluate(`document.querySelector('#code').value=${JSON.stringify(projectCode)};document.querySelector('#code').dispatchEvent(new Event('input'));document.querySelector('#run').click()`);
    await waitFor("!document.querySelector('#run').disabled");
    assert.match(await evaluate("document.querySelector('#log').textContent"),/Completed/);
    const savedProjectCSV=await evaluate("(async()=>await (await (await (await window.__projectTest.getDirectoryHandle('outputs')).getFileHandle('result.csv')).getFile()).text())()");
    assert.equal(savedProjectCSV,'"id","amount","doubled"\r\n"1","10","20"\r\n"2","20","40"\r\n');
    // No REPLACE: existing disk output remains intact and WORK rolls back.
    const projectBefore=await evaluate("document.querySelector('#datasets').textContent");
    await evaluate(`document.querySelector('#code').value="data should_not_commit; x=3; run;proc export data=should_not_commit outfile='outputs/result.csv' dbms=csv;run;";document.querySelector('#run').click()`);
    await waitFor("!document.querySelector('#run').disabled");
    assert.match(await evaluate("document.querySelector('#log').textContent"),/add REPLACE/);
    assert.equal(await evaluate("document.querySelector('#datasets').textContent"),projectBefore);
    assert.equal(await evaluate("(async()=>await (await (await (await window.__projectTest.getDirectoryHandle('outputs')).getFileHandle('result.csv')).getFile()).text())()"),savedProjectCSV);
    // A later program error must not create an earlier prepared export.
    await evaluate(`document.querySelector('#code').value="data pending; x=1; run;proc export data=pending outfile='outputs/not_written.csv' dbms=csv;run;data broken;bad_statement;run;";document.querySelector('#run').click()`);
    await waitFor("!document.querySelector('#run').disabled");
    assert.equal(await evaluate("(async()=>{try{await (await window.__projectTest.getDirectoryHandle('outputs')).getFileHandle('not_written.csv');return true}catch(e){if(e.name==='NotFoundError')return false;throw e}})()"),false);
    // Remembered native handle survives reload; cached code is not auto-executed.
    await send('Page.reload');
    await waitFor("!document.querySelector('#run').disabled && document.querySelector('#log').textContent.includes('Completed') && document.querySelector('#projectstatus').textContent.includes('Project: sasita-project-test')");
    assert.ok((await evaluate("document.querySelector('#code').value")).includes('bad_statement'));
    await evaluate("document.querySelector('#forgetproject').click()");
    await waitFor("!document.querySelector('#run').disabled && document.querySelector('#projectstatus').textContent.includes('Choose a folder')");
    console.log(`${label}: program open/direct save, native project streams, staged export rollback, overwrite guard, remembered folder and draft recovery passed`);
    // Import through the actual file input and form.
    await evaluate(`(()=>{const transfer=new DataTransfer();transfer.items.add(new File(['id,amount\\n1,10\\n2,20'],'browser_input.csv',{type:'text/csv'}));const input=document.querySelector('#file');input.files=transfer.files;input.dispatchEvent(new Event('change'));document.querySelector('#importform').requestSubmit();})()`);
    await waitFor("document.querySelector('#log').textContent.includes('Imported WORK.BROWSER_INPUT')");
    assert.ok((await evaluate("document.querySelector('#rowcount').textContent")).startsWith('2 observations'));
    // Capture the browser-generated download and check raw CSV contents.
    const exported=await evaluate(`(async()=>{let blob;const original=URL.createObjectURL,click=HTMLAnchorElement.prototype.click;URL.createObjectURL=value=>{blob=value;return original(value)};HTMLAnchorElement.prototype.click=function(){};try{document.querySelector('#export').click();return await blob.text();}finally{URL.createObjectURL=original;HTMLAnchorElement.prototype.click=click;}})()`);
    assert.equal(exported, '\"id\",\"amount\"\r\n\"1\",\"10\"\r\n\"2\",\"20\"');
    const before=await evaluate("document.querySelector('#datasets').textContent");
    await evaluate("document.querySelector('#code').value='data should_not_exist; x=1; run; data broken; unknown_statement; run;';document.querySelector('#run').click()");
    await waitFor("!document.querySelector('#run').disabled");
    assert.match(await evaluate("document.querySelector('#log').textContent"),/No dataset changes were committed/);
    assert.equal(await evaluate("document.querySelector('#datasets').textContent"),before);
    console.log(`${label}: ten examples, expanded code, CSV import/export, failed-run rollback passed`);
  }
  console.log('Browser checks passed in '+await evaluate('navigator.userAgent'));
} finally {
  socket?.close();
  if(browser.exitCode===null&&!launchError){const exited=new Promise(r=>browser.once('exit',r));browser.kill();await exited;}
  await new Promise(r=>server.close(r));
  await rm(profile,{recursive:true,force:true,maxRetries:10,retryDelay:100});
}
