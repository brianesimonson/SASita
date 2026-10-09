import {readFile,writeFile,mkdir} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {run,csv} from '../dist/engine.mjs';
const output='/tmp/sasita-large-numbers';
await mkdir(output,{recursive:true});
const source=await readFile('examples/large-numbers/04-large-numbers.sas','utf8');
const result=run(source,{});
assert.equal(result.datasets.big_number_results.rows.length,3000);
for(const row of result.datasets.big_number_results.rows)for(const value of Object.values(row))assert.ok(Number.isFinite(value));
for(const name of ['big_number_results','big_integer_edges'])await writeFile(`${output}/${name}.csv`,csv(result.datasets[name])+'\r\n');
const fields=result.datasets.big_number_results.columns;
let helper=`/* SAS ONLY. Set this to the folder containing the two supplied CSVs. */\n%let app_path = C:/SASita-large-numbers/results;\n\n${source}\n`;
for(const name of ['big_number_results','big_integer_edges']) {
 const ds=result.datasets[name];
 helper+=`data app_${name};\n  infile "&app_path./${name}.csv" dsd dlm=',' firstobs=2 termstr=crlf lrecl=32767 truncover;\n  input ${ds.columns.map(c=>c+' :best32.').join(' ')};\nrun;\n`;
}
helper+=`title 'Large-number calculations: 10-digit relative error threshold';\nproc compare base=big_number_results compare=app_big_number_results method=relative criterion=1e-10;\n  id id;\nrun;\ntitle 'Large-number calculations: 15-digit relative error threshold';\nproc compare base=big_number_results compare=app_big_number_results method=relative criterion=1e-15;\n  id id;\nrun;\ntitle 'Integer boundary: exact behavior';\nproc compare base=big_integer_edges compare=app_big_integer_edges method=exact;\n  id id;\nrun;\n`;
const operations=fields.filter(c=>!['id','scale_exp','scale','x','y'].includes(c));
helper+=`data big_number_differences;\n  merge big_number_results app_big_number_results(rename=(${fields.filter(c=>c!=='id').map(c=>c+'=app_'+c).join(' ')}));\n  by id;\n  length operation $32;\n  array reference_values[${operations.length}] ${operations.join(' ')};\n  array app_values[${operations.length}] ${operations.map(c=>'app_'+c).join(' ')};\n  do operation_index=1 to ${operations.length};\n    operation=vname(reference_values[operation_index]);\n    sas_value=reference_values[operation_index];\n    app_value=app_values[operation_index];\n    absolute_difference=abs(sas_value-app_value);\n    missing_result=missing(sas_value) or missing(app_value);\n    exceeds_10_digits=missing_result or absolute_difference>abs(sas_value)*1e-10;\n    exceeds_15_digits=missing_result or absolute_difference>abs(sas_value)*1e-15;\n    output;\n  end;\n  keep id scale_exp operation sas_value app_value absolute_difference missing_result exceeds_10_digits exceeds_15_digits;\nrun;\ntitle 'Absolute differences and counts exceeding precision thresholds';\nproc means data=big_number_differences n max sum;\n  class operation;\n  var absolute_difference missing_result exceeds_10_digits exceeds_15_digits;\nrun;\nproc export data=big_number_differences outfile="&app_path./sas_big_number_differences.csv" dbms=csv replace;run;\ntitle;\n`;
await writeFile('examples/large-numbers/05-sas-large-number-comparison.sas',helper);
console.log('Generated 3,000 finite large-number rows, integer edges, and a self-contained SAS comparison helper.');
