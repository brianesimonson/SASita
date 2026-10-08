# Function and format expansion planning

## Scope and research status

The current inventory is complete for this app: see current-functions-formats.md and the app's Supported syntax dialog. No new language functions or format behavior have been added in this branch.

The official catalog is now available in [catalogs/README.md](catalogs/README.md), based on the user's uploaded PDFs: **SAS Functions and CALL Routines: Reference** (September 14, 2026, 2020.1–2026.09) and **SAS Formats and Informats: Reference** (April 8, 2026, 2020.1–2026.04). These are the actual supplied editions, replacing the earlier plan to query SAS 9.4 web manuals.

The complete dictionary indexes contain 655 function topics, 65 CALL routine topics, 289 format topics, and 109 informat topics. Every indexed title and page was cross-checked against chapter contents. Counts are of documented topics, not distinct function names: some callables have several distribution or operation topics. Product-specific and user-defined extensions outside these manuals are not covered.

Website requests were previously blocked by egress policy. SAS documentation domain additions were saved in the configuration draft, but the PDFs remove that dependency for this inventory. Live website access remains unverified and is no longer a prerequisite to selecting the next implementation group.

Proposed names below were matched to entries in the supplied manuals, with page references in the catalogs. This establishes that the features are documented, not that their complete semantics have been audited or implemented. Selection remains the user's decision. Functions, CALL routines, formats, and informats are kept separate.

## Proposed batches to discuss

| Batch | Candidate functions | Candidate formats | Dependencies and acceptance checks |
|---|---|---|---|
| 1 — everyday data cleaning | SCAN, COUNTW, COMPRESS, TRANWRD, TRANSLATE, FIND, FINDW, SUBSTRN, LENGTHC, REVERSE, CMISS | Z, bare w.d numeric, $w., $CHARw., DATE widths, MMDDYY, DDMMYY, additional YYMMDD variants | Verify delimiters/modifiers, missing and blank behavior, Unicode/byte choices, negative indices, fixed-length strings, width overflow, and rounding. Character descriptors need deliberate treatment. |
| 2 — dates and conversion | INTNX, INTCK, WEEKDAY, QTR, DATE, DATETIME, TIME, DHMS, HMS, DATEPART, TIMEPART, INPUT, PUT | TIME, HHMM, DATETIME, MONYY, YEAR, WEEKDATE, WORDDATE, ISO E8601DA/E8601DT | Build a shared format/informat registry; distinguish SAS date days from datetime/time seconds. Test leap years, interval boundaries/alignment, two-digit year policy, invalid input, and locale/timezone policy. INPUT needs informats; PUT is a function as well as a separate SAS statement concept. |
| 3 — numeric and statistics | LOG, LOG10, EXP, SIGN, MEDIAN, RANGE, STD, VAR, SUMABS | Improve BEST, COMMA, DOLLAR, PERCENT precision and width semantics; consider COMMAX | Test domain errors, all-missing inputs, sample/population definitions, precision, very large/small numbers, width overflow, and SAS-reference edge cases. |
| Later — additional complexity | PRX functions, RAND/random distributions, LAG/DIF, dataset/file/system functions, CALL routines | User-defined formats via PROC FORMAT, binary/platform-specific and locale-specific formats | Regex limits, seeded randomness, queue semantics, external service/file assumptions, or substantial parser/runtime changes. Assess browser-local feasibility individually. |

These batches are suggestions, not an approved implementation scope. Adding many functions is feasible when grouped around shared helpers and fixtures. Simply mapping names to JavaScript would miss important SAS semantics. Preserve the offline single-file build throughout.

## Before implementation

1. Select functions/formats with the user from the completed official catalog.
2. Choose representative SAS programs and expected outputs, marking fixtures unverified against SAS where appropriate.
3. Fix or explicitly preserve the existing semantic limits (rounding, missing values, type validation, string lengths, format widths) before building more features on top of them.
4. Implement in separate branches, regenerate the standalone HTML, run regression and browser checks, and save version checkpoints when requested. Leave main and v1.0 untouched until the user explicitly authorizes a merge.
