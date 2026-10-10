import {readFile,writeFile} from 'node:fs/promises';
import {runFileProgram,projectCSV} from '../dist/file-program.mjs';
import {portableZip} from '../dist/portable-export.mjs';
const home=new URL('../examples/means-validation/',import.meta.url);
const code=await readFile(new URL('01-means-validation.sas',home),'utf8');
const result=await runFileProgram(code),files={};
for(const name of ['means_all','means_missing','means_nway','means_default','means_by','means_large']){const text=projectCSV(result.datasets[name]);await writeFile(new URL('app_'+name+'.csv',home),text);files['app_'+name+'.csv']=text;}
// The schema comes from the actual generated tables, never CSV type guessing.
const checks=[
 ['means_all','site period _type_','_freq_ amount_n other_n amount_nmiss other_nmiss amount_mean other_mean amount_stddev other_stddev amount_var other_var amount_min other_min amount_max other_max'],
 ['means_missing','site period _type_','_freq_ count missing_count avg'],
 ['means_nway','site period _type_','_freq_ count avg'],
 ['means_default','_type_ _stat_','_freq_ amount other'],
 ['means_by','site _type_','_freq_ count avg variance'],
 ['means_large','_type_','_freq_ count avg variance sd css']
];
let comparison=`/* SAS ONLY. Run 01-means-validation.sas first. Upload the six app_*.csv files.
   Explicit column types avoid PROC IMPORT classifying quoted numbers as text.
   This file is generated from Sassy's result schema; edit only the folder below. */
%let app_csv_folder = /replace/with/your/upload/folder;
%macro check(table, keys, variables, lengths, inputs);
    title "PROC MEANS validation: &table";
    data app_&table;
        length &lengths;
        infile "&app_csv_folder/app_&table..csv"
            dsd dlm=',' firstobs=2 truncover lrecl=32767;
        input &inputs;
        if _error_ then do;
            putlog 'ERROR: Invalid validation CSV value. Inspect the SAS log.';
            stop;
        end;
    run;
    %if &table=means_all %then %do;
        proc contents data=&table varnum; run;
    %end;
    proc sort data=&table out=base_sorted; by &keys; run;
    proc sort data=app_&table out=app_sorted; by &keys; run;
    proc compare base=base_sorted compare=app_sorted
        method=relative criterion=1e-12;
        id &keys;
        var &variables;
    run;
%mend;
`;
for(const [name,keys,variables] of checks){
 const ds=result.datasets[name];
 const lengths=ds.columns.map(c=>c+' '+(ds.types[c]==='char'?'$ '+(ds.lengths[c]||32):'8')).join(' ');
 const inputs=ds.columns.map(c=>c+' :'+(ds.types[c]==='char'?'$'+(ds.lengths[c]||32)+'.':'best32.')).join(' ');
 comparison+=`%check(${name}, ${keys}, ${variables}, ${lengths}, ${inputs});\n`;
}
comparison+=`title;
/* Dataset labels/formats may still differ; the explicit character lengths and
   numeric types preserve IDs/counts so actual VALUES can be compared. Return
   both HTML results and the SAS log, especially if any comparison is absent. */
`;
await writeFile(new URL('02-sas-comparison.sas',home),comparison);
for(const name of ['01-means-validation.sas','02-sas-comparison.sas','README.md'])files[name]=await readFile(new URL(name,home),'utf8');
await writeFile(new URL('means-validation.zip',home),portableZip(files));
console.log('Six deterministic PROC MEANS validation CSVs and SAS comparison ZIP created.');
