import assert from 'node:assert/strict';
import {completionContext} from './dist/completion.mjs';
import {procedureStatementTemplates} from './dist/syntax-help.mjs';
import {runFileProgram} from './dist/file-program.mjs';
const context=code=>completionContext(code,code.length);
let c=context('data temp; set work.claims; run;\nproc means data=work.temp;\n??');
assert.equal(c.kind,'statements');assert.deepEqual(c.items.map(i=>i.keyword),['class','var','weight','by','output','output','run']);
const source='proc means data=work.temp;\n??cl';c=context(source);assert.equal(c.items.length,1);assert.equal(source.slice(0,c.start)+c.items[0].insert+source.slice(c.end),'proc means data=work.temp;\nclass variable;');
assert.equal(context('proc means data=t; class g; var x; weight w; ??').items.some(i=>['class','var','weight'].includes(i.keyword)),false);
assert.ok(!context('proc means data=t vardef=wgt; ??out').items.some(i=>i.insert.includes('stderr=')));
assert.ok(context('proc means data=t; ??out').items.some(i=>i.insert.includes('sumwgt=')&&i.insert.includes('/ autoname')));
assert.deepEqual(context('proc sort data=t; ??').items.map(i=>i.insert),['by variable;','by descending variable;']);
assert.deepEqual(context('proc sort data=t; by x; ??').items.map(i=>i.insert),['run;']);
assert.deepEqual(context('proc glm data=t; ??').items.map(i=>i.keyword),['class','weight','model']);
assert.deepEqual(context('proc glm data=t; class g; model y=x; ??').items.map(i=>i.keyword),['weight','output','run']);
assert.deepEqual(context('proc glm data=t; model y=x; output out=s p=p; weight w;\n    ??').items.map(i=>i.insert),['run;\n    quit;']);
assert.deepEqual(context('proc sgplot data=t; scatter x=x y=y; xaxis label="x"; ??').items.map(i=>i.keyword),['yaxis','run']);
for(const code of ['??','data t; ??','proc means data=t ??','proc means data=t; run; ??','proc means data=t; data next; ??','proc means data=t; proc unknown; ??','proc constructor; ??','proc __proto__; ??','proc means data=t; x=input(y, ??','proc means data=t; var ??','proc means data=t; /* ??','proc means data=t; * ??','proc means data=t; %* ??',`proc means data=t; x='??`])assert.equal(context(code),null,code);
assert.equal(context('proc means data=t; /* comment; */\n??').kind,'statements');
assert.equal(context('proc means data=t; run; proc sort data=t; ??').qualifier,'sort');
// Execute every starter, filling the documented placeholder identifiers with actual columns.
const frame=await runFileProgram('data t; do measure=1 to 8; predictor=measure; response=2*measure+mod(measure,2); x_variable=measure; y_variable=response; category="A"; output; end; run;');
for(const proc of ['means','sort','glm','sgplot'])for(const item of procedureStatementTemplates(proc)){
 let before='',after='run;';
 if(proc==='glm'&&['output','run'].includes(item.keyword))before='model response=predictor / solution;';
 if(proc==='glm'&&['class','weight'].includes(item.keyword))after='model response=predictor / solution; run;';
 if(proc==='sgplot'&&['xaxis','yaxis','run'].includes(item.keyword))before='scatter x=x_variable y=y_variable;';
 if(proc==='sort'&&item.keyword==='run')before='by variable;';
 if(item.keyword==='run')after='';
 const r=await runFileProgram(`proc ${proc} data=t; ${before} ${item.insert.replace(/\bvariable\b/g,'measure')} ${after}`,frame.datasets);
 assert.ok(r.datasets.t,item.label);
}
console.log('Procedure ?? starters: scoped statement boundaries, filtering, used-line/order rules, comments/strings/input modifiers, indentation and every filled starter executed for MEANS/SORT/GLM/SGPLOT.');
