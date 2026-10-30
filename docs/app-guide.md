# Sassy v0.4.21

Unzip this package and double-click data-step-lab.html in desktop Chrome or Edge. No server, Python, account, or internet connection is needed. Keep the old version if you want an easy rollback.

The Program, Output, and Log tabs share the main workspace. WORK datasets stay on the left; clicking one opens its current table in Output. Use New, Open program, Save, or Save as alongside the program filename. Run executes the editor; Ctrl+Enter also runs it. Source and Expanded code are views within Program. Program and project-folder controls, including Supported syntax, share a compact box at the top right.

Output history accumulates procedure reports and charts from successful runs. DATA-step results, sorted tables, prediction/residual datasets and ODS OUTPUT datasets are available in the sidebar; creating them does not print observations or add dataset snapshots to report history. Click a sidebar dataset to inspect its current values in the paged viewer (50 observations per page), download CSV or save CSV to the project. ODS OUTPUT saves reusable datasets while the corresponding procedure report remains displayed once. Replacing a WORK dataset replaces its current contents; historical observation snapshots are no longer retained automatically.

Choose an earlier report/chart in the Reports and charts dropdown to review or download it. The log appends run starts, file reads, notes, errors and file actions. Successful runs with reports/charts open Output; runs that only create datasets return to Program; failed runs open Log. Clear output removes report/chart history without deleting WORK datasets. Clear log removes only log text. Both histories are held in this tab and reset on reload; program recovery and folder permissions remain separate.

To keep memory bounded, output retains up to 100 report/chart snapshots or 250,000 rows/plotted values, preserving at least the newest snapshot. Older snapshots are removed with a log note. The log trims oldest entries beyond one million characters. Export important results before closing. These are session histories, not disk backups.

SAS syntax colors use bundled PrismJS 1.30.0: blue statements/functions, red strings, green comments, amber numbers, and purple macro variables. Typing, selection, copying, and saving use a plain text editor; coloring never changes the program. Programs over 100,000 characters use plain text coloring to keep editing responsive. Coloring recognizes more SAS syntax than this interpreter supports; it does not validate programs or add language features.

For a ready-to-test file workflow, choose the included demo-project folder, click Browse files, open project-demo.sas, and Run. It imports claims.csv and saves reviewed.csv. See project-files.md for relative paths, permission/reconnection rules, overwrite behavior, and the current PROC IMPORT/EXPORT subset.

This patch adds Chart.js plots, titles, and PNG downloads. Open charts-demo.sas from the included demo-project folder and Run to create five charts; it needs no folder connection. Choose each chart in the Reports and charts dropdown. Chart.js is bundled inside the HTML and works offline. See charts.md for supported syntax and limits. Permanent JSON libraries and the SPI logo are included. Open library-demo.sas from the included demo-project folder to create a native table. See native-tables.md for the file schema, library syntax and limits. Folder permission rules remain unchanged. Further small releases can use v0.4.10, v0.4.11, and so on; a major milestone can be cut when agreed.

## Contextual syntax guide

On the Program tab, click **Syntax guide**, or press **Ctrl+Space** in Source. The right panel follows the cursor inside a supported procedure or function and shows implemented syntax, options and limits. Close it to restore the full editor width. Tab accepts an active dataset/variable suggestion; otherwise it indents. Ctrl+Space remains the syntax-guide shortcut.

The catalog has ten procedures (SQL, PRINT, GLM, SURVEYSELECT, MEANS, SORT, IMPORT, EXPORT, SGPLOT, SGPIE), 40 function entries (including LAGn), 20 format families, and DATA/LIBNAME/FILENAME/TITLE/CALL STREAMINIT/macro references. Search or select an entry to browse independently; check **Follow cursor** to resume contextual help. **Insert template at cursor** inserts a procedure skeleton or function example, replacing only an explicitly selected range. Surrounding source remains. Edit example names before Run; insertion never runs code or accesses files. Format entries are reference-only.

The tolerant scanner skips comments and quoted strings. It examines source before the caret, without expanding macros or validating the whole program; macro-generated procedures and incomplete/ambiguous syntax may need manual catalog selection. This is the supported Sassy subset, not the complete SAS documentation. Source catalog: dist/syntax-help.mjs, embedded in the standalone build. Added HTML size is approximately 24 KB (1.6%); no runtime dependencies or network calls.

## Code & export demo

Click **Code & export** in the upper-right project controls to view the current SAS program, actual JavaScript runtime or Node/Python wrappers. **Export runnable demo ZIP** packages the current program and all current WORK snapshots. Export never executes code. External CSV/native project files are not copied; use `--project folder` when running to locate them.

To try it, open demo-project/portable-demo.sas and export. Extract the package and run `node run.mjs`, or `python run.py` with Node.js 24+ and Python installed. The README explains calling it from Python and interpreting returned JSON tables. The standalone browser app requires neither runtime installed. Chart data models are returned, not rendered images. See portable-demo.md for scope and filesystem behavior.

## PROC MEANS and example programs

Click **Examples** in the upper-right header. Preview twelve programs, download a .sas snippet, or **Open in editor**. Opening never runs code; unsaved edits prompt before replacement. Programs cover generated DATA/SORT/MERGE, MT32 uniform draws, all five charts, PROC MEANS, macros, CSV project files, permanent libraries and formats. The CSV/library examples require the included demo-project folder; the others generate their own inputs.

PROC MEANS saves overall totals and each CLASS subset by default using _TYPE_ bit flags and _FREQ_. NWAY removes those rows when requested. Inactive character classes are blank; numeric classes are missing. OUTPUT without statistic requests uses five _STAT_ rows. Reports appear in session Output; saved tables appear in Libraries. See means.md for statistics/options, missing values, naming and limits. The included means-validation ZIP contains deterministic SAS programs and Sassy result CSVs for the next actual SAS comparison.

