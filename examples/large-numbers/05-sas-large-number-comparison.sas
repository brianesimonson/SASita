/* SAS ONLY. Set this to the folder containing the two supplied CSVs. */
%let app_path = C:/SASita-large-numbers/results;

/* Identical program for SAS and the standalone app. No RAND dependency.
   3,000 rows: 15 scales from 1e-12 to 1e100, 200 input pairs per scale.
   Products/powers stay finite, up to roughly 1e307. */
data big_number_results;
  do scale_exp = -12 to 100 by 8;
    scale = 10 ** scale_exp;
    do i = 1 to 200;
      id + 1;
      x = (i + 0.125) * scale;
      y = (401 - i + 0.375) * scale;
      multiply = x * y;
      divide = x / y;
      square = x ** 2;
      cube = x ** 3;
      root = sqrt(x);
      cube_root = x ** (1/3);
      power_four = (x / scale) ** 4;
      mixed = (x * y) / (x + y);
      output;
    end;
  end;
  keep id scale_exp scale x y multiply divide square cube root cube_root power_four mixed;
run;

/* Demonstrate the double-precision integer limit separately from accuracy.
   Above 2**53, successive integers cannot all be represented. */
data big_integer_edges;
  do offset = -4 to 4;
    id + 1;
    value = 9007199254740992 + offset;
    plus_one = value + 1;
    observed_increment = plus_one - value;
    output;
  end;
run;

data app_big_number_results;
  infile "&app_path./big_number_results.csv" dsd dlm=',' firstobs=2 termstr=crlf lrecl=32767 truncover;
  input scale_exp :best32. scale :best32. id :best32. x :best32. y :best32. multiply :best32. divide :best32. square :best32. cube :best32. root :best32. cube_root :best32. power_four :best32. mixed :best32.;
run;
data app_big_integer_edges;
  infile "&app_path./big_integer_edges.csv" dsd dlm=',' firstobs=2 termstr=crlf lrecl=32767 truncover;
  input offset :best32. id :best32. value :best32. plus_one :best32. observed_increment :best32.;
run;
title 'Large-number calculations: 10-digit relative error threshold';
proc compare base=big_number_results compare=app_big_number_results method=relative criterion=1e-10;
  id id;
run;
title 'Large-number calculations: 15-digit relative error threshold';
proc compare base=big_number_results compare=app_big_number_results method=relative criterion=1e-15;
  id id;
run;
title 'Integer boundary: exact behavior';
proc compare base=big_integer_edges compare=app_big_integer_edges method=exact;
  id id;
run;
data big_number_differences;
  merge big_number_results app_big_number_results(rename=(scale_exp=app_scale_exp scale=app_scale x=app_x y=app_y multiply=app_multiply divide=app_divide square=app_square cube=app_cube root=app_root cube_root=app_cube_root power_four=app_power_four mixed=app_mixed));
  by id;
  length operation $32;
  array reference_values[8] multiply divide square cube root cube_root power_four mixed;
  array app_values[8] app_multiply app_divide app_square app_cube app_root app_cube_root app_power_four app_mixed;
  do operation_index=1 to 8;
    operation=vname(reference_values[operation_index]);
    sas_value=reference_values[operation_index];
    app_value=app_values[operation_index];
    absolute_difference=abs(sas_value-app_value);
    missing_result=missing(sas_value) or missing(app_value);
    exceeds_10_digits=missing_result or absolute_difference>abs(sas_value)*1e-10;
    exceeds_15_digits=missing_result or absolute_difference>abs(sas_value)*1e-15;
    output;
  end;
  keep id scale_exp operation sas_value app_value absolute_difference missing_result exceeds_10_digits exceeds_15_digits;
run;
title 'Absolute differences and counts exceeding precision thresholds';
proc means data=big_number_differences n max sum;
  class operation;
  var absolute_difference missing_result exceeds_10_digits exceeds_15_digits;
run;
proc export data=big_number_differences outfile="&app_path./sas_big_number_differences.csv" dbms=csv replace;run;
title;
