data sql_a;length g $4;id=1;g='A';x=2;output;id=1;x=4;output;id=2;g='B';x=8;output;id=.;g='';x=.;output;run;
data sql_b;id=1;y=3;output;id=1;y=6;output;id=3;y=12;output;id=.;y=9;output;run;
proc sql;create table sql_grouped as select g,count(*) as rows_count,count(x) as nonmissing,count(distinct id) as unique_ids,sum(x) as total,mean(x) as average,avg(x) as average2,std(x) as sd,stddev(x) as sd2,var(x) as variance,min(x) as lo,max(x) as hi from sql_a group by g order by g;quit;
