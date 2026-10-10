# SASita project status

## Sassy v0.4.8: PROC MEANS AUTONAME correction

User-supplied initial SAS logs confirm all six base datasets have the same dimensions as Sassy, with clean 01 execution. Original 02 guessed all numeric CSV columns as character and aborted comparisons; first compare also failed because SAS lacks AMOUNT_STD/OTHER_STD. STD AUTONAME uses the canonical StdDev suffix. Branch fix/sassy-means-autoname changes generated STD/STDDEV names to *_stddev, preserves explicit names, tests repeated *_stddev2 requests, updates fixture headers and bundles the typed SAS helper (plus first-table PROC CONTENTS). Numeric CSV values are unchanged. Evidence hashes and exact diagnostic summary: docs/validation/means-initial-logs.md. Actual numerical comparison remains pending.

Validation: full baseline npm test and modular/standalone Chromium checks, including returned Python/Node tables, example execution and canonical header checks. App and portable ZIPs are rebuilt with the corrected runtime; corrected comparison ZIP contains six CSVs and the typed helper. Main and earlier tags/branches remain unchanged.


## Initial PROC MEANS SAS report: typed-import correction

User-uploaded October 10 report contains five dataset summaries with matching row counts (14, 6, 5, 3, 1), but numeric-column type conflicts (6, 5, 4, 5, 7) and no value comparisons. The first comparison section is empty. This does not validate the calculations. Evidence/hash are in docs/validation/means-initial-comparison.md. Branch fix/means-sas-comparison-types replaces the SAS-only test importer with schema-generated explicit LENGTH/INFILE DSD/INPUT, preserving the six app CSVs unchanged and adding table titles. Corrected harness ZIP is available on that branch; v0.4.7 app ZIP/tag remains the existing milestone. Actual corrected SAS run and log remain pending; main and prior milestones unchanged.


## Sassy v0.4.7: PROC MEANS and example catalog

Branch feature/sassy-proc-means adds 13 unweighted descriptive statistics, numeric VAR, sorted BY, formatted CLASS grouping, default all-type totals/subtotals, NWAY, MISSING, NOPRINT, DF/N variance, MAXDEC, named OUTPUT statements and AUTONAME. Saved datasets preserve _TYPE_ bit order, _FREQ_, blank/missing inactive classes, per-variable N/NMISS, and five _STAT_ rows when OUTPUT requests are omitted. Displayed reports show full combinations and append to session Output. Native library staging and portable runtime include the new procedure. docs/means.md defines boundaries and SAS 9.2 PDF provenance; no actual new SAS reference results have been received.

Eight previewable/downloadable examples in a compact header dialog cover DATA/SORT/MERGE, uniform MT32, five charts, MEANS total/NWAY/default outputs, macros, project CSV, JSON libraries and formats. Opening never runs and prompts before replacing unsaved edits. Source .sas files generate the embedded example catalog. Six deterministic result CSVs and SAS-only PROC COMPARE helper are packaged in examples/means-validation/means-validation.zip and included in the app ZIP.

Validation passed: npm test including new hand-derived CLASS/type/frequency/missingness/statistics/large-offset/singleton/formatted-group/BY/native/example checks; portable ZIP-to-Python MEANS execution/report checks; modular and standalone Chromium for example opening/no-auto-run, 12-row two-CLASS saved structure, exact counts and all existing charts/folders/history/export checks. Table screenshot inspected. Remaining SAS runtime comparison, Windows/locale validation and unsupported advanced statistics/options are explicit in docs/means.md. Main/v1.0 and v0.4.5/v0.4.6 milestones remain unchanged.


## Sassy v0.4.6: portable wrapper proof of concept

Branch feature/sassy-portable-wrapper adds a small Code & export control in the upper-right project file box. Its read-only modal shows current SAS, Node/Python runners and exact build-snapshotted runtime modules. The exported ZIP includes current WORK native table snapshots, unchanged program.sas, remembered bindings/title, runtime and runners. This remains an interpreter, not generated JavaScript per program. External project files are intentionally not copied; --project selects the actual data folder. Default project library folders are empty. Chart models are returned, not rendered PNGs. The app stays one offline HTML (~95 KB added); the optional local runner needs Node.js 24+, and Python is optional.

