/* Import examples/claims.csv as CLAIMS and providers.csv as PROVIDERS. */
%let threshold = 1000;

proc sort data=claims out=claims_sorted;
    by provider;
run;

proc sort data=providers out=providers_sorted;
    by provider;
run;

%macro enrich(source, reference, out, limit=500);
    data &out;
        merge &source(in=a) &reference(in=b);
        by provider;
        if a and paid_amount > &limit;
        matched_provider = b;
        excess = paid_amount - allowed_amount;
        keep claim_id provider specialty paid_amount excess matched_provider;
        format paid_amount dollar12.2 excess dollar12.2;
    run;
%mend enrich;

%enrich(claims_sorted, providers_sorted, reviewed, limit=&threshold);
