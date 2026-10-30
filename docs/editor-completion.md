# Dataset and variable completion — Sassy v0.4.15

The source editor uses dataset column metadata to help type ordinary SAS. It does not execute the program or add object access to the language.

- Type `work.` to list known WORK datasets. Type a prefix to filter, use Up/Down to select, then Tab or Enter to insert a dataset name. Choosing claims leaves `work.claims` in the program.
- After writing `data temp; set work.claims;`, type `temp.` to list its inferred variables before running. Choosing paid_amount replaces the entire `temp.` shortcut with `paid_amount`.
- You can also type `claims.pa` or `work.claims.pa`; choosing paid_amount inserts only `paid_amount`. For example, `amount=temp.pa` becomes `amount=paid_amount`.
- Named libraries use the same approach: `saved.` lists known/cached members; `saved.claims.` automatically loads its column header when the library is assigned, the table is listed and project permission is granted.
- Escape dismisses the menu without changing text. Mouse selection also works. Tab indents normally when no completion menu is open. Ctrl+Space continues to open the supported syntax guide.

The final program can look like this:

```sas
data temp;
    set work.claims;
    amount=paid_amount;
run;
```

WORK is the temporary library. DATA temp still creates a dataset from SET input when run; temp is not a live pointer to claims. The editor infers available column names to help author that program. Dataset-qualified variables such as temp.paid_amount are not added as runtime SAS expressions. Accepting a suggestion removes that qualifier; manually leaving unsupported shorthand in the source can still fail when run in Sassy or SAS.

## Scope and limits

Known metadata comes from current/imported datasets and previously loaded library tables. Library-member names can also come from cached sidebar listings. The pure completion scanner never performs I/O or reads observations. A separate v0.4.19 controller reads only bounded native-file headers for referenced saved tables, using existing project permission without prompting or running code. Selecting a table in the sidebar is no longer required. Saving/opening/running programs keeps the existing workflows and permission rules.

The scanner masks strings, block comments, statement/macro comments and does not expand macros. Simple DATA output schemas are inferred from explicit SET or MERGE source names, with straightforward KEEP/DROP/RENAME statements after the source and simple assignments. These suggestions are labeled “inferred from source”; this is not full SAS semantic validation. Dataset options, macro-generated sources, PROC SQL, complex control flow/schema transformations and full procedure-output inference are outside this first implementation. In uncertain source lookups it offers no inferred target schema. Existing runtime descriptors remain the reliable source after a successful run.

Suggestions use standard SAS identifier names supported by this interpreter. Up to 200 matches are displayed; type more to narrow the list. Programs over 100,000 characters disable this lightweight assistance. Metadata inference operates on source before the caret and may not know columns introduced later. Unloaded native tables can supply their column headers through the authorized metadata reader described below. No code or dataset is sent outside the browser.

## Procedure statement starters (`??`) — v0.4.16

At the start of a new statement inside PROC MEANS, SORT, GLM or SGPLOT, type `??`. A small menu offers supported statement starters. Up/Down chooses an item; Tab/Enter or a mouse click replaces the marker with editable SAS. The first placeholder (such as `variable` or `summary`) is selected so typing immediately replaces it. Escape dismisses without editing. You can type `??cl` or `??out` to narrow the list. Hovering an item shows its full starter text.

For example, after `proc means data=work.temp;`, choose VAR to insert `var variable;`. Replace the selected placeholder with a real name, or type `temp.` to use the existing variable chooser. Choose OUTPUT for either common summary statistics or all currently supported statistics with AUTONAME; edit the output dataset name. The all-statistics choice omits STDERR when the header specifies a non-DF VARDEF.

| Procedure | Starters |
| --- | --- |
| MEANS | CLASS, VAR, WEIGHT, BY, OUTPUT (common/all supported statistics), RUN |
| SORT | BY ascending/default or BY DESCENDING, then RUN |
| GLM | CLASS, WEIGHT, MODEL / SOLUTION, OUTPUT P/R, RUN/QUIT |
| SGPLOT | SCATTER, HBAR, VBAR, HISTOGRAM, XAXIS/YAXIS labels, RUN |

The menu suppresses already-used single statements and applies basic supported ordering: GLM CLASS precedes MODEL; OUTPUT follows MODEL; SGPLOT offers one plot, then axes/RUN. It does not validate the whole program. SORT uses `by descending variable;`, with ascending as default. Options use a forward slash `/` where supported; PROC header options are still edited in the header or looked up in the syntax guide.

The original v0.4.16 menu covered those four procedures; v0.4.17 extends the shared starter catalog to all nine supported procedures. The ?? marker still requires a new statement boundary. A completed RUN/QUIT, a DATA step or a new PROC changes/ends the context. No menu is offered in comments, strings, a partly typed PROC header or expressions such as INPUT's `??` modifier. Macro expansion, automatic analysis selection and unsupported procedures remain outside the menu. The catalog is a short data table next to the supported syntax reference, not another runtime/compiler or a separate documentation panel. Accept or delete `??` before running/saving a program intended for SAS; it is an editor trigger, not added SAS syntax.

## Automatic incremental suggestions — v0.4.17

