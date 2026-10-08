import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {run,display,parseCSV} from './dist/engine.mjs';
import {parseFormat} from './dist/formats.mjs';
import {createMT32} from './dist/random.mjs';
const one=code=>run(`data test;${code}run;`).datasets.test.rows[0];

// Official SAS manual examples, not generated from our formatter.
// lefunctionsref.pdf pp. 1052–1054, 1385–1387 (printed).
assert.deepEqual(one(`sale='2,115,353';fmtsale=input(sale,comma9.);numdate=122591;chardate=put(numdate,z6.);sasdate=input(chardate,mmddyy6.);keep fmtsale chardate sasdate;`),{fmtsale:2115353,chardate:'122591',sasdate:11681});
// leforinforref.pdf printed pp. 174–175, 246, 551, 573, 527, 674, 726.
const date=one(`x='15MAR2018'd;`).x;
for(const [fmt,result] of [['date5.','15MAR'],['date6.',' 15MAR'],['date7.','15MAR18'],['date8.',' 15MAR18'],['date9.','15MAR2018'],['date11.','15-MAR-2018']])assert.equal(one(`x=put('15MAR2018'd,${fmt});`).x,result,fmt);
for(const [width,result] of [[2,'05'],[3,' 05'],[4,'0502'],[5,'05/02'],[6,'050218'],[7,' 050218'],[8,'05/02/18'],[10,'05/02/2018']])assert.equal(one(`x=put('02MAY2018'd,mmddyy${width}.);`).x,result);
for(const [width,result] of [[2,'18'],[3,' 18'],[4,'1804'],[5,'18-04'],[6,'180403'],[7,' 180403'],[8,'18-04-03'],[10,'2018-04-03']])assert.equal(one(`x=put('03APR2018'd,yymmdd${width}.);`).x,result);
assert.equal(one('x=put(1350,z8.);').x,'00001350');
assert.equal(one('x=put(23.45,6.3);').x,'23.450');
assert.equal(one(`x=input('$1,000,000',comma10.);`).x,1000000);
assert.equal(one(`x=input('23.48%',percent7.2);`).x,.2348);
assert.equal(one(`x=put(input('12:59:56',time8.),hhmm8.2);`).x,'12:59.93');
assert.equal(one(`x=put(input('12:59:56',time8.),hhmm5.);`).x,'13:00');

// Practical subset boundaries and exact value-changing widths.
assert.equal(display(date,'ddmmyy10.'),'15/03/2018');
assert.equal(display(date,'yymmddn8.'),'20180315');
assert.equal(display(date,'yymmddp10.'),'2018.03.15');
assert.equal(display(date,'mmddyyn8.'),'03152018');
assert.equal(display(date,'monyy7.'),'MAR2018');
assert.equal(one('x=put(1,hex16.);').x,'3FF0000000000000');
assert.equal(one('x=put(-1,hex16.);').x,'BFF0000000000000');
assert.equal(one('x=put(12,8.2);').x,'   12.00');
assert.equal(one('x=put(12,F8.2 -L);').x,'12.00   ');
assert.equal(one('x=put(12,8.2 -C);').x,' 12.00  ');
assert.equal(one('x=put(-12,z5.);').x,'-0012');
assert.equal(one('x=put(12345,3.);').x,'***'); // Documented subset overflow policy.
assert.equal(one(`x=put('   abc',$char6.);`).x,'   abc');
assert.equal(one(`x=put('abcdef',$3.);`).x,'abc');
assert.equal(one(`x=put('abc',$upcase5.);`).x,'ABC  ');
assert.equal(one(`x=input('12345',3.);`).x,123);
assert.equal(one(`x=input('1234',4.2);`).x,12.34);
assert.equal(one(`x=input('12',2.2);`).x,.12);
assert.equal(one(`x=input('12.34',5.2);`).x,12.34);
assert.equal(one(`x=input('1e2',8.2);`).x,100);
assert.equal(one(`x=input('   ',8.);`).x,null);
assert.equal(one(`x=input('(1,234.50)',comma10.);`).x,-1234.5);
assert.equal(one(`x=input('2024-02-29',yymmdd10.);`).x,23435);
assert.equal(one(`x=input('2023-02-29',??yymmdd10.);`).x,null);
assert.equal(one(`x=input('2026/1/1',??e8601da10.);`).x,null);
assert.equal(one(`x=input('2026-01-01',e8601da10.);`).x,24107);
assert.equal(one(`x=input('1/1/26',mmddyy8.);y=put(x,date9.);`).y,'01JAN1926');
assert.equal(one(`x=input('1/1/25',mmddyy8.);y=put(x,date9.);`).y,'01JAN2025');
assert.equal(one(`x=input('12:30 PM',time8.);`).x,45000);
assert.equal(one(`x=input('12:00 AM',time8.);`).x,0);
assert.equal(display(-.25,'datetime22.2'),'31DEC1959:23:59:59.75');
assert.equal(one(`x=input('2026-01-01T12:34:56.125',e8601dt23.3);y=put(x,e8601dt23.3);`).y,'2026-01-01T12:34:56.125');
assert.equal(one(`x=input('01JAN2026:12:34:56',datetime20.);y=put(x,datetime19.);`).y,' 01JAN2026:12:34:56');
let result=run(`data test;x=input('abc',8.);error=_error_;run;`);
assert.equal(result.datasets.test.rows[0].error,1);assert.match(result.logs.join('\n'),/Invalid INPUT/);
result=run(`data test;x=input('abc',?8.);error=_error_;run;`);
assert.equal(result.datasets.test.rows[0].error,1);assert.ok(!result.logs.some(x=>x.includes('Invalid INPUT')));
result=run(`data test;x=input('abc',??8.);error=_error_;run;`);
assert.equal(result.datasets.test.rows[0].error,0);assert.ok(!result.logs.some(x=>x.includes('Invalid INPUT')));
assert.equal(run(`data t;x=input('',$char4.);format x $char4.;run;`).datasets.t.types.x,'char');
assert.deepEqual(run(`data t;set source;x=input(value,??8.);error=_error_;run;`,{source:parseCSV('value\nabc\n123')}).datasets.t.rows.map(r=>r.error),[0,0]);
for(const code of ["x=put('abc',8.);","x=put(.,$4.);","x=input(.,8.);","x=input(123,8.);","x=1;format x $char4.;","x=put(1,unknown8.);","x=put(1,8.20);","x=input('1',z8.);","x=put(1,date9.2);","x=put(1,hex8.);","x=input('1','8.');","x=input('1',???8.);"])
 assert.throws(()=>one(code),undefined,code);
