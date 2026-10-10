import {programExamples} from './example-programs.mjs';
export function createExamplesView(load,download){
 const get=id=>document.getElementById(id),entries=programExamples();
 const selected=()=>entries.find(e=>e.file===get('examplechoice').value);
 const show=()=>{const e=selected();get('examplesource').textContent=e?.code||'';get('exampledescription').textContent=e?.description||'';};
 get('exampleprograms').onclick=()=>{get('examplechoice').replaceChildren();for(const e of entries){const option=document.createElement('option');option.value=e.file;option.textContent=e.title;get('examplechoice').append(option);}show();get('examplesdialog').showModal();};
 get('examplechoice').onchange=show;get('closeexamples').onclick=()=>get('examplesdialog').close();
 get('loadexample').onclick=()=>{const e=selected();if(e&&load(e.code,e.file))get('examplesdialog').close();};
 get('downloadexample').onclick=()=>{const e=selected();if(e)download(e.file,e.code);};
}
