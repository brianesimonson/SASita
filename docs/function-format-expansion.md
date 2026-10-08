# Function and format expansion planning

## Scope and research status

The current inventory is complete for this app: see current-functions-formats.md and the app's Supported syntax dialog. No new language functions or format behavior have been added in this branch.

For the broader comparison, use the Base SAS DATA step function/CALL routine and format reference catalogs, starting with SAS 9.4. Separate functions from CALL routines, formats from informats, and Base SAS from DS2, macro, licensed-product, host-specific, and user-defined extensions. An exhaustive catalog must identify its SAS release and source; there is no single timeless list covering every SAS product.

On 2026-10-08, requests to SAS documentation were blocked by the cloud egress proxy with `Tunnel connection failed: 403 Forbidden`. Domain additions for support.sas.com and documentation.sas.com were saved in the environment configuration draft. Saving a draft does not apply network access. The official catalog has not been retrieved or counted, and the lists below are proposed candidates from general SAS knowledge, not a claimed documentation-verified or exhaustive inventory.

Official reference entry points to query after access is enabled:

- SAS Functions and CALL Routines reference: https://support.sas.com/documentation/cdl/en/lefunctionsref/63354/HTML/default/titlepage.htm
- SAS Formats and Informats reference: https://support.sas.com/documentation/cdl/en/lrfor/62949/HTML/default/titlepage.htm
- Current SAS documentation: https://documentation.sas.com/

After access is restored, save a release-specific comparison table with name, kind, category, official URL, current support, implementation constraints, and suggested priority. Keep counts distinct for functions, CALL routines, formats, and informats. Do not infer full compatibility from matching names.

## Proposed batches to discuss

| Batch | Candidate functions | Candidate formats | Dependencies and acceptance checks |
|---|---|---|---|
| 1 — everyday data cleaning | SCAN, COUNTW, COMPRESS, TRANWRD, TRANSLATE, FIND, FINDW, SUBSTRN, LENGTHC, REVERSE, CMISS | Z, bare w.d numeric, $w., $CHARw., DATE widths, MMDDYY, DDMMYY, additional YYMMDD variants | Verify delimiters/modifiers, missing and blank behavior, Unicode/byte choices, negative indices, fixed-length strings, width overflow, and rounding. Character descriptors need deliberate treatment. |
| 2 — dates and conversion | INTNX, INTCK, WEEKDAY, QTR, DATE, DATETIME, TIME, DHMS, HMS, DATEPART, TIMEPART, INPUT, PUT | TIME, HHMM, DATETIME, MONYY, YEAR, WEEKDATE, WORDDATE, ISO E8601DA/E8601DT | Build a shared format/informat registry; distinguish SAS date days from datetime/time seconds. Test leap years, interval boundaries/alignment, two-digit year policy, invalid input, and locale/timezone policy. INPUT needs informats; PUT is a function as well as a separate SAS statement concept. |
| 3 — numeric and statistics | LOG, LOG10, EXP, SIGN, MEDIAN, RANGE, STD, VAR, SUMABS | Improve BEST, COMMA, DOLLAR, PERCENT precision and width semantics; consider COMMAX | Test domain errors, all-missing inputs, sample/population definitions, precision, very large/small numbers, width overflow, and SAS-reference edge cases. |
| Later — additional complexity | PRX functions, RAND/random distributions, LAG/DIF, dataset/file/system functions, CALL routines | User-defined formats via PROC FORMAT, binary/platform-specific and locale-specific formats | Regex limits, seeded randomness, queue semantics, external service/file assumptions, or substantial parser/runtime changes. Assess browser-local feasibility individually. |

These batches are suggestions, not an approved implementation scope. Adding many functions is feasible when grouped around shared helpers and fixtures. Simply mapping names to JavaScript would miss important SAS semantics. Preserve the offline single-file build throughout.

## Before implementation

1. Finish the official catalog and select functions/formats with the user.
2. Choose representative SAS programs and expected outputs, marking fixtures unverified against SAS where appropriate.
3. Fix or explicitly preserve the existing semantic limits (rounding, missing values, type validation, string lengths, format widths) before building more features on top of them.
4. Implement in separate branches, regenerate the standalone HTML, run regression and browser checks, and save version checkpoints when requested. Leave main and v1.0 untouched until the user explicitly authorizes a merge.
