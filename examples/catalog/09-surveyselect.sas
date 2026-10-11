/* Default RAND and equal-probability observation sampling. No folder needed. */
data sampling_frame;
    call streaminit(12345);
    do stratum=1 to 5;
        do unit=1 to 5;
            id=(stratum-1)*5+unit;
            uniform=rand('uniform');
            output;
        end;
    end;
run;
proc surveyselect data=sampling_frame out=sample_srs
    method=srs seed=12345 sampsize=7 stats outsize;
run;
proc surveyselect data=sampling_frame out=sample_replacement
    method=urs seed=12345 sampsize=40 stats outsize;
run;
proc surveyselect data=sampling_frame out=sample_expanded
    method=urs seed=12345 sampsize=40 stats outsize outhits;
run;
/* Fractional interval 25/6. */
proc surveyselect data=sampling_frame out=sample_systematic
    method=sys seed=12345 sampsize=6 stats outsize;
run;
proc surveyselect data=sampling_frame out=sample_stratified
    method=srs seed=12345 sampsize=2 stats outsize outseed;
    strata stratum;
run;
