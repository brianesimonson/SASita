/* Explicit MT32 seed. Seed 12345 uniform draws have a real SAS comparison fixture. */
data demo_uniform;
    call streaminit('MT32',12345);
    do id=1 to 1000;
        uniform_x=rand('uniform');
        uniform_y=rand('uniform');
        x_hex=put(uniform_x,hex16.);
        output;
    end;
run;
