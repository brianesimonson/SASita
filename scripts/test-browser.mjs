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
      await evaluate(`Array.from(document.querySelectorAll('#datasets button')).find(b=>b.querySelector('strong')?.textContent===${JSON.stringify(dataset)}).click()`);
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
    assert.ok(await evaluate("document.querySelector('#outputhistory').options.length===1"));
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
    assert.equal(await evaluate("document.querySelector('#syntaxentry').options.length"),70);
    await evaluate("document.querySelector('#syntaxclose').click();document.querySelector('#code').value='proc sgplot data=x; histogram x /';document.querySelector('#code').setSelectionRange(32,32);document.querySelector('#code').dispatchEvent(new KeyboardEvent('keydown',{ctrlKey:true,code:'Space',key:' ',bubbles:true}))");
    assert.equal(await evaluate("document.querySelector('#syntaxentry').value"),'sgplot');
    assert.ok(await evaluate("!document.querySelector('#syntaxpanel').hidden && document.querySelector('#syntaxfollow').checked"));
    if(process.argv.includes('--screenshots')){const capture=await send('Page.captureScreenshot');await writeFile('/tmp/sassy-syntax-'+label+'.png',Buffer.from(capture.data,'base64'));}
    await evaluate("document.querySelector('#syntaxclose').click()");
    assert.ok(await evaluate("document.querySelector('#syntaxpanel').hidden && document.querySelector('#code').getBoundingClientRect().width>900"));
    if(process.argv.includes('--screenshots')){await send('Emulation.setDeviceMetricsOverride',{width:1400,height:900,deviceScaleFactor:1,mobile:false});const capture=await send('Page.captureScreenshot');await writeFile('/tmp/sassy-'+label+'.png',Buffer.from(capture.data,'base64'));}
    await evaluate("document.querySelector('#code').value='data snapshot; x=1; run; proc means data=snapshot; var x; run;';document.querySelector('#run').click()");
    await waitFor("document.querySelector('#run') && !document.querySelector('#run').disabled");
    const firstSnapshot=await evaluate("document.querySelector('#outputhistory').value");
    await evaluate("document.querySelector('#code').value='data snapshot; x=2; run; proc means data=snapshot; var x; run;';document.querySelector('#run').click()");
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
    await evaluate("document.querySelector('#code').value='data snapshot; x=3; run; proc means data=snapshot; var x; run;';document.querySelector('#run').click()");
    await waitFor("document.querySelector('#run') && !document.querySelector('#run').disabled");
    assert.match(await evaluate("document.querySelector('#log').textContent"),/Completed/);
    assert.equal(await evaluate("document.querySelector('#outputhistory').options.length"),2);
    console.log(`${label}: tabbed workspace, offline SAS colors, rolling output/log, independent clears and snapshot preservation passed`);
    // Completion reads descriptors, infers an unrun target and inserts ordinary SAS.
    await evaluate("document.querySelector('#workspaceprogramtab').click();document.querySelector('#code').value='data temp; set work.cl';document.querySelector('#code').focus();document.querySelector('#code').setSelectionRange(document.querySelector('#code').value.length,document.querySelector('#code').value.length);document.querySelector('#code').dispatchEvent(new Event('input'))");
    await waitFor("document.querySelector('#codecompletion') && !document.querySelector('#codecompletion').hidden");
    assert.ok(await evaluate("document.querySelector('#codecompletion').textContent.includes('claims')"));
    if(process.argv.includes('--screenshots')){const shot=await send('Page.captureScreenshot');await writeFile('/tmp/sassy-completion-'+label+'.png',Buffer.from(shot.data,'base64'));}
    await evaluate("document.querySelector('#code').dispatchEvent(new KeyboardEvent('keydown',{key:'Tab',bubbles:true,cancelable:true}))");
    assert.equal(await evaluate("document.querySelector('#code').value"),'data temp; set work.claims');
    await evaluate("document.querySelector('#code').value='data temp; set work.claims; amount=temp.pa';document.querySelector('#code').setSelectionRange(document.querySelector('#code').value.length,document.querySelector('#code').value.length);document.querySelector('#code').dispatchEvent(new Event('input'))");
    await waitFor("!document.querySelector('#codecompletion').hidden && document.querySelector('#codecompletion').textContent.includes('paid_amount')");
    await evaluate("document.querySelector('#code').dispatchEvent(new KeyboardEvent('keydown',{key:'Tab',bubbles:true,cancelable:true}))");
    assert.equal(await evaluate("document.querySelector('#code').value"),'data temp; set work.claims; amount=paid_amount');
    assert.equal(await evaluate("document.querySelector('#programstate').textContent"),'Unsaved changes');
    await evaluate("document.querySelector('#code').value='data temp; set work.claims; amount=paid_amount; run;';document.querySelector('#run').click()");
    await waitFor("document.querySelector('#run') && !document.querySelector('#run').disabled");
    assert.equal(await evaluate("document.querySelector('#status').textContent"),'Ready');
    await evaluate("document.querySelector('#code').value='work.claims.pa';document.querySelector('#code').focus();document.querySelector('#code').setSelectionRange(14,14);document.querySelector('#code').dispatchEvent(new Event('input'))");
    await waitFor("!document.querySelector('#codecompletion').hidden");
    await evaluate("document.querySelector('#code').dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true,cancelable:true}))");
    assert.equal(await evaluate("document.querySelector('#code').value"),'work.claims.pa');
    assert.ok(await evaluate("document.querySelector('#codecompletion').hidden"));
    await evaluate("document.querySelector('#code').value='work.cl';document.querySelector('#code').setSelectionRange(7,7);document.querySelector('#code').dispatchEvent(new Event('input'))");
    await waitFor("!document.querySelector('#codecompletion').hidden");
    await evaluate("document.querySelector('#codecompletion [role=option]').dispatchEvent(new MouseEvent('mousedown',{bubbles:true,cancelable:true}))");
    assert.equal(await evaluate("document.querySelector('#code').value"),'work.claims');
    await evaluate("document.querySelector('#code').value='work.';document.querySelector('#code').setSelectionRange(5,5);document.querySelector('#code').dispatchEvent(new Event('input'))");
    await waitFor("!document.querySelector('#codecompletion').hidden");
    const secondCompletion=await evaluate("document.querySelectorAll('#codecompletion [role=option] strong')[1].textContent");
    await evaluate("document.querySelector('#code').dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowDown',bubbles:true,cancelable:true}));document.querySelector('#code').dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true,cancelable:true}))");
    assert.equal(await evaluate("document.querySelector('#code').value"),'work.'+secondCompletion);
    await evaluate("document.querySelector('#code').value='/* work.';document.querySelector('#code').setSelectionRange(8,8);document.querySelector('#code').dispatchEvent(new Event('input'))");
    await waitFor("document.querySelector('#codecompletion').hidden");
    console.log(`${label}: dataset/variable completion, unrun SET inference, Tab/Escape/mouse, dirty state and resulting executable SAS passed`);
    // ?? at a procedure statement boundary offers short editable SAS starters.
    await evaluate("document.querySelector('#code').value='proc means data=work.claims;\\n??';document.querySelector('#code').focus();document.querySelector('#code').setSelectionRange(document.querySelector('#code').value.length,document.querySelector('#code').value.length);document.querySelector('#code').dispatchEvent(new Event('input'))");
    await waitFor("!document.querySelector('#codecompletion').hidden && document.querySelector('#codecompletion').textContent.includes('CLASS')");
    if(process.argv.includes('--screenshots')){const shot=await send('Page.captureScreenshot');await writeFile('/tmp/sassy-statements-'+label+'.png',Buffer.from(shot.data,'base64'));}
    await evaluate("Array.from(document.querySelectorAll('#codecompletion [role=option]')).find(o=>o.querySelector('strong').textContent.startsWith('VAR ')).dispatchEvent(new MouseEvent('mousedown',{bubbles:true,cancelable:true}))");
    assert.equal(await evaluate("document.querySelector('#code').value"),'proc means data=work.claims;\nvar variable;');
    assert.equal(await evaluate("document.querySelector('#code').value.slice(document.querySelector('#code').selectionStart,document.querySelector('#code').selectionEnd)"),'variable');
    await evaluate("document.querySelector('#code').setRangeText('claims.pa',document.querySelector('#code').selectionStart,document.querySelector('#code').selectionEnd,'end');document.querySelector('#code').dispatchEvent(new Event('input'))");
    await waitFor("!document.querySelector('#codecompletion').hidden && document.querySelector('#codecompletion').textContent.includes('paid_amount')");
    await evaluate("document.querySelector('#code').dispatchEvent(new KeyboardEvent('keydown',{key:'Tab',bubbles:true,cancelable:true}));document.querySelector('#code').value+='\\nrun;';document.querySelector('#run').click()");
    await waitFor("document.querySelector('#run') && !document.querySelector('#run').disabled");
    assert.equal(await evaluate("document.querySelector('#status').textContent"),'Ready');
    assert.ok(await evaluate("document.querySelector('#resulttitle').textContent.includes('PROC MEANS')"));
    await evaluate("document.querySelector('#workspaceprogramtab').click();document.querySelector('#code').value='proc sort data=claims out=descending_claims;\\n??';document.querySelector('#code').focus();document.querySelector('#code').setSelectionRange(document.querySelector('#code').value.length,document.querySelector('#code').value.length);document.querySelector('#code').dispatchEvent(new Event('input'))");
    await waitFor("!document.querySelector('#codecompletion').hidden && document.querySelector('#codecompletion').textContent.includes('DESCENDING')");
    await evaluate("document.querySelector('#code').dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowDown',bubbles:true,cancelable:true}));document.querySelector('#code').dispatchEvent(new KeyboardEvent('keydown',{key:'Tab',bubbles:true,cancelable:true}))");
    assert.ok(await evaluate("document.querySelector('#code').value.endsWith('by descending variable;')"));
    await evaluate("document.querySelector('#code').setRangeText('provider',document.querySelector('#code').selectionStart,document.querySelector('#code').selectionEnd,'end');document.querySelector('#code').value+='\\nrun;';document.querySelector('#run').click()");
    await waitFor("document.querySelector('#run') && !document.querySelector('#run').disabled");
    assert.equal(await evaluate("document.querySelector('#status').textContent"),'Ready');
    assert.ok(await evaluate("document.querySelector('#datasets').textContent.includes('descending_claims')"));
    console.log(`${label}: scoped ?? menu, editable placeholders, variable completion inside starters and resulting MEANS/SORT execution passed`);
    // Shared incremental pattern for all supported procedures, without a manual trigger.
    const typeAssist=async text=>{await evaluate(`document.querySelector('#workspaceprogramtab').click();document.querySelector('#code').value=${JSON.stringify(text)};document.querySelector('#code').focus();document.querySelector('#code').setSelectionRange(document.querySelector('#code').value.length,document.querySelector('#code').value.length);document.querySelector('#code').dispatchEvent(new Event('input'))`);};
    const pickAssist=async label=>{await waitFor(`!document.querySelector('#codecompletion').hidden && Array.from(document.querySelectorAll('#codecompletion [role=option] strong')).some(n=>n.textContent===${JSON.stringify(label)})`);await evaluate(`Array.from(document.querySelectorAll('#codecompletion [role=option]')).find(o=>o.querySelector('strong').textContent===${JSON.stringify(label)}).dispatchEvent(new MouseEvent('mousedown',{bubbles:true,cancelable:true}))`);};
    const appendAssist=async text=>{await evaluate(`document.querySelector('#code').setRangeText(${JSON.stringify(text)},document.querySelector('#code').selectionStart,document.querySelector('#code').selectionEnd,'end');document.querySelector('#code').dispatchEvent(new Event('input'))`);};
    for(const proc of ['means','sort','glm','sgplot','sgpie','print','surveyselect','import','export']){await typeAssist('proc '+proc);await waitFor(`!document.querySelector('#codecompletion').hidden && document.querySelector('#codecompletion').textContent.includes('PROC '+${JSON.stringify(proc.toUpperCase())})`);}
    await typeAssist('proc means');
    await pickAssist('DATA=');await pickAssist('work.claims');await pickAssist('MEAN');
    await waitFor("!document.querySelector('#codecompletion').hidden");
    assert.ok(await evaluate("!Array.from(document.querySelectorAll('#codecompletion [role=option] strong')).some(n=>n.textContent==='DATA='||n.textContent==='MEAN')"));
    if(process.argv.includes('--screenshots')){const shot=await send('Page.captureScreenshot');await writeFile('/tmp/sassy-incremental-'+label+'.png',Buffer.from(shot.data,'base64'));}
    await pickAssist('; — begin statements');
    await waitFor("!document.querySelector('#codecompletion').hidden");
    assert.equal(await evaluate("(()=>{const e=new KeyboardEvent('keydown',{key:'Enter',bubbles:true,cancelable:true});document.querySelector('#code').dispatchEvent(e);return e.defaultPrevented})()"),false,'Automatic menus preserve plain Enter');
    await appendAssist('\n');
    await pickAssist('VAR');
    await waitFor("!document.querySelector('#codecompletion').hidden");
    assert.ok(await evaluate("!Array.from(document.querySelectorAll('#codecompletion [role=option] strong')).some(n=>n.textContent==='provider')"));
    await pickAssist('paid_amount');await pickAssist('; — finish VAR');await pickAssist('OUTPUT');await pickAssist('OUT=');await pickAssist('summary');await pickAssist('MEAN=');
    await appendAssist('average ');
    await waitFor("!document.querySelector('#codecompletion').hidden");
    assert.ok(await evaluate("!Array.from(document.querySelectorAll('#codecompletion [role=option] strong')).some(n=>n.textContent==='MEAN=')"));
    await pickAssist('STD=');await appendAssist('deviation ');await pickAssist('; — finish OUTPUT');await pickAssist('RUN;');
    assert.ok(await evaluate("!document.querySelector('#code').value.includes('??')"));
    await evaluate("document.querySelector('#run').click()");
    await waitFor("document.querySelector('#run') && !document.querySelector('#run').disabled");
    assert.equal(await evaluate("document.querySelector('#status').textContent"),'Ready');
    assert.ok(await evaluate("document.querySelector('#datasets').textContent.includes('summary')"));
    console.log(`${label}: all nine automatic procedure headers, chained DATA/VAR/OUTPUT pieces, duplicate/typed-field suppression, plain Enter and completed MEANS execution passed`);
    // Export from the REAL browser build, extract, and execute the Python bridge.
    const portableBrowserProgram='data portable_result; set snapshot; square=x*x; run; data frame; do stratum=1 to 5; do unit=1 to 5; id=(stratum-1)*5+unit; output; end; end; run; proc surveyselect data=frame out=portable_sample n=2 seed=12345 outseed; strata stratum; run; '+await readFile('examples/project-demo/normal-demo.sas','utf8')+' '+await readFile('examples/catalog/10-glm.sas','utf8')+' proc print data=glm_scored(obs=3) noobs; var predicted residual; run; '+await readFile('examples/catalog/12-weights.sas','utf8');
    await evaluate(`document.querySelector('#code').value=${JSON.stringify(portableBrowserProgram)};document.querySelector('#codeexport').click();document.querySelector('#portablefile').value='runtime/engine.mjs';document.querySelector('#portablefile').dispatchEvent(new Event('change'))`);
    assert.equal(await evaluate("document.querySelector('#portablesource').textContent"),await readFile('dist/engine.mjs','utf8'));
    await evaluate("window.__portableZip=null;window.__portableClick=HTMLAnchorElement.prototype.click;HTMLAnchorElement.prototype.click=function(){if(this.download==='Sassy-portable-v0.4.17.zip'){fetch(this.href).then(r=>r.blob()).then(blob=>{const reader=new FileReader();reader.onload=()=>window.__portableZip=reader.result;reader.readAsDataURL(blob);});}else window.__portableClick.call(this);};document.querySelector('#downloadportable').click()");
    await waitFor("window.__portableZip!==null");
    const portableDownload=await evaluate("window.__portableZip");
    const zipPath=join(profile,'portable-'+label+'.zip'),packagePath=join(profile,'portable-'+label);
    await writeFile(zipPath,Buffer.from(portableDownload.split(',')[1],'base64'));
    const extracted=spawnSync('python3',['-c','import sys,zipfile; z=zipfile.ZipFile(sys.argv[1]); assert z.testzip() is None; z.extractall(sys.argv[2])',zipPath,packagePath],{encoding:'utf8'});
    assert.equal(extracted.status,0,extracted.stderr);
    const wrapped=spawnSync('python3',[join(packagePath,'run.py')],{encoding:'utf8',maxBuffer:10000000,timeout:35000});assert.equal(wrapped.status,0,wrapped.stderr);
    assert.deepEqual(JSON.parse(JSON.parse(wrapped.stdout).tables.portable_result).rows,[{x:3,square:9}]);
    assert.deepEqual(JSON.parse(JSON.parse(wrapped.stdout).tables.portable_sample).rows.map(r=>r.id),[3,5,6,9,12,13,17,19,23,24]);
    const browserGlm=JSON.parse(JSON.parse(wrapped.stdout).tables.glm_tests).rows;
    for(const [source,ss] of [['A',67.6],['B',10],['A*B',.4]])assert.ok(Math.abs(browserGlm.find(r=>r.source===source&&r.hypothesistype===3).ss-ss)<1e-10);
    assert.ok(Math.abs(JSON.parse(JSON.parse(wrapped.stdout).tables.glm_parameters).rows[0].estimate-17)<1e-10);
    const exportedWeighted=JSON.parse(JSON.parse(wrapped.stdout).tables.weighted_stats).rows[0];
    assert.equal(exportedWeighted.count,8);assert.equal(exportedWeighted.weight_total,18);
    assert.ok(Number.isFinite(JSON.parse(JSON.parse(wrapped.stdout).tables.weighted_parameters).rows[0].stderr));
    const portableNormalFixture=JSON.parse(await readFile('fixtures/sas/normal-method-probe.json','utf8'));
    for(const context of portableNormalFixture.contexts){
      const rows=JSON.parse(JSON.parse(wrapped.stdout).tables['normal_'+context.generator.toLowerCase()+'_'+context.mode.toLowerCase()]).rows;
      assert.equal(rows.length,512);
      for(const ref of context.printed_rows){const expected=Buffer.from(ref.z_hex,'hex').readDoubleBE();assert.ok(Math.abs(rows[ref.id-1].z-expected)<=1e-14*Math.max(1,Math.abs(expected)));if(ref.next_u_hex)assert.equal(rows[ref.id-1].next_u_hex,ref.next_u_hex);}
    }
    assert.ok(await evaluate("document.querySelector('#portablestatus').textContent.includes('Downloaded')"));
    if(process.argv.includes('--screenshots')){const shot=await send('Page.captureScreenshot');await writeFile('/tmp/sassy-portable-'+label+'.png',Buffer.from(shot.data,'base64'));}
    await evaluate("HTMLAnchorElement.prototype.click=window.__portableClick;document.querySelector('#closeportable').click()");
    console.log(`${label}: actual-source viewer and downloaded ZIP executed through Python/Node passed`);
    const glmCode=await readFile('examples/catalog/10-glm.sas','utf8');
    await evaluate(`document.querySelector('#code').value=${JSON.stringify(glmCode)};document.querySelector('#code').dispatchEvent(new Event('input'));document.querySelector('#run').click()`);
    await waitFor("document.querySelector('#run') && !document.querySelector('#run').disabled");
    assert.equal(await evaluate("document.querySelector('#status').textContent"),'Ready');
    assert.ok(await evaluate("document.querySelector('#outputhistory').textContent.toLowerCase().includes('glm')"));
    assert.ok(await evaluate("document.querySelector('#datasets').textContent.includes('glm_tests')"));
    const glmOptions=await evaluate("Array.from(document.querySelector('#outputhistory').options).filter(o=>o.textContent.includes('10-glm.sas')||o.textContent.includes('PROC GLM')).map(o=>o.textContent)");
    assert.ok(glmOptions.every(o=>o.includes('PROC GLM')),'Only procedure reports belong in GLM history');
    for(const table of ['glm_study','glm_scored','glm_tests','glm_parameters'])assert.ok(await evaluate(`Array.from(document.querySelectorAll('#datasets strong')).some(n=>n.textContent===${JSON.stringify(table)})`));
    const glmHistory=await evaluate("document.querySelector('#outputhistory').options.length");
    await evaluate("document.querySelector('#code').value='data badglm; x=1; y=2; run; proc glm data=badglm; model y=x / noint; run;';document.querySelector('#run').click()");
    await waitFor("document.querySelector('#run') && !document.querySelector('#run').disabled");
    assert.equal(await evaluate("document.querySelector('#outputhistory').options.length"),glmHistory);
    assert.ok(await evaluate("!document.querySelector('#datasets').textContent.includes('badglm')"));
    console.log(`${label}: GLM reports, tables, Type III/SOLUTION portable values and failed-run rollback passed`);
    const reportsBeforeData=await evaluate("document.querySelector('#outputhistory').options.length");
    await evaluate("document.querySelector('#code').value='data many_rows; do id=1 to 50000; x=id; output; end; run;';document.querySelector('#run').click()");
    await waitFor("document.querySelector('#run') && !document.querySelector('#run').disabled");
    assert.equal(await evaluate("document.querySelector('#outputhistory').options.length"),reportsBeforeData);
    assert.equal(await evaluate("document.querySelector('#workspaceprogramtab').getAttribute('aria-selected')"),'true');
    await evaluate("Array.from(document.querySelectorAll('#datasets button')).find(b=>b.querySelector('strong')?.textContent==='many_rows').click()");
    assert.ok((await evaluate("document.querySelector('#rowcount').textContent")).startsWith('50,000 observations'));
    assert.equal(await evaluate("document.querySelectorAll('#table tbody tr').length"),50);
    assert.equal(await evaluate("document.querySelector('#outputhistory').options.length"),reportsBeforeData);
    console.log(`${label}: report-only history, dataset availability and explicit 50,000-row paged viewing passed`);
    await evaluate("document.querySelector('#code').value='proc print data=many_rows(firstobs=5 obs=10); var x id; run;';document.querySelector('#run').click()");
    await waitFor("document.querySelector('#run') && !document.querySelector('#run').disabled");
    assert.equal(await evaluate("document.querySelector('#status').textContent"),'Ready');
    assert.ok(await evaluate("document.querySelector('#resulttitle').textContent.includes('PROC PRINT')"));
    assert.equal(await evaluate("document.querySelectorAll('#table tbody tr').length"),6);
    assert.equal(await evaluate("document.querySelector('#table tbody td').textContent"),'5');
    assert.equal(await evaluate("document.querySelector('#table thead th:nth-child(2)').textContent"),'x');
    await evaluate("document.querySelector('#code').value='proc print data=many_rows(obs=3) noobs; var id; run;';document.querySelector('#run').click()");
    await waitFor("document.querySelector('#run') && !document.querySelector('#run').disabled");
    assert.equal(await evaluate("document.querySelectorAll('#table thead th').length"),1);
    assert.equal(await evaluate("document.querySelectorAll('#table tbody tr').length"),3);
    assert.equal(await evaluate("document.querySelector('#table thead th').textContent"),'id');
    console.log(`${label}: explicit PRINT observations, FIRSTOBS numbering, VAR order and NOOBS rendering passed`);
    const weightedCode=await readFile('examples/catalog/12-weights.sas','utf8');
    await evaluate(`document.querySelector('#code').value=${JSON.stringify(weightedCode)};document.querySelector('#run').click()`);
    await waitFor("document.querySelector('#run') && !document.querySelector('#run').disabled");
    assert.equal(await evaluate("document.querySelector('#status').textContent"),'Ready');
    assert.ok(await evaluate("document.querySelector('#resulttitle').textContent.includes('PROC PRINT')"));
    assert.equal(await evaluate("document.querySelectorAll('#table tbody tr').length"),5);
    assert.ok(await evaluate("document.querySelector('#datasets').textContent.includes('weighted_stats') && document.querySelector('#datasets').textContent.includes('weighted_parameters')"));
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
    await evaluate("document.querySelector('#code').value='saved.persist.am';document.querySelector('#code').focus();document.querySelector('#code').setSelectionRange(16,16);document.querySelector('#code').dispatchEvent(new Event('input'))");
    await waitFor("!document.querySelector('#codecompletion').hidden");
    await evaluate("document.querySelector('#code').dispatchEvent(new KeyboardEvent('keydown',{key:'Tab',bubbles:true,cancelable:true}))");
    assert.equal(await evaluate("document.querySelector('#code').value"),'amount');

    if(process.argv.includes('--screenshots')){const capture=await send('Page.captureScreenshot');await writeFile('/tmp/sassy-libraries-'+label+'.png',Buffer.from(capture.data,'base64'));}
    assert.ok(await evaluate("document.querySelector('.brandlogo').complete && document.querySelector('.brandlogo').naturalWidth>0"));
    await evaluate("document.querySelector('#code').value='data restored_native;set saved.persist;run;';document.querySelector('#run').click()");
    await waitFor("document.querySelector('#run') && !document.querySelector('#run').disabled");
    await evaluate("Array.from(document.querySelectorAll('#datasets button')).find(b=>b.querySelector('strong')?.textContent==='restored_native').click()");
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
    await evaluate("Array.from(document.querySelectorAll('#datasets button')).find(b=>b.querySelector('strong')?.textContent==='from_new_session').click()");
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
    // User-facing example catalog and SAS-shaped CLASS totals.
    await evaluate("document.querySelector('#exampleprograms').click()");
    assert.equal(await evaluate("document.querySelector('#examplechoice').options.length"),12);
    await evaluate("document.querySelector('#examplechoice').value='04-means.sas';document.querySelector('#examplechoice').dispatchEvent(new Event('change'))");
    assert.ok(await evaluate("document.querySelector('#examplesource').textContent.includes('_TYPE_')"));
    const logBeforeExample=await evaluate("document.querySelector('#log').textContent");
    await evaluate("document.querySelector('#loadexample').click()");
    assert.equal(await evaluate("document.querySelector('#log').textContent"),logBeforeExample);
    assert.ok(await evaluate("document.querySelector('#examplesdialog').open===false && document.querySelector('#code').value.includes('demo_all_types')"));
    await evaluate("document.querySelector('#run').click()");
    await waitFor("!document.querySelector('#run').disabled");
    assert.equal(await evaluate("document.querySelector('#status').textContent"),'Ready');
    assert.ok(await evaluate("Array.from(document.querySelector('#outputhistory').options).some(o=>o.textContent.includes('PROC MEANS'))"));
    await evaluate("Array.from(document.querySelectorAll('#datasets button')).find(b=>b.querySelector('strong')?.textContent==='demo_all_types').click()");
    assert.equal(await evaluate("document.querySelector('#table tbody tr td:nth-child(2)').textContent"),'');
    assert.ok(await evaluate("document.querySelector('#table thead').textContent.includes('_TYPE_')"));
    const meansCSV=await evaluate(`(async()=>{let blob;const original=URL.createObjectURL,click=HTMLAnchorElement.prototype.click;URL.createObjectURL=value=>{blob=value;return original(value)};HTMLAnchorElement.prototype.click=function(){};try{document.querySelector('#export').click();return await blob.text();}finally{URL.createObjectURL=original;HTMLAnchorElement.prototype.click=click;}})()`);
    const meansData=(await import('../dist/engine.mjs')).parseCSV(meansCSV);
    assert.equal(meansData.rows.length,12);
    assert.deepEqual(meansData.rows.map(r=>r._type_),[0,1,1,1,2,2,3,3,3,3,3,3]);
    assert.ok(meansData.columns.includes('amount_stddev'));assert.ok(!meansData.columns.includes('amount_std'));
    assert.equal(meansData.rows[0]._freq_,24);assert.equal(meansData.rows[0].amount_n,20);assert.equal(meansData.rows[0].amount_nmiss,4);
    if(process.argv.includes('--screenshots')){const shot=await send('Page.captureScreenshot');await writeFile('/tmp/sassy-means-'+label+'.png',Buffer.from(shot.data,'base64'));}
    console.log(`${label}: example catalog, PROC MEANS reports and exact CLASS type/frequency structure passed`);
    const surveyCode=await readFile('examples/catalog/09-surveyselect.sas','utf8');
    await evaluate(`document.querySelector('#code').value=${JSON.stringify(surveyCode)};document.querySelector('#run').click()`);
    await waitFor("!document.querySelector('#run').disabled");
    assert.equal(await evaluate("document.querySelector('#status').textContent"),'Ready');
    assert.ok(await evaluate("Array.from(document.querySelector('#outputhistory').options).some(o=>o.textContent.includes('SURVEYSELECT'))"));
    await evaluate("Array.from(document.querySelectorAll('#datasets button')).find(b=>b.querySelector('strong')?.textContent==='sample_stratified').click()");
    const surveyCSV=await evaluate(`(async()=>{let blob;const original=URL.createObjectURL,click=HTMLAnchorElement.prototype.click;URL.createObjectURL=value=>{blob=value;return original(value)};HTMLAnchorElement.prototype.click=function(){};try{document.querySelector('#export').click();return await blob.text();}finally{URL.createObjectURL=original;HTMLAnchorElement.prototype.click=click;}})()`);
    const surveyData=(await import('../dist/engine.mjs')).parseCSV(surveyCSV);
    assert.deepEqual(surveyData.rows.map(r=>r.id),[3,5,6,9,12,13,17,19,23,24]);
    assert.equal(surveyData.rows.at(-1).initialseed,1841400341);
    const originalSurveyDatasets=await evaluate("document.querySelector('#datasets').textContent");
    await evaluate("document.querySelector('#code').value='proc surveyselect data=sampling_frame out=bad n=2 reps=2; strata stratum; run;';document.querySelector('#run').click()");
    await waitFor("!document.querySelector('#run').disabled");
    assert.equal(await evaluate("document.querySelector('#datasets').textContent"),originalSurveyDatasets);
    assert.match(await evaluate("document.querySelector('#log').textContent"),/Stratified REPS/);
    console.log(`${label}: integrated SURVEYSELECT/default RAND, automatic stratum seeds, reports and rollback passed`);
    const normalFixture=JSON.parse(await readFile('fixtures/sas/normal-method-probe.json','utf8'));
    await evaluate(`document.querySelector('#code').value=${JSON.stringify(await readFile('examples/project-demo/normal-demo.sas','utf8'))};document.querySelector('#run').click()`);
    await waitFor("!document.querySelector('#run').disabled");
    assert.equal(await evaluate("document.querySelector('#status').textContent"),'Ready');
    for(const context of normalFixture.contexts){
      const name='normal_'+context.generator.toLowerCase()+'_'+context.mode.toLowerCase();
      await evaluate(`Array.from(document.querySelectorAll('#datasets button')).find(b=>b.querySelector('strong')?.textContent===${JSON.stringify(name)}).click()`);
      const text=await evaluate(`(async()=>{let blob;const original=URL.createObjectURL,click=HTMLAnchorElement.prototype.click;URL.createObjectURL=value=>{blob=value;return original(value)};HTMLAnchorElement.prototype.click=function(){};try{document.querySelector('#export').click();return await blob.text();}finally{URL.createObjectURL=original;HTMLAnchorElement.prototype.click=click;}})()`);
      const rows=(await import('../dist/engine.mjs')).parseCSV(text).rows;assert.equal(rows.length,512);
      for(const ref of context.printed_rows){const actual=Buffer.from(rows[ref.id-1].z_hex,'hex').readDoubleBE(),expected=Buffer.from(ref.z_hex,'hex').readDoubleBE();assert.ok(Math.abs(actual-expected)<=1e-14*Math.max(1,Math.abs(expected)));if(ref.next_u_hex)assert.equal(rows[ref.id-1].next_u_hex,ref.next_u_hex);}
    }
    console.log(`${label}: four NORMAL/mixed contexts match 52 SAS normal references and 28 exact stream witnesses`);
    console.log(`${label}: ten examples, expanded code, CSV import/export, failed-run rollback passed`);
  }
  console.log('Browser checks passed in '+await evaluate('navigator.userAgent'));
} finally {
  socket?.close();
  if(browser.exitCode===null&&!launchError){const exited=new Promise(r=>browser.once('exit',r));browser.kill();await exited;}
  await new Promise(r=>server.close(r));
  await rm(profile,{recursive:true,force:true,maxRetries:10,retryDelay:100});
}
