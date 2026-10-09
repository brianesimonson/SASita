// Chart.js is bundled locally; all chart inputs are validated data-only models.
export function createChartView(container,summary) {
 let instance=null,current=null;
 const palette=['#2e6fbb','#17a398','#f0a44b','#b56bce','#e86f73','#547d97','#92b951','#d77c3f'];
 function clear(){instance?.destroy();instance=null;current=null;container.replaceChildren();}
 function show(model){
  if(model===current&&instance)return;
  clear();current=model;summary.textContent=`${model.used.toLocaleString()} observations used · ${model.omitted.toLocaleString()} omitted · ${model.source.toUpperCase()}`;
  if(typeof globalThis.Chart!=='function'){container.textContent='Chart.js could not load. Reopen the complete app download.';return;}
  const canvas=document.createElement('canvas');canvas.setAttribute('role','img');canvas.setAttribute('aria-label',model.title);container.append(canvas);
  const pie=model.kind==='pie',scatter=model.kind==='scatter',horizontal=model.kind==='hbar';
  const datasets=model.series.map((series,index)=>({...series,borderColor:pie?palette:palette[index%palette.length],backgroundColor:pie?model.labels.map((_,i)=>palette[i%palette.length]):palette[index%palette.length]+'bb',borderWidth:pie?2:1,borderRadius:pie?0:4,pointRadius:scatter?(model.pointCount>5000?2:3):undefined,pointHoverRadius:5}));
  const scales=pie?undefined:{x:{type:scatter?'linear':horizontal?'linear':'category',title:{display:true,text:model.xLabel},stacked:!!model.stacked,grid:{color:'#e8edf4'},...(horizontal?{beginAtZero:true}:{})},y:{type:horizontal?'category':'linear',title:{display:true,text:model.yLabel},stacked:!!model.stacked,grid:{color:'#e8edf4'},...(!scatter&&!horizontal?{beginAtZero:true}:{})}};
  try{instance=new Chart(canvas,{type:pie?'pie':scatter?'scatter':'bar',data:{labels:scatter?undefined:model.labels,datasets},options:{responsive:true,maintainAspectRatio:false,animation:false,indexAxis:horizontal?'y':'x',font:{family:'Segoe UI, Arial, sans-serif'},scales,plugins:{legend:{display:pie||datasets.length>1,position:pie?'right':'top'},tooltip:{enabled:true}},...(model.kind==='histogram'?{barPercentage:1,categoryPercentage:1}: {})},plugins:[{id:'sassyBackground',beforeDraw(chart){const ctx=chart.ctx;ctx.save();ctx.globalCompositeOperation='destination-over';ctx.fillStyle='#ffffff';ctx.fillRect(0,0,chart.width,chart.height);ctx.restore();}}]});}
  catch(e){instance?.destroy();instance=null;container.replaceChildren();container.textContent='Chart could not render: '+e.message;}
 }
 return {show,clear,resize(){instance?.resize();},get ready(){return !!instance},image(){
  if(!instance||!instance.canvas.width||!instance.canvas.height)throw new Error('View a rendered chart before downloading');
  const source=instance.canvas,ratio=instance.currentDevicePixelRatio||1,margin=16*ratio,lineHeight=24*ratio,canvas=document.createElement('canvas');canvas.width=source.width;const ctx=canvas.getContext('2d');ctx.font=`600 ${16*ratio}px Segoe UI, Arial, sans-serif`;
  const lines=[];let line='';for(const character of current.title){if(line&&ctx.measureText(line+character).width>canvas.width-margin*2){lines.push(line);line='';}line+=character;}if(line)lines.push(line);
  const top=margin*2+lines.length*lineHeight;canvas.height=source.height+top;ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.font=`600 ${16*ratio}px Segoe UI, Arial, sans-serif`;ctx.fillStyle='#203049';ctx.textBaseline='top';lines.forEach((text,index)=>ctx.fillText(text,margin,margin+index*lineHeight));ctx.drawImage(source,0,top);return canvas.toDataURL('image/png');
 }};
}
