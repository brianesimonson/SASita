/* Self-contained SQL: joins, grouped statistics, CASE and CALCULATED. */
data sql_claims;
    length provider $1;
    do claim_id=1 to 12;
        if mod(claim_id,2)=0 then provider='A';
        else provider='B';
        paid_amount=claim_id*100;
        output;
    end;
run;
data sql_providers;
    length provider $1 specialty $12;
    provider='A'; specialty='Medical'; output;
    provider='B'; specialty='Surgical'; output;
run;

proc sql;
    create table sql_enriched as
    select c.claim_id, c.provider, p.specialty,
           c.paid_amount,
           c.paid_amount*1.1 as adjusted,
           calculated adjusted-c.paid_amount as increase,
           case when c.paid_amount>=1000 then 'High'
                else 'Routine' end as category
    from work.sql_claims as c
    left join work.sql_providers as p
        on c.provider=p.provider
    order by c.claim_id;

    create table sql_summary as
    select provider,
           count(*) as claim_count,
           count(distinct claim_id) as unique_claims,
           mean(paid_amount) as average_paid,
           std(paid_amount) as sd_paid,
           var(paid_amount) as variance_paid,
           sum(paid_amount) as total_paid
    from sql_enriched
    group by provider
    having calculated claim_count>0
    order by provider;

    /* Explicit SELECT displays a report; CREATE TABLE only saves datasets. */
    select * from sql_summary;
quit;