assert.throws(()=>parseFormat('time4.'),/TIME/);
assert.throws(()=>parseFormat('datetime7.'),/shortened/);

// Canonical MT19937/2002 reference output, seed 5489.
let generator=createMT32(5489);
assert.deepEqual(Array.from({length:10},()=>generator.uint32()),[3499211612,581869302,3890346734,3586334585,545404204,4161255391,3922919429,949333985,2715962298,1323567403]);
// Independently generated NumPy integer streams exercise many twist boundaries.
const fixture=JSON.parse(fs.readFileSync('fixtures/mt32-reference.json','utf8'));
for(const stream of fixture.streams){
 const g=createMT32(stream.seed),bytes=Buffer.alloc(fixture.draws_per_seed*4);
 for(let i=0;i<fixture.draws_per_seed;i++)bytes.writeUInt32LE(g.uint32(),i*4);
 assert.equal(createHash('sha256').update(bytes).digest('hex'),stream.sha256,'MT32 seed '+stream.seed);
}
const program=`data sample;call streaminit('MT32',12345);do i=1 to 20;u=rand('uniform');n=rand('normal');output;end;run;`;
const sample=run(program).datasets.sample.rows;
assert.deepEqual(run(program).datasets.sample.rows,sample);
assert.ok(sample.every(r=>r.u>0&&r.u<1&&Number.isFinite(r.n)));
assert.deepEqual(run(program+program.replace('data sample','data second')).datasets.second.rows,sample);
const normal=one(`call streaminit('MT32',5489);x=rand('normal');`).x;
assert.equal(one(`call streaminit('MT2002',5489);x=rand('normal',10,2);`).x,10+2*normal);
assert.equal(one(`call streaminit('MT32',5489);x=rand('uniform',-2,5);`).x,-2+7*((3499211612+.5)/2**32));
assert.equal(one(`call streaminit('MT32',5489);call streaminit('MT32',1);x=rand('uniform');`).x,(3499211612+.5)/2**32);
assert.equal(one(`call streaminit('MT32',1);x=rand('normal',7,0);`).x,7);
const many=run(`data s;call streaminit('MT32',12345);do i=1 to 10000;x=rand('normal');output;end;run;`).datasets.s.rows.map(r=>r.x);
const mean=many.reduce((a,b)=>a+b,0)/many.length,variance=many.reduce((a,b)=>a+(b-mean)**2,0)/(many.length-1);
assert.ok(Math.abs(mean)<.05 && Math.abs(variance-1)<.1,`normal mean=${mean}, variance=${variance}`);
for(const code of ["x=rand('uniform');","call streaminit(12345);","call streaminit('MTHYBRID',1);","call streaminit('MT32',0);","call streaminit('MT32',4294967296);","call streaminit('MT32',1.5);","call streaminit('MT32',1);x=rand('poisson',1);","call streaminit('MT32',1);x=rand('normal',0,-1);","call streaminit('MT32',1);x=rand('uniform',.);"])
 assert.throws(()=>one(code),undefined,code);
console.log('Format/conversion/RAND checks passed: manual examples, width effects, date validity, INPUT diagnostics, 60,000 independently matched MT32 integers, stream lifecycle, reproducibility, and normal sample sanity. SAS RAND bit equivalence is unverified.');
