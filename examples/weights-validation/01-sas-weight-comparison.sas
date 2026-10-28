/* SAS ONLY: run this entire program in SAS Studio. No folder, CSV uploads,
   or edits needed. Expected numbers were computed by Sassy v0.4.18.
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


/* WEIGHT validation: deterministic examples, no uploads besides this program. */

/* means_df */
proc datasets lib=work nolist; delete means_df; quit;
title;
data m; length g $1;
g='A'; x=1; y=2; w=1; output;
g='A'; x=3; y=.; w=3; output;
g='A'; x=100; y=7; w=0; output;
g='A'; x=-100; y=8; w=-2; output;
g='B'; x=999; y=999; w=.; output;
g='B'; x=.; y=4; w=2; output;
g='B'; x=5; y=6; w=.3; output;
g='B'; x=7; y=9; w=.8; output;
run;proc means data=m  vardef=df; class g; var x; weight w; output out=means_df n=count nmiss=missing_count sum=total sumwgt=weights mean=average min=lo max=hi var=variance std=sd css=css uss=uss stderr=se; run;
data app_means_df; length g $128 _type_ 8 _freq_ 8 count 8 missing_count 8 total 8 weights 8 average 8 lo 8 hi 8 variance 8 sd 8 css 8 uss 8 se 8; infile datalines4 dsd dlm=',' truncover; input g :$128. _type_ :best32. _freq_ :best32. count :best32. missing_count :best32. total :best32. weights :best32. average :best32. lo :best32. hi :best32. variance :best32. sd :best32. css :best32. uss :best32. se :best32.;
datalines4;
"","0","8","6","1","17.1","5.1","3.3529411764705883","-100","100","3.472941176470589","1.863582886933283","17.364705882352943","74.7","0.8252083725529499"
"A","1","4","4","0","10","4","2.5","-100","100","1","1","3","28","0.5"
"B","1","4","2","1","7.1000000000000005","1.1","6.454545454545455","5","7","0.8727272727272728","0.9341987329938276","0.8727272727272728","46.7","0.8907235428302466"
;;;;
run;
%glm_check(means_df,app_means_df,g _type_,_freq_ count missing_count total weights average lo hi variance sd css uss se,absolute=0);

/* means_exclude */
proc datasets lib=work nolist; delete means_exclude; quit;
title;
data m; length g $1;
g='A'; x=1; y=2; w=1; output;
g='A'; x=3; y=.; w=3; output;
g='A'; x=100; y=7; w=0; output;
g='A'; x=-100; y=8; w=-2; output;
g='B'; x=999; y=999; w=.; output;
g='B'; x=.; y=4; w=2; output;
g='B'; x=5; y=6; w=.3; output;
g='B'; x=7; y=9; w=.8; output;
run;proc means data=m exclnpwgt vardef=df; class g; var x; weight w; output out=means_exclude n=count nmiss=missing_count sum=total sumwgt=weights mean=average min=lo max=hi var=variance std=sd css=css uss=uss stderr=se; run;
data app_means_exclude; length g $128 _type_ 8 _freq_ 8 count 8 missing_count 8 total 8 weights 8 average 8 lo 8 hi 8 variance 8 sd 8 css 8 uss 8 se 8; infile datalines4 dsd dlm=',' truncover; input g :$128. _type_ :best32. _freq_ :best32. count :best32. missing_count :best32. total :best32. weights :best32. average :best32. lo :best32. hi :best32. variance :best32. sd :best32. css :best32. uss :best32. se :best32.;
datalines4;
"","0","8","4","1","17.1","5.1","3.3529411764705883","1","7","5.788235294117648","2.405875161789915","17.364705882352943","74.7","1.065339428016167"
"A","1","4","2","0","10","4","2.5","1","3","3","1.7320508075688772","3","28","0.8660254037844386"
"B","1","4","2","1","7.1000000000000005","1.1","6.454545454545455","5","7","0.8727272727272728","0.9341987329938276","0.8727272727272728","46.7","0.8907235428302466"
;;;;
run;
%glm_check(means_exclude,app_means_exclude,g _type_,_freq_ count missing_count total weights average lo hi variance sd css uss se,absolute=0);

