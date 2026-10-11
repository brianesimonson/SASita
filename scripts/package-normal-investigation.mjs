import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {portableZip} from '../dist/portable-export.mjs';
const home=new URL('../examples/normal-investigation/',import.meta.url);
const files=Object.fromEntries(['01-normal-method-probe.sas','README.md'].map(name=>[name,readFileSync(new URL(name,home),'utf8')]));
files['manifest.json']=JSON.stringify(Object.fromEntries(Object.entries(files).map(([name,text])=>
 [name,{sha256:createHash('sha256').update(text).digest('hex'),bytes:Buffer.byteLength(text)}])),null,2)+'\n';
writeFileSync(new URL('normal-method-probe.zip',home),portableZip(files));
console.log('SAS-only normal method probe ZIP created; no app runtime changed.');
