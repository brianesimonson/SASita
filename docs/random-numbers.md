# RAND and stream initialization — Sassy v0.4.9

You no longer need an explicit MT32 designation to use seeded RAND:

```sas
data random_values;
    call streaminit(12345);
    do id=1 to 1000;
        u=rand('uniform');
        output;
    end;
run;
```

`CALL STREAMINIT(seed)` selects MTHYBRID. Explicit
`CALL STREAMINIT('MT32',seed)` remains available; MT2002 is its alias. MT1998
and MTHYBRID can also be selected by name. Seeds are positive integers up to
4294967295. Only the first initialization in a DATA step takes effect. Each
DATA step/run owns its own stream.

RAND without STREAMINIT initializes automatically, as does a nonpositive seed.
Sassy chooses a positive seed using browser/Node crypto (clock fallback) and
records it in the log. Reuse that seed explicitly for reproducibility. This is
not reproduction of SAS's clock-based seed choice or timestamp. An automatically
chosen seed can fall outside the seeds empirically verified against SAS.

## Two initializations, one Mersenne Twister core

MT32/MT2002 uses the 2002 state initialization. MT1998 uses the older 69069
recurrence. MTHYBRID uses the older initialization except seeds divisible by
8192, which select the 2002 initialization. The exceptional-seed hybrid mapping
is implemented but has not been checked against an actual SAS fixture.

Uniform conversion preserves the exact constant `2.328306436538696e-10`.
Replacing it with `1/2**32` changes bits. Exact checks cover:

- Explicit MT32: 40,000 uniform HEX16 values at seed 12345.
- Default initialization: 400 uniform HEX16 values at seed 12345.
- SURVEYSELECT: matching selected records/hits and derived stratum seeds at
  main seeds 12345 and 24680. RAND returns draws; SURVEYSELECT uses draws in
  sampling algorithms. Neither calls the other as a SAS procedure.

These are scoped reference checks. Other seeds, streams crossing further twist
boundaries under the older initialization, hybrid exceptions and zero-output
endpoint handling are not all certified against SAS.

## Distribution limits

UNIFORM and NORMAL remain the only supported distributions. Existing optional
UNIFORM bounds and NORMAL mean/sigma parameters remain supported; other
distributions fail clearly. Uniform HEX16 agreement applies to unbounded draws.

NORMAL uses the existing Marsaglia polar sampler, discarding the second variate.
It is statistically useful but **does not reproduce SAS's normal sequence**.
Matching a generator does not establish matching distribution transforms. Do
not describe all RAND distributions as SAS-identical. The same limitation
applies to mixed uniform/normal sequences because NORMAL consumes draws.

The browser and exported Node/Python-wrapper packages use the identical engine;
Python invokes Node and does not replace the RNG. Floating-point computations
use ordinary JavaScript doubles. Deployment limits: procedure-support.md.
