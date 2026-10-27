import assert from 'node:assert/strict';
import {completionContext} from './dist/completion.mjs';
const ds={columns:['id','payment_amount','paid_date'],types:{id:'char',payment_amount:'num',paid_date:'num'}};
Object.defineProperty(ds,'rows',{get(){throw new Error('Completion must never inspect observations');}});
const state={datasets:{claims:ds,other:{columns:['extra'],types:{extra:'num'}},'saved.table':ds},libraries:{saved:'tables'},members:{saved:['table','unloaded']}};
function get(code,s=state){return completionContext(code,code.length,s);}
function accept(code,index=0){const c=get(code);return code.slice(0,c.start)+c.items[index].insert+code.slice(c.end);}
assert.deepEqual(get('set work.').items.map(i=>i.label),['claims','other']);assert.equal(accept('set work.cl'),'set work.claims');
assert.equal(accept('work.claims.payment'),'payment_amount');assert.equal(accept('claims.payment'),'payment_amount');
assert.deepEqual(get('data temp; set work.claims; temp.').items.map(i=>i.label),['id','paid_date','payment_amount']);
assert.equal(accept('data temp; set work.claims; x=temp.payment'),'data temp; set work.claims; x=payment_amount');
assert.ok(get('data temp; set claims; run; proc means data=temp; var temp.pay').items.some(i=>i.label==='payment_amount'));
assert.deepEqual(get('data temp; merge claims other; temp.ex').items.map(i=>i.label),['extra']);
assert.deepEqual(get('data temp; set claims; keep id; temp.').items.map(i=>i.label),['id']);
assert.deepEqual(get('data temp; set claims; drop payment_amount; temp.').items.map(i=>i.label),['id','paid_date']);
assert.equal(accept('data temp; set claims; rename payment_amount=amount; temp.am'),'data temp; set claims; rename payment_amount=amount; amount');
assert.equal(accept('saved.table.pay'),'payment_amount');assert.deepEqual(get('set saved.').items.map(i=>i.label),['table','unloaded']);assert.equal(get('saved.unloaded.'),null);
for(const code of ['/* work.','* work.','%* work.',`data a; x='work.`,`data a; x="work.`,`&work.`,`&lib..`,`1.`,`unknown.`,`data temp; set claims(keep=id); temp.`,`data temp; set absent; temp.`])assert.equal(get(code),null,code);
assert.equal(accept("/* ignored */ data temp; set claims; x=temp.pay"),"/* ignored */ data temp; set claims; x=payment_amount");
assert.equal(accept("data a; x='don''t work.'; y=claims.pay"),"data a; x='don''t work.'; y=payment_amount");
const text='set work.clXYZ;';const c=completionContext(text,11,state);assert.equal(text.slice(0,c.start)+c.items[0].insert+text.slice(c.end),'set work.claims;');
assert.equal(get('x'.repeat(100001)+' work.'),null);
console.log('Editor completion: WORK/library datasets, variable-only insertion, simple SET/MERGE inference, KEEP/DROP/RENAME, prefix/replacement bounds, comments/strings/macros, unknown metadata and no observation access passed.');
