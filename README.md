# Sassy — standalone SAS-style workspace

Start with [START-HERE.md](START-HERE.md) for use and development, and [PROJECT-STATUS.md](PROJECT-STATUS.md) for current validation and next steps. The following description comes from the supplied v0.2.0 prototype. Development commands are `npm run build`, `npm test`, `npm run test:browser`, and `npm run dev`; Node 24+ is used for development. There are no npm dependencies to install.

# Original DATA Step Lab v2 scope

Browser-local SAS-style analysis prototype. Download the latest ZIP below, unzip it, then double-click it on Windows, and open it in a modern Edge/Chrome browser. The standalone file includes its styling, interpreter, macro processor, and Blob-based worker. No Python installation, server, AI API, external assets, or internet connection is required for computation.

Open or type a program and click Run (Ctrl+Enter). Import CSV datasets into the WORK library and export results as raw CSV. Dataset and variable names are case-insensitive. Datasets and macro definitions exist in tab memory; programs can be saved to files and recovered from a browser-local draft. Macro definitions/variables reset on each Run. Export results before closing. Failed programs do not commit partial dataset changes.

## Current development build

Version 0.4.3 adds the SPI logo and permanent, versioned JSON table libraries with LIBNAME. Download [Sassy-v0.4.3.zip](dist/Sassy-v0.4.3.zip), unzip, and open data-step-lab.html. The upper-right controls, full-size Program/Output/Log tabs, rolling histories, and offline SAS colors are included. See [the app guide](docs/app-guide.md) and [native JSON table format](docs/native-tables.md).

The v0.4.0 program open/save, editor recovery, and remembered project folder workflow are included. Choose the demo folder, Browse files, open its program and Run to test CSV import/export. See [project files and permissions](docs/project-files.md). Other browsers retain manual upload/download fallbacks. Data remains local; no installed desktop app or backend is required.


The feature/formats-conversions-rand branch adds common formats, INPUT/PUT conversion functions, and seeded RAND for UNIFORM/NORMAL with explicit MT32. Regression samples cover INPUT/PUT, the format gallery, and seeded RAND. See [feature scope and validation](docs/formats-conversions-rand.md). The standalone HTML still requires no server or installed runtime. Main and v1.0 remain preserved checkpoints.

Width now controls value-changing formatting and PUT padding. Some SAS format semantics remain simplified. The MT32 integer core is verified, and 40,000 seed-12345 uniform values match a supplied SAS fixture bit-for-bit. Other seeds and normal sequences remain unverified. The current inventory is 35 DATA step functions and 20 common format families (date separator variants grouped within their parent family).

## Function and format references

The app’s **Supported syntax** dialog now lists every implemented function and format family with examples. See [current functions and formats](docs/current-functions-formats.md) and [expansion planning](docs/function-format-expansion.md). The [official reference catalogs](docs/catalogs/README.md) now index all dictionary topics in the uploaded SAS manuals, with current-support comparisons and proposed batches. No additional language features have been implemented yet.

## New in version 2

- Match MERGE with BY, multiple inputs, IN= indicators, unmatched observations, repeated keys, and shared-variable precedence. Repeated groups are paired, not multiplied. Exhausted inputs retain their values within a BY group; each new BY group resets input variables. Shared variables are overwritten only by inputs actually read, in MERGE order. IN= variables are excluded from output; copy them to a new variable to preserve them. Input KEEP=, DROP=, and RENAME=(old=new) accept explicit variable names.
- PROC SORT DATA= OUT= with multiple BY keys, per-key DESCENDING, stable equal-key order (EQUALS), and NODUPKEY. Without OUT= the input is replaced. NODUPKEY keeps the first observation for each complete BY key.
- A bounded macro text generator: %LET, &variables and dot delimiters, %MACRO/%MEND, positional and keyword arguments/defaults, %IF/%THEN/%ELSE, %DO/%END blocks and indexed %TO/%BY loops, %LOCAL/%GLOBAL, %PUT, integer %EVAL, and %UPCASE. Single-quoted strings suppress substitution. Double-quoted strings allow substitution. An Expanded code view shows the generated program.
- Ten examples, including sort-and-merge, parameterized macros, and macro loops. Two synthetic input datasets are supplied.
- A downloadable, self-contained offline HTML app.

## Remaining subset

DATA, one top-level SET or MERGE per step, assignments, IF/THEN/ELSE, subsetting IF, DO/END, indexed DO/TO/BY, DELETE, STOP, OUTPUT, KEEP/DROP, RETAIN, sum statements, character LENGTH, FIRST./LAST. variables, selected formats, and common functions. See Supported syntax in the app for details.

No positional MERGE without BY, arrays, PROC procedures beyond SORT and the browser CSV import/export subset, INPUT/INFILE statements, SAS binary files, unlisted informats, output dataset options, variable lists, special missing values, or full SAS numeric/character coercion and fixed character semantics. Flexible character strings are used unless LENGTH is supplied. Character sorting uses Unicode, so host/locale collation can differ from SAS. Dates export as raw days since 1960-01-01. CSV types are inferred.

Macro scope and conditional expressions cover a practical subset. No quoting functions, indirect && references, %SYSFUNC, CALL SYMPUT, nested macro definitions, dynamic macro names, full SAS rescanning, or advanced/empty-operand expressions. Unknown constructs and unsupported macro features produce errors rather than being ignored. Semantics outside the supported subset can still differ from SAS. This is an independent prototype, not SAS software or a certified compatible runtime.

## Implementation and rebuilding

`dist/engine.mjs` parses statements into an AST and interprets it without evaluating user code as JavaScript. `dist/macros.mjs` expands bounded macro text. `dist/file-program.mjs` plans asynchronous CSV steps and stages exports; `dist/project-files.mjs` manages scoped native handles and permission-aware persistence. `dist/worker.mjs` isolates processing and requests reads from the UI. `dist/app.mjs` owns the visible workspace. `python3 build-offline.py` regenerates the standalone file from these same sources.

Run checks:

```
node test-engine.mjs
node test-upgrades.mjs
node test-ui-examples.mjs
node test-offline.mjs
```

Checks cover match-merge behavior including the overlapping-variable example in SAS Usage Note 48705; missing/unmatched/repeated keys; IN= reset behavior; renaming; multiple BY keys/directions; stable sorting/deduplication; macro quotes, scope, parameters, branches, loops, nested calls, limits, and failure paths; all UI examples; and execution of the exact embedded offline worker in an isolated JavaScript worker runtime. The baseline also has real headless Chromium UI checks for the modular app and offline file, described in PROJECT-STATUS.md. The specific numeric/RAND/merge SAS comparisons are recorded in PROJECT-STATUS.md. Broader SAS compatibility and Windows OS-picker/local-file checks remain outstanding.

Limits: 100,000 imported/output rows per dataset; 20 MB CSV import; four million interpreter operations; 50,000 macro-expansion operations; 10,000 iterations per macro loop; bounded expanded text and nesting; eight seconds per browser run.

## Primary references used for behavior

- SAS IN= option: https://support.sas.com/documentation/cdl/en/lrdict/64316/HTML/default/a000131134.htm
- SAS shared-variable match-merge behavior (Usage Note 48705): https://support.sas.com/kb/48/705.html
- SAS MERGE: https://support.sas.com/documentation/cdl/en/lrdict/64316/HTML/default/a000202970.htm
- SAS NODUPKEY: https://support.sas.com/documentation/cdl/en/proc/61895/HTML/default/a002473667.htm
- SAS macro parameters: https://support.sas.com/documentation/cdl/en/mcrolref/61885/HTML/default/macro-stmt.htm
