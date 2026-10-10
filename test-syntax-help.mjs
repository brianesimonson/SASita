import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {syntaxContext,syntaxCatalog} from './dist/syntax-help.mjs';
import {run} from './dist/engine.mjs';
const entries=syntaxCatalog();
assert.equal(new Set(entries.map(e=>e.id)).size,entries.length);
assert.equal(entries.filter(e=>e.group==='Functions').length,35);
assert.equal(entries.filter(e=>e.group==='Formats').length,20);
assert.deepEqual(entries.filter(e=>e.group==='Procedures').map(e=>e.id),['means','sort','import','export','sgplot','sgpie']);
const source=readFileSync('dist/engine.mjs','utf8');
const functions=[...source.split('const funcs=')[1].split('function cmp')[0].matchAll(/(?:^|[,\n])\s*([a-z]+):/g)].map(m=>m[1]);
for(const name of [...functions,'input','put','rand'])assert.ok(entries.some(e=>e.id==='fn-'+name),name+' missing');
for(const [code,expected] of [
 ['proc sort','sort'],['PROC SORT DATA=claims; by provider ','sort'],
 ['proc sgplot data=x; histogram x / nbins=','sgplot'],['proc sgpie data=x; pie c;','sgpie'],
 ['proc sort data=x; by x; run;',null],['proc unknown data=x;',null],
 ["/* proc sgpie */ proc sort data=x; by x;",'sort'],
 ["* proc sgpie; proc sort data=x; by x;",'sort'],
 ["data x; text='proc sort; run;'; x=sqrt(sum(",'fn-sum'],
 ['data x; x=sqrt(sum(1,2),','fn-sqrt'],['data x; x=sqrt(4);','data'],
 ['data x; format x comma12.;','data'],['data x; format x ','formats'],
 ["libname saved 'tables'",'libname'],["filename source 'inputs.csv'",'filename'],
 ["title 'Test'",'title'],["data x; call streaminit('MT32',",'streaminit'],
 ['%macro x(a);','macros'],['data x; libname=1;','data'],['proc',null]
])assert.equal(syntaxContext(code),expected,code);
const code='proc sort data=x; by x; run; proc sgpie data=x; pie x; run;';
assert.equal(syntaxContext(code,20),'sort');
assert.equal(syntaxContext(code,49),'sgpie');
for(const e of entries.filter(e=>e.group==='Functions'))assert.doesNotThrow(()=>run("data test; call streaminit('MT32', 12345); value="+e.template+'; run;'),e.label+' example must run');
console.log('Syntax catalog coverage, templates and tolerant cursor contexts passed.');
