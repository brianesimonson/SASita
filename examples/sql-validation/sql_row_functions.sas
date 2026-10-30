data sql_a;length g $4;id=1;g='A';x=2;output;id=1;x=4;output;id=2;g='B';x=8;output;id=.;g='';x=.;output;run;
data sql_b;id=1;y=3;output;id=1;y=6;output;id=3;y=12;output;id=.;y=9;output;run;
proc sql;create table sql_row_functions as select id,x,mean(x,10) as row_mean,sum(x,10) as row_sum,put(coalesce(x,0),z4.) as text,input('0042',4.) as parsed from sql_a order by id,x;quit;
