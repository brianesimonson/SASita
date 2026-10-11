# SAS normal generation research

Follow-up results are now available: normal-generation-results.md records
strong evidence for paired polar sampling returning x first and caching y.
All 512 candidate values per context match within rounding tolerance, with
exact subsequent uniform witnesses. Direct JavaScript checks cover all 52
printed values and 28 uniform witnesses. App integration has not changed.
The discussion below describes the initial documentary research.

Research uses the user's `lefunctionsref.pdf`, extracted locally as
/tmp/sas-functions.txt, and the official online RAND reference:
https://support.sas.com/documentation/cdl/en/lefunctionsref/63354/HTML/default/p0fpeei0opypg8n1b06qe4r040lv.htm

## Confirmed statements

- The modern functions manual, introductory discussion (printed p. 20), says
  RAND generates distributions by transforming one or more uniform variates
  from the current RNG.
- RAND details (printed p. 1411) identify the Mersenne Twister default and the
  hybrid initialization exception for seeds divisible by 8192, independently
  supporting the mapping implemented in v0.4.9.
- RAND's NORMAL section (printed pp. 1421–1422) specifies the distribution,
  mean and standard deviation, without identifying a named generation algorithm.
- Legacy RANNOR and CALL RANNOR explicitly document the Box–Muller transform
  of RANUNI uniform variates. This is not evidence that modern RAND('NORMAL')
  uses that same transform, generator or pair-caching rule.

Neither the inspected modern PDF nor the online SAS 9.3 RAND page contains a
Ziggurat reference. Do not claim SAS uses Ziggurat based on common practice in
other numerical libraries. Searches via public search engines, SAS blogs and
SAS Communities are unavailable through this environment's network proxy;
the official support reference and user's PDF were readable. Absence here is
not a claim that no public description exists anywhere.

## Concrete experiment

examples/normal-investigation/01-normal-method-probe.sas compares ten candidate
inverse-CDF, trigonometric Box–Muller and polar transformations, with/without
pair caching, in default/MT32 and normal-only/mixed contexts. Each context uses
seed 12345 and 512 normals. Candidate arithmetic is performed inside SAS to
avoid confusing JavaScript math differences with algorithm identity. Summary
compares exact HEX16 values, tolerance matches and subsequent uniform draws.

The code is a SAS-only reference experiment, not an app change. No actual SAS
results for it have been received. Sassy v0.4.9's current polar normal sampler
continues to be documented as unverified for SAS sequence equivalence. Matching
uniform generation alone cannot establish the distribution transform.
