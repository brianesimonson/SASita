data sql_a;length g $4;id=1;g='A';x=2;output;id=1;x=4;output;id=2;g='B';x=8;output;id=.;g='';x=.;output;run;
data sql_b;id=1;y=3;output;id=1;y=6;output;id=3;y=12;output;id=.;y=9;output;run;
proc sql;create table sql_cross as select a.id as aid,b.id as bid,a.x,b.y from sql_a as a cross join sql_b as b order by aid,bid,x,y;quit;
