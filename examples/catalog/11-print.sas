/* Creating the table does not print it. Each PROC PRINT requests a listing. */
data inspect;
    do id=1 to 20;
        amount=id/3;
        output;
    end;
    format amount 8.2;
run;
proc print data=inspect(obs=10);
    var id amount;
run;
/* OBS is the ending index, not the count: observations 5 through 10. */
proc print data=inspect(firstobs=5 obs=10);
    var amount id;
run;
proc print data=inspect(obs=3) noobs;
    var id amount;
run;
