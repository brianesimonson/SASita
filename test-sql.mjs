import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {readFile} from 'node:fs/promises';
import {runFileProgram,filePlan} from './dist/file-program.mjs';
import {readTable,writeTable} from './dist/table-storage.mjs';
const close=(a,b)=>assert.ok(Math.abs(a-b)<=1e-12*Math.max(1,Math.abs(b)),`${a} != ${b}`);
const source=`data a;length g $4;id=1;g='A';x=2;output;id=1;x=4;output;id=2;g='B';x=8;output;id=.;g='';x=.;output;run;
data b;id=1;y=3;output;id=1;y=6;output;id=3;y=12;output;id=.;y=9;output;run;`;
const query=async sql=>runFileProgram(source+'proc sql;'+sql+'quit;');
await assert.rejects(query('select stddev(x) as sd from a;'),/uses STD\(x\)/);
const sasEvidence=JSON.parse(await readFile('fixtures/sas/sql-validation-v1-results.json','utf8'));
assert.equal(sasEvidence.outcome.comparison_groups_run,15);assert.equal(sasEvidence.outcome.matched_records,68);
assert.equal(sasEvidence.outcome.observations_unequal,0);assert.equal(sasEvidence.outcome.not_run[0].name,'sql_grouped');
for(const c of sasEvidence.confirmed_cases){const replay=await runFileProgram(c.program);assert.deepEqual(replay.datasets[c.name].rows,c.expected,c.name+' confirmed SAS values');}
const sasPass=JSON.parse(await readFile('fixtures/sas/sql-validation-v2-pass.json','utf8'));
assert.equal(sasPass.outcome.comparison_groups,16);assert.equal(sasPass.outcome.matched_records,71);
const groupedCase=sasPass.confirmed_grouped_case;
assert.deepEqual((await runFileProgram(groupedCase.program)).datasets.sql_grouped.rows,groupedCase.expected);
let r=await query(`create table s as select g,count(*) as n,count(x) as nx,count(distinct id) as unique_ids,sum(x) as total,mean(x) as average,avg(x) as average2,std(x) as sd,var(x) as variance,min(x) as lo,max(x) as hi from a group by g having count(*)>=1 order by g;`);
assert.equal(r.reports.length,0);assert.equal(r.datasets.s.rows.length,3);assert.equal(r.datasets.s.rows[0].n,1);assert.equal(r.datasets.s.rows[0].nx,0);assert.equal(r.datasets.s.rows[0].total,null);
assert.deepEqual(r.datasets.s.rows[1],{g:'A',n:2,nx:2,unique_ids:1,total:6,average:3,average2:3,sd:Math.SQRT2,variance:2,lo:2,hi:4});
r=await query(`create table s as select id,mean(x,10) as row_mean,sum(x,10) as row_sum,put(x,z4.) as text,input('0042',4.) as parsed,log(exp(1)) as natural from a where id in (1,.) and x between . and 4 order by x desc;`);
assert.deepEqual(r.datasets.s.rows.map(v=>[v.id,v.row_mean,v.row_sum,v.text,v.parsed]),[[1,7,14,'0004',42],[1,6,12,'0002',42],[null,10,10,'   .',42]]);close(r.datasets.s.rows[0].natural,1);
r=await query(`create table s as select id,x*2 as doubled,calculated doubled+1 as adjusted,case g when 'A' then 'alpha' else 'other' end as label from a where calculated doubled>=8 order by adjusted desc;`);
assert.deepEqual(r.datasets.s.rows.map(v=>[v.id,v.doubled,v.adjusted,v.label]),[[2,16,17,'other'],[1,8,9,'alpha']]);
for(const [join,expected] of [['inner',5],['left',6],['right',6],['full',7]]){
 r=await query(`create table s as select a.id as left_id,b.id as right_id,a.x,b.y from a ${join} join b on a.id=b.id order by left_id,x,y;`);
 assert.equal(r.datasets.s.rows.length,expected);assert.equal(r.datasets.s.rows.filter(v=>v.left_id===1).length,4);assert.ok(r.datasets.s.rows.some(v=>v.left_id===null&&v.right_id===null&&v.y===9));
}
r=await query('create table s as select a.id as aid,b.id as bid from a cross join b;');assert.equal(r.datasets.s.rows.length,16);
r=await query('create table s as select a.id as aid,b.id as bid from a,b where a.id=b.id;');assert.equal(r.datasets.s.rows.length,5);
r=await query('create table s as select a.* from a as a left join b as b on a.id=b.id and b.y>3;');assert.equal(r.datasets.s.rows.length,4);
r=await query('create table s as select unique g from a order by 1 desc;');assert.deepEqual(r.datasets.s.rows.map(v=>v.g),['B','A','']);
r=await query('create table s as select g from a group by g;');assert.deepEqual(r.datasets.s.rows.map(v=>v.g),['','A','A','B']);assert.match(r.logs.at(-2),/GROUP BY/);
r=await query("create table s as select coalesce('   ','A') as a,missing('   ') as b from a where id=2;");assert.deepEqual(r.datasets.s.rows,[{a:'A',b:1}]);
r=await query('create table s as select case when x is missing then 0 when x>3 then 1 else 2 end as bin,count(*) as n from a group by calculated bin having n>0 order by bin;');assert.deepEqual(r.datasets.s.rows,[{bin:0,n:1},{bin:1,n:2},{bin:2,n:1}]);
r=await query('create table s as select g,count(*) as n from a where g like \'A%\' and id not in (2,3) group by g;');assert.deepEqual(r.datasets.s.rows,[{g:'A',n:2}]);
r=await query('create table s as select count(*) as n,sum(x) as total,mean(x) as m,std(x) as sd from a where id=99;');assert.deepEqual(r.datasets.s.rows,[{n:0,total:null,m:null,sd:null}]);
r=await query('create table s as select a.* from a where id=99;');assert.equal(r.datasets.s.rows.length,0);assert.equal(r.datasets.s.types.g,'char');assert.equal(r.datasets.s.lengths.g,4);
r=await runFileProgram(source+'proc sql outobs=2;select * from a order by x;create table limited as select * from a order by x desc;quit;');assert.equal(r.reports.length,1);assert.equal(r.reports[0].dataset.rows.length,2);assert.equal(r.datasets.limited.rows[0].x,8);
r=await runFileProgram(source+'proc sql noprint;select * from a;quit;');assert.equal(r.reports.length,0);
// Trailing blanks compare/group as SAS blanks; missing numeric keys also match.
const table={columns:['g','x'],types:{g:'char',x:'num'},lengths:{g:3},formats:{x:'comma12.2'},rows:[{g:'A',x:1},{g:'A  ',x:2},{g:'',x:null}]};
r=await runFileProgram('proc sql;create table s as select g,sum(x) as total from f group by g order by g;create table copy as select * from f;quit;',{f:table});assert.deepEqual(r.datasets.s.rows.map(v=>[v.g,v.total]),[['',null],['A',3]]);assert.equal(r.datasets.copy.formats.x,'comma12.2');
// Exact-same query text against independent SQLite for shared, nonmissing SQL semantics.
const shared='select a.id as aid,b.id as bid,a.x*b.y as product from a left join b on a.id=b.id where a.id is not null order by aid,product;';
r=await query('create table s as '+shared);
const sqlite=spawnSync('python3',['-c',`import sqlite3,json
c=sqlite3.connect(':memory:');c.executescript('create table a(id,x);insert into a values(1,2),(1,4),(2,8),(NULL,NULL);create table b(id,y);insert into b values(1,3),(1,6),(3,12),(NULL,9);')
print(json.dumps(c.execute(${JSON.stringify(shared)}).fetchall()))`],{encoding:'utf8'});assert.equal(sqlite.status,0,sqlite.stderr);assert.deepEqual(r.datasets.s.rows.map(v=>[v.aid,v.bid,v.product]),JSON.parse(sqlite.stdout));
// Native output is staged, and can be read via another alias before disk commit.
const native=writeTable(table,'f');const paths=[];
r=await runFileProgram("libname saved 'tables';libname other 'tables';proc sql;create table saved.summary as select g,sum(x) as total from saved.f group by g;create table copied as select * from other.summary;quit;",{},async path=>{paths.push(path);return native;},{checkDirectory:async()=>true});
assert.deepEqual(paths,['tables/f.sassy-table.json']);assert.equal(r.exports.length,1);assert.deepEqual(readTable(r.exports[0].text).rows,r.datasets.copied.rows);
for(const sql of [
 'create table s as select id,mean(x) as average from a;', // remerge
 'create table s as select id as identifier,mean(x) as average from a group by x;',
 'create table s as select x from a where count(*)>1;',
 'create table s as select sum(mean(x)) as nested from a;',
 'create table s as select sum(x) as total,sum(calculated total) as nested from a;',
 'create table s as select id from a join b on a.id=b.id;', // ambiguous
 'create table s as select * from a join b on a.id=b.id;', // duplicate output names
 'create table s as select nonexistent from a where id=99;',
 'create table s as select x from a having x>2;',
 'create table s as select count(distinct *) as n from a;',
 'create table s as select sum(g) as total from a;',
 'create table s as select a.id from a join b on c.id=b.id join a as c on c.id=a.id;',
 'create table s as select case when id=1 then 1 else \'bad\' end as value from a;',
 'create table s as select x from a union select y from b;',
 'create table s as select id into :macro from a;',
 'create table s as select x from a where id in (select id from b);',
 'delete from a;', 'create view v as select x from a;', 'select monotonic() from a;'
])await assert.rejects(query(sql),undefined,sql);
await assert.rejects(runFileProgram(source+'proc sql;create table s as select * from a;quit;data bad;unsupported;run;'));
// Hash equality join handles a realistic size without a quadratic scan.
const large={columns:['id'],types:{id:'num'},formats:{},rows:Array.from({length:12000},(_,id)=>({id}))};
r=await runFileProgram('proc sql;create table s as select a.id from a inner join b on a.id=b.id;quit;',{a:large,b:large});assert.equal(r.datasets.s.rows.length,12000);
await assert.rejects(runFileProgram('proc sql;create table s as select a.id from a cross join b;quit;',{a:large,b:large}),/limit/i);
assert.throws(()=>filePlan('proc sql;select * from a;run;'),/SELECT|Expected|SQL/);
console.log('PROC SQL: semantic/native/SQLite/resource checks pass; all sixteen actual SAS groups / 71 matched records replay exactly, including corrected grouped STD/VAR. STDDEV rejected with STD guidance; metadata/order remain outside certification.');
