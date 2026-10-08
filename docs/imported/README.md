# DATA Step Lab — version 2

Browser-local SAS-style analysis prototype. Use the hosted Site, or download `dist/data-step-lab.html`, double-click it on Windows, and open it in a modern Edge/Chrome browser. The standalone file includes its styling, interpreter, macro processor, and Blob-based worker. No Python installation, server, AI API, external assets, or internet connection is required for computation.

Choose an example and Run program (Ctrl+Enter). Import CSV datasets into the WORK library and export results as raw CSV. Dataset and variable names are case-insensitive. Data, programs, and macro definitions exist only in tab memory. Macro definitions/variables reset on each Run. Export results before closing. Failed programs do not commit partial dataset changes.

## New in version 2

- Match MERGE with BY, multiple inputs, IN= indicators, unmatched observations, repeated keys, and shared-variable precedence. Repeated groups are paired, not multiplied. Exhausted inputs retain their values within a BY group; each new BY group resets input variables. Shared variables are overwritten only by inputs actually read, in MERGE order. IN= variables are excluded from output; copy them to a new variable to preserve them. Input KEEP=, DROP=, and RENAME=(old=new) accept explicit variable names.
- PROC SORT DATA= OUT= with multiple BY keys, per-key DESCENDING, stable equal-key order (EQUALS), and NODUPKEY. Without OUT= the input is replaced. NODUPKEY keeps the first observation for each complete BY key.
- A bounded macro text generator: %LET, &variables and dot delimiters, %MACRO/%MEND, positional and keyword arguments/defaults, %IF/%THEN/%ELSE, %DO/%END blocks and indexed %TO/%BY loops, %LOCAL/%GLOBAL, %PUT, integer %EVAL, and %UPCASE. Single-quoted strings suppress substitution. Double-quoted strings allow substitution. An Expanded code view shows the generated program.
- Seven examples, including sort-and-merge, parameterized macros, and macro loops. Two synthetic input datasets are supplied.
- A downloadable, self-contained offline HTML app.

## Remaining subset

DATA, one top-level SET or MERGE per step, assignments, IF/THEN/ELSE, subsetting IF, DO/END, indexed DO/TO/BY, DELETE, STOP, OUTPUT, KEEP/DROP, RETAIN, sum statements, character LENGTH, FIRST./LAST. variables, selected formats, and common functions. See Supported syntax in the app for details.

No positional MERGE without BY, arrays, other PROC procedures, INPUT/INFILE, SAS binary files, informats, output dataset options, variable lists, special missing values, or full SAS numeric/character coercion and fixed character semantics. Flexible character strings are used unless LENGTH is supplied. Character sorting uses Unicode, so host/locale collation can differ from SAS. Dates export as raw days since 1960-01-01. CSV types are inferred.

Macro scope and conditional expressions cover a practical subset. No quoting functions, indirect && references, %SYSFUNC, CALL SYMPUT, nested macro definitions, dynamic macro names, full SAS rescanning, or advanced/empty-operand expressions. Unknown constructs and unsupported macro features produce errors rather than being ignored. Semantics outside the supported subset can still differ from SAS. This is an independent prototype, not SAS software or a certified compatible runtime.

## Implementation and rebuilding

`dist/engine.mjs` parses statements into an AST and interprets it without evaluating user code as JavaScript. `dist/macros.mjs` expands bounded macro text. `dist/worker.mjs` isolates processing. `dist/app.mjs` owns the visible workspace. `python3 build-offline.py` regenerates the standalone file from these same sources.

Run checks:

```
node test-engine.mjs
node test-upgrades.mjs
node test-ui-examples.mjs
node test-offline.mjs
```

Checks cover match-merge behavior including the overlapping-variable example in SAS Usage Note 48705; missing/unmatched/repeated keys; IN= reset behavior; renaming; multiple BY keys/directions; stable sorting/deduplication; macro quotes, scope, parameters, branches, loops, nested calls, limits, and failure paths; all UI examples; and execution of the exact embedded offline worker in an isolated JavaScript worker runtime. No comparison against an installed SAS runtime, visual browser QA, or Windows file:// browser execution has been performed in this environment. The basic WebMCP tool has no permitted browser context for validation.

Limits: 100,000 imported/output rows per dataset; 20 MB CSV import; four million interpreter operations; 50,000 macro-expansion operations; 10,000 iterations per macro loop; bounded expanded text and nesting; eight seconds per browser run.

## Primary references used for behavior

- SAS IN= option: https://support.sas.com/documentation/cdl/en/lrdict/64316/HTML/default/a000131134.htm
- SAS shared-variable match-merge behavior (Usage Note 48705): https://support.sas.com/kb/48/705.html
- SAS MERGE: https://support.sas.com/documentation/cdl/en/lrdict/64316/HTML/default/a000202970.htm
- SAS NODUPKEY: https://support.sas.com/documentation/cdl/en/proc/61895/HTML/default/a002473667.htm
- SAS macro parameters: https://support.sas.com/documentation/cdl/en/mcrolref/61885/HTML/default/macro-stmt.htm
