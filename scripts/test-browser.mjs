// Exercise the real UI and worker in Chromium without third-party packages.
import assert from 'node:assert/strict';
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
  await rm(profile,{recursive:true,force:true});
}
