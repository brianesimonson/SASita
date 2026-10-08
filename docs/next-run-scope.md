# User priorities for the next development run

Recorded 2026-10-08. This preserves the user's requested direction for a subsequent implementation chat. It does not implement new language behavior or authorize a merge into main.

## Existing text functions

SUBSTR on the right-hand side of assignment is already implemented, including its optional length argument. LENGTH and LENGTHN are already implemented: trailing whitespace is removed, LENGTH returns at least 1, and LENGTHN returns 0 for an empty string. Fixed-length SAS padding, byte/Unicode semantics, and argument edge cases remain subset limitations. Assignment-form SUBSTR, SUBSTRN, and LENGTHC are separate features. The user wants broader text-cleaning work deferred.

## Common formats and conversion functions

Prioritize common formats and INPUT/PUT functions instead of the earlier text-cleaning batch. Candidate scope to make concrete at implementation time: bare w.d numeric, Z, DATE widths, MMDDYY, DDMMYY, YYMMDD variants, MONYY, TIME, DATETIME, and common character formats. Keep existing COMMA/DOLLAR/PERCENT families.

INPUT converts text using an informat; PUT returns text using a format. These are distinct from INPUT/PUT statements and from CSV file import/export. A shared format/informat registry and parser support for format arguments are needed. Start with representative conversions and clearly defined invalid-input behavior.

The user is interested in simplifying width handling. Recommended distinction: table alignment/padding can be relaxed, but width can affect content in Z formats, date representations, character truncation, numeric precision/overflow, and strings returned by PUT. Do not promise SAS-compatible conversion while ignoring those width semantics. Document any deliberately simplified behavior. The chosen subset and width policy still need to be finalized in the implementation run.

## RAND and repeatability

The user wants modern RAND, especially uniform and normal, and values bit-for-bit SAS reproducibility. Legacy RANUNI/RANNOR/etc. are not requested.

Research source: uploaded SAS Functions and CALL Routines: Reference, September 14, 2026, versions 2020.1–2026.09. Printed pages below are PDF pages minus 10.

- Printed pp. 22–24 (PDF pp. 32–34): default RNG is MTHYBRID beginning with SAS 9.4M3. SAS offers MT1998, MT32/MT2002, MT64, PCG, Threefry, and hardware alternatives. RAND transforms one or more uniforms to generate distributions; normal draws consume an indeterminate number of values, so call order affects subsequent results.
- Printed pp. 417–420 (PDF pp. 427–430): CALL STREAMINIT selects generator and seed. First initialization wins in a DATA step/thread; later calls are ignored. Positive seeds give reproducibility. Missing/nonpositive seeds or RAND without prior initialization cause SAS to obtain a seed. MT-family 32-bit seeds range from 1 to 4294967295; other seed edge cases need deliberate handling.
- Printed p. 1411 (PDF p. 1421): default 32-bit Mersenne Twister uses the 2002 initialization when the seed is divisible by 8192, and the 1998 initialization otherwise, for compatibility.

MT19937 recurrence alone does not guarantee the SAS RAND output sequence. Exact reproduction also depends on generator variant, initialization, integer-to-uniform conversion, stream lifecycle, distribution transformation, number of words consumed, caching/rejection behavior, and floating-point arithmetic. The reviewed manual sections do not provide a complete bit-level normal implementation.

Recommended acceptance work:

1. Choose an explicit SAS release and generator target, preferably an explicitly selected MT32/MT2002 for an initial bounded implementation, or implement/document MTHYBRID when matching ordinary SAS defaults is required. Do not silently substitute MT32 for default MTHYBRID.
2. Validate a JavaScript core against authoritative generator test vectors. This proves the core algorithm only.
3. Obtain SAS fixtures for uniform-only, normal-only, and interleaved uniform/normal calls. Cover seeds 1, 12345, a multiple of 8192, and 4294967295; repeated STREAMINIT and separate DATA steps.
4. For a bit-for-bit claim, compare exact numeric bit patterns (for example HEX16 output), not rounded printed decimals or statistical distributions alone.
5. Use one stream per DATA step with documented initialization. Fail clearly on unimplemented generator/distribution choices. Investigate normal transformation details before claiming SAS-exact output.

JavaScript can implement the integer generator accurately using unsigned 32-bit operations. SAS-identical normal outputs are a separate goal requiring evidence; a generic Box–Muller implementation must not be labeled SAS-equivalent merely because it uses MT19937.

## Working workflow

Keep browser-local execution and regenerate the self-contained HTML after changes. Start implementation in a separate feature branch from the user's chosen baseline. Keep main and v1.0 untouched; use pushed commits/checkpoints and update PROJECT-STATUS.md with actual results. The official catalogs and current support reference are available on docs/function-format-catalog and inherited by this planning branch.
