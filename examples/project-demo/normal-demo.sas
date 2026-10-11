/* Sassy/SAS-compatible NORMAL examples: four seed-12345 contexts.
   Each table has 512 rows; inspect z and next_u_hex. No folder needed. */

data normal_default_normal;
    call streaminit(12345);
    do id=1 to 512;
        z=rand('normal');
        z_hex=put(z,hex16.);
        next_u_hex=''; if id=512 then next_u_hex=put(rand('uniform'),hex16.);
        output;
    end;
run;

data normal_default_mixed;
    call streaminit(12345);
    do id=1 to 512;
        z=rand('normal');
        z_hex=put(z,hex16.);
        next_u_hex=put(rand('uniform'),hex16.);
        output;
    end;
run;

data normal_mt32_normal;
    call streaminit('MT32',12345);
    do id=1 to 512;
        z=rand('normal');
        z_hex=put(z,hex16.);
        next_u_hex=''; if id=512 then next_u_hex=put(rand('uniform'),hex16.);
        output;
    end;
run;

data normal_mt32_mixed;
    call streaminit('MT32',12345);
    do id=1 to 512;
        z=rand('normal');
        z_hex=put(z,hex16.);
        next_u_hex=put(rand('uniform'),hex16.);
        output;
    end;
run;
