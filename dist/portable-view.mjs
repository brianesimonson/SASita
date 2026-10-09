import {portableFiles,portableZip} from './portable-export.mjs';
import {runtimeAssets} from './runtime-assets.mjs';
export function createPortableView(snapshot,report){
 const get=id=>document.getElementById(id),assets=runtimeAssets();
 function show(){const name=get('portablefile').value;get('portablesource').textContent=name==='program.sas'?snapshot().code:assets[name]||'';}
 get('codeexport').onclick=()=>{get('portablefile').replaceChildren();for(const name of ['program.sas','run.mjs','run.py',...Object.keys(assets).filter(n=>n.startsWith('runtime/'))]){const option=document.createElement('option');option.value=name;option.textContent=name;get('portablefile').append(option);}show();get('portabledialog').showModal();};
 get('portablefile').onchange=show;get('closeportable').onclick=()=>get('portabledialog').close();
 get('downloadportable').onclick=()=>{try{const state=snapshot();if(state.busy)throw new Error('Wait for the current operation to finish.');const zip=portableZip(portableFiles(state,assets)),url=URL.createObjectURL(new Blob([zip],{type:'application/zip'})),anchor=document.createElement('a');anchor.href=url;anchor.download='Sassy-portable-v0.4.6.zip';anchor.click();setTimeout(()=>URL.revokeObjectURL(url),1000);get('portablestatus').textContent='Downloaded program, runtime, Python wrapper and current WORK snapshots. External project files are not copied.';report('NOTE: Exported portable demo package ('+zip.length.toLocaleString()+' bytes).');}catch(e){get('portablestatus').textContent=e.message;report('ERROR: '+e.message,true);}};
}