Validation: npm test passed with new source/ZIP CRC/Node/Python/RAND/signed-zero/library/CSV/chart/rollback/preflight/symlink checks. Modular and standalone Chromium checks export the actual ZIP, compare visible source byte-for-byte, extract and execute the Python wrapper, and verify output rows. Existing editor/history/charts/library/files checks also passed; modal screenshot inspected. docs/portable-demo.md records precise snapshot semantics, limits and filesystem scope; OS-specific Windows validation and multiuser/concurrent filesystem hardening are not claimed. Main/v1.0 unchanged; v0.4.5 tag and snapshot branch point at b30711e.


## Sassy v0.4.5: contextual syntax guide

Branch feature/sassy-context-help adds an initially collapsed right-side Program syntax guide. Cursor scanning ignores comments/strings, tracks procedure boundaries and nested function calls, and supports a searchable catalog of all five procedures, 35 DATA step functions, 20 format families and six statement/macro references (66 entries). Manual browsing pauses cursor following; a checkbox resumes it. Ctrl+Space opens help; Tab keeps indentation. Templates insert only at the current selection/caret, mark edits unsaved, preserve surrounding code and never execute. Formats are reference-only. No AI/network/runtime dependency; modular catalog embedded in standalone HTML adds about 24 KB (1.6%).

Validation: npm test passed, including catalog/engine function coverage, runnable function examples, comments/quotes/nested calls and procedure/caret boundaries. Chromium browser checks passed in modular and standalone builds for live function tracking, PROC SORT options, catalog search/browse, non-destructive template insertion, dirty-state tracking, collapse/full-width restoration, and existing charts/libraries/files/calculation examples. Screenshot inspected. Scanner is tolerant source guidance rather than a complete SAS parser; macro-generated/incomplete contexts may need manual browsing. No engine semantics changed. Main and v1.0 remain unchanged.


## Sassy v0.4.4: offline Chart.js plotting

Branch feature/sassy-chartjs-plots adds bounded PROC SGPLOT SCATTER/HBAR/VBAR/HISTOGRAM and PROC SGPIE PIE, TITLE/reset, axis labels, scatter/bar grouping, bar/pie FREQ/SUM/MEAN, grouped stack/cluster layouts, histogram counts/percent/proportion and explicit/automatic bins. Sources can be WORK or named JSON libraries; macros expand before parsing. Unsupported options, overlays and PROC PLOT fail clearly. docs/charts.md and in-app Help define the implemented subset and non-SAS-exact defaults.

Chart.js 4.5.1 was vendored from the verified npm release with MIT attribution; its UMD renderer is embedded directly in the standalone HTML. No CDN/internet dependency was introduced. Pure chart models are prepared in the worker, capture values at procedure execution, and append to session Output after successful final table snapshots. Output history can select prior plots after dataset replacement. Canvas instances are destroyed on table selection/clear, and PNG downloads include the title and white background. Titles commit across runs only on success. Programmatic CSV/native writes retain staging/preflight/partial-write safeguards.

Bounds: 20 charts/100,000 plotted values per run, 20,000 scatter points, 200 categories, 50 groups, 1–100 explicit histogram bins; output history shares the 100-entry/250,000-row-or-point cap. Missing/nonfinite observations are omitted and counted. Pie totals must be positive/nonnegative and finite, and overflowing ranges/statistics fail clearly. Histograms use defined bounded Sturges bins rather than SAS's exact default algorithm; means use online double arithmetic. Source formats do not currently alter chart ticks/tooltips. No new SAS runtime graph/statistics comparison or SGPLOT manual fixture has been supplied.

Validation passed: npm test, including new chart grouping/statistics/bin-edge/missing/title/macro/native-library/snapshot/bounds/rollback checks and all existing numeric fixtures; npm run test:browser -- --validation --large-numbers --screenshots in modular and standalone Chromium for all five rendered chart types, histogram totals, PNG bytes, history snapshots, Clear/instance cleanup, failed-chart rollback, library reads/writes and the full calculation CSV suites. A final focused browser run verifies titled PNG export dimensions. The desktop chart screenshot and titled PNG were inspected. charts-demo.sas generates all five plots without a project folder; ZIP/license/member checksums are verified. Cloud file://, Windows OS dialogs and hosted CI remain outside this local validation. Download dist/Sassy-v0.4.4.zip. Main and v1.0 remain unchanged.


## Sassy v0.4.3: native JSON libraries and SPI logo

