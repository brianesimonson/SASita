/* SAS ONLY. Run 01-means-validation.sas first in SAS.
   Upload the six app_*.csv files to SAS Studio. Set their folder below.
   Find the exact folder using the uploaded file's Properties in SAS Studio. */
%let app_csv_folder = /replace/with/your/upload/folder;
%macro check(table, keys, variables);
    proc import datafile="&app_csv_folder/app_&table..csv"
        out=app_&table dbms=csv replace;
        getnames=yes;
        guessingrows=max;
    run;
    proc sort data=&table out=base_sorted; by &keys; run;
    proc sort data=app_&table out=app_sorted; by &keys; run;
    proc compare base=base_sorted compare=app_sorted
        method=relative criterion=1e-12;
        id &keys;
        var &variables;
    run;
%mend;
%check(means_all, site period _type_, _freq_ amount_n other_n amount_nmiss other_nmiss amount_mean other_mean amount_std other_std amount_var other_var amount_min other_min amount_max other_max);
%check(means_missing, site period _type_, _freq_ count missing_count avg);
%check(means_nway, site period _type_, _freq_ count avg);
%check(means_default, _type_ _stat_, _freq_ amount other);
%check(means_by, site _type_, _freq_ count avg variance);
%check(means_large, _type_, _freq_ count avg variance sd css);
/* PROC IMPORT may infer different character lengths from CSV. Assess observation
   keys, statistics and frequencies; the program reports metadata differences too. */
