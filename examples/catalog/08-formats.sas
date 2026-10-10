data demo_formats;
    amount=input('$1,234.50',comma12.);
    sas_day=input('03/15/2018',mmddyy10.);
    iso_day=put(sas_day,e8601da10.);
    padded_id=put(1350,z8.);
    format amount dollar12.2 sas_day date9.;
run;
