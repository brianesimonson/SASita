// Compare real SAS reference data; matching our own output is not SAS evidence.
import fs from 'node:fs';
import {run,parseCSV} from '../dist/engine.mjs';
const file=process.argv[2];
if(!file){console.error('Usage: node scripts/compare-sas-rand.mjs path/to/rand-reference.csv');process.exit(2);}
const reference=parseCSV(fs.readFileSync(file,'utf8'));
for(const column of ['seed','mode','id','u_hex','n_hex'])if(!reference.columns.includes(column))throw new Error('Missing reference column '+column);
const keys=new Set(),expected=new Map();
for(const seed of [1,12345,8192,4294967295])for(const mode of ['uniform','normal','mixed']){
 const samples=mode==='uniform'?`u_hex=put(rand('uniform'),hex16.);`:mode==='normal'?`n_hex=put(rand('normal'),hex16.);`:`u_hex=put(rand('uniform'),hex16.);n_hex=put(rand('normal'),hex16.);`;
 const result=run(`data s;call streaminit('MT32',${seed});do id=1 to 32;u_hex='';n_hex='';${samples}output;end;run;`).datasets.s;
 for(const row of result.rows)expected.set(`${seed}/${mode}/${row.id}`,row);
}
let compared=0,mismatches=0;
for(const row of reference.rows){
 const key=`${row.seed}/${String(row.mode).trim().toLowerCase()}/${row.id}`,actual=expected.get(key);
 if(!actual||keys.has(key))throw new Error('Unknown or duplicate reference row '+key);
 keys.add(key);
 for(const field of ['u_hex','n_hex']){
  const ref=String(row[field]??'').trim().toUpperCase();
  if(ref&&!/^[0-9A-F]{16}$/.test(ref))throw new Error('Invalid HEX16 reference '+key+' '+field);
  if(ref!==actual[field]){if(mismatches<12)console.error(`${key} ${field}: SAS=${ref} app=${actual[field]}`);mismatches++;}
  if(actual[field])compared++;
 }
}
if(keys.size!==expected.size)throw new Error(`Incomplete reference: ${keys.size} of ${expected.size} expected rows`);
console.log(`${reference.rows.length} rows, ${compared} exact hexadecimal comparisons, ${mismatches} mismatches.`);
if(mismatches)process.exitCode=1;
