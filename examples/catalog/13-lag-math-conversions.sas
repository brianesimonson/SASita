/* LAG queues advance when each call executes; they do not reset at BY boundaries. */
data calculations;
    do x=1 to 10;
        previous=lag(x);
        two_back=lag2(x);
        natural_log=log(x);
        base10_log=log10(x);
        base2_log=log2(x);
        restored=exp(natural_log);
        as_text=put(x,z4.);
        as_number=input(as_text,4.);
        output;
    end;
run;
proc print data=calculations(obs=10);
run;
