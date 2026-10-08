# Current repository status

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