/* means_n */
proc datasets lib=work nolist; delete means_n; quit;
title;
data m; length g $1;
g='A'; x=1; y=2; w=1; output;
g='A'; x=3; y=.; w=3; output;
g='A'; x=100; y=7; w=0; output;
g='A'; x=-100; y=8; w=-2; output;
g='B'; x=999; y=999; w=.; output;
g='B'; x=.; y=4; w=2; output;
g='B'; x=5; y=6; w=.3; output;
g='B'; x=7; y=9; w=.8; output;
run;proc means data=m  vardef=n; class g; var x; weight w; output out=means_n n=count nmiss=missing_count sum=total sumwgt=weights mean=average min=lo max=hi var=variance std=sd css=css uss=uss; run;
data app_means_n; length g $128 _type_ 8 _freq_ 8 count 8 missing_count 8 total 8 weights 8 average 8 lo 8 hi 8 variance 8 sd 8 css 8 uss 8; infile datalines4 dsd dlm=',' truncover; input g :$128. _type_ :best32. _freq_ :best32. count :best32. missing_count :best32. total :best32. weights :best32. average :best32. lo :best32. hi :best32. variance :best32. sd :best32. css :best32. uss :best32.;
datalines4;
"","0","8","6","1","17.1","5.1","3.3529411764705883","-100","100","2.894117647058824","1.7012106415899308","17.364705882352943","74.7"
"A","1","4","4","0","10","4","2.5","-100","100","0.75","0.8660254037844386","3","28"
"B","1","4","2","1","7.1000000000000005","1.1","6.454545454545455","5","7","0.4363636363636364","0.6605782590758164","0.8727272727272728","46.7"
;;;;
run;
%glm_check(means_n,app_means_n,g _type_,_freq_ count missing_count total weights average lo hi variance sd css uss,absolute=0);

/* means_wdf */
proc datasets lib=work nolist; delete means_wdf; quit;
title;
data m; length g $1;
g='A'; x=1; y=2; w=1; output;
g='A'; x=3; y=.; w=3; output;
g='A'; x=100; y=7; w=0; output;
g='A'; x=-100; y=8; w=-2; output;
g='B'; x=999; y=999; w=.; output;
g='B'; x=.; y=4; w=2; output;
g='B'; x=5; y=6; w=.3; output;
g='B'; x=7; y=9; w=.8; output;
run;proc means data=m  vardef=wdf; class g; var x; weight w; output out=means_wdf n=count nmiss=missing_count sum=total sumwgt=weights mean=average min=lo max=hi var=variance std=sd css=css uss=uss; run;
data app_means_wdf; length g $128 _type_ 8 _freq_ 8 count 8 missing_count 8 total 8 weights 8 average 8 lo 8 hi 8 variance 8 sd 8 css 8 uss 8; infile datalines4 dsd dlm=',' truncover; input g :$128. _type_ :best32. _freq_ :best32. count :best32. missing_count :best32. total :best32. weights :best32. average :best32. lo :best32. hi :best32. variance :best32. sd :best32. css :best32. uss :best32.;
datalines4;
"","0","8","6","1","17.1","5.1","3.3529411764705883","-100","100","4.23529411764706","2.0579830217101063","17.364705882352943","74.7"
"A","1","4","4","0","10","4","2.5","-100","100","1","1","3","28"
"B","1","4","2","1","7.1000000000000005","1.1","6.454545454545455","5","7","8.72727272727272","2.9541957835039843","0.8727272727272728","46.7"
;;;;
run;
%glm_check(means_wdf,app_means_wdf,g _type_,_freq_ count missing_count total weights average lo hi variance sd css uss,absolute=0);

