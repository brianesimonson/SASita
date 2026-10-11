# NORMAL probe results: paired polar sampling

Source: user-uploaded `01-normal-method-probe-results.html` and
`01-normal-method-probe-log.html` (uploads file_00000000464481f5a66d705a7a213531
and file_00000000716481f595359e11e5a75884). SAS 9.4 M8/SAS/STAT 15.3 Linux;
no ERROR/WARNING diagnostics. Source hashes, 52 printed normal HEX16 values
and all 40 candidate summaries are in fixtures/sas/normal-method-probe.json.

The `polar_pair_x` candidate matches all 512 normals within rounding tolerance
in every context, and all subsequent uniform witnesses match exactly:

| Context | Exact normal values | Close normal values | Exact subsequent uniforms | Maximum absolute normal difference |
| --- | ---: | ---: | ---: | ---: |
| DEFAULT / NORMAL | 413/512 | 512/512 | 1/1 | 7.632783294e-16 |
| DEFAULT / MIXED | 417/512 | 512/512 | 512/512 | 7.632783294e-16 |
| MT32 / NORMAL | 440/512 | 512/512 | 1/1 | 6.661338148e-16 |
| MT32 / MIXED | 442/512 | 512/512 | 512/512 | 6.661338148e-16 |

These are candidate computations inside SAS, not 2,048 direct comparisons
of JavaScript output. The HTML prints 13 actual normals per context (first 12
and draw 512). scripts/check-normal-reference.mjs independently runs the paired
polar algorithm in JavaScript with the existing runtime uniform generators:
all 52 printed normals agree within tolerance, 38 are bit-identical, maximum
absolute difference 4.440892098500626e-16. All 28 printed subsequent-uniform
witnesses match exactly, including the draw after 512 normal-only outputs.

## Mechanism supported by the evidence

Generate x=2*U1-1 and y=2*U2-1; reject the pair unless 0 < s=x*x+y*y < 1.
Compute factor=sqrt(-2*log(s)/s). Return x*factor and cache y*factor for the next
NORMAL call. Returning the cached value consumes no new uniform draws. In the
mixed experiment, an intervening uniform call leaves that cached normal intact.

The simple inverse-CDF and trigonometric Box–Muller candidates fail. A paired
polar candidate returning y first consumes the same stream, but does not match
the normal ordering. The current deployed Sassy sampler returns x and discards
y; its candidate matches only the first normal and then diverges in values and
stream consumption. The transform family is already present, but pair caching
must change to reproduce SAS's tested behavior.

This is empirical algorithm identification for seed 12345 and these contexts,
not source-code disclosure or proof for every seed/parameter/release. Last-bit
differences remain even when candidates are evaluated inside SAS, so do not
claim bit-identical normals. Additional complete normal fixtures, seeds, tails,
parameter/caching checks and app integration remain future work. Sassy v0.4.9,
main and prior tags are unchanged by this research.
