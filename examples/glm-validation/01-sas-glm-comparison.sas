/* SAS ONLY: run this entire program in SAS Studio. No folder, CSV uploads,
   or edits needed. Expected numbers were computed by Sassy v0.4.11.
   This compares values and key labels; it does not certify full ODS metadata. */
%macro glm_check(base,expected,keys,variables);
  %local ds k field absent rc;
  %let absent=0;
  %let ds=%sysfunc(open(&base));
  %if &ds=0 %then %do;
    %put ERROR: Missing SAS table &base. This comparison did not run.;
    %return;
  %end;
  %do k=1 %to %sysfunc(countw(&keys &variables));
    %let field=%scan(&keys &variables,&k);
    %if %sysfunc(varnum(&ds,&field))=0 %then %do;
      %put ERROR: Missing column &field in &base. Return the log and results.;
      %let absent=1;
    %end;
  %end;
  %let rc=%sysfunc(close(&ds));
  %if &absent %then %return;
  data sas_check; set &base;
    %if %index(%str( &keys ),source) %then %do; source=upcase(compbl(source)); %end;
    %if %index(%str( &keys ),parameter) %then %do; parameter=upcase(compbl(parameter)); %end;
  run;
  data app_check; set &expected;
    %if %index(%str( &keys ),source) %then %do; source=upcase(compbl(source)); %end;
    %if %index(%str( &keys ),parameter) %then %do; parameter=upcase(compbl(parameter)); %end;
  run;
  %if %length(&keys) %then %do;
    proc sort data=sas_check; by &keys; run;
    proc sort data=app_check; by &keys; run;
  %end;
  title "GLM values: &base vs &expected";
  proc compare base=sas_check compare=app_check method=relative criterion=1e-10;
    %if %length(&keys) %then %do; id &keys; %end;
    var &variables;
  run;
%mend;

/* published */
proc datasets lib=work nolist; delete published_glm_anova published_glm_tests published_glm_parameters published_glm_fit published_glm_scored; quit;
title;
/* Unbalanced two-factor example from the supplied SAS GLM manual, pp. 2989–2990.
   All four cells are present. /SOLUTION is a MODEL option, not a statement.
   Inspect published_glm_tests (HypothesisType=1 or 3), published_glm_parameters and published_glm_scored. */
data glm_study;
    length a $2 b $2;
    a='A1'; b='B1'; y=12; output;
    a='A1'; b='B1'; y=14; output;
    a='A1'; b='B2'; y=11; output;
    a='A1'; b='B2'; y=9; output;
    a='A2'; b='B1'; y=20; output;
    a='A2'; b='B1'; y=18; output;
    a='A2'; b='B2'; y=17; output;
run;
data glm_study; set glm_study; id=_n_; run;
ods output OverallANOVA=published_glm_anova ModelANOVA=published_glm_tests
    ParameterEstimates=published_glm_parameters FitStatistics=published_glm_fit;
proc glm data=glm_study;
    class a b;
    model y=a|b / solution;
    output out=published_glm_scored p=predicted r=residual;
run;
quit;
ods output close;

