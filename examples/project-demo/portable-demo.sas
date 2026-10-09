/* Open this in Sassy, then Code & export > Export runnable demo ZIP.
   Default WORK.CLAIMS is captured in the export. Run the ZIP via run.py or run.mjs. */
data results;
    set claims;
    excess = paid_amount - allowed_amount;
    squared_excess = excess ** 2;
    root_payment = sqrt(paid_amount);
run;
proc sort data=results out=sorted_results;
    by descending paid_amount;
run;