The existing popup now follows all nine implemented procedures while typing: MEANS, SORT, GLM, SGPLOT, SGPIE, PRINT, SURVEYSELECT, IMPORT and EXPORT. Type a complete `proc means` (or another supported procedure name) to start. The editor inserts only the selected fragment, preserving text already written. Option names, common aliases and already-listed fields/statistics are tracked so duplicates are suppressed. Basic look-ahead also avoids repeating single statements already present later in the same procedure.

| Location | Suggestions |
| --- | --- |
| Procedure header | Supported unused flags/options and statistics; available values after `=`; DATA= choices from known metadata |
| MEANS | Numeric VAR/WEIGHT fields, CLASS/BY fields, remaining OUTPUT statistics and AUTONAME |
| SORT | BY fields and DESCENDING, plus DATA/OUT/NODUPKEY/EQUALS in the header |
| GLM | CLASS/WEIGHT fields, response and predictor fields in MODEL, SOLUTION/SS1/SS3, OUTPUT P/R |
| SGPLOT/SGPIE | Applicable variables, X/Y/RESPONSE/GROUP and supported enum values, histogram/bar/pie options and axis labels |
| PRINT | VAR fields, NOOBS, and OBS/FIRSTOBS inside DATA=table(...) |
| SURVEYSELECT | Supported size/rate/method/seed options, valid common values, STRATA fields; incompatible size/rate and some other combinations suppressed |
| IMPORT/EXPORT | CSV options, sample quoted relative paths, output dataset names and supported import settings |

For example: choose DATA=, then a dataset; choose VAR, then one or more numeric fields; finish that statement; choose OUTPUT and remaining statistics. DATA= and existing VAR/CLASS/WEIGHT/BY statements are not inserted again. On an OUTPUT right-hand side, type your new result variable name, then a space to see the remaining statistics. Values such as paths, sample sizes, seeds and output names are editable examples, not guesses about the data or filesystem. Some free-form values have no suggestions; type them normally.

Tab accepts a suggestion. Arrow keys followed by Enter also accept it. **Plain Enter continues to make a new line in automatic menus until you navigate a choice with the arrow keys.** Escape closes the popup until a subsequent edit. This keeps line breaks available while typing multi-line SAS statements. Dataset dots and `??` continue to work; `??` retains whole-line starters, now also for the other implemented procedures. Ctrl+Space still opens the reference guide.

Suggestions are metadata/source-driven local JavaScript, not model calls or runtime execution. Known numeric/character roles are filtered; unknown inferred types cannot be fully checked before execution. Macros are not expanded, unassigned/unlisted files are not inspected, and advanced expressions, dataset options or transformations may need manual entry. This is bounded assistance, not a complete SAS compiler or semantic validator. The interpreter still checks actual values, statement order, resource limits, output-name collisions and unsupported combinations when you click Run. Accepted pieces are ordinary SAS; no completion module is needed by exported wrappers.

## Saved-library suggestions — v0.4.19

Run `libname saved 'tables';` once to establish the binding and list members in the selected project folder. Then type `proc means data=saved.claims; var `: numeric fields appear even if claims has never been run or clicked in the sidebar. The same cached header supports `saved.claims.` and a new target such as `data temp; set saved.claims; value=temp.`. It does not create temp or execute SET while typing. LIBNAME assignment/reassignment must run before the editor can use that folder; a merely typed new LIBNAME does not grant a binding.

A separate asynchronous reader checks existing folder permission and reads the referenced native JSON file prefix, normally 16 KB and at most 512 KB, stopping at the top-level rows property. It validates the descriptor, discards the prefix and caches columns/types/formats/lengths only; it does not parse, retain or validate observations. File bytes adjacent to the header may be in that bounded prefix, but observation objects are never parsed. Full table/schema validation still happens when a program runs or a table is opened. This reader does not change WORK, library bindings, output history or the selected dataset, and it never prompts for access.

Only assigned, listed library members named before the caret are considered (SQL also inspects FROM/JOIN sources later in the current query statement), up to eight distinct table paths per update; there is no directory-wide table scan. Concurrent requests for the same path share a promise; aliases to the same directory share headers. Typing, Escape, moving focus and running prevent a late response from reopening an obsolete menu. Running, refreshing libraries, switching/disconnecting the project and reconnecting invalidate the cache. Use Refresh libraries after changing files externally. Failed reads are cached until invalidation to avoid repeated requests; ordinary typing remains available. If permission expires, use the existing Reconnect folder action. Corrupt/unsupported files and tables with descriptors after rows or beyond the header bound cannot supply automatic fields.

## PROC SQL assistance — v0.4.20

SQL joins the procedure catalog. Header suggestions offer OUTOBS/NOPRINT, and new-statement menus/?? offer CREATE TABLE, SELECT and QUIT templates. FROM/JOIN slots offer known tables. For `select c. from work.claims as c;`, choosing a field preserves `c.` because it is real SQL syntax. Known expression/summary/WHERE/ON/GROUP/HAVING/ORDER slots offer fields; numeric summary arguments exclude character columns. Native source headers use the existing authorized reader. The scanner recognizes simple FROM/JOIN aliases, not every unfinished/complex query form, comma-source alias inference or schemas of CREATE TABLE results before execution. Full clause autocomplete remains manual.
