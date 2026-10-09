import {projectPath} from './file-program.mjs';
async function storedHandle(mode,handle) {
 const db=await new Promise((resolve,reject)=>{const request=indexedDB.open('sasita-projects',1);request.onupgradeneeded=()=>request.result.createObjectStore('handles');request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);});
 try{return await new Promise((resolve,reject)=>{const transaction=db.transaction('handles',mode==='get'?'readonly':'readwrite'),store=transaction.objectStore('handles');const request=mode==='get'?store.get('project'):mode==='delete'?store.delete('project'):store.put(handle,'project');transaction.oncomplete=()=>resolve(request.result);transaction.onerror=()=>reject(transaction.error);transaction.onabort=()=>reject(transaction.error||new Error('Project storage unavailable'));});}finally{db.close();}
}
export function createProjectFiles() {
 let directory=null,remembered=null,notice='';
 const supported=()=>typeof globalThis.showDirectoryPicker==='function'&&globalThis.isSecureContext;
 async function permission(handle,prompt=false) {
  if(!handle)throw new Error('Choose a project folder first.');
  const descriptor={mode:'readwrite'};
  let state=await handle.queryPermission(descriptor);
  if(state!=='granted'&&prompt)state=await handle.requestPermission(descriptor);
  if(state!=='granted'){if(handle===directory)directory=null;throw new Error('Folder access needs permission. Click Reconnect folder, then run again.');}
 }
 async function parent(path,root=directory) {
  await permission(root);const parts=projectPath(path),name=parts.pop();
  let folder=root;for(const part of parts)folder=await folder.getDirectoryHandle(part);
  return {folder,name};
 }
 async function connect() {
  const picked=await globalThis.showDirectoryPicker({mode:'readwrite'});
  await permission(picked);directory=picked;remembered=picked;notice='';
  try{await storedHandle('put',picked)}catch{notice='Folder connected for this session; this browser could not remember it.';}
 }
 async function restore() {
  try{const handle=await storedHandle('get');if(directory)return;if(handle){remembered=handle;if(await handle.queryPermission({mode:'readwrite'})==='granted')directory=handle;}}
  catch{notice='Remembered folders are unavailable here; choose a folder for this session.';}
 }
 async function reconnect() {await permission(remembered,true);directory=remembered;}
 async function forget() {directory=null;remembered=null;notice='';try{await storedHandle('delete')}catch{notice='Disconnected for this session; clear browser site data to remove any stored folder.';}}
 async function read(path) {
  const {folder,name}=await parent(path),handle=await folder.getFileHandle(name),file=await handle.getFile();
  if(file.size>20000000)throw new Error('CSV import limit is 20 MB');return file.text();
 }
 async function list(path='') {
  await permission(directory);let folder=directory;
  if(path)for(const part of projectPath(path))folder=await folder.getDirectoryHandle(part);
  const entries=[];for await(const [name,handle] of folder.entries()){entries.push({name,handle,kind:handle.kind});if(entries.length>=500)break;}
  return entries.sort((a,b)=>a.kind.localeCompare(b.kind)||a.name.localeCompare(b.name));
 }
 async function open(path) {const {folder,name}=await parent(path);return folder.getFileHandle(name);}
 async function saveExports(exports=[]) {
  if(!exports.length)return [];
  const root=directory,prepared=[],touched=[];
  // Check every target before writing any file. Existing subfolders are required.
  for(const item of exports) {
   if(!/\.csv$/i.test(item.path))throw new Error('Program exports must end in .csv');
   if(new TextEncoder().encode(item.text).length>20000000)throw new Error('CSV export limit is 20 MB');
   const {folder,name}=await parent(item.path,root);let handle=null;
   try{handle=await folder.getFileHandle(name)}catch(e){if(e.name!=='NotFoundError')throw e;}
   if(handle&&!item.replace)throw new Error(item.path+' already exists; add REPLACE to PROC EXPORT.');
   if(prepared.some(p=>p.path.toLowerCase()===item.path.toLowerCase()))throw new Error('Duplicate export path '+item.path);
   prepared.push({...item,folder,name,handle});
  }
  try {
   for(const item of prepared){touched.push(item.path);const handle=item.handle||await item.folder.getFileHandle(item.name,{create:true});const stream=await handle.createWritable();try{await stream.write(item.text);await stream.close();}catch(e){await stream.abort().catch(()=>{});throw e;}}
  } catch(e){throw new Error(e.message+'\nDisk files possibly changed: '+touched.join(', ')+'. File saves cannot be rolled back as a group.');}
  return touched;
 }
 return {supported,connect,restore,reconnect,forget,read,list,open,saveExports,get directory(){return directory},get remembered(){return remembered},get notice(){return notice}};
}
