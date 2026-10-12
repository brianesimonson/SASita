Latest app milestone v0.4.12 on feature/report-only-output: automatic Output history now holds only procedure reports/charts, never written dataset observations. ODS datasets save normally; report displayed once. Explicit sidebar viewing/export stays paged; DATA-only runs stay in Program. Replaced datasets are current only, not automatic historical snapshots. Full tests/both browser builds pass including 50,000-row no-history/explicit-view case and report immutability. Corrected successful SAS GLM kit included in app ZIP. No engine changes; main/prior tags untouched. Earlier notes historical.

GLM validation-v2 actual Results/Log now PASS all 10 comparisons / 89 matched records, no unequal compared values under relative 1e-10 stats and absolute 1e-12 P/R. No SAS errors/warnings; CV field mappings confirmed. Largest statistical relative criterion 9.6233e-14. Read fixtures/sas/glm-validation-v2-pass.json and latest PROJECT-STATUS. Label/special-missing/CV normalization explicit; original metadata/label/Biased parity and bit identity still not certified. No runtime edits; app v0.4.11 and validation kit glm-validation-v2 preserved. Earlier pending notes below are historical.

GLM log now received. Both FitStatistics comparisons stopped at missing coeffvar guards. Log does not list actual alternate name. fix/glm-validation-kit / glm-validation-v2 regenerates the separate kit with guarded CV alias, explicit A*X→X*A fixture-key mapping, special-missing normalization and absolute 1e-12 scored checks (other stats relative 1e-10), plus fit descriptors. Original models/app calculations and all expected CSV values unchanged. No fresh SAS run of revision 2 yet. App v0.4.11 ZIP retains old helper; direct users to separate revision-2 ZIP. Main untouched.

Two-model GLM comparison Results received on test/sas-glm-two-models; no log yet. Read latest PROJECT-STATUS. Actual full-precision matched test/parameter groups and all 33 ANCOVA P/R rows meet relative 1e-10 (max reported criterion 3.2567e-13). Not an overall pass: SAS X*A vs app A*X excludes two test/three parameter rows; OverallANOVA special missing ._ vs . yields five differences per model; published residual 3.553e-15 vs0 fails relative-only; both FitStatistics comparisons absent. CONTENTS shows SAS Biased numeric versus app char B. New fixture/automated printed checks retain these gaps. Next obtain log, align labels and fix helper/fit checks before claiming all comparisons pass. Runtime/app/tag v0.4.11 unchanged.

Actual SAS GLM catalog-example log/results received on test/sas-glm-reference. fixtures/sas/glm-seven-row-printed.json preserves original SHA256 hashes and actual printed tables. scripts/check-glm-reference.mjs (imported by test-glm.mjs) confirms 69 numeric cells at printed precision, 20 missing cells and nine B flags. Clean log and expected ODS table sizes; singular X'X note is normal for redundant CLASS coding. This is not the two-model comparison kit: full-precision values, scored values, mixed ANCOVA Type III and exact ODS descriptors remain unverified. No app/runtime edits, version/tag/package v0.4.11 preserved.

Latest app milestone: v0.4.11 on feature/sassy-glm adds bounded fixed-effects PROC GLM: one response/intercept, formatted CLASS, hierarchical crossed interactions through degree three, Type I/III, MODEL / SOLUTION, OUTPUT P/R and six ODS OUTPUT table names. Read docs/glm.md. Ordered reorthogonalized QR plus sum-contrast block hypotheses; reject empty interaction cells/additional rank deficiency. test-glm.mjs covers published SAS 7-row unbalanced example and independent NumPy/SciPy ANCOVA fixture; both browser builds and exported Node/Python wrappers pass. Fresh actual SAS runtime comparison, ODS descriptor parity and mixed-effect hypothesis parity remain pending. examples/glm-validation/glm-validation.zip embeds typed app expectations in a self-contained SAS-only program, no paths/CSV uploads needed; regenerate via scripts/package-glm-validation.mjs after statistical changes. Main and earlier tags preserved. Earlier notes below are historical.

