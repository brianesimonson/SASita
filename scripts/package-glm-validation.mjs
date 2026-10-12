import {readFile,writeFile} from 'node:fs/promises';
import {runFileProgram,projectCSV} from '../dist/file-program.mjs';
import {portableZip} from '../dist/portable-export.mjs';
const home=new URL('../examples/glm-validation/',import.meta.url);
const ref=JSON.parse(await readFile(new URL('../fixtures/glm-independent.json',import.meta.url),'utf8'));
const cases=[
 {name:'published',code:await readFile(new URL('../examples/catalog/10-glm.sas',import.meta.url),'utf8')},
 {name:'ancova',code:`data glm_study; length a $2 b $2; ${ref.rows.map((r,i)=>`id=${i+1}; a='${r.a}'; b='${r.b}'; x=${r.x}; y=${r.y}; output;`).join('\n')} run;
ods output OverallANOVA=glm_anova ModelANOVA=glm_tests ParameterEstimates=glm_parameters FitStatistics=glm_fit;
proc glm data=glm_study; class a b; model y=${ref.model} / solution; output out=glm_scored p=predicted r=residual; run; quit; ods output close;`}
];
const comparisons=[['glm_anova','source','df ss ms fvalue probf'],['glm_tests','source hypothesistype','df ss ms fvalue probf'],['glm_parameters','parameter','estimate stderr tvalue probt'],['glm_fit','','rsquare coeffvar rootmse depmean'],['glm_scored','id','predicted residual']];
// SAS-only, self-contained: typed expected values are embedded, not inferred/imported.
let sas=`/* SAS ONLY: run this entire program in SAS Studio. No folder, CSV uploads,
   or edits needed. Expected numbers were computed by Sassy v0.4.11.
   Validation helper revision 2: maps A*X to X*A for these models only;
   normalizes SAS special missing values to ordinary missing for value checks;
   scored P/R use absolute 1e-12, other checks relative 1e-10.
   This does not certify full ODS metadata or exact source-label compatibility. */
%macro glm_check(base,expected,keys,variables,absolute=0);
  %local ds k field absent rc cv_option;
  %let cv_option=;
  %let absent=0;
  %let ds=%sysfunc(open(&base));
  %if &ds=0 %then %do;
    %put ERROR: Missing SAS table &base. This comparison did not run.;
    %return;
  %end;
  /* Some PROC GLM versions call coefficient of variation CV in ODS. */
  %if %index(%str( &variables ),coeffvar) %then %do;
    %if %sysfunc(varnum(&ds,coeffvar))=0 and %sysfunc(varnum(&ds,CV))>0 %then %do;
      %let cv_option=(rename=(CV=coeffvar));
      %put NOTE: GLM validation maps SAS CV to app coeffvar.;
    %end;
  %end;
  %do k=1 %to %sysfunc(countw(&keys &variables));
    %let field=%scan(&keys &variables,&k);
    %if %sysfunc(varnum(&ds,&field))=0 %then %do;
      %if &field=coeffvar and %length(&cv_option) %then %do; %end;
      %else %do;
        %put ERROR: Missing column &field in &base. Return the log and results.;
        %let absent=1;
      %end;
    %end;
  %end;
  %let rc=%sysfunc(close(&ds));
  %if &absent %then %do;
    title "GLM comparison did not run: &base — inspect columns";
    proc contents data=&base varnum; run;
    %return;
  %end;
  data sas_check; set &base &cv_option;
    %if %index(%str( &keys ),source) %then %do; source=tranwrd(upcase(compbl(source)),'A*X','X*A'); %end;
    %if %index(%str( &keys ),parameter) %then %do; parameter=tranwrd(upcase(compbl(parameter)),'A*X','X*A'); %end;
    array check_numbers _numeric_;
    do over check_numbers; if missing(check_numbers) then check_numbers=.; end;
  run;
  data app_check; set &expected;
    %if %index(%str( &keys ),source) %then %do; source=tranwrd(upcase(compbl(source)),'A*X','X*A'); %end;
    %if %index(%str( &keys ),parameter) %then %do; parameter=tranwrd(upcase(compbl(parameter)),'A*X','X*A'); %end;
  run;
  %if %length(&keys) %then %do;
    proc sort data=sas_check; by &keys; run;
    proc sort data=app_check; by &keys; run;
  %end;
  title "GLM values: &base vs &expected";
  proc compare base=sas_check compare=app_check
    %if &absolute %then %do; method=absolute criterion=1e-12 %end;
    %else %do; method=relative criterion=1e-10 %end;
    ;
    %if %length(&keys) %then %do; id &keys; %end;
    var &variables;
  run;
%mend;
`;
const files={};
for(const c of cases){
 // Add a stable observation key to the published seven-row example.
 let code=c.code.replace('ods output OverallANOVA=', 'data glm_study; set glm_study; id=_n_; run;\nods output OverallANOVA=');
 const result=await runFileProgram(code);
 const sasCode=code.replaceAll(/\b(glm_anova|glm_tests|glm_parameters|glm_fit|glm_scored)\b/g,m=>c.name+'_'+m);
 files[c.name+'-model.sas']=code;
 sas+='\n/* '+c.name+' */\nproc datasets lib=work nolist; delete '+comparisons.map(([table])=>c.name+'_'+table).join(' ')+'; quit;\ntitle;\n'+sasCode+'\n';
 for(const [table,keys,variables] of comparisons){
  const ds=result.datasets[table],expected='app_'+c.name+'_'+table.slice(4);
  const columns=[...new Set([...keys.split(' ').filter(Boolean),...variables.split(' ')])];
  const subset={...ds,columns};
  const lengths=columns.map(k=>k+' '+(ds.types[k]==='char'?'$128':'8')).join(' ');
  const inputs=columns.map(k=>k+' :'+(ds.types[k]==='char'?'$128.':'best32.')).join(' ');
  const csv=projectCSV(subset);files[c.name+'-'+table+'.csv']=csv;
  sas+=`data ${expected}; length ${lengths}; infile datalines4 dsd dlm=',' truncover; input ${inputs};\ndatalines4;\n${csv.split('\n').slice(1).join('\n').trimEnd()}\n;;;;\nrun;\n`;
  sas+=`%glm_check(${c.name}_${table},${expected},${keys},${variables},absolute=${table==='glm_scored'?1:0});\n`;
 }
 sas+=`title "${c.name}: actual SAS ODS descriptors"; proc contents data=${c.name}_glm_parameters varnum; run; proc contents data=${c.name}_glm_fit varnum; run; title;\n`;
}
sas+='title;\n';
files['01-sas-glm-comparison.sas']=sas;
files['README.md']=`# PROC GLM validation — Sassy v0.4.11, helper revision 2\n\nUpload only 01-sas-glm-comparison.sas to SAS Studio, open it and run the entire program. No folder edits or CSV uploads are needed: Sassy results are embedded with explicit types and full double precision. Download the SAS HTML Results and Log and return both.\n\nTwo models cover the manual’s unbalanced 2×2 example and an unbalanced 3×2 design with a numeric covariate, CLASS interaction and class-by-covariate interaction. Compare OverallANOVA, Type I/III ModelANOVA, SOLUTION estimates/SE/t/p, fit statistics, predictions and residuals. Statistics use relative criterion 1e-10; the modest-scale prediction/residual fixture uses absolute criterion 1e-12, including near-zero residuals. These thresholds are not a promise of fixed decimal places or bit identity. Missing tables/columns are explicit errors, not passes. Label casing/multiple spaces are normalized; A*X is mapped to X*A explicitly for these fixture models. This checks numbers without claiming actual app labels already match SAS. Special SAS missing codes are normalized to ordinary missing for value comparisons. SAS CV is mapped to coeffvar when present; unknown fields still fail and print descriptors. Exact special-missing codes are not certified. B flags, labels/formats/lengths and all ODS descriptors are not certified by these numeric checks.\n\nThe other SAS model files run in Sassy too; CSVs archive the expected results but are not needed for the SAS comparison. Models are deterministic and do not depend on random stream agreement. Actual SAS results for the first helper confirm the matched calculations, but expose label, special-missing and near-zero comparison issues, plus absent fit checks. The uploaded log identifies a missing coeffvar column. This helper addresses those checks; this newly generated program has not yet run in SAS.\n`;
for(const [name,text] of Object.entries(files))await writeFile(new URL(name,home),text);
await writeFile(new URL('glm-validation.zip',home),portableZip(files));
console.log('Self-contained two-model GLM SAS comparison and archived expected CSVs packaged.');
