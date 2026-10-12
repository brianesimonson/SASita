import {readFile,writeFile} from 'node:fs/promises';
import {runFileProgram,projectCSV} from '../dist/file-program.mjs';
import {portableZip} from '../dist/portable-export.mjs';
const home=new URL('../examples/weights-validation/',import.meta.url),files={};
const original=await readFile(new URL('../examples/glm-validation/01-sas-glm-comparison.sas',import.meta.url),'utf8');
let sas=original.split('/* published */')[0].replace('Sassy v0.4.11','Sassy v0.4.14')+'\n/* WEIGHT validation: deterministic examples, no uploads besides this program. */\n';
const cases=[];
const base=`data m; length g $1;
g='A'; x=1; y=2; w=1; output;
g='A'; x=3; y=.; w=3; output;
g='A'; x=100; y=7; w=0; output;
g='A'; x=-100; y=8; w=-2; output;
g='B'; x=999; y=999; w=.; output;
g='B'; x=.; y=4; w=2; output;
g='B'; x=5; y=6; w=.3; output;
g='B'; x=7; y=9; w=.8; output;
run;`;
for(const [name,definition,exclude] of [['means_df','df',''],['means_exclude','df','exclnpwgt'],['means_n','n',''],['means_wdf','wdf',''],['means_wgt','wgt','']]){
 const requests=`n=count nmiss=missing_count sum=total sumwgt=weights mean=average min=lo max=hi var=variance std=sd css=css uss=uss${definition==='df'?' stderr=se':''}`;
 // One analysis variable per case keeps keys and output columns simple; missing x tests per-variable rules.
 const code=base+`proc means data=m ${exclude} vardef=${definition}; class g; var x; weight w; output out=${name} ${requests}; run;`;
 cases.push({name,code,checks:[[name,'g _type_','_freq_ count missing_count total weights average lo hi variance sd css uss'+(definition==='df'?' se':'')]]});
}
const ref=JSON.parse(await readFile(new URL('../fixtures/weighted-glm-independent.json',import.meta.url),'utf8'));
const data=`data weighted; length a $2 b $2;\n${ref.rows.map((r,i)=>`id=${i+1}; a='${r.a}'; b='${r.b}'; x=${r.x}; y=${r.y}; w=${r.w}; output;`).join('\n')}\nrun;`;
for(const [name,source,model,classes] of [['glm_weighted',data,ref.model,'class a b;'],['glm_weight_edges',`data weighted; do id=1 to 6; x=id; y=2+3*x+mod(id,2)/2; w=id/2; output; end; id=7; x=99; y=-999; w=0; output; id=8; x=100; w=-1; output; id=9; x=101; w=.; output; id=10; x=7; y=.; w=2; output; run;`,'x','']]){
 const code=source+`ods output OverallANOVA=${name}_anova ModelANOVA=${name}_tests ParameterEstimates=${name}_params FitStatistics=${name}_fit; proc glm data=weighted; ${classes} model y=${model} / solution; weight w; output out=${name}_scored p=predicted r=residual; run; quit; ods output close;`;
 cases.push({name,code,checks:[['_anova','source','df ss ms fvalue probf'],['_tests','source hypothesistype','df ss ms fvalue probf'],['_params','parameter','estimate stderr tvalue probt'],['_fit','','rsquare coeffvar rootmse depmean'],['_scored','id','predicted residual']].map(([suffix,...rest])=>[name+suffix,...rest])});
}
for(const c of cases){
 const result=await runFileProgram(c.code);files[c.name+'.sas']=c.code+'\n';
 sas+=`\n/* ${c.name} */\nproc datasets lib=work nolist; delete ${c.checks.map(([name])=>name).join(' ')}; quit;\ntitle;\n${c.code}\n`;
 for(const [name,keys,variables] of c.checks){
  const ds=result.datasets[name],columns=[...new Set((keys+' '+variables).split(' ').filter(Boolean))],csv=projectCSV({...ds,columns}),expected='app_'+name;
  files[name+'.csv']=csv;
  const lengths=columns.map(k=>k+' '+(ds.types[k]==='char'?'$128':'8')).join(' '),inputs=columns.map(k=>k+' :'+(ds.types[k]==='char'?'$128.':'best32.')).join(' ');
  sas+=`data ${expected}; length ${lengths}; infile datalines4 dsd dlm=',' truncover; input ${inputs};\ndatalines4;\n${csv.split('\n').slice(1).join('\n').trimEnd()}\n;;;;\nrun;\n%glm_check(${name},${expected},${keys},${variables},absolute=${name.endsWith('_scored')?1:0});\n`;
 }
}
sas+='title;\n';files['01-sas-weight-comparison.sas']=sas;
files['README.md']=`# WEIGHT validation — Sassy v0.4.14\n\nUpload only 01-sas-weight-comparison.sas to SAS Studio and run the entire program. No CSV imports or folder edits needed. Return the Results and Log. Fifteen comparison groups cover weighted MEANS CLASS totals, missing/nonpositive weights, EXCLNPWGT, four variance divisors, SUMWGT and standard errors, plus weighted GLM CLASS/interactions and a regression with excluded weights/missing responses.\n\nStatistics use relative 1e-10 and modest-scale P/R use absolute 1e-12. The helper maps CV/coeffvar, fixture A*X/X*A labels and special missing codes for numeric comparison; descriptors/layout/bit identity are not certified. Predictions for excluded-weight rows and weighted fit statistics are specifically included for SAS confirmation.\n\nLocal independent NumPy/SciPy weighted GLM and documented MEANS formula checks passed; this newly generated weighted SAS kit has not yet run in SAS. WEIGHT is not FREQ or complex-survey variance estimation. Other model restrictions remain. Archive CSVs/models need not be uploaded for this comparison.\n`;
for(const [name,text] of Object.entries(files))await writeFile(new URL(name,home),text);
await writeFile(new URL('weights-validation.zip',home),portableZip(files));console.log('Fifteen self-contained weighted SAS comparisons packaged.');
