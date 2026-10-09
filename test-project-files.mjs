import assert from 'node:assert/strict';
import {createProjectFiles} from './dist/project-files.mjs';
let permission='granted',requests=0;
const missing=()=>Object.assign(new Error('Not found'),{name:'NotFoundError'});
function file(name,text='',broken=false) {
 return {kind:'file',name,text,
  async getFile(){return {size:this.text.length,text:async()=>this.text}},
  async createWritable(){let pending='';const target=this;return {async write(value){if(broken)throw new Error('Disk full');pending=value},async close(){target.text=pending},async abort(){}};}
 };
}
function folder(name) {
 const entries=new Map();
 return {name,kind:'directory',entriesMap:entries,
  async queryPermission(){return permission},async requestPermission(){requests++;permission='granted';return permission},
  async getDirectoryHandle(name){const entry=entries.get(name);if(entry?.kind==='directory')return entry;throw missing()},
  async getFileHandle(name,options={}){const entry=entries.get(name);if(entry?.kind==='file')return entry;if(entry)throw new Error('Wrong type');if(options.create){const result=file(name);entries.set(name,result);return result;}throw missing()},
  async *entries(){yield* entries.entries()}
 };
}
const root=folder('project'),inputs=folder('inputs'),outputs=folder('outputs');root.entriesMap.set('inputs',inputs);root.entriesMap.set('outputs',outputs);
inputs.entriesMap.set('source.csv',file('source.csv','id,x\n1,2'));
outputs.entriesMap.set('existing.csv',file('existing.csv','original'));
const previous=globalThis.showDirectoryPicker;globalThis.showDirectoryPicker=async()=>root;
try {
 const project=createProjectFiles();await project.connect();
 assert.equal(await project.read('inputs/source.csv'),'id,x\n1,2');
 await assert.rejects(project.read('../outside.csv'),/Invalid project path/);
 await assert.rejects(project.saveExports([{path:'outputs/new.csv',text:'new',replace:false},{path:'outputs/existing.csv',text:'overwrite',replace:false}]),/already exists/);
 assert.equal(outputs.entriesMap.has('new.csv'),false,'all paths checked before writes');
 assert.equal(outputs.entriesMap.get('existing.csv').text,'original');
 await project.saveExports([{path:'outputs/existing.csv',text:'changed',replace:true}]);
 assert.equal(outputs.entriesMap.get('existing.csv').text,'changed');
 outputs.entriesMap.set('broken.csv',file('broken.csv','unchanged',true));
 await assert.rejects(project.saveExports([{path:'outputs/new.csv',text:'saved',replace:false},{path:'outputs/broken.csv',text:'fail',replace:true}]),/possibly changed: outputs\/new.csv, outputs\/broken.csv/);
 assert.equal(outputs.entriesMap.get('new.csv').text,'saved');assert.equal(outputs.entriesMap.get('broken.csv').text,'unchanged');
 permission='prompt';await assert.rejects(project.read('inputs/source.csv'),/Reconnect/);
 assert.equal(requests,0,'program IO never prompts');assert.equal(project.directory,null,'expired access exposes Reconnect');
 assert.equal(project.remembered,root);await project.reconnect();assert.equal(requests,1);
 assert.equal(await project.read('inputs/source.csv'),'id,x\n1,2');
 await project.forget();assert.equal(project.directory,null);assert.equal(project.remembered,null);
 console.log('Project-file checks passed: permission expiry/reconnect, scoped reads, all-target preflight, explicit overwrite, and honest partial-save reporting.');
}finally{globalThis.showDirectoryPicker=previous}
