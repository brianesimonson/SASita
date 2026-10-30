data sql_a;length g $4;id=1;g='A';x=2;output;id=1;x=4;output;id=2;g='B';x=8;output;id=.;g='';x=.;output;run;
data sql_b;id=1;y=3;output;id=1;y=6;output;id=3;y=12;output;id=.;y=9;output;run;
proc sql;create table sql_case_group as select case when x is missing then 0 when x>3 then 1 else 2 end as bin,count(*) as rows_count from sql_a group by calculated bin order by bin;quit;
