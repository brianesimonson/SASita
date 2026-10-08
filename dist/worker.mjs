import {run} from './engine.mjs';
import {expandMacros} from './macros.mjs';
self.onmessage=({data})=>{let expanded;try{expanded=expandMacros(data.code).code;self.postMessage({ok:true,result:run(data.code,data.datasets)})}catch(e){self.postMessage({ok:false,error:e.message,expanded})}};
