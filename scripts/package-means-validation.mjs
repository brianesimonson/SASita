import {readFile,writeFile} from 'node:fs/promises';
import {runFileProgram,projectCSV} from '../dist/file-program.mjs';
import {portableZip} from '../dist/portable-export.mjs';
const home=new URL('../examples/means-validation/',import.meta.url);
const code=await readFile(new URL('01-means-validation.sas',home),'utf8');
const result=await runFileProgram(code),files={};
for(const name of ['means_all','means_missing','means_nway','means_default','means_by','means_large']){const text=projectCSV(result.datasets[name]);await writeFile(new URL('app_'+name+'.csv',home),text);files['app_'+name+'.csv']=text;}
for(const name of ['01-means-validation.sas','02-sas-comparison.sas','README.md'])files[name]=await readFile(new URL(name,home),'utf8');
await writeFile(new URL('means-validation.zip',home),portableZip(files));
console.log('Six deterministic PROC MEANS validation CSVs and SAS comparison ZIP created.');