/* means_wgt */
proc datasets lib=work nolist; delete means_wgt; quit;
title;
data m; length g $1;
g='A'; x=1; y=2; w=1; output;
g='A'; x=3; y=.; w=3; output;
g='A'; x=100; y=7; w=0; output;
g='A'; x=-100; y=8; w=-2; output;
g='B'; x=999; y=999; w=.; output;
g='B'; x=.; y=4; w=2; output;
g='B'; x=5; y=6; w=.3; output;
g='B'; x=7; y=9; w=.8; output;
run;proc means data=m  vardef=wgt; class g; var x; weight w; output out=means_wgt n=count nmiss=missing_count sum=total sumwgt=weights mean=average min=lo max=hi var=variance std=sd css=css uss=uss; run;
data app_means_wgt; length g $128 _type_ 8 _freq_ 8 count 8 missing_count 8 total 8 weights 8 average 8 lo 8 hi 8 variance 8 sd 8 css 8 uss 8; infile datalines4 dsd dlm=',' truncover; input g :$128. _type_ :best32. _freq_ :best32. count :best32. missing_count :best32. total :best32. weights :best32. average :best32. lo :best32. hi :best32. variance :best32. sd :best32. css :best32. uss :best32.;
datalines4;
"","0","8","6","1","17.1","5.1","3.3529411764705883","-100","100","3.40484429065744","1.8452220166303674","17.364705882352943","74.7"
"A","1","4","4","0","10","4","2.5","-100","100","0.75","0.8660254037844386","3","28"
"B","1","4","2","1","7.1000000000000005","1.1","6.454545454545455","5","7","0.7933884297520661","0.8907235428302466","0.8727272727272728","46.7"
;;;;
run;
%glm_check(means_wgt,app_means_wgt,g _type_,_freq_ count missing_count total weights average lo hi variance sd css uss,absolute=0);