data app_published_anova; length source $128 df 8 ss 8 ms 8 fvalue 8 probf 8; infile datalines4 dsd dlm=',' truncover; input source :$128. df :best32. ss :best32. ms :best32. fvalue :best32. probf :best32.;
datalines4;
"Model","3","91.71428571428571","30.57142857142857","15.285714285714285","0.025349668997856095"
"Error","3","6","2","",""
"Corrected Total","6","97.71428571428572","","",""
;;;;
run;
%glm_check(published_glm_anova,app_published_anova,source,df ss ms fvalue probf);
data app_published_tests; length source $128 hypothesistype 8 df 8 ss 8 ms 8 fvalue 8 probf 8; infile datalines4 dsd dlm=',' truncover; input source :$128. hypothesistype :best32. df :best32. ss :best32. ms :best32. fvalue :best32. probf :best32.;
datalines4;
"A","1","1","80.04761904761904","80.04761904761904","40.02380952380952","0.007984480683235953"
"A","3","1","67.6","67.6","33.8","0.010131423857703385"
"B","1","1","11.26666666666667","11.26666666666667","5.633333333333335","0.09819588108985156"
"B","3","1","10.000000000000005","10.000000000000005","5.000000000000003","0.1113671547140837"
"A*B","1","1","0.4","0.4","0.2","0.6850376424742926"
"A*B","3","1","0.3999999999999991","0.3999999999999991","0.19999999999999954","0.6850376424742928"
;;;;
run;
%glm_check(published_glm_tests,app_published_tests,source hypothesistype,df ss ms fvalue probf);
data app_published_parameters; length parameter $128 estimate 8 stderr 8 tvalue 8 probt 8; infile datalines4 dsd dlm=',' truncover; input parameter :$128. estimate :best32. stderr :best32. tvalue :best32. probt :best32.;
datalines4;
"Intercept","17","1.4142135623730954","12.020815280171306","0.001238664461222031"
"A A1","-6.999999999999999","1.7320508075688772","-4.04145188432738","0.02726185440936135"
"A A2","0","","",""
"B B1","2.0000000000000004","1.7320508075688774","1.1547005383792517","0.33184140605450263"
"B B2","0","","",""
"A*B A1 B1","1","2.2360679774997894","0.447213595499958","0.6850376424742926"
"A*B A1 B2","0","","",""
"A*B A2 B1","0","","",""
"A*B A2 B2","0","","",""
;;;;
run;
%glm_check(published_glm_parameters,app_published_parameters,parameter,estimate stderr tvalue probt);
data app_published_fit; length rsquare 8 coeffvar 8 rootmse 8 depmean 8; infile datalines4 dsd dlm=',' truncover; input rsquare :best32. coeffvar :best32. rootmse :best32. depmean :best32.;
datalines4;
"0.9385964912280702","9.801480135259075","1.4142135623730951","14.428571428571429"
;;;;
run;
%glm_check(published_glm_fit,app_published_fit,,rsquare coeffvar rootmse depmean);
data app_published_scored; length id 8 predicted 8 residual 8; infile datalines4 dsd dlm=',' truncover; input id :best32. predicted :best32. residual :best32.;
datalines4;
"1","13.000000000000002","-1.0000000000000018"
"2","13.000000000000002","0.9999999999999982"
"3","10","1"
"4","10","-1"
"5","19","1"
"6","19","-1"
"7","17","0"
;;;;
run;
%glm_check(published_glm_scored,app_published_scored,id,predicted residual);
title "published: actual SAS ODS descriptors"; proc contents data=published_glm_parameters varnum; run; title;

