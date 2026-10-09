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
