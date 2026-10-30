data sql_a;length g $4;id=1;g='A';x=2;output;id=1;x=4;output;id=2;g='B';x=8;output;id=.;g='';x=.;output;run;
data sql_b;id=1;y=3;output;id=1;y=6;output;id=3;y=12;output;id=.;y=9;output;run;
proc sql;create table sql_calculated as select id,x*2 as doubled,calculated doubled+1 as adjusted,case g when 'A' then 'alpha' else 'other' end as label from sql_a where calculated doubled>=8 order by adjusted desc;quit;