PROC SURVEYSELECT and default RAND are included in v0.4.10. Use the ninth Examples program for self-contained sampling. Read surveyselect.md and random-numbers.md for supported methods and SAS-reference limits. procedure-support.md lists what every procedure can deploy in the browser and Node/Python-wrapper runtime.

In v0.4.10, NORMAL caches the second polar value instead of discarding it. Normal-only and mixed sequences therefore change from older versions. The tested SAS examples match within rounding tolerance, with exact subsequent uniform witnesses. Open demo-project/normal-demo.sas to generate all four reference contexts without choosing a folder.

## PROC GLM

The tenth Examples program fits an unbalanced CLASS interaction model. Type I/III tests and MODEL / SOLUTION estimates, standard errors, t values and p values appear in Output. ODS OUTPUT captures reusable tables; OUTPUT P=/R= saves predictions/residuals. Read glm.md for the first fixed-effects subset, design limits and accuracy evidence. To compare in SAS Studio, extract the included glm-validation.zip and upload/run only 01-sas-glm-comparison.sas; expected results are embedded, with no CSV uploads or folder edits. Return the SAS Results and Log. Fresh SAS runtime validation is pending.

## Explicit observation output

Run `proc print data=table(obs=10); var id amount; run;` to put a few observations in session Output. Add NOOBS to hide observation numbers. FIRSTOBS=5 OBS=10 lists rows 5–10. DATA= and its parenthesized options select the source range; VAR selects columns. PRINT changes no dataset. Open the eleventh Examples program; see print.md for limits and unsupported statements. WEIGHT is supported in MEANS/GLM; see weights.md.

## Weighted analysis

Use WEIGHT variable; in MEANS or GLM. The twelfth Examples program demonstrates both and prints five predictions. MEANS adds SUMWGT and EXCLNPWGT; variance divisors and row inclusion differ from GLM. See weights.md. Extract the included weights-validation.zip and upload/run its 01-sas-weight-comparison.sas in SAS Studio; the expected data are embedded. All fifteen corrected weighted MEANS/GLM SAS comparisons pass in v0.4.18, including _FREQ_; no further weight-kit rerun is outstanding. See VALIDATION-STATUS.md.

## Dataset and variable completion

Type `work.` for dataset suggestions. Use Up/Down and Tab/Enter, or click a choice. After `data temp; set work.claims;`, type `temp.` to browse inferred variables before running. Choosing paid_amount inserts only `paid_amount`, removing the qualifier so the program stays ordinary SAS. `work.claims.pa` and loaded named libraries also work. Escape dismisses. Suggestions use column metadata only and never run code or open files. See editor-completion.md for inference boundaries.

Outstanding reference/manual tests are tracked in VALIDATION-STATUS.md. Weighted SAS validation is deliberately deferred; editor development does not mark it passed.

## Small procedure starter menu

Inside MEANS, SORT, GLM or SGPLOT, type `??` after the previous semicolon. Select a line with arrows and Tab/Enter or the mouse. The marker is replaced with a supported SAS starter and its first placeholder is selected for editing. MEANS includes CLASS/VAR/WEIGHT/BY/OUTPUT; SORT includes BY and DESCENDING. GLM/SGPLOT have their applicable lines. Existing statement/order rules keep this first menu small. Accept or delete the editor marker before Run. See editor-completion.md; no new documentation pane is required.

## Automatic procedure assistance

Type a supported PROC name to see unused header options. DATA= offers known datasets; variable lists use that source’s metadata; MODEL, plots and OUTPUT offer applicable remaining pieces. All nine supported procedures use the same dropdown. Tab accepts; plain Enter makes a newline until you navigate with arrows. Esc dismisses. The ?? trigger still inserts full starter lines. Sample paths/names/numbers remain editable; actual validation happens at Run. See editor-completion.md. No network or ChatGPT calls are made while typing.

## LAG, conversions and mathematics

The thirteenth Examples program shows LAG/LAG2, EXP, natural LOG, LOG10, LOG2 and INPUT/PUT conversions. Use `lag2(x)` for two prior executions of that call, not `lag(x,2)`. Each call has a separate queue, initially missing; conditional calls advance only when executed. BY groups do not reset queues. Declare LENGTH for character results. The implementation bounds LAGn at 1000 and all queues at 100,000 slots per DATA step. Fresh actual SAS confirmation is tracked separately in VALIDATION-STATUS.md.

`PUT(value,format.)` returns character text (for example `put(42,z4.)` returns `0042`); `INPUT(text,informat.)` parses text to a number/date or a character value as specified by the informat. A standalone PUT statement writes log/file text in SAS and is not implemented here. PROC IMPORT supports CSV only; see procedure-support.md. Native JSON tables use LIBNAME/SET.

## PROC SQL

Open the fourteenth Examples program for SQL joins and grouped statistics. CREATE TABLE saves a WORK/native table; a standalone SELECT explicitly produces a report. End PROC SQL with QUIT. OUTOBS restricts results and NOPRINT suppresses reports. The implemented SQL subset includes means, counts, sample STD/VAR, DISTINCT, CASE and CALCULATED. No external SQL package or connection is needed. See sql.md for SAS-specific missing/grouping behavior, resource limits, unsupported remerging/subqueries and the self-contained validation kit.

Actual SQL validation: fifteen first-run groups / 68 matched records passed exactly. The grouped test stopped at STDDEV name resolution; v0.4.21 removes that alias and uses STD. Only 02-sas-grouped-comparison.sas from the SQL kit needs a rerun. No formulas changed. See VALIDATION-STATUS.md.
