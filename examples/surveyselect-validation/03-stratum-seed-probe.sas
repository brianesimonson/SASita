/* SAS ONLY. No uploads, CSVs, folder settings or earlier WORK tables needed.
   Run the entire program and return its HTML Results and log.
   Five strata distinguish seed-conversion rules that agree on the first four.
   The four cases test sample-size/method independence and a second main seed. */
%put NOTE: SAS version: &sysvlong4 Platform: &sysscpl;
data ss_seed_probe_frame;
    do stratum=1 to 5;
        do unit=1 to 5;
            id=(stratum-1)*5+unit;
            output;
        end;
    end;
run;

title 'Stratum seeds: main seed 12345, SRS, one per stratum';
proc surveyselect data=ss_seed_probe_frame out=ss_seed_probe_srs1
    method=srs seed=12345 sampsize=1 outseed;
    strata stratum;
run;
proc print data=ss_seed_probe_srs1 noobs;
    var stratum InitialSeed id;
run;

title 'Stratum seeds: main seed 12345, SRS, two per stratum';
proc surveyselect data=ss_seed_probe_frame out=ss_seed_probe_srs2
    method=srs seed=12345 sampsize=2 outseed;
    strata stratum;
run;
proc print data=ss_seed_probe_srs2 noobs;
    var stratum InitialSeed id;
run;

title 'Stratum seeds: main seed 12345, SYS, two per stratum';
proc surveyselect data=ss_seed_probe_frame out=ss_seed_probe_sys2
    method=sys seed=12345 sampsize=2 outseed;
    strata stratum;
run;
proc print data=ss_seed_probe_sys2 noobs;
    var stratum InitialSeed id;
run;

title 'Stratum seeds: main seed 24680, SRS, two per stratum';
proc surveyselect data=ss_seed_probe_frame out=ss_seed_probe_second
    method=srs seed=24680 sampsize=2 outseed;
    strata stratum;
run;
proc print data=ss_seed_probe_second noobs;
    var stratum InitialSeed id;
run;
title;
