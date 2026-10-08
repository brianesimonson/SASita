/* SAS ONLY: INFILE/INPUT statements, PROC COMPARE and PROC EXPORT require SAS.
   Run this program alone: it includes both original reference programs.
   Unzip validation-pack.zip and change this path to its results folder. */
%let app_path = C:/SASita-validation/results;

/* Always rebuild the original SAS reference datasets before comparison.
   This makes the helper repeatable even after a previous failed import.
   The first two standalone programs are embedded unchanged below. */
/* BEGIN FRESH REFERENCES */
/* Run this entire program unchanged in SASita or SAS.
   Explicit MT32 seed; exact SAS RAND equivalence is still unverified.
   Both random draws are uniform on (0,1); systematic inputs are independent. */
data numeric_inputs;
  call streaminit('MT32', 12345);
  do id = 1 to 20000;
    random_x = rand('uniform');
    random_y = rand('uniform');
    systematic_x = id;
    systematic_y = id + 20000;
    random_x_hex = put(random_x, hex16.);
    random_y_hex = put(random_y, hex16.);
    output;
  end;
run;

/* To isolate arithmetic from RAND, import numeric_inputs.csv into SAS
   as NUMERIC_INPUTS, then run from this DATA step onward. */
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

/* Deterministic many-to-many SAS match-MERGE, not a Cartesian join.
   Unequal duplicates, unmatched keys, retained values and shared columns. */
data merge_left;
  do id = 1 to 10000;
    do left_index = 1 to 2;
      left_value = id * 10 + left_index;
      shared = left_value;
      output;
    end;
  end;
run;
data merge_right;
  do id = 5001 to 15000;
    do right_index = 1 to 3;
      right_value = id * 100 + right_index;
      shared = right_value;
      output;
    end;
  end;
run;
proc sort data=merge_left; by id; run;
proc sort data=merge_right; by id; run;
data merge_results;
  merge merge_left(in=in_left) merge_right(in=in_right);
  by id;
  merge_row + 1;
  has_left = in_left;
  has_right = in_right;
  first_id = first.id;
  last_id = last.id;
  combined = sum(left_value, right_value);
run;
data merge_summary;
  set merge_results;
  row_count + 1;
  group_count + first_id;
  if has_left = 1 and has_right = 0 then left_only + 1;
  if has_left = 1 and has_right = 1 then matched + 1;
  if has_left = 0 and has_right = 1 then right_only + 1;
  if id = 15000 and last_id = 1 then output;
  keep row_count group_count left_only matched right_only;
run;

/* Reverse exhaustion: LEFT keeps reading after RIGHT runs out.
   On the second row SHARED must come from LEFT, not a stale RIGHT value. */
data shared_left;
  do id = 1 to 3;
    do left_index = 1 to 2;
      shared = id * 10 + left_index;
      output;
    end;
  end;
run;
data shared_right;
  do id = 1 to 3;
    shared = id * 100;
    output;
  end;
run;
data shared_results;
  merge shared_left shared_right;
  by id;
  shared_row + 1;
run;
/* END FRESH REFERENCES */

/* Explicit CSV schema: no PROC IMPORT type guessing.
   DSD removes CSV quotes, preserves empty fields as missing, and TERMSTR
   matches the CRLF records shipped in the pack (including on Linux SAS). */