Latest app milestone: v0.4.10 on feature/sassy-normal-cache integrates unscaled NORMAL pair caching. See dist/random.mjs, test-normal.mjs, docs/random-numbers.md and demo-project/normal-demo.sas. Integrated engine, portable Python/Node, modular/standalone browsers and actual browser-export ZIPs check all 52 printed SAS normals within tolerance (38 exact in Node, max abs 4.4409e-16) and all 28 printed uniform witnesses exactly. Mean/sigma changes use the unscaled cached value; UNIFORM and ignored STREAMINIT preserve it; new DATA steps reset it. This intentionally changes old normal/mixed sequences. Do not claim all 2,048 SAS normals were directly compared in JavaScript: only 52 were printed. Broader seed/parameter/tail/bit-identical guarantees remain unverified. Main and earlier tags preserved. Research/pending notes below are historical.

Latest app milestone: v0.4.9 on feature/sassy-surveyselect integrates PROC SURVEYSELECT and default RAND into browser/portable runtime. Source: dist/surveyselect.mjs and dist/random.mjs. Exact integrated tests cover twelve CSV outputs, 35 probe rows, default/MT32 uniform fixtures; browser and Python/Node checks pass. See docs/surveyselect.md, docs/random-numbers.md and docs/procedure-support.md for supported/deferred syntax and deployment. Stratified REPS, formatted strata, PPS/cluster/legacy options remain unsupported. NORMAL is not SAS sequence-identical; hybrid exceptional seeds lack real SAS fixture verification. Example catalog has nine entries and build snapshots nine runtime modules. Main and previous tags remain unchanged. Earlier research/pending notes below are historical.

Latest app milestone: Sassy v0.4.8 on fix/sassy-means-autoname. Corrected real-SAS MEANS comparison has now passed all six tables at relative criterion 1e-12; 17 values differ in final floating-point digits, maximum relative criterion 2.5879e-16. See docs/validation/means-successful-comparison.md. Historical pending notes below are superseded for those six tests. Main and prior milestones unchanged.

Current follow-up: fix/means-sas-comparison-types corrects ONLY the SAS validation importer after the initial uploaded report showed numeric/character conflicts. Replace 02-sas-comparison.sas from the corrected kit, not app CSV values; new actual SAS results/log remain pending. See docs/validation/means-initial-comparison.md. Sassy app milestone remains v0.4.7.

Latest milestone: Sassy v0.4.7 on feature/sassy-proc-means. See docs/means.md for statistical scope/output semantics and examples/means-validation for the pending real-SAS comparison kit. Default CLASS OUTPUT preserves totals/subtotals; do not silently impose NWAY. Example catalog is generated from examples/catalog .sas files. Main and earlier milestones remain unchanged.

Latest milestone: Sassy v0.4.6 on feature/sassy-portable-wrapper. Actual execution-source viewer and portable ZIP/Python proof of concept are documented in docs/portable-demo.md. Build snapshots runtime sources into dist/runtime-assets.mjs; never edit that generated module independently. v0.4.5 is saved as both a GitHub snapshot branch and annotated tag at b30711e. Main and v1.0 remain unchanged.

Latest milestone: Sassy v0.4.5 on feature/sassy-context-help. Contextual syntax guide and insertable templates are described in docs/app-guide.md; full verification and scope are in PROJECT-STATUS.md. Main and v1.0 remain unchanged.

Latest milestone: Sassy v0.4.4 on feature/sassy-chartjs-plots. Chart.js is bundled offline; PROC SGPLOT/SGPIE subset, Output chart history and titled PNG exports are documented in docs/charts.md. See PROJECT-STATUS.md for validation and scope. Main and v1.0 remain unchanged.

Latest milestone: Sassy v0.4.3 on feature/sassy-json-libraries. LIBNAME/native JSON tables and an adapted SPI logo are implemented; docs/native-tables.md and its schema are authoritative for storage. See PROJECT-STATUS.md for scope and verified checks. Main and v1.0 remain unchanged.

Latest layout milestone: Sassy v0.4.2 on feature/sassy-compact-header. File controls share the upper-right brand header. SPI is a text placeholder awaiting artwork. LIBNAME storage is proposed in docs/library-storage-proposal.md and is not implemented.

Current workspace milestone: Sassy v0.4.1 on feature/sassy-tabbed-workspace. Program/Output/Log are full-size tabs, with rolling bounded in-memory histories and vendored offline PrismJS SAS colors. See docs/app-guide.md. Main and v1.0 are protected by the user agreement.

