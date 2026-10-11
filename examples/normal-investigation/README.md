# SAS NORMAL generation investigation

Completed initial result: `polar_pair_x` matches all 512 normals within rounding
tolerance in all four contexts, with exact subsequent uniform checks. The
JavaScript prototype matches the 52 printed normals (38 bit-identical) and all
28 printed uniform witnesses. See docs/validation/normal-generation-results.md.
Sassy v0.4.9 still discards the second polar value; app integration is pending.
No rerun is needed to inspect this already-received result.

Run `01-normal-method-probe.sas` in SAS Studio and return HTML Results and log.
No CSVs, folder setup, previous WORK tables or downloads of output files are
needed. The Sassy app has not changed.

The program tests ten candidate transformations, each using the same seed and
RNG as SAS RAND('NORMAL'): inverse normal CDF, its complement, trigonometric
Box–Muller (sine/cosine, cached or discarded pair), and polar sampling (x/y,
cached or discarded pair). Four contexts cover default/explicit MT32 and
normal-only/mixed normal-uniform calls, with 512 normals each.

The final summary has 40 rows:

- `exact_z`: number of bit-identical normal values out of 512.
- `close_z`: number matching within 1e-12 scaled by max(1,abs(actual)).
- `exact_uniform` / `uniform_checks`: whether subsequent uniform values match,
  testing stream consumption as well as normal values. Normal-only contexts
  compare one uniform after all 512 normals; mixed contexts compare after each.
- `max_abs_diff`: maximum absolute difference for normal values.

If values are close but not bit-identical, numerical arithmetic needs more work.
If subsequent uniforms differ, the candidate consumes the stream differently.
If no candidate matches, do not conclude that a particular untested algorithm
(for example, a Ziggurat variant) must be the answer. Other implementations,
parameterizations and endpoint rules are possible.

SAS documents Box–Muller for legacy RANNOR, but the inspected RAND reference
does not name the NORMAL transformation. The candidate tests investigate it;
they do not assume the legacy method is also RAND's method. A successful match
in these cases still needs additional seeds, tails, parameter and caching checks
before implementation can claim broader SAS sequence equivalence.
