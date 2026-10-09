// Execute the exact embedded offline worker in Node's isolated worker runtime.
import fs from 'node:fs';import vm from 'node:vm';import assert from 'node:assert/strict';import {Worker}from'node:worker_threads';
const html=fs.readFileSync('dist/data-step-lab.html','utf8'),scripts=[...html.matchAll(/<script(?:[^>]*)>([\s\S]*?)<\/script>/g)];
assert.equal(scripts.length,2);let source=JSON.parse(scripts[0][1]);new vm.Script(source);new vm.Script(scripts[1][1]);assert.ok(!/\bimport\s/.test(source));assert.ok(!/<script[^>]+src=|<link[^>]+rel="stylesheet"/.test(html));
async function workerRun(code){let w=new Worker(`const{parentPort}=require('node:worker_threads');global.self={postMessage:value=>parentPort.postMessage(value)};${source};parentPort.on('message',data=>self.onmessage({data}));`,{eval:true});try{return await new Promise((resolve,reject)=>{let timer=setTimeout(()=>reject(new Error('Worker timeout')),8000);w.once('message',r=>{clearTimeout(timer);resolve(r)});w.once('error',e=>{clearTimeout(timer);reject(e)});w.postMessage({code,datasets:{}})})}finally{await w.terminate()}}
let r=await workerRun('%let n=3;data a;do id=&n to 1 by -1;x=id*10;output;end;run;proc sort data=a out=s;by id;run;data b;id=2;label="match";run;data out;merge s(in=a) b(in=b);by id;if a;found=b;run;');assert.equal(r.ok,true);assert.deepEqual(r.result.datasets.out.rows.map(x=>[x.id,x.found]),[[1,0],[2,1],[3,0]]);assert.ok(r.result.expanded.includes('do id=3'));
r=await workerRun('%let x=1;data out;y=&x;unknown_statement;run;');assert.equal(r.ok,false);assert.ok(r.expanded.includes('y=1'));assert.ok(!r.result);
r=await workerRun('data out;y=&missing;run;');assert.equal(r.ok,false);assert.match(r.error,/Undefined/);
r=await workerRun(`data s;call streaminit('MT32',5489);u=rand('uniform');n=rand('normal');bits=put(u,hex16.);d=input(put(122591,z6.),mmddyy6.);format d date11. u 10.6;run;`);assert.equal(r.ok,true);assert.equal(r.result.datasets.s.rows[0].d,11681);assert.equal(r.result.datasets.s.rows[0].u,3499211612*2.328306436538696e-10);assert.equal(r.result.datasets.s.rows[0].bits.length,16);assert.ok(Number.isFinite(r.result.datasets.s.rows[0].n));
const sasPrinted=JSON.parse(fs.readFileSync('fixtures/sas/mt32-seed12345-printed.json','utf8')).observations;
r=await workerRun(`data s;call streaminit('MT32',12345);x=put(rand('uniform'),hex16.);y=put(rand('uniform'),hex16.);run;`);
assert.equal(r.ok,true);
assert.equal(r.result.datasets.s.rows[0].x,sasPrinted.find(x=>x.id===1&&x.column==='random_x').sas_hex);
assert.equal(r.result.datasets.s.rows[0].y,sasPrinted.find(x=>x.id===1&&x.column==='random_y').sas_hex);
console.log('Offline package checks passed: no external dependencies, valid embedded scripts, isolated worker sorting/macros/merge, and transactional failure paths. Browser-specific file access has not been tested.');