# Current repository status

Version 0.4.0 now implements program open/save/recovery and permission-aware project folders with browser CSV IMPORT/EXPORT. Read docs/project-files.md and PROJECT-STATUS.md for current architecture and checks; historical roadmap items below may now be complete. The synchronous numeric engine remains covered by actual SAS fixtures.

This document preserves the original architectural handoff. See PROJECT-STATUS.md for current validation and START-HERE.md for commands. The baseline now includes real Chromium browser checks. The historical hosted-site URL below is background; this repository does not control or deploy that site.

# Development handoff

## Product goal and user intent

Brian Simonson wants an independent, Windows-friendly tool with the familiar feel of a SAS editor. Analysts should write SAS-style DATA steps, prepare and merge datasets, use practical text-generating macros, inspect logs and observations, and export data. Preserve the ability to run the completed application from one self-contained HTML file without a backend, AI calls, or installed runtime. JavaScript implements the language; it is not translating programs through an LLM at run time.

The user explicitly identified MERGE and PROC SORT as necessary. Macros should generate text that the execution engine then parses. This prototype is a starting codebase to mature, not a request to rewrite the entire app or implement all of SAS at once. A hosted browser version is also available at https://data-step-lab.cleverreed1.chatgpt.site.

## Architecture and source map

| File | Responsibility |
| --- | --- |
| `dist/index.html` | Modular browser entry, editor, dataset list, results, log, help, import dialog. |
| `dist/style.css` | Responsive navy editor / light data workbench styling. |
| `dist/app.mjs` | In-memory state, sample programs/data, CSV import/export, editor tabs, worker lifecycle, transactional commits. |
| `dist/macros.mjs` | Bounded macro parser and text expansion; exported `expandMacros(code)` returns `{code, logs}`. |
| `dist/engine.mjs` | Tokenizer, expression/statement AST parser, interpreter, PROC SORT, match MERGE, CSV and display helpers. `run(code, input)` returns `{datasets, written, logs, expanded}`. |
| `dist/worker.mjs` | Worker entry. It receives `{code, datasets}` and returns success/results or an error plus expanded text when available. |
| `build-offline.py` | Combines the same modules and styling into a classic inline script and Blob worker in one HTML file. |
| `dist/data-step-lab.html` | Generated, self-contained distribution artifact. Rebuild from the modules; do not edit it separately. |
| `test-engine.mjs` | Original expected-output checks. |
| `test-upgrades.mjs` | Merge, sort, macro behavior and negative cases. |
| `test-ui-examples.mjs` | All seven examples plus HTML element-reference checks. |
| `test-offline.mjs` | Parses the packaged scripts and runs the exact embedded worker in Node worker_threads. This is not browser QA. |
| `source-history.bundle` | Complete original two-commit Git history, with no token or credential export. |

Dataset state consists of names mapped to `{columns, rows, formats, types}`. `rows` are objects with lower-case variable keys. Numeric missing values are represented as null; character blanks use empty strings. Formats are display metadata; export writes raw values. Case-insensitive names and explicit WORK prefixes are supported. The macro environment resets for each submission.

The interpreter evaluates a parsed AST rather than evaluating user-supplied JavaScript. The offline test harness uses Node's eval-based Worker constructor only to execute the trusted packaged source; this does not mean user programs are evaluated as JavaScript.

## Implemented scope

The full statement/function list and limitations are in README.md and the in-app Supported syntax reference. Highlights:

- DATA steps, one top-level SET or MERGE reader, assignments, conditional statements/filters, DO blocks/indexed loops, KEEP/DROP, explicit outputs, DELETE/STOP, RETAIN/sum statements, character LENGTH, formats, basic numeric/string/date functions, _N_, and FIRST./LAST.
- Match MERGE uses a sorted union of BY groups, pairs repeated observations, and retains exhausted-input values within the group. It does not use SQL Cartesian join semantics. Inputs actually read overwrite shared columns in MERGE order. IN= variables persist within the group unless changed by program logic and are excluded from output. Input KEEP=/DROP=/RENAME= are supported with explicit names.
- PROC SORT uses stable ordering with ascending or DESCENDING keys, DATA=/OUT=, EQUALS, and NODUPKEY keeping the first observation per complete BY key.
- Macro text generation: %LET, references with a dot delimiter, parameterized %MACRO/%MEND, positional and keyword arguments, %IF/%THEN/%ELSE, %DO/%END blocks/indexed loops with %TO/%BY, %LOCAL/%GLOBAL, %PUT, integer %EVAL, and %UPCASE. An expanded-code view is included.
- Synthetic claims and provider datasets and seven example programs. User CSVs remain in tab memory; there is no durable dataset/program storage.

