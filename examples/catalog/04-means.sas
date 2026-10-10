/* All CLASS types: total, each one-way subtotal, and complete combinations.
   _TYPE_: 0=overall, 1=period, 2=site, 3=site+period.
   Missing CLASS rows are excluded from ALL types unless MISSING is specified. */
data demo_observations;
    length site $ 8;
    do id=1 to 24;
        if mod(id,2)=0 then site='North'; else site='South';
        period=mod(id,3)+1;
        amount=100+id*7;
        if mod(id,5)=0 then amount=.;
        output;
    end;
run;
proc means data=demo_observations n nmiss mean std var min max;
    class site period;
    var amount;
    output out=demo_all_types n= nmiss= mean= std= var= / autoname;
run;
/* NWAY removes the overall and partial-group rows from the saved dataset. */
proc means data=demo_observations nway noprint;
    class site period;
    var amount;
    output out=demo_nway mean=mean_amount;
run;
/* With no statistic requests on OUTPUT, SAS stores five _STAT_ rows per level. */
proc means data=demo_observations noprint;
    var amount;
    output out=demo_default_stats;
run;
