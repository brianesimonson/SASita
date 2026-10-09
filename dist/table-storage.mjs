import {parseFormat} from './formats.mjs';
// Versioned, readable native tables. No executable content or external references.
export function tableDocument(ds,name) {
 if(typeof name!=='string'||!/^[a-z_]\w{0,31}$/.test(name))throw new Error('Native table names must be SAS identifiers of at most 32 characters');
 if(!Array.isArray(ds.columns)||!ds.columns.length||ds.columns.length>1024||ds.rows.length>100000)throw new Error('Native tables require 1–1024 columns and at most 100,000 rows');
 const columns=ds.columns.map(column=>({name:column,type:ds.types?.[column]==='char'?'character':'numeric',length:ds.types?.[column]==='char'?(ds.lengths?.[column]??null):8,format:ds.formats?.[column]??null}));
 return {format:'sassy-table',version:1,name,columns,rows:ds.rows.map(row=>Object.fromEntries(ds.columns.map(c=>[c,row[c]??null])))};
}
export function readTable(text) {
 if(typeof text!=='string'||text.length>20000000||new TextEncoder().encode(text).length>20000000)throw new Error('Native table limit is 20 MB');
 let document;try{document=JSON.parse(text)}catch{throw new Error('Invalid native table JSON')}
 if(document?.format!=='sassy-table'||document.version!==1)throw new Error('Unsupported native table format/version');
 if(typeof document.name!=='string'||!/^[a-z_]\w{0,31}$/.test(document.name)||!Array.isArray(document.columns)||!document.columns.length||document.columns.length>1024||!Array.isArray(document.rows)||document.rows.length>100000)throw new Error('Invalid native table name or dimensions');
 const ds={columns:[],types:Object.create(null),formats:Object.create(null),lengths:Object.create(null),rows:[]};
 for(const c of document.columns){
  if(!c||typeof c.name!=='string'||!/^[a-z_]\w{0,31}$/.test(c.name)||ds.columns.includes(c.name)||!['numeric','character'].includes(c.type))throw new Error('Invalid or duplicate native column descriptor');
  if(c.type==='numeric'?c.length!==8:c.length!==null&&(!Number.isInteger(c.length)||c.length<1||c.length>32767))throw new Error('Invalid native column length');
  if(c.format!==null&&(typeof c.format!=='string'||c.format.length>64))throw new Error('Invalid native column format');
  if(c.format!==null){const format=parseFormat(c.format);if(format.name.startsWith('$')!==(c.type==='character'))throw new Error('Native column format type mismatch');}
  ds.columns.push(c.name);ds.types[c.name]=c.type==='character'?'char':'num';if(c.format!==null)ds.formats[c.name]=c.format;if(c.type==='character'&&c.length!==null)ds.lengths[c.name]=c.length;
 }
 for(const row of document.rows){
  if(!row||typeof row!=='object'||Array.isArray(row)||Object.keys(row).length!==ds.columns.length||ds.columns.some(c=>!Object.hasOwn(row,c)))throw new Error('Native row does not match its descriptors');
  for(const c of ds.columns){const value=row[c];if(value===null)continue;if(ds.types[c]==='num'?(typeof value!=='number'||!Number.isFinite(value)):typeof value!=='string')throw new Error('Native value does not match column '+c);if(ds.lengths[c]&&value.length>ds.lengths[c])throw new Error('Native character value exceeds declared length '+c);}
  ds.rows.push(Object.fromEntries(ds.columns.map(c=>[c,row[c]])));
 }
 return ds;
}
export function writeTable(ds,name) {
 // Bound work before allocating the serialized text, then validate the same format we read.
 let minimum=0;for(const row of ds.rows)for(const c of ds.columns){if(typeof row[c]==='number'&&!Number.isFinite(row[c]))throw new Error('Native numeric values must be finite or null');minimum+=c.length+String(row[c]??'').length+6;if(minimum>20000000)throw new Error('Native table limit is 20 MB')}
 const document=tableDocument(ds,name),rows=document.rows;delete document.rows;
 const header=JSON.stringify(document,null,2).trimEnd().slice(0,-1);
 const text=header+',\n  \"rows\": [\n'+rows.map(row=>'    {'+ds.columns.map(c=>JSON.stringify(c)+': '+(Object.is(row[c],-0)?'-0':JSON.stringify(row[c]))).join(', ')+'}').join(',\n')+'\n  ]\n}\n';readTable(text);return text;
}
