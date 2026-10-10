/* Macros generate SAS statements; Expanded code shows the result. */
%macro squares(limit=10);
    data demo_squares;
        do number=1 to &limit;
            square=number**2;
            output;
        end;
    run;
%mend squares;
%squares(limit=20);
