import {completionLex} from './completion.mjs';

// Explicitly separate authorized, asynchronous descriptor I/O from the pure editor scanner.
// Only assigned, listed members referenced before the caret are read. No SAS execution.
export function referencedLibraryTables(code,caret,state){
 if(typeof code!=='string'||code.length>100000)return [];
 const {mask,inside}=completionLex(code.slice(0,caret));if(inside)return [];
 const found=new Map();
 for(const match of mask.matchAll(/(?<![\w.&%])([a-z_]\w{0,7})\.([a-z_]\w{0,31})(?!\w)/gi)){
  const alias=match[1].toLowerCase(),member=match[2].toLowerCase(),path=state.libraries?.[alias];
  if(alias==='work'||typeof path!=='string'||!state.members?.[alias]?.includes(member))continue;
  const key=(path==='.'?'':path+'/')+member+'.sassy-table.json';found.set(key,{key,alias,member});
 }
 return [...found.values()].slice(-8);
}

export function createLibraryCompletion(readDescriptor,getState){
 let generation=0;const cache=new Map(),pending=new Map();
 return {
  clear(){generation++;cache.clear();pending.clear();},
  descriptors(){
   const state=getState(),descriptors=Object.create(null);
   for(const [alias,path] of Object.entries(state.libraries||{}))for(const member of state.members?.[alias]||[]){
    const ds=cache.get((path==='.'?'':path+'/')+member+'.sassy-table.json');if(ds)descriptors[alias+'.'+member]=ds;
   }
   return descriptors;
  },
  async ensure(code,caret){
   const state=getState();if(!state.enabled)return false;const epoch=generation;
   const work=referencedLibraryTables(code,caret,state).map(({key})=>{
    if(cache.has(key))return false;
    if(!pending.has(key)){
     const request=Promise.resolve().then(()=>readDescriptor(key)).then(ds=>{if(epoch!==generation)return false;cache.set(key,ds);return true;},()=>{if(epoch===generation)cache.set(key,null);return false;}).finally(()=>{if(epoch===generation)pending.delete(key);});
     pending.set(key,request);
    }
    return pending.get(key);
   });
   return (await Promise.all(work)).some(Boolean);
  }
 };
}