/* glm_weighted */
proc datasets lib=work nolist; delete glm_weighted_anova glm_weighted_tests glm_weighted_params glm_weighted_fit glm_weighted_scored; quit;
title;
data weighted; length a $2 b $2;
id=1; a='A1'; b='B1'; x=0; y=4.5; w=0.25; output;
id=2; a='A1'; b='B1'; x=1; y=6.1000000000000005; w=0.75; output;
id=3; a='A1'; b='B1'; x=2; y=7.2; w=1.25; output;
id=4; a='A1'; b='B1'; x=3; y=7.6000000000000005; w=1.75; output;
id=5; a='A1'; b='B2'; x=0.3; y=3.47; w=2.25; output;
id=6; a='A1'; b='B2'; x=1.3; y=5.07; w=2.75; output;
id=7; a='A1'; b='B2'; x=2.3; y=6.17; w=3.25; output;
id=8; a='A1'; b='B2'; x=3.3; y=6.57; w=0.25; output;
id=9; a='A1'; b='B2'; x=4.3; y=7.07; w=0.75; output;
id=10; a='A2'; b='B1'; x=-0.7; y=5.59; w=1.25; output;
id=11; a='A2'; b='B1'; x=0.30000000000000004; y=7.590000000000001; w=1.75; output;
id=12; a='A2'; b='B1'; x=1.3; y=9.09; w=2.25; output;
id=13; a='A2'; b='B1'; x=2.3; y=9.89; w=2.75; output;
id=14; a='A2'; b='B1'; x=3.3; y=10.79; w=3.25; output;
id=15; a='A2'; b='B2'; x=-0.39999999999999997; y=5.279999999999999; w=0.25; output;
id=16; a='A2'; b='B2'; x=0.6000000000000001; y=7.28; w=0.75; output;
id=17; a='A2'; b='B2'; x=1.6; y=8.780000000000001; w=1.25; output;
id=18; a='A2'; b='B2'; x=2.5999999999999996; y=9.579999999999998; w=1.75; output;
id=19; a='A2'; b='B2'; x=3.5999999999999996; y=10.479999999999999; w=2.25; output;
id=20; a='A2'; b='B2'; x=4.6; y=12.479999999999999; w=2.75; output;
id=21; a='A3'; b='B1'; x=-1.4; y=6.12; w=3.25; output;
id=22; a='A3'; b='B1'; x=-0.3999999999999999; y=8.52; w=0.25; output;
id=23; a='A3'; b='B1'; x=0.6000000000000001; y=10.420000000000002; w=0.75; output;
id=24; a='A3'; b='B1'; x=1.6; y=11.62; w=1.25; output;
id=25; a='A3'; b='B1'; x=2.6; y=12.92; w=1.75; output;
id=26; a='A3'; b='B1'; x=3.6; y=15.32; w=2.25; output;
id=27; a='A3'; b='B2'; x=-1.0999999999999999; y=6.53; w=2.75; output;
id=28; a='A3'; b='B2'; x=-0.09999999999999992; y=8.93; w=3.25; output;
id=29; a='A3'; b='B2'; x=0.9000000000000001; y=10.83; w=0.25; output;
id=30; a='A3'; b='B2'; x=1.9000000000000001; y=12.03; w=0.75; output;
id=31; a='A3'; b='B2'; x=2.9; y=13.33; w=1.25; output;
id=32; a='A3'; b='B2'; x=3.9; y=15.73; w=1.75; output;
id=33; a='A3'; b='B2'; x=4.8999999999999995; y=17.63; w=2.25; output;
run;ods output OverallANOVA=glm_weighted_anova ModelANOVA=glm_weighted_tests ParameterEstimates=glm_weighted_params FitStatistics=glm_weighted_fit; proc glm data=weighted; class a b; model y=a b x a*b a*x / solution; weight w; output out=glm_weighted_scored p=predicted r=residual; run; quit; ods output close;
data app_glm_weighted_anova; length source $128 df 8 ss 8 ms 8 fvalue 8 probf 8; infile datalines4 dsd dlm=',' truncover; input source :$128. df :best32. ss :best32. ms :best32. fvalue :best32. probf :best32.;
datalines4;
"Model","8","671.9930544970512","83.9991318121314","347.40733708028324","6.890507420048899e-23"
"Error","24","5.802926272179668","0.24178859467415284","",""
"Corrected Total","32","677.7959807692307","","",""
;;;;
run;
%glm_check(glm_weighted_anova,app_glm_weighted_anova,source,df ss ms fvalue probf,absolute=0);
data app_glm_weighted_tests; length source $128 hypothesistype 8 df 8 ss 8 ms 8 fvalue 8 probf 8; infile datalines4 dsd dlm=',' truncover; input source :$128. hypothesistype :best32. df :best32. ss :best32. ms :best32. fvalue :best32. probf :best32.;
datalines4;
"A","1","2","245.48265969844195","122.74132984922097","507.63903903173644","2.300136983904956e-20"
"A","3","2","56.38392442384089","28.191962211920444","116.5975684250675","4.358949829059462e-13"
"B","1","1","2.629971233450719","2.629971233450719","10.877151740738674","0.003026246581213288"
"B","3","1","4.07150851879547","4.07150851879547","16.839125618321457","0.00040546576692975715"
"X","1","1","404.9316229260483","404.9316229260483","1674.7341762408425","1.0261062973503788e-23"
"X","3","1","156.3696511914497","156.3696511914497","646.7205428038561","7.221743488438279e-19"
"A*B","1","2","4.284572597238649","2.1422862986193243","8.860162744675295","0.0013132960695943219"
"A*B","3","2","3.368894871258361","1.6844474356291805","6.966612457048404","0.0041143165989280285"
"A*X","1","2","14.664228041871544","7.332114020935772","30.32448255393071","2.698205762183098e-7"
"A*X","3","2","14.664228041871562","7.332114020935781","30.32448255393075","2.698205762183069e-7"
;;;;
run;
%glm_check(glm_weighted_tests,app_glm_weighted_tests,source hypothesistype,df ss ms fvalue probf,absolute=0);
data app_glm_weighted_params; length parameter $128 estimate 8 stderr 8 tvalue 8 probt 8; infile datalines4 dsd dlm=',' truncover; input parameter :$128. estimate :best32. stderr :best32. tvalue :best32. probt :best32.;
datalines4;
"Intercept","8.754328281968329","0.16045488905821745","54.55943619637553","1.108483552940915e-26"
"A A1","-5.131576305133493","0.3134477586168904","-16.371392565628554","1.5921701741001986e-14"
"A A2","-2.2852311739013587","0.33561050413369475","-6.8091765476774455","4.829206716361745e-7"
"A A3","0","","",""
"B B1","-0.041524639967020424","0.21400713748773648","-0.19403390211412908","0.847782306129012"
"B B2","0","","",""
"X","1.78644644985527","0.048015551183080735","37.20558039714352","9.752450893553544e-23"
"A*B A1 B1","1.3662389734117248","0.3676848758565687","3.715787793090203","0.0010769361561804053"
"A*B A1 B2","0","","",""
"A*B A2 B1","0.569304853056823","0.3246048460845299","1.7538396605100932","0.09222148607206636"
"A*B A2 B2","0","","",""
"A*B A3 B1","0","","",""
"A*B A3 B2","0","","",""
"A*X A1","-0.8205482429279946","0.1350814808531953","-6.074468815009181","0.000002837964627095232"
"A*X A2","-0.5496245320470508","0.09308525346475804","-5.904528500372381","0.000004310868778510008"
"A*X A3","0","","",""
;;;;
run;
%glm_check(glm_weighted_params,app_glm_weighted_params,parameter,estimate stderr tvalue probt,absolute=0);
data app_glm_weighted_fit; length rsquare 8 coeffvar 8 rootmse 8 depmean 8; infile datalines4 dsd dlm=',' truncover; input rsquare :best32. coeffvar :best32. rootmse :best32. depmean :best32.;
datalines4;
"0.9914385354342262","5.263368035820967","0.4917200368849665","9.342307692307692"
;;;;
run;
%glm_check(glm_weighted_fit,app_glm_weighted_fit,,rsquare coeffvar rootmse depmean,absolute=0);
data app_glm_weighted_scored; length id 8 predicted 8 residual 8; infile datalines4 dsd dlm=',' truncover; input id :best32. predicted :best32. residual :best32.;
datalines4;
"1","4.94746631027954","-0.4474663102795402"
"2","5.913364517206816","0.18663548279318487"
"3","6.879262724134091","0.32073727586590906"
"4","7.845160931061367","-0.24516093106136605"
"5","3.9125214389130187","-0.44252143891301854"
"6","4.878419645840294","0.1915803541597061"
"7","5.84431785276757","0.3256821472324303"
"8","6.810216059694844","-0.24021605969484394"
"9","7.77611426662212","-0.7061142666221194"
"10","6.131101978691019","-0.5411019786910192"
"11","7.367923896499239","0.22207610350076212"
"12","8.604745814307458","0.48525418569254164"
"13","9.841567732115676","0.04843226788432453"
"14","11.078389649923896","-0.2883896499238965"
"15","5.974368340943682","-0.6943683409436829"
"16","7.211190258751902","0.06880974124809836"
"17","8.448012176560121","0.33198782343987965"
"18","9.68483409436834","-0.10483409436834101"
"19","10.921656012176559","-0.44165601217656025"
"20","12.158477929984778","0.32152207001522015"
"21","6.211778612203931","-0.0917786122039308"
"22","7.9982250620592","0.5217749379407994"
"23","9.784671511914471","0.6353284880855306"
"24","11.57111796176974","0.04888203823025883"
"25","13.357564411625011","-0.4375644116250115"
"26","15.14401086148028","0.17598913851971965"
"27","6.789237187127532","-0.25923718712753185"
"28","8.575683636982802","0.3543163630171975"
"29","10.362130086838071","0.4678699131619286"
"30","12.148576536693342","-0.11857653669334312"
"31","13.935022986548612","-0.6050229865486116"
"32","15.721469436403881","0.008530563596119478"
"33","17.50791588625915","0.1220841137408506"
;;;;
run;
%glm_check(glm_weighted_scored,app_glm_weighted_scored,id,predicted residual,absolute=1);

