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
