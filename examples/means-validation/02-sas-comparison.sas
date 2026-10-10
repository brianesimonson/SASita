/* SAS ONLY. Run 01-means-validation.sas first. Upload the six app_*.csv files.
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
%check(means_all, site period _type_, _freq_ amount_n other_n amount_nmiss other_nmiss amount_mean other_mean amount_stddev other_stddev amount_var other_var amount_min other_min amount_max other_max, site $ 8 period 8 _type_ 8 _freq_ 8 amount_n 8 other_n 8 amount_nmiss 8 other_nmiss 8 amount_mean 8 other_mean 8 amount_stddev 8 other_stddev 8 amount_var 8 other_var 8 amount_min 8 other_min 8 amount_max 8 other_max 8, site :$8. period :best32. _type_ :best32. _freq_ :best32. amount_n :best32. other_n :best32. amount_nmiss :best32. other_nmiss :best32. amount_mean :best32. other_mean :best32. amount_stddev :best32. other_stddev :best32. amount_var :best32. other_var :best32. amount_min :best32. other_min :best32. amount_max :best32. other_max :best32.);
%check(means_missing, site period _type_, _freq_ count missing_count avg, site $ 8 period 8 _type_ 8 _freq_ 8 count 8 missing_count 8 avg 8, site :$8. period :best32. _type_ :best32. _freq_ :best32. count :best32. missing_count :best32. avg :best32.);
%check(means_nway, site period _type_, _freq_ count avg, site $ 8 period 8 _type_ 8 _freq_ 8 count 8 avg 8, site :$8. period :best32. _type_ :best32. _freq_ :best32. count :best32. avg :best32.);
%check(means_default, _type_ _stat_, _freq_ amount other, _type_ 8 _freq_ 8 _stat_ $ 8 amount 8 other 8, _type_ :best32. _freq_ :best32. _stat_ :$8. amount :best32. other :best32.);
%check(means_by, site _type_, _freq_ count avg variance, site $ 8 _type_ 8 _freq_ 8 count 8 avg 8 variance 8, site :$8. _type_ :best32. _freq_ :best32. count :best32. avg :best32. variance :best32.);
%check(means_large, _type_, _freq_ count avg variance sd css, _type_ 8 _freq_ 8 count 8 avg 8 variance 8 sd 8 css 8, _type_ :best32. _freq_ :best32. count :best32. avg :best32. variance :best32. sd :best32. css :best32.);
title;
/* Dataset labels/formats may still differ; the explicit character lengths and
   numeric types preserve IDs/counts so actual VALUES can be compared. Return
   both HTML results and the SAS log, especially if any comparison is absent. */