/* glm_weight_edges */
proc datasets lib=work nolist; delete glm_weight_edges_anova glm_weight_edges_tests glm_weight_edges_params glm_weight_edges_fit glm_weight_edges_scored; quit;
title;
data weighted; do id=1 to 6; x=id; y=2+3*x+mod(id,2)/2; w=id/2; output; end; id=7; x=99; y=-999; w=0; output; id=8; x=100; w=-1; output; id=9; x=101; w=.; output; id=10; x=7; y=.; w=2; output; run;ods output OverallANOVA=glm_weight_edges_anova ModelANOVA=glm_weight_edges_tests ParameterEstimates=glm_weight_edges_params FitStatistics=glm_weight_edges_fit; proc glm data=weighted;  model y=x / solution; weight w; output out=glm_weight_edges_scored p=predicted r=residual; run; quit; ods output close;
data app_glm_weight_edges_anova; length source $128 df 8 ss 8 ms 8 fvalue 8 probf 8; infile datalines4 dsd dlm=',' truncover; input source :$128. df :best32. ss :best32. ms :best32. fvalue :best32. probf :best32.;
datalines4;
"Model","1","204.04285714285712","204.04285714285712","1360.2857142857133","0.0000032267515105369048"
"Error","4","0.6000000000000003","0.15000000000000008","",""
"Corrected Total","5","204.6428571428571","","",""
;;;;
run;
%glm_check(glm_weight_edges_anova,app_glm_weight_edges_anova,source,df ss ms fvalue probf,absolute=0);
data app_glm_weight_edges_tests; length source $128 hypothesistype 8 df 8 ss 8 ms 8 fvalue 8 probf 8; infile datalines4 dsd dlm=',' truncover; input source :$128. hypothesistype :best32. df :best32. ss :best32. ms :best32. fvalue :best32. probf :best32.;
datalines4;
"X","1","1","204.04285714285712","204.04285714285712","1360.2857142857133","0.0000032267515105369048"
"X","3","1","204.0428571428571","204.0428571428571","1360.2857142857133","0.0000032267515105369048"
;;;;
run;
%glm_check(glm_weight_edges_tests,app_glm_weight_edges_tests,source hypothesistype,df ss ms fvalue probf,absolute=0);
data app_glm_weight_edges_params; length parameter $128 estimate 8 stderr 8 tvalue 8 probt 8; infile datalines4 dsd dlm=',' truncover; input parameter :$128. estimate :best32. stderr :best32. tvalue :best32. probt :best32.;
datalines4;
"Intercept","2.400000000000004","0.3674234614174767","6.531972647421819","0.002837845926734437"
"X","2.9571428571428564","0.08017837257372733","36.88205138391455","0.0000032267515105369048"
;;;;
run;
%glm_check(glm_weight_edges_params,app_glm_weight_edges_params,parameter,estimate stderr tvalue probt,absolute=0);
data app_glm_weight_edges_fit; length rsquare 8 coeffvar 8 rootmse 8 depmean 8; infile datalines4 dsd dlm=',' truncover; input rsquare :best32. coeffvar :best32. rootmse :best32. depmean :best32.;
datalines4;
"0.9970680628272252","2.545622856662153","0.3872983346207418","15.214285714285714"
;;;;
run;
%glm_check(glm_weight_edges_fit,app_glm_weight_edges_fit,,rsquare coeffvar rootmse depmean,absolute=0);
data app_glm_weight_edges_scored; length id 8 predicted 8 residual 8; infile datalines4 dsd dlm=',' truncover; input id :best32. predicted :best32. residual :best32.;
datalines4;
"1","5.35714285714286","0.14285714285713969"
"2","8.314285714285717","-0.3142857142857167"
"3","11.271428571428574","0.22857142857142598"
"4","14.22857142857143","-0.22857142857142954"
"5","17.185714285714283","0.3142857142857167"
"6","20.142857142857146","-0.1428571428571459"
"7","295.1571428571428","-1294.1571428571428"
"8","298.11428571428564","-1297.1142857142856"
"9","301.0714285714285","-1300.0714285714284"
"10","23.1",""
;;;;
run;
%glm_check(glm_weight_edges_scored,app_glm_weight_edges_scored,id,predicted residual,absolute=1);
title;