Branch feature/sassy-json-libraries adds LIBNAME bindings for existing relative project subfolders (or '.' for the project root), session-persistent bindings/CLEAR, permanent DATA and PROC SORT targets, named-library CSV import/export, and sidebar discovery/refresh/open. One-level/WORK datasets remain temporary. Changing/disconnecting a project clears bindings. Reopening the app requires reassignment; disk tables remain. Permanent PROC IMPORT requires REPLACE; native DATA/SORT targets replace on success. Libraries cannot be reassigned/cleared after writing through them in one run.

Native .sassy-table.json files have a version marker, ordered column descriptors and ordinary row objects. Codecs validate names, types, supported formats, character lengths, row shape, finite numeric values, version and file bounds. Finite doubles including signed zero round-trip exactly in JavaScript. The engine now carries declared character-length metadata through input selection/rename, SET/MERGE and SORT and enforces inherited lengths on assignments. This is a bounded descriptor subset, not full SAS descriptor semantics. See docs/native-tables.md and its included machine-readable JSON Schema.

First library reads per run refresh from disk; same-run reads see staged writes, including shared-folder aliases. Repeated native writes save the final version; ambiguous case-colliding paths fail. CSV/native exports share staging, all-target preflight, 20 MB/file and 50 MB/run bounds; partial disk failures remain explicitly non-atomic. WORK and library bindings commit after saves. The offline build includes the codec. The SPI header uses an image_gen-prepared adaptation of the supplied logo, embedded in the HTML; provenance is in dist/spi-logo-provenance.md.

Validation passed: npm test, with new native-schema/finite-double/alias/replacement/reload/CLEAR/rollback/library-demo checks and the prior 40,000-draw SAS fixture; npm run test:browser -- --validation --large-numbers --screenshots for modular and standalone builds. Browser checks cover actual sandbox native writes, metadata, later-run and reopened-session reads, library discovery, rendered logo, failed-run disk preservation, and prior full CSV validation suites. The desktop screenshot was inspected. Latest packaged library demo writes and reloads six formatted observations; ZIP member checksums are verified. No fresh SAS-runtime comparison was performed for LIBNAME or inherited character-length semantics. OS picker dialogs and cloud-blocked file:// remain manual checks. Download dist/Sassy-v0.4.3.zip. Main and v1.0 are unchanged.


## Sassy v0.4.2: more editor space

Branch feature/sassy-compact-header moves the program/project file box into the upper-right brand header and puts Supported syntax inside it. The separate full-width toolbar row is gone; the editor gains about 70 pixels at a 1400×900 desktop viewport. The brand and favicon use temporary SPI text because the actual SPI logo asset is not available in the checkout. Replace this placeholder when supplied; do not invent the graphic.

Validation: npm test passes. Modular and standalone Chromium checks pass for tab visibility, editor dimensions, help placement, rolling histories, prior snapshot preservation, all ten regression programs, program open/save, folder streams and persistence, import/export and failed-run rollback. The desktop screenshot was visually inspected. The ZIP and member checksums are verified. OS picker dialogs and cloud-blocked file:// navigation remain manual checks. Main and v1.0 are unchanged.

LIBNAME is not implemented in this release. docs/library-storage-proposal.md records the requested design discussion: versioned native .sassy-table.json files preserving rows and descriptors, scoped folder libraries, temporary WORK, CSV interchange, and required replacement/validation semantics. SAS7BDAT is not the recommended first implementation. Storage decisions remain for discussion before that feature is built.


## Sassy v0.4.1: compact tabbed workspace

Branch `feature/sassy-tabbed-workspace` builds on v0.4.0. The app is now Sassy, with a compact filename/file toolbar, Run beside program controls, full-size Program/Output/Log panes, and WORK datasets kept at the left. Introductory, example-loading, browser/offline-download chrome has been removed. Supported syntax and macro-expanded source remain available. A fresh editor starts blank; recovered drafts are never executed automatically.

Log entries append across runs and file actions. Output keeps final successful-run dataset snapshots with a run/program selector; replacing WORK datasets does not replace earlier snapshots. Independent Clear buttons preserve WORK. Histories reset on reload and have documented memory bounds. Dataset selection opens Output, successful Run opens Output, errors open Log.

