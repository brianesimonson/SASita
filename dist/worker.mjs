import {runFileProgram} from './file-program.mjs';
import {expandMacros} from './macros.mjs';
let nextRequest=0;
const requests=new Map();
self.onmessage=async({data})=>{
 if(data.kind==='file-response'){const request=requests.get(data.id);if(request){requests.delete(data.id);data.error?request.reject(new Error(data.error)):request.resolve(data.value??data.text)}return;}
 let expanded;
 try {
  expanded=expandMacros(data.code).code;
  const readFile=path=>new Promise((resolve,reject)=>{const id=++nextRequest;requests.set(id,{resolve,reject});self.postMessage({kind:'read-file',id,path});});
  const checkDirectory=path=>new Promise((resolve,reject)=>{const id=++nextRequest;requests.set(id,{resolve,reject});self.postMessage({kind:'check-directory',id,path});});
  self.postMessage({ok:true,result:await runFileProgram(data.code,data.datasets,readFile,{libraries:data.libraries,checkDirectory})});
 } catch(e){self.postMessage({ok:false,error:e.message,expanded})}
};
