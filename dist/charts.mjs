// A deliberate SAS plotting subset. Models contain data only, never executable code.
export function parsePlot(tokens,start) {
 let i=start;
 const take=()=>{const t=tokens[i++];if(!t)throw new Error('Incomplete plotting procedure');return t;};
 const need=value=>{const t=take();if(t.v!==value)throw new Error('Expected '+value+' in plotting procedure (line '+t.line+')');};
 const name=()=>{const t=take();if(t.type!=='id'||!/^[a-z_]\w{0,31}$/.test(t.v))throw new Error('Expected a plot variable name');return t.v;};
 need('proc');const procedure=take().v;need('data');need('=');const source=take();
 if(source.type!=='id'||!/^(?:[a-z_]\w{0,7}\.)?[a-z_]\w{0,31}$/.test(source.v))throw new Error('Plots require DATA=dataset');
 need(';');const plot={source:source.v.replace(/^work\./,''),procedure,options:{},axes:{}};
 while(tokens[i]?.v!=='run') {
  const statement=take().v;
  if(statement==='xaxis'||statement==='yaxis'){
   if(Object.hasOwn(plot.axes,statement))throw new Error('Repeated '+statement.toUpperCase());
   need('label');need('=');const label=take();if(label.type!=='str'||label.v.length>200)throw new Error('Axis LABEL requires text of at most 200 characters');need(';');plot.axes[statement]=label.v;continue;
  }
  if(plot.kind)throw new Error('Use one plot statement per procedure; overlays are not supported');
  if(!(['scatter','hbar','vbar','histogram'].includes(statement)&&procedure==='sgplot'||statement==='pie'&&procedure==='sgpie'))throw new Error('Unsupported plot statement '+statement+' in PROC '+procedure.toUpperCase());
  plot.kind=statement;
  if(statement==='scatter'){
   while(!['/',';'].includes(tokens[i]?.v)){const option=take().v;if(!['x','y'].includes(option)||Object.hasOwn(plot,option))throw new Error('SCATTER requires X= and Y= once each');need('=');plot[option]=name();}
   if(!plot.x||!plot.y)throw new Error('SCATTER requires X= and Y=');
  }else plot.variable=name();
  if(tokens[i]?.v==='/'){
   take();const allowed=statement==='scatter'?['group']:statement==='histogram'?['nbins','scale']:statement==='pie'?['response','stat']:['response','stat','group','groupdisplay'];
   while(tokens[i]?.v!==';'){
    const option=take().v;if(!allowed.includes(option)||Object.hasOwn(plot.options,option))throw new Error('Unsupported or repeated '+statement.toUpperCase()+' option '+option);
    need('=');const value=take();
    if(['group','response'].includes(option)){if(value.type!=='id'||!/^[a-z_]\w{0,31}$/.test(value.v))throw new Error('Expected a variable for '+option);}
    else if(option==='nbins'){if(value.type!=='num'||!Number.isInteger(value.v)||value.v<1||value.v>100)throw new Error('NBINS must be an integer from 1 to 100');}
    else if(value.type!=='id')throw new Error('Expected an option value for '+option);
    plot.options[option]=value.v;
   }
  }
  need(';');
 }
 need('run');need(';');if(!plot.kind)throw new Error('Plotting procedure has no plot statement');
 if(procedure==='sgpie'&&Object.keys(plot.axes).length)throw new Error('Pie charts do not support axis statements');
 const o=plot.options;
 if(o.stat&&!['freq','sum','mean'].includes(o.stat))throw new Error('STAT supports FREQ, SUM or MEAN');
 if(o.scale&&!['count','percent','proportion'].includes(o.scale))throw new Error('SCALE supports COUNT, PERCENT or PROPORTION');
 if(o.groupdisplay&&!['stack','cluster'].includes(o.groupdisplay))throw new Error('GROUPDISPLAY supports STACK or CLUSTER');
 if(o.groupdisplay&&!o.group)throw new Error('GROUPDISPLAY requires GROUP=');
 if(o.stat==='freq'&&o.response)throw new Error('STAT=FREQ does not use RESPONSE; remove RESPONSE=');
 if(['sum','mean'].includes(o.stat)&&!o.response)throw new Error('STAT='+o.stat.toUpperCase()+' requires RESPONSE=');
 return {next:i,plot};
}
export function preparePlot(plot,ds,title='') {
 if(!ds)throw new Error('Plot dataset '+plot.source+' was not found');
 const numeric=n=>{if(!ds.columns.includes(n))throw new Error('Plot variable '+n+' was not found');if(ds.types?.[n]==='char')throw new Error('Plot variable '+n+' must be numeric');};
 for(const name of [plot.variable,plot.x,plot.y,plot.options.group,plot.options.response].filter(Boolean))if(!ds.columns.includes(name))throw new Error('Plot variable '+name+' was not found');
 const finite=v=>typeof v==='number'&&Number.isFinite(v),missing=v=>v==null||typeof v==='string'&&!v.trim()||typeof v==='number'&&!Number.isFinite(v);
 const label=v=>{const text=String(v);if(text.length>256)throw new Error('Chart labels are limited to 256 characters');return text;};
 const identity=v=>typeof v+':'+String(v),o=plot.options;
 const source=plot.source.includes('.')?plot.source:'work.'+plot.source;
 const model={kind:plot.kind,source,title:title||({scatter:'Scatter',hbar:'Horizontal bar',vbar:'Vertical bar',histogram:'Histogram',pie:'Pie chart'}[plot.kind]+' · '+source),series:[],labels:[],observations:ds.rows.length,used:0,omitted:0,pointCount:0};
 if(plot.kind==='scatter'){
  numeric(plot.x);numeric(plot.y);const groups=new Map();
  for(const row of ds.rows){if(!finite(row[plot.x])||!finite(row[plot.y])||o.group&&missing(row[o.group])){model.omitted++;continue;}
   const value=o.group?row[o.group]:source,key=identity(value);if(!groups.has(key)){if(groups.size>=50)throw new Error('Scatter plots are limited to 50 groups');groups.set(key,{label:label(value),data:[]});}
   if(++model.used>20000)throw new Error('Scatter plots are limited to 20,000 points; subset the dataset first');groups.get(key).data.push({x:row[plot.x],y:row[plot.y]});
  }
  for(const axis of ['x','y']){let min=Infinity,max=-Infinity;for(const series of groups.values())for(const point of series.data){min=Math.min(min,point[axis]);max=Math.max(max,point[axis]);}if(model.used&&!Number.isFinite(max-min))throw new Error('Scatter axis range exceeds numeric limits; rescale the variable');}
  model.series=[...groups.values()];model.pointCount=model.used;model.xLabel=plot.axes.xaxis??plot.x;model.yLabel=plot.axes.yaxis??plot.y;
 }else if(plot.kind==='histogram'){
  numeric(plot.variable);const values=[];let min=Infinity,max=-Infinity;
  for(const row of ds.rows){const value=row[plot.variable];if(!finite(value)){model.omitted++;continue;}values.push(value);min=Math.min(min,value);max=Math.max(max,value);}
  model.used=values.length;if(!values.length)throw new Error('No valid observations for histogram');
  let bins=min===max?1:o.nbins??Math.min(50,Math.ceil(Math.log2(values.length)+1));const range=max-min;if(!Number.isFinite(range))throw new Error('Histogram range exceeds numeric limits; rescale the variable');
  if(range&&range/bins===0)throw new Error('Histogram bins are smaller than numeric precision; use fewer bins');
  const counts=Array(bins).fill(0);for(const value of values)counts[min===max?0:Math.min(bins-1,Math.floor((value-min)/range*bins))]++;
  const short=n=>Number(n.toPrecision(5)).toString();
  model.labels=Array.from({length:bins},(_,i)=>min===max?short(min):`${short(min+range*(i/bins))} – ${i===bins-1?'':'< '}${short(i===bins-1?max:min+range*((i+1)/bins))}`);
  const scale=o.scale||'percent',data=counts.map(count=>scale==='count'?count:scale==='proportion'?count/values.length:count/values.length*100);
  model.series=[{label:scale,data}];model.binCounts=counts;model.binEdges=Array.from({length:bins+1},(_,i)=>i===bins?max:min+range*(i/bins));model.pointCount=bins;model.xLabel=plot.axes.xaxis??plot.variable;model.yLabel=plot.axes.yaxis??({count:'Count',percent:'Percent',proportion:'Proportion'}[scale]);
 }else{
  const stat=o.stat||(o.response?'sum':'freq');if(o.response)numeric(o.response);
  const categories=new Map(),groups=new Map();
  for(const row of ds.rows){const category=row[plot.variable],group=o.group?row[o.group]:stat.toUpperCase();if(missing(category)||o.group&&missing(group)||o.response&&!finite(row[o.response])){model.omitted++;continue;}
   const ckey=identity(category),gkey=identity(group);if(!categories.has(ckey)){if(categories.size>=200)throw new Error('Charts are limited to 200 categories');categories.set(ckey,{label:label(category),values:new Map()});}
   if(!groups.has(gkey)){if(groups.size>=50)throw new Error('Bar charts are limited to 50 groups');groups.set(gkey,label(group));}
   const entries=categories.get(ckey).values;if(!entries.has(gkey))entries.set(gkey,{count:0,sum:0,mean:0});const entry=entries.get(gkey),value=o.response?row[o.response]:1;
   entry.count++;entry.sum+=value;const delta=value-entry.mean;entry.mean=Number.isFinite(delta)?entry.mean+delta/entry.count:entry.mean*((entry.count-1)/entry.count)+value/entry.count;model.used++;
  }
  model.labels=[...categories.values()].map(c=>c.label);
  model.series=[...groups].map(([key,group])=>({label:group,data:[...categories.values()].map(c=>{const entry=c.values.get(key);return !entry?(stat==='mean'?null:0):stat==='freq'?entry.count:stat==='mean'?entry.mean:entry.sum;})}));
  for(const s of model.series)if(s.data.some(v=>v!==null&&!finite(v)))throw new Error('Chart statistic exceeds numeric limits');
  if(plot.kind==='pie'){const values=model.series[0]?.data||[];if(values.some(v=>v<0)||!values.some(v=>v>0))throw new Error('Pie slices must be nonnegative with at least one positive slice');if(!finite(values.reduce((n,v)=>n+v,0)))throw new Error('Pie slice total exceeds numeric limits; rescale the response');}
  model.pointCount=model.labels.length*model.series.length;model.stacked=!!o.group&&(o.groupdisplay||'stack')==='stack';
  const response=o.response?`${stat.toUpperCase()}(${o.response})`:'Frequency';model.xLabel=plot.axes.xaxis??(plot.kind==='hbar'?response:plot.variable);model.yLabel=plot.axes.yaxis??(plot.kind==='hbar'?plot.variable:response);
 }
 if(!model.used)throw new Error('No valid observations for '+plot.kind+' chart');return model;
}