PrismJS 1.30.0 SAS syntax coloring is vendored from the verified npm release, with MIT attribution included in the generated HTML and ZIP. No network request or runtime dependency is required. Large programs fall back to plain coloring. Syntax coloring does not imply additional engine support. See docs/app-guide.md and dist/vendor/README.md. Download: dist/Sassy-v0.4.1.zip. Main and v1.0 remain unchanged.

Validation passed: npm test and npm run test:browser -- --validation --large-numbers --screenshots, for both modular and standalone builds. Browser checks cover tab visibility, SAS token coloring and escaped HTML, accumulated histories, independent clears, prior snapshot preservation, all ten regression programs, full validation CSV exports, file open/save, directory streams, persisted folder handles, draft recovery, and failed-run rollback. The desktop Program pane was also visually inspected in a 1400×900 Chromium screenshot. The ZIP and member checksums are verified. The user reports the prior folder workflow works on their computer; browser/version details were not supplied. OS permission dialogs and cloud-blocked file:// navigation remain outside automated coverage.


## v0.4.0: program files and remembered project folders

Branch `feature/project-folder-program-files` adds New/Open/Save/Save As program controls, filename and unsaved status, keyboard saves, recovery drafts, project folder selection/browsing, IndexedDB directory-handle persistence and permission-aware reconnect, plus manual Save CSV to project and download fallbacks. Source and generated standalone HTML remain offline and browser-local. The new download is dist/SASita-v0.4.0.zip, containing the app and a ready-to-select demo-project folder.

The asynchronous worker adapter supports bounded FILENAME aliases and CSV PROC IMPORT/EXPORT with relative project paths, macros, GETNAMES=YES, GUESSINGROWS=MAX, and REPLACE. Absolute paths/URLs/parent traversal are rejected. Exports are staged until all computations succeed; all targets are preflighted, existing files require REPLACE, and individual disk writes follow. Partial write failures report possibly changed files and leave WORK uncommitted. Same-path imports can read a prior staged export. CSVs are capped at 20 MB each, aggregate program exports at 50 MB, project programs at 200 steps, and program files at 1 MB. Existing numeric/merge behavior is preserved.

Validation passed: npm test, including exact 40,000-draw SAS fixture and new file-program/project-adapter edge cases; npm run test:browser -- --validation --large-numbers for modular and standalone builds, all existing examples and full validation CSVs, program open/direct save, native browser sandbox directory streams, remembered handles, draft recovery, overwrite refusal, and failed-run no-write behavior. Packaged demo produces six reviewed rows and a prepared CSV; ZIP integrity and checksums are verified.

Real OS picker dialogs and Windows file:// folder access remain manual checks. Chromium tests substitute native browser sandbox handles for the OS picker and run the standalone HTML over HTTP, because cloud browser file:// navigation is blocked by policy. Unsupported browsers retain upload/download workflows. Permission persistence is browser-controlled and is never promised as permanent. Existing validation ZIPs preserve previous app milestones; use the new v0.4.0 ZIP for this workflow. Main and v1.0 are unchanged.


## Large-number SAS validation confirmed

The uploaded 05-sas-large-number-comparison-results.html confirms all 3,000 large-number rows pass both 1e-10 and 1e-15 SAS/app comparison thresholds. There are 761 nonexact values and a maximum criterion of 2.219e-16. All nine integer-boundary observations match exactly. Per-operation summaries show no missing results or threshold failures; multiplication, division, squares, square roots, cube roots, and mixed expressions have zero absolute difference. Cubes and fourth powers have small differences relative to their magnitude.

This actual SAS comparison complements the independent 100-digit reference. Cube roots via **(1/3) agree exactly with SAS for this program, while sharing the approximate-exponent accuracy limitation observed against mathematical reference values. Evidence and source checksum are recorded in docs/validation/large-number-sas-results.md on branch docs/large-number-sas-confirmed. This validation round is complete. The following sections preserve earlier milestones; no app/package changes or additional SAS reruns are required. Main and v1.0 remain unchanged.


## Large-number precision test

Branch `test/large-number-precision` adds a separate examples/large-numbers/large-number-tests.zip: unchanged standalone HTML, a portable 3,000-row large-number program, a SAS-only comparison helper, app CSVs, 100-digit independent decimal-reference report, and integer-boundary demonstration. Ordinary SAS and JavaScript calculations use double precision; this tests significant-digit error thresholds, not 15 fractional digits at arbitrary magnitudes.