## Validation status

All four supplied check programs passed on the exported baseline. They use expected results defined by the implementation author and selected official SAS examples. They are regression checks, not proof of complete SAS compatibility.

No installed SAS runtime comparison has been performed. No visual browser QA, Windows file:// run, real browser Blob-worker check, or WebMCP tool validation has been performed. These gaps should be checked before claiming production readiness. README.md contains primary SAS references, including Usage Note 48705 for shared-variable match-merges.

## Compatibility gaps and audit targets

These are known limitations or areas requiring audit, not a claim that every item is already a confirmed failing test:

- SAS compile-time descriptor creation, variable order, character/numeric type rules, fixed-length character padding/truncation, automatic conversions, missing-value propagation, and detailed function edge cases are incomplete. Flexible strings are used unless LENGTH is supplied.
- CSV type inference can lose leading zeros in identifiers or treat an all-blank column as numeric. Consider explicit schema overrides and a preview before import.
- Character collation is JavaScript Unicode ordering, which can differ from SAS host/locale sorting. Numeric missing is supported; special missing values are not.
- DATA steps use one top-level reader. Audit behavior of statements preceding SET/MERGE, END/STOP paths, explicit OUTPUT, read variables retained across iterations, and input variables also named in RETAIN.
- MERGE without BY, arrays, variable lists, output dataset options, INPUT/INFILE, informats, SAS7BDAT, and most PROC procedures are unsupported.
- Macro quoting, full SAS rescanning, indirect && references, runtime CALL SYMPUT, %SYSFUNC, dynamic macro names, nested definitions, empty operands, and advanced expressions are unsupported. Macro parameters/defaults, expression parsing, whitespace, quote state, and scope need broader conformance tests.
- Engine code is compact. Improve readability and module boundaries with behavior-preserving refactors after establishing the baseline.
- Resource limits prevent runaway execution but do not guarantee large-data performance. Clone/row overhead, sort cost, merge memory, rendering, and timeout reporting need measurement.
- Program/macro state resets and in-memory data loss on closing are current product behavior. Save/open programs and workspace persistence are proposed future improvements, not implemented features.

## Recommended next milestones

1. Establish the baseline: run checks; execute hosted modular and offline builds in actual Edge/Chrome; test CSV import/export, examples, tabs, errors, worker termination, and responsive layout. Keep a record of browser/runtime versions.
2. Audit correctness: build a table of supported syntax and expected behavior. Add fixtures for missing values, types/lengths, descriptors, BY boundaries, duplicate keys, shared merge variables, outputs, macro scope/quoting, and sorting stability. When SAS access exists, run the same synthetic programs in SAS and compare raw outputs plus descriptor metadata. Otherwise label expected outputs as unverified against SAS.
3. Improve maintainability: split parser/expression/runtime/CSV modules as warranted, document interfaces, introduce a repeatable build/check command and automated checks for commits. Preserve the offline build.
4. Expand the language around Brian's representative programs: prioritize requested functions, dataset options, variable lists and arrays; treat more PROC procedures as a separate roadmap. Define acceptance examples for every feature rather than promising full SAS replacement.
5. Improve the editor and workflow: syntax highlighting, accurate line/column errors, save/open programs, clearer schema controls, cancellation, and useful diagnostics. Keep the primary editor/results workspace accessible.
6. Measure performance and issue versioned downloadable releases. Raise limits only when profiling and bounded-execution behavior justify it.

## Constraints to preserve

Use the complete source as the baseline; do not develop the generated HTML independently. Preserve offline/local computation. No data transmission, external AI dependency, backend runtime, or public publishing should be introduced merely to make development easier. An architecture change can be proposed explicitly if needed for an agreed data-scale target. Unsupported constructs should fail clearly; avoid silently substituting a different meaning for supported SAS syntax. Keep limitations honest. The user values precision and familiar SAS workflows more than cosmetic expansion.
