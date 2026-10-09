/* Select demo-project, then run. The existing tables folder holds native tables. */
libname saved 'tables';
proc import datafile='claims.csv' out=claims dbms=csv replace;
  getnames=yes;
  guessingrows=max;
run;
data saved.reviewed;
  set claims;
  if paid_amount > 1000;
  excess = paid_amount - allowed_amount;
  format paid_amount dollar12.2 allowed_amount dollar12.2 excess dollar12.2 service_date date9.;
run;
/* This SET works in a later run too. Reissue LIBNAME after reopening the app. */
data restored;
  set saved.reviewed;
run;