All 24,000 computed values pass 1e-10 error versus 100-digit Decimal references on exact stored binary inputs. Seven operations pass 1e-15 on all cases; cube roots via **(1/3) exceed that tighter threshold on 2,028 cases, with maximum relative error 4.45287319e-15. Basic multiplication/division/squares/cubes/square roots max out around 1.1e-16. This does not certify all expressions, powers, overflow behavior or exact decimal input storage.

The new program and its two complete CSV exports pass modular and standalone Chromium checks using npm run test:browser -- --large-numbers. The generated SAS helper runs fresh references itself and reports absolute differences and precision threshold failures; the user needs only the two CSVs, helper, app_path, and one run. Actual SAS execution of the new test remains pending. Existing seed-12345 validation files and app runtime are unchanged; main and v1.0 are preserved.


## Final SAS confirmation: all seven comparisons pass

The final uploaded 03-sas-comparison-results.html confirms all 40,000 explicit MT32 seed-12345 uniform draws match exactly after the conversion fix. Integer summary, 40,000 merge observations, merge summary, and six shared-variable observations also match exactly. All 21 selected systematic numeric variables and 15 same-input random numeric variables pass relative tolerance 1e-12 across 20,000 rows each. Nonexact counts are 26 and 5,343 respectively, with maximum reported criteria 2.0648e-16 and 5.6717e-16. No conflicting column types remain.

Evidence, report checksum, implementation commit, and scope limits are recorded in docs/validation/sas-seed12345-results.md on branch docs/sas-validation-confirmed. This round is complete; no additional SAS run or app changes are required. Other seeds and normal sequences remain unverified. The following sections preserve earlier milestones and do not supersede this confirmation. Main and v1.0 remain untouched.


## Uniform MT32 conversion fixed against full SAS sequence

Branch `fix/mt32-sas-uniform-conversion` corrects the mapping from MT32 integers to uniform decimals. All 40,000 exact HEX16 values in the uploaded sas_mt32_inputs.csv match the app after changing (integer + 0.5)/2^32 to integer * 2.328306436538696e-10. All 40,000 underlying integers also agree. The exact constant is significant; rounding it to 1/2^32 changes bits.

The actual SAS CSV is preserved in fixtures/sas/mt32-seed12345.csv with its source SHA-256, provenance, and unknown SAS release recorded in the adjacent metadata JSON. A new mandatory npm regression test checks all 20,000 IDs/systematic inputs and 40,000 random bit patterns and recovered integers. The embedded offline worker also checks actual SAS bit patterns. Evidence applies to unbounded uniform draws with seed 12345 in the supplied run; other seeds, zero-integer endpoint behavior, bound transformations and normal bit sequences remain unverified against SAS.

The normal sampler uses the same corrected uniform conversion, so its app sequence changes too, without a claim of SAS normal equivalence. Source, Help, generated standalone HTML, and test-pack CSVs are refreshed together. Main and v1.0 are preserved. Validation passed: npm test (including the 40,000-draw SAS fixture and offline worker), analytic/CSV-schema pack checks, and npm run test:browser -- --validation for modular and standalone builds. Both full-sized programs complete within the worker timeout and browser exports match engine results. Updated archive checksums and HTML are verified. Windows file:// testing remains pending.


## Fresh SAS report: arithmetic passes; uniform RAND differs

Branch `test/sas-mt32-evidence` records the third uploaded report, `03-sas-comparison-results (2).html`. Fresh references remove the type conflicts. All 21 selected systematic numeric variables across 20,000 rows pass relative tolerance 1e-12 (26 nonexact values, maximum criterion 2.0648e-16). All five integer summary values, 40,000 merge rows, merge summary, and six shared-variable observations match exactly. Same-input random arithmetic passes all 15 selected variables across 20,000 rows (5,121 nonexact values, maximum criterion 2.2194e-16).

Both random input HEX columns differ on every row: 40,000 exact mismatches. The 100 printed pairs are saved with source hash/provenance in fixtures/sas/mt32-seed12345-printed.json. In those displayed draws, recovered MT32 integers match the app's core. Multiplication by 2.328306436538696e-10 reproduces all 100 SAS bit patterns; the app currently uses (integer + 0.5)/2^32. This diagnoses a candidate uniform conversion, not full-sequence or multi-seed SAS equivalence. No runtime change has been made; normal sequences remain unverified.

