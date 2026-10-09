/* Choose the demo-project folder before running this program.
   The input and output paths are relative to that selected folder. */
filename source 'claims.csv';
proc import datafile=source out=claims dbms=csv replace;
  getnames=yes;
  guessingrows=max;
run;

data reviewed;
  set claims;
  if paid_amount > 1000;
  excess = paid_amount - allowed_amount;
  format paid_amount dollar12.2 excess dollar12.2;
  keep claim_id provider paid_amount excess;
run;

/* REPLACE explicitly allows overwriting the result from a previous run. */
proc export data=reviewed outfile='reviewed.csv' dbms=csv replace;
run;