/* ancova */
proc datasets lib=work nolist; delete ancova_glm_anova ancova_glm_tests ancova_glm_parameters ancova_glm_fit ancova_glm_scored; quit;
title;
data glm_study; length a $2 b $2; id=1; a='A1'; b='B1'; x=0; y=4.5; output;
id=2; a='A1'; b='B1'; x=1; y=6.1000000000000005; output;
id=3; a='A1'; b='B1'; x=2; y=7.2; output;
id=4; a='A1'; b='B1'; x=3; y=7.6000000000000005; output;
id=5; a='A1'; b='B2'; x=0.3; y=3.47; output;
id=6; a='A1'; b='B2'; x=1.3; y=5.07; output;
id=7; a='A1'; b='B2'; x=2.3; y=6.17; output;
id=8; a='A1'; b='B2'; x=3.3; y=6.57; output;
id=9; a='A1'; b='B2'; x=4.3; y=7.07; output;
id=10; a='A2'; b='B1'; x=-0.7; y=5.59; output;
id=11; a='A2'; b='B1'; x=0.30000000000000004; y=7.590000000000001; output;
id=12; a='A2'; b='B1'; x=1.3; y=9.09; output;
id=13; a='A2'; b='B1'; x=2.3; y=9.89; output;
id=14; a='A2'; b='B1'; x=3.3; y=10.79; output;
id=15; a='A2'; b='B2'; x=-0.39999999999999997; y=5.279999999999999; output;
id=16; a='A2'; b='B2'; x=0.6000000000000001; y=7.28; output;
id=17; a='A2'; b='B2'; x=1.6; y=8.780000000000001; output;
id=18; a='A2'; b='B2'; x=2.5999999999999996; y=9.579999999999998; output;
id=19; a='A2'; b='B2'; x=3.5999999999999996; y=10.479999999999999; output;
id=20; a='A2'; b='B2'; x=4.6; y=12.479999999999999; output;
id=21; a='A3'; b='B1'; x=-1.4; y=6.12; output;
id=22; a='A3'; b='B1'; x=-0.3999999999999999; y=8.52; output;
id=23; a='A3'; b='B1'; x=0.6000000000000001; y=10.420000000000002; output;
id=24; a='A3'; b='B1'; x=1.6; y=11.62; output;
id=25; a='A3'; b='B1'; x=2.6; y=12.92; output;
id=26; a='A3'; b='B1'; x=3.6; y=15.32; output;
id=27; a='A3'; b='B2'; x=-1.0999999999999999; y=6.53; output;
id=28; a='A3'; b='B2'; x=-0.09999999999999992; y=8.93; output;
id=29; a='A3'; b='B2'; x=0.9000000000000001; y=10.83; output;
id=30; a='A3'; b='B2'; x=1.9000000000000001; y=12.03; output;
id=31; a='A3'; b='B2'; x=2.9; y=13.33; output;
id=32; a='A3'; b='B2'; x=3.9; y=15.73; output;
id=33; a='A3'; b='B2'; x=4.8999999999999995; y=17.63; output; run;
data glm_study; set glm_study; id=_n_; run;
ods output OverallANOVA=ancova_glm_anova ModelANOVA=ancova_glm_tests ParameterEstimates=ancova_glm_parameters FitStatistics=ancova_glm_fit;
proc glm data=glm_study; class a b; model y=a b x a*b a*x / solution; output out=ancova_glm_scored p=predicted r=residual; run; quit; ods output close;
data app_ancova_anova; length source $128 df 8 ss 8 ms 8 fvalue 8 probf 8; infile datalines4 dsd dlm=',' truncover; input source :$128. df :best32. ss :best32. ms :best32. fvalue :best32. probf :best32.;
datalines4;
"Model","8","372.0869407925408","46.5108675990676","276.5881619621015","1.0286624981098385e-21"
"Error","24","4.035822843822847","0.16815928515928527","",""
"Corrected Total","32","376.1227636363636","","",""
;;;;
run;
%glm_check(ancova_glm_anova,app_ancova_anova,source,df ss ms fvalue probf);
data app_ancova_tests; length source $128 hypothesistype 8 df 8 ss 8 ms 8 fvalue 8 probf 8; infile datalines4 dsd dlm=',' truncover; input source :$128. hypothesistype :best32. df :best32. ss :best32. ms :best32. fvalue :best32. probf :best32.;
datalines4;
"A","1","2","165.97591297591296","82.98795648795648","493.5080237130404","3.202125228979035e-20"
"A","3","2","48.229192532307124","24.114596266153562","143.40329910008555","4.4941973644004984e-14"
"B","1","1","1.7941302957090148","1.7941302957090148","10.669231223298574","0.0032690957263948523"
"B","3","1","3.835761338644445","3.835761338644445","22.810285706264168","0.00007339744648843391"
"X","1","1","190.27681818181821","190.27681818181821","1131.5272778519638","1.04878937396675e-21"
"X","3","1","126.81486366199955","126.81486366199955","754.1353636338124","1.2118747263803521e-19"
"A*B","1","2","5.314148936170216","2.657074468085108","15.800938173400603","0.00004182746356864362"
"A*B","3","2","2.223268600018068","1.111634300009034","6.610603149008765","0.00516475318615881"
"A*X","1","2","8.7259304029304","4.3629652014652","25.94543142433363","0.0000010006011858277057"
"A*X","3","2","8.725930402930402","4.362965201465201","25.945431424333638","0.0000010006011858277057"
;;;;
run;
%glm_check(ancova_glm_tests,app_ancova_tests,source hypothesistype,df ss ms fvalue probf);
data app_ancova_parameters; length parameter $128 estimate 8 stderr 8 tvalue 8 probt 8; infile datalines4 dsd dlm=',' truncover; input parameter :$128. estimate :best32. stderr :best32. tvalue :best32. probt :best32.;
datalines4;
"Intercept","8.82032967032967","0.19329931086671437","45.63042481000644","7.767959389640742e-25"
"A A1","-5.281663003663005","0.36097182047852205","-14.631787591234607","1.8628946284336187e-13"
"A A2","-2.5817842157842166","0.3039042703953777","-8.495386433449356","1.0720746142970586e-8"
"A A3","0","","",""
"B B1","0.07527472527472559","0.233269414983893","0.3226943629962086","0.7497212019836736"
"B B2","0","","",""
"X","1.74945054945055","0.060793161334472795","28.777094512742885","4.069596623734156e-20"
"A*B A1 B1","1.3460586080586088","0.37048764413324536","3.633207825885013","0.001323528146775722"
"A*B A1 B2","0","","",""
"A*B A2 B1","0.5790889110889123","0.34639074714435014","1.6717793874776645","0.1075572996588589"
"A*B A2 B2","0","","",""
"A*B A3 B1","0","","",""
"A*B A3 B2","0","","",""
"A*X A1","-0.8227838827838827","0.1220918812847859","-6.739054834159651","5.702902389230094e-7"
"A*X A2","-0.44399600399600386","0.09904893518731292","-4.482592398962759","0.00015481575363624744"
"A*X A3","0","","",""
;;;;
run;
%glm_check(ancova_glm_parameters,app_ancova_parameters,parameter,estimate stderr tvalue probt);
data app_ancova_fit; length rsquare 8 coeffvar 8 rootmse 8 depmean 8; infile datalines4 dsd dlm=',' truncover; input rsquare :best32. coeffvar :best32. rootmse :best32. depmean :best32.;
datalines4;
"0.9892699319636907","4.5031398808168985","0.41007229260129885","9.106363636363636"
;;;;
run;
%glm_check(ancova_glm_fit,app_ancova_fit,,rsquare coeffvar rootmse depmean);
data app_ancova_scored; length id 8 predicted 8 residual 8; infile datalines4 dsd dlm=',' truncover; input id :best32. predicted :best32. residual :best32.;
datalines4;
"1","4.959999999999999","-0.4599999999999991"
"2","5.886666666666667","0.21333333333333382"
"3","6.8133333333333335","0.3866666666666667"
"4","7.74","-0.13999999999999968"
"5","3.816666666666665","-0.3466666666666649"
"6","4.743333333333332","0.326666666666668"
"7","5.669999999999999","0.5000000000000009"
"8","6.596666666666668","-0.026666666666667282"
"9","7.523333333333333","-0.45333333333333314"
"10","5.9790909090909095","-0.3890909090909096"
"11","7.284545454545455","0.30545454545454565"
"12","8.590000000000002","0.4999999999999982"
"13","9.895454545454546","-0.005454545454545823"
"14","11.200909090909093","-0.4109090909090938"
"15","5.716363636363635","-0.4363636363636356"
"16","7.0218181818181815","0.25818181818181873"
"17","8.327272727272728","0.4527272727272731"
"18","9.632727272727273","-0.05272727272727451"
"19","10.93818181818182","-0.4581818181818207"
"20","12.243636363636364","0.23636363636363455"
"21","6.446373626373626","-0.3263736263736261"
"22","8.195824175824177","0.324175824175823"
"23","9.945274725274725","0.4747252747252766"
"24","11.694725274725275","-0.07472527472527624"
"25","13.444175824175826","-0.5241758241758259"
"26","15.193626373626376","0.12637362637362415"
"27","6.895934065934066","-0.3659340659340655"
"28","8.645384615384614","0.2846153846153854"
"29","10.394835164835165","0.4351648351648354"
"30","12.144285714285715","-0.11428571428571566"
"31","13.893736263736265","-0.5637362637362653"
"32","15.643186813186816","0.08681318681318473"
"33","17.392637362637366","0.23736263736263297"
;;;;
run;
%glm_check(ancova_glm_scored,app_ancova_scored,id,predicted residual);
title "ancova: actual SAS ODS descriptors"; proc contents data=ancova_glm_parameters varnum; run; title;
title;