The SAS helper now additionally exports ORIGINAL SAS inputs as sas_mt32_inputs.csv, preserving exact HEX16 strings. It requires the same app_path and one run; full 40,000-draw export is pending. Pack/source checks pass and packaged app inputs/HTML are unchanged. Main and v1.0 remain untouched.


## SAS report: merge and same-input arithmetic verified

Branch `fix/sas-reference-isolation` records the second supplied SAS report, `03-sas-comparison-results (1).html`. All 40,000 merge rows, the merge summary, and six shared-variable rows compare exactly. All 15 selected numeric variables on 20,000 same-input observations pass relative tolerance 1e-12; 5,121 values are not exactly equal, maximum reported criterion 2.2194e-16.

MT32 parity, original systematic calculations, and missing-value summaries remain unresolved: the original numeric reference datasets have earlier timestamps and retain character columns from the first helper run. The current SAS-only helper rebuilds both reference programs automatically before comparison, then uses separate SAME_* datasets for imported-input computations. This also prevents contamination on repeated runs. Only app_path needs editing; run the third program alone. No app code or reference CSV changes.

Validation: the pack builder executes analytic checks, enforces embedded reference source consistency and CSV schema alignment, and verifies isolated computation results plus preservation of original datasets. The archive is regenerated with unchanged CSVs and HTML. This latest helper still needs execution in SAS. Main and v1.0 are preserved.


## SAS comparison import repair

Branch `fix/sas-comparison-imports` responds to the user's uploaded SAS HTML report. Numeric CSV values were imported as text (5/37/5 type conflicts for inputs/results/summary), so the report does not establish RAND or arithmetic compatibility. The final equal-values message follows 31 type conflicts, and merge reports are absent. No SAS pass is claimed.

The SAS-only helper now uses explicit BEST32 numeric fields, $16 HEX fields, DSD quoting, and CRLF input records, replacing PROC IMPORT guessing. It checks reference-dataset presence, file presence, and imported row counts before comparisons. The downloadable pack is refreshed; CSVs and application code are unchanged. Full SAS execution of the repaired helper remains pending.

## Calculation and merge comparison pack

Branch `test/numeric-merge-comparison` builds on the formats/RAND feature branch and adds `examples/validation/validation-pack.zip`: the standalone HTML, two portable SAS/app programs, six app-generated result CSVs with checksums, a guide, and a SAS-only PROC COMPARE helper. Main and v1.0 are preserved.

The arithmetic program uses 20,000 seeded MT32 uniform input pairs plus systematic inputs 1–20,000 and 20,001–40,000. It exercises arithmetic, powers, roots, SUM/MEAN/MIN/MAX, missing propagation, and exact integer summaries. The merge program checks 40,000 rows with duplicates, unmatched groups, held values, shared-variable precedence, and a reverse-exhaustion fixture. Unique output sequence IDs enable PROC COMPARE on duplicate BY keys.

Validation: `node scripts/build-validation-pack.mjs` checks all rows against analytic expectations, seeded reproducibility, and raw CSV round-trips. `npm test` passes. `npm run test:browser -- --validation` runs both full-sized programs in modular and standalone Linux Chromium, within the existing 8-second worker timeout, and verifies all six full CSV exports against engine outputs. `python3 scripts/package-validation.py` creates a reproducible archive with fixed member timestamps. No engine or app changes were required.

These CSVs are generated by the app, not SAS reference outputs. The SAS-only helper separates exact RAND input-bit checks, systematic arithmetic with relative tolerance 1e-12, exact integer and merge checks, and random arithmetic recomputed from imported app inputs. SAS runtime execution and Windows local-file testing remain pending. The same-input random check includes SAS decimal CSV parsing; it does not prove bit-identical numeric parsing.

## Current feature branch

feature/formats-conversions-rand adds common formats, INPUT/PUT, and explicit MT32 RAND (uniform/normal), plus three examples. Main and v1.0 are unchanged. See docs/formats-conversions-rand.md for exact scope, reference pages, checks, and unresolved SAS bit equivalence. The source modules and generated HTML are saved together. No third-party browser dependencies were added.

Validation: npm test and npm run test:browser pass, including all ten examples in modular and standalone builds, reference dialog, CSV import/export, and failed-run rollback. The MT32 integer core matches 60,000 independently generated values. Format/conversion assertions include supplied-manual examples. The narrow SAS comparisons and remaining RAND parity gap are recorded above. The RAND-specific fixture/checker is prepared for a reference run. Windows file:// verification remains outstanding.

