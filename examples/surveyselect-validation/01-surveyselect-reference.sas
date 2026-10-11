/* SAS ONLY: collect actual SURVEYSELECT selections before implementing Sassy.
   Upload this program and sassy_mt32_uniform.csv to your SASUSER folder.
   No existing input datasets or files are needed. Existing ss_* outputs are replaced.
   Change these two folders only if you uploaded somewhere else. */
%let output_folder = %sysfunc(pathname(sasuser));
%let fixture_folder = &output_folder;
%put NOTE: SURVEYSELECT reference CSV folder: &output_folder;
%put NOTE: SAS version: &sysvlong4 Platform: &sysscpl;
proc product_status; run;

data ss_frame;
    do id=1 to 20;
        stratum=ceil(id/5);
        value=id*10;
        output;
    end;
run;

/* Fixed input order, seed, sizes and release are part of the reference. */
proc surveyselect data=ss_frame out=ss_srs method=srs
    seed=12345 sampsize=7 stats outsize;
run;
proc surveyselect data=ss_frame out=ss_srs_second_seed method=srs
    seed=24680 sampsize=7 stats outsize;
run;
proc surveyselect data=ss_frame out=ss_srs_rate method=srs
    seed=12345 samprate=0.3 stats outsize;
run;
proc surveyselect data=ss_frame out=ss_srs_census method=srs
    seed=12345 sampsize=20 stats outsize;
run;

/* Forty draws from twenty units guarantee repeated selections. */
proc surveyselect data=ss_frame out=ss_urs_collapsed method=urs
    seed=12345 sampsize=40 stats outsize;
run;
proc surveyselect data=ss_frame out=ss_urs_hits method=urs
    seed=12345 sampsize=40 stats outsize outhits;
run;
proc surveyselect data=ss_frame out=ss_urs_reps method=urs
    seed=12345 sampsize=7 reps=2 stats outsize outhits;
run;

/* N/n is 4 for the first test and 20/6 for the fractional-interval test. */
proc surveyselect data=ss_frame out=ss_sys_integer method=sys
    seed=12345 sampsize=5 stats outsize;
run;
proc surveyselect data=ss_frame out=ss_sys_fractional method=sys
    seed=12345 sampsize=6 stats outsize;
run;

/* The frame is already sorted by stratum. n=2 means TWO PER STRATUM. */
proc surveyselect data=ss_frame out=ss_strata_srs method=srs
    seed=12345 sampsize=2 stats outsize outseed;
    strata stratum;
run;
/* Isolate one continuous RNG stream from default per-stratum initialization.
   OUTSEED cannot be combined with STRATUMSEED=NONE. */
proc surveyselect data=ss_frame out=ss_strata_single_stream method=srs
    seed=12345 sampsize=2 stratumseed=none stats outsize;
    strata stratum;
run;
proc surveyselect data=ss_frame out=ss_strata_sys method=sys
    seed=12345 sampsize=2 stats outsize outseed;
    strata stratum;
run;

/* Link this procedure investigation to our already-verified MT32 stream.
   Default RAND is a separate probe: its match is NOT assumed. */
data ss_uniform_mt32;
    length uniform_hex $16;
    call streaminit('MT32',12345);
    do draw=1 to 400;
        uniform=rand('uniform');
        uniform_hex=put(uniform,hex16.);
        output;
    end;
run;
data ss_uniform_default;
    length uniform_hex $16;
    call streaminit(12345);
    do draw=1 to 400;
        uniform=rand('uniform');
        uniform_hex=put(uniform,hex16.);
        output;
    end;
run;
data ss_sassy_uniform;
    length draw 8 uniform_hex $16;
    infile "&fixture_folder/sassy_mt32_uniform.csv"
        dsd dlm=',' firstobs=2 truncover;
    input draw :best32. uniform_hex :$16.;
run;
title 'Explicit SAS MT32 versus Sassy: exact hexadecimal comparison';
proc compare base=ss_uniform_mt32 compare=ss_sassy_uniform;
    id draw;
    var uniform_hex;
run;
title 'Default SAS RAND versus Sassy MT32: exploratory, agreement not assumed';
proc compare base=ss_uniform_default compare=ss_sassy_uniform;
    id draw;
    var uniform_hex;
run;

/* Check the two replacement representations select the same units/hit counts.
   Count expanded rows; do not SUM NumberHits on already-expanded rows. */
proc freq data=ss_urs_hits noprint;
    tables id / out=ss_hit_counts;
run;
proc sort data=ss_urs_collapsed out=ss_collapsed_sorted; by id; run;
proc sort data=ss_hit_counts; by id; run;
title 'Collapsed NumberHits versus counts of expanded rows: must agree';
proc compare base=ss_collapsed_sorted compare=ss_hit_counts
    method=absolute criterion=0;
    id id;
    var NumberHits;
    with count;
run;

/* Print all small sampling tables and their descriptors, and export CSVs.
   BEST32 preserves enough decimal digits; uniform_hex is authoritative for RNG. */
%macro save(table);
    %if %sysfunc(exist(work.&table)) %then %do;
        title "SURVEYSELECT reference: &table";
        proc contents data=work.&table varnum; run;
        proc print data=work.&table noobs; run;
        data ss_export;
            set work.&table;
            format _numeric_ best32.;
        run;
        proc export data=ss_export outfile="&output_folder/&table..csv"
            dbms=csv replace;
        run;
    %end;
    %else %put ERROR: Missing reference table &table. Inspect earlier SAS errors.;
%mend;
%save(ss_frame);
%save(ss_srs);
%save(ss_srs_second_seed);
%save(ss_srs_rate);
%save(ss_srs_census);
%save(ss_urs_collapsed);
%save(ss_urs_hits);
%save(ss_urs_reps);
%save(ss_sys_integer);
%save(ss_sys_fractional);
%save(ss_strata_srs);
%save(ss_strata_single_stream);
%save(ss_strata_sys);
%save(ss_uniform_mt32);
%save(ss_uniform_default);
title;