%macro load_app(name, fields, chars=, expected=);
  %local handle rows close_rc bad_input;
  %let bad_input=0;
  %if not %sysfunc(fileexist(&app_path./&name..csv)) %then %do;
    %put ERROR: Cannot find &app_path./&name..csv. Check app_path.;
    %abort cancel;
  %end;
  data app_&name;
    %if %length(&chars) %then %do;
      length &chars $16;
    %end;
    infile "&app_path./&name..csv" dsd dlm=',' firstobs=2
      termstr=crlf lrecl=32767 truncover;
    input &fields;
    if _error_ then call symputx('bad_input',1,'l');
  run;
  %if &bad_input %then %do;
    %put ERROR: Invalid CSV values in &name.. Check the SAS log before comparing.;
    %abort cancel;
  %end;
  %let handle=%sysfunc(open(app_&name,i));
  %if &handle = 0 %then %do;
    %put ERROR: Unable to open imported app_&name.. Check the SAS log.;
    %abort cancel;
  %end;
  %let rows=%sysfunc(attrn(&handle,NOBS));
  %let close_rc=%sysfunc(close(&handle));
  %if &rows ne &expected %then %do;
    %put ERROR: app_&name has &rows rows; expected &expected.. Check the CSV.;
    %abort cancel;
  %end;
%mend;
%load_app(numeric_inputs,
    id :best32. random_x :best32. random_y :best32. systematic_x :best32.
    systematic_y :best32. random_x_hex :$16. random_y_hex :$16.,
    chars=random_x_hex random_y_hex, expected=20000);
%load_app(numeric_results,
    id :best32. random_x :best32. random_y :best32. systematic_x :best32.
    systematic_y :best32. random_x_hex :$16. random_y_hex :$16. r_add :best32.
    r_subtract :best32. r_multiply :best32. r_divide :best32. r_square :best32.
    r_cube :best32. r_sqrt :best32. r_cuberoot :best32. r_sum :best32.
    r_mean :best32. r_min :best32. r_max :best32. r_combined :best32.
    s_add :best32. s_subtract :best32. s_multiply :best32. s_divide :best32.
    s_square :best32. s_cube :best32. s_sqrt :best32. s_cuberoot :best32.
    s_sum :best32. s_mean :best32. s_min :best32. s_max :best32.
    s_combined :best32. sometimes_missing :best32. missing_add :best32. missing_sum :best32.
    missing_mean :best32. missing_min :best32. missing_max :best32.,
    chars=random_x_hex random_y_hex, expected=20000);
%load_app(numeric_summary,
    count :best32. total_x :best32. total_y :best32. total_product :best32.
    total_missing :best32.,
    chars=, expected=1);
%load_app(merge_results,
    id :best32. left_index :best32. left_value :best32. shared :best32.
    right_index :best32. right_value :best32. merge_row :best32. has_left :best32.
    has_right :best32. first_id :best32. last_id :best32. combined :best32.,
    chars=, expected=40000);
%load_app(merge_summary,
    row_count :best32. group_count :best32. left_only :best32. matched :best32.
    right_only :best32.,
    chars=, expected=1);
%load_app(shared_results,
    id :best32. left_index :best32. shared :best32. shared_row :best32.,
    chars=, expected=6);

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

/* BEGIN SAME INPUT CALCULATIONS */
/* Recompute on the SAME saved app random inputs, regardless of RNG parity.
   Recreate inputs, then include only the computation portion of program 01. */
data same_inputs;
  set app_numeric_inputs;
run;

data same_results;
  set same_inputs;
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
data same_summary;
  set same_results;
  count + 1;
  total_x + systematic_x;
  total_y + systematic_y;
  total_product + s_multiply;
  total_missing + missing(sometimes_missing);
  if id = 20000 then output;
  keep count total_x total_y total_product total_missing;
run;

/* END SAME INPUT CALCULATIONS */

title 'Random arithmetic on identical CSV inputs: relative tolerance 1e-12';
proc compare base=same_results compare=app_numeric_results
  method=relative criterion=1e-12;
  id id;
  var random_x random_y r_add r_subtract r_multiply r_divide r_square
      r_cube r_sqrt r_cuberoot r_sum r_mean r_min r_max r_combined;
run;
title;

/* Export the recomputed SAS results beside app outputs for further review.
   No formats that round raw values for display should be applied. */
data sas_numeric_results;
  set same_results;
  format _numeric_ best32.;
run;
proc export data=sas_numeric_results
  outfile="&app_path./sas_numeric_results.csv" dbms=csv replace;
run;
