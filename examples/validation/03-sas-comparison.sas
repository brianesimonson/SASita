/* SAS ONLY: PROC IMPORT / PROC COMPARE / PROC EXPORT are not in SASita.
   First run 01-calculations.sas and 02-merge.sas in SAS.
   Unzip validation-pack.zip and change this path to its results folder. */
%let app_path = C:/SASita-validation/results;

%macro load_app(name);
  proc import datafile="&app_path./&name..csv"
    out=app_&name dbms=csv replace;
    guessingrows=max;
    getnames=yes;
  run;
%mend;
%load_app(numeric_inputs);
%load_app(numeric_results);
%load_app(numeric_summary);
%load_app(merge_results);
%load_app(merge_summary);
%load_app(shared_results);

/* Exact 64-bit uniform draw comparison; expect possible failures here.
   This is separate from all arithmetic tests. */
title 'RAND input bits: exact comparison';
proc compare base=numeric_inputs compare=app_numeric_inputs method=exact;
  id id;
  var random_x_hex random_y_hex;
run;

/* No RAND dependency. Relative difference threshold: 1e-12.
   Pass means within tolerance, not bit-for-bit identity. */
title 'Systematic arithmetic: relative tolerance 1e-12';
proc compare base=numeric_results compare=app_numeric_results
  method=relative criterion=1e-12;
  id id;
  var systematic_x systematic_y
      s_add s_subtract s_multiply s_divide s_square s_cube s_sqrt
      s_cuberoot s_sum s_mean s_min s_max s_combined
      sometimes_missing missing_add missing_sum missing_mean missing_min missing_max;
run;
title 'Exact integer summaries';
proc compare base=numeric_summary compare=app_numeric_summary method=exact;
run;
title 'Exact match-MERGE results';
proc compare base=merge_results compare=app_merge_results method=exact;
  id merge_row;
run;
proc compare base=merge_summary compare=app_merge_summary method=exact;
run;
proc compare base=shared_results compare=app_shared_results method=exact;
  id shared_row;
run;

/* Recompute on the SAME saved app random inputs, regardless of RNG parity.
   Recreate inputs, then include only the computation portion of program 01. */
data numeric_inputs;
  set app_numeric_inputs;
run;

data numeric_results;
  set numeric_inputs;
  r_add = random_x + random_y;
  r_subtract = random_y - random_x;
  r_multiply = random_x * random_y;
  r_divide = random_x / random_y;
  r_square = random_x ** 2;
  r_cube = random_x ** 3;
  r_sqrt = sqrt(random_x);
  r_cuberoot = random_x ** (1/3);
  r_sum = sum(random_x, random_y);
  r_mean = mean(random_x, random_y);
  r_min = min(random_x, random_y);
  r_max = max(random_x, random_y);
  r_combined = sqrt(random_x * random_y) + (random_x + random_y) ** (1/3);
  s_add = systematic_x + systematic_y;
  s_subtract = systematic_y - systematic_x;
  s_multiply = systematic_x * systematic_y;
  s_divide = systematic_x / systematic_y;
  s_square = systematic_x ** 2;
  s_cube = systematic_x ** 3;
  s_sqrt = sqrt(systematic_x);
  s_cuberoot = systematic_x ** (1/3);
  s_sum = sum(systematic_x, systematic_y);
  s_mean = mean(systematic_x, systematic_y);
  s_min = min(systematic_x, systematic_y);
  s_max = max(systematic_x, systematic_y);
  s_combined = sqrt(systematic_x * systematic_y) + (systematic_x + systematic_y) ** (1/3);
  /* Missing-value propagation versus SUM/MEAN/MIN/MAX ignoring missing. */
  sometimes_missing = systematic_x;
  if mod(id, 10) = 0 then sometimes_missing = .;
  missing_add = sometimes_missing + systematic_y;
  missing_sum = sum(sometimes_missing, systematic_y);
  missing_mean = mean(sometimes_missing, systematic_y);
  missing_min = min(sometimes_missing, systematic_y);
  missing_max = max(sometimes_missing, systematic_y);
run;

/* Running sums, emitted once. Values below remain within exact integer range. */
data numeric_summary;
  set numeric_results;
  count + 1;
  total_x + systematic_x;
  total_y + systematic_y;
  total_product + s_multiply;
  total_missing + missing(sometimes_missing);
  if id = 20000 then output;
  keep count total_x total_y total_product total_missing;
run;

title 'Random arithmetic on identical CSV inputs: relative tolerance 1e-12';
proc compare base=numeric_results compare=app_numeric_results
  method=relative criterion=1e-12;
  id id;
  var random_x random_y r_add r_subtract r_multiply r_divide r_square
      r_cube r_sqrt r_cuberoot r_sum r_mean r_min r_max r_combined;
run;
title;

/* Export the recomputed SAS results beside app outputs for further review.
   No formats that round raw values for display should be applied. */
data sas_numeric_results;
  set numeric_results;
  format _numeric_ best32.;
run;
proc export data=sas_numeric_results
  outfile="&app_path./sas_numeric_results.csv" dbms=csv replace;
run;
