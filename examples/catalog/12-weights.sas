/* WEIGHT is not FREQ: noninteger weights are allowed. */
data weighted_demo;
    do x=1 to 8;
        y=2+3*x+mod(x,3)/2;
        w=x/2;
        output;
    end;
run;
proc means data=weighted_demo n mean var std stderr sumwgt;
    var y;
    weight w;
    output out=weighted_stats n=count mean=average var=variance
        std=sd stderr=se sumwgt=weight_total;
run;
ods output ParameterEstimates=weighted_parameters ModelANOVA=weighted_tests;
proc glm data=weighted_demo;
    model y=x / solution;
    weight w;
    output out=weighted_scored p=predicted r=residual;
run;
quit;
ods output close;
proc print data=weighted_scored(obs=5);
    var x y w predicted residual;
run;