## Purpose

A standalone HTML application for entering a practical SAS-style subset and processing datasets in the browser. Preserve local computation and offline single-file delivery. The source modules and interpreter are the supplied DATA Step Lab v0.2.0 baseline; the baseline setup preserved its language behavior. Subsequent additions are described above.

## Current capabilities

DATA steps, SET, BY groups, match MERGE, PROC SORT, bounded macro expansion, CSV import/export, result tables, logs, and expanded-code inspection. README.md describes the supported subset and its limits.

## Baseline validation

The four original Node test programs pass under Node 24.19.0. They exercise filtering, grouping, loops, output, missing values, merge/sort/macros, failure paths, all seven example programs, and the embedded offline worker.

The Python 3.12.14 build reproduces the supplied 96,800-byte offline HTML exactly.

The real-browser suite uses headless Linux Chromium. It checks the modular application over HTTP and the standalone HTML over HTTP: all seven examples and expected observation counts, expanded code, CSV import and export content, and rollback when a later DATA step fails. Browser tests intercept the export link to verify its Blob contents; they do not test an OS download dialog.

These tests are regression evidence, not certification against SAS. Opening file:// in this cloud Chromium is blocked by administrator policy (net::ERR_BLOCKED_BY_ADMINISTRATOR); this is an environment restriction, not an observed application failure. The optional `--file` browser check is configured in CI but has not passed locally. There has been no Windows Chrome/Edge manual testing, no installed SAS reference comparison, no full visual/accessibility audit, and no UI timeout/termination check yet. GitHub Actions results must be checked on GitHub; local passes do not establish a hosted CI pass.

## Next milestone

1. Manually open the standalone HTML in Windows Edge/Chrome and follow START-HERE.md. Record browser version, program, expected result, actual result, and reproduction steps for failures.
2. Add representative SAS programs and reference output fixtures, including variable types and lengths. Prioritize missing values, BY boundaries, repeated merge keys, shared variables, macro scope, and output rules. Label fixtures not checked against SAS.
3. Add save/open programs and workspace export/import so closing a tab does not lose analyst work.
4. Expand syntax based on concrete programs; retain explicit errors for unsupported features.

## Working agreement

Use Git commits and version tags for recoverable milestones. Update this file when capabilities or validation change. Keep application data local. No deployment or hosted-site changes are included in baseline setup.

## Function and format reference branch

Branch `docs/function-format-catalog` adds a categorized in-app inventory of all 32 current DATA step functions and six format families, including callable examples and implementation limits. All 32 function examples and six format examples were exercised against the current runtime; npm test and npm run test:browser pass. No engine or macro semantics changed. The offline HTML was rebuilt.

See docs/current-functions-formats.md for the inventory and docs/function-format-expansion.md for proposed batches. Official SAS catalog retrieval remains blocked by egress policy (403 Forbidden). SAS documentation domains were saved in a configuration draft but access is not established. The exhaustive SAS-wide inventory is pending; proposed additions are not documentation-verified or approved implementation scope. Main and v1.0 are preserved.

## Official catalogs from uploaded PDFs

The catalog branch now includes complete dictionary-topic indexes from the uploaded September 2026 functions/CALL manual and April 2026 formats/informats manual. All 1,118 topic titles and printed pages were matched independently against chapter contents: 655 function topics, 65 CALL routine topics, 289 format topics, and 109 informat topics. All 32 current functions and six supported format families are mapped to their reference entries. SUBSTR assignment form is explicitly unsupported. See docs/catalogs/README.md and its CSVs for source metadata, current support, and proposed priorities.

The earlier network blocker is resolved for catalog research by the uploaded PDFs; live website access remains unverified. No new functions/formats have been implemented, no SAS runtime comparison has been performed, and selections are still pending. Main and v1.0 remain unchanged.

## Next-run priorities

See docs/next-run-scope.md. The user prefers common formats, INPUT/PUT conversions, and seeded RAND (uniform/normal), with broader text cleaning deferred. SUBSTR, LENGTH, and LENGTHN already exist. Width simplification and SAS-exact random sequence requirements are documented for the implementation run. The supplied manual identifies MTHYBRID defaults and seed-dependent initialization; MT19937 alone does not establish SAS bit-for-bit RAND compatibility. No new runtime features were implemented in this planning pass.
