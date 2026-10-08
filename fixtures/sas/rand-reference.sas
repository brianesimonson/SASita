/* Run in an actual SAS DATA step runtime to capture exact comparison fixtures.
   This file uses PROC EXPORT and is not an app example.
   Record SAS release and host alongside the CSV. All streams explicitly use MT32. */
%macro capture(seed, mode, name);
data &name;
    call streaminit('MT32', &seed);
    length mode $ 7 u_hex n_hex $ 16;
    seed = &seed;
    mode = "&mode";
    do id = 1 to 32;
        u_hex = '';
        n_hex = '';
        %if &mode = uniform %then %do;
            u_hex = put(rand('uniform'), hex16.);
        %end;
        %else %if &mode = normal %then %do;
            n_hex = put(rand('normal'), hex16.);
        %end;
        %else %do;
            u_hex = put(rand('uniform'), hex16.);
            n_hex = put(rand('normal'), hex16.);
        %end;
        output;
    end;
    keep seed mode id u_hex n_hex;
run;
%mend;
%capture(1, uniform, s1u);
%capture(1, normal, s1n);
%capture(1, mixed, s1m);
%capture(12345, uniform, s2u);
%capture(12345, normal, s2n);
%capture(12345, mixed, s2m);
%capture(8192, uniform, s3u);
%capture(8192, normal, s3n);
%capture(8192, mixed, s3m);
%capture(4294967295, uniform, s4u);
%capture(4294967295, normal, s4n);
%capture(4294967295, mixed, s4m);
data rand_reference;
    set s1u s1n s1m s2u s2n s2m s3u s3n s3m s4u s4n s4m;
run;
proc export data=rand_reference outfile='rand-reference.csv'
    dbms=csv replace;
run;
