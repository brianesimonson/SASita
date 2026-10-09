import {writeTable} from './table-storage.mjs';
import {filePlan,projectPath} from './file-program.mjs';
import {expandMacros} from './macros.mjs';
export function portableFiles(snapshot,assets){
 if(!snapshot.code.trim())throw new Error('Write or open a program before exporting.');
 const files=Object.assign(Object.create(null),assets),work=Object.create(null),folders=new Set();
 const plan=filePlan(expandMacros(snapshot.code).code);
 for(const [name,ds] of Object.entries(snapshot.datasets))if(!name.includes('.')){
  if(!/^[a-z_]\w{0,31}$/.test(name))throw new Error('Invalid WORK table name: '+name);
  const path='work/'+name+'.sassy-table.json';work[name]=path;files[path]=writeTable(ds,name);
 }
 const libraries=Object.assign(Object.create(null),snapshot.libraries);
 for(const path of [...Object.values(libraries),...plan.filter(p=>p.kind==='libname'&&p.path!==null).map(p=>p.path)]){
  if(path!=='.'){projectPath(path);folders.add(path);}
 }
 files['program.sas']=snapshot.code;
 files['inputs.json']=JSON.stringify({version:1,work,libraries,chartTitle:snapshot.chartTitle||''},null,2);
 files['project/']='';for(const path of folders)files['project/'+path+'/']='';
 files['project/README.txt']='Place required CSV/native table inputs here, or use --project to point the runner at your existing project folder. External files are not copied by this demo.\n';
 return files;
}
export function portableZip(files){
 const encoder=new TextEncoder(),parts=[],central=[];let offset=0,total=0;
 const crcTable=new Uint32Array(256);for(let i=0;i<256;i++){let c=i;for(let n=0;n<8;n++)c=(c&1)?0xedb88320^(c>>>1):c>>>1;crcTable[i]=c>>>0;}
 const crc=data=>{let value=0xffffffff;for(const b of data)value=crcTable[(value^b)&255]^(value>>>8);return (value^0xffffffff)>>>0;};
 for(const [path,text] of Object.entries(files)){
  if(path.startsWith('/')||path.split('/').includes('..')||path.includes('\\'))throw new Error('Invalid package entry');
  const name=encoder.encode(path),data=encoder.encode(text);total+=data.length;if(total>50000000)throw new Error('Portable package limit is 50 MB. Export fewer WORK tables.');
  const checksum=crc(data),header=new Uint8Array(30+name.length),view=new DataView(header.buffer);
  view.setUint32(0,0x04034b50,true);view.setUint16(4,20,true);view.setUint16(6,0x800,true);view.setUint16(12,0x5d49,true);view.setUint32(14,checksum,true);view.setUint32(18,data.length,true);view.setUint32(22,data.length,true);view.setUint16(26,name.length,true);header.set(name,30);
  const entry=new Uint8Array(46+name.length),cv=new DataView(entry.buffer);cv.setUint32(0,0x02014b50,true);cv.setUint16(4,20,true);cv.setUint16(6,20,true);cv.setUint16(8,0x800,true);cv.setUint16(14,0x5d49,true);cv.setUint32(16,checksum,true);cv.setUint32(20,data.length,true);cv.setUint32(24,data.length,true);cv.setUint16(28,name.length,true);cv.setUint32(42,offset,true);entry.set(name,46);
  parts.push(header,data);central.push(entry);offset+=header.length+data.length;
 }
 if(central.length>65535)throw new Error('Too many package entries');
 const end=new Uint8Array(22),ev=new DataView(end.buffer);ev.setUint32(0,0x06054b50,true);ev.setUint16(8,central.length,true);ev.setUint16(10,central.length,true);ev.setUint32(12,central.reduce((n,b)=>n+b.length,0),true);ev.setUint32(16,offset,true);
 const all=[...parts,...central,end],output=new Uint8Array(all.reduce((n,b)=>n+b.length,0));let at=0;for(const part of all){output.set(part,at);at+=part.length;}return output;
}
