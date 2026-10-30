# PROC SQL — Sassy v0.4.21

Sassy parses a defined SAS-style SQL subset in JavaScript and operates on its existing datasets. No SQL package, server, connection or internet access is required. This milestone adds about 87 KB (4.82%) to the standalone HTML, including repeated embedded worker/export sources; the SQL engine source itself is about 25 KB. Summary moments reuse the same unweighted formulas as PROC MEANS. Browser and exported Node/Python execution use the same source. Actual SAS evidence passes all sixteen corrected groups / 71 matched records exactly across the original fifteen passing groups and the focused v0.4.21 grouped STD/VAR rerun. No further SQL-kit rerun is outstanding.

```sas
proc sql;
    create table work.provider_summary as
    select provider,
           count(*) as claim_count,
           count(distinct claim_id) as unique_claims,
           mean(paid_amount) as average_paid,
           std(paid_amount) as sd_paid
    from work.claims
    group by provider
    having calculated claim_count>1
    order by provider;
quit;
```

`CREATE TABLE … AS SELECT` saves a dataset without displaying observations. An explicit standalone `SELECT` produces a report in session Output. `PROC SQL NOPRINT` suppresses these reports. `OUTOBS=10` limits each query's final result, including a saved table; it does not bypass intermediate-work limits. SQL ends with `QUIT;`, not `RUN;`. Multiple queries can use preceding results in the same procedure. Existing macro expansion applies before SQL parsing; macro `SELECT INTO` is not implemented.

## Supported queries

- Explicit SELECT expressions, `*`, `alias.*`, AS column/table aliases and simple implicit aliases. Prefer explicit aliases for computed columns; unnamed expressions receive local `_sql1`-style names that are not SAS metadata parity. Duplicate output names fail: select explicit aliases rather than relying on SAS's duplicate-column handling.
- WORK and assigned native libraries. `CREATE TABLE saved.summary AS …` stages `summary.sassy-table.json` in the assigned folder. Native sources refresh through the same run-level disk-reading rules as DATA steps. Aliases of the same folder can read an earlier staged output. No SQL writes commit if a later program statement fails; existing multi-file storage failure limitations still apply.
- INNER, LEFT, RIGHT, FULL and CROSS JOIN; OUTER is optional for LEFT/RIGHT/FULL. ON supports expressions and compound conditions. Comma-separated tables are cross joins and may be filtered by WHERE. Duplicate keys produce every matching combination, unlike DATA-step match MERGE. Common equality joins use keyed lookups; non-equality/OR joins have bounded nested evaluation. Comma joins materialize the cross-product before WHERE, so use JOIN/ON for larger data.
- WHERE, GROUP BY, HAVING, ORDER BY ASC/DESC, positional GROUP/ORDER references, DISTINCT and its SAS synonym UNIQUE. ORDER BY can use output aliases. DISTINCT queries require ORDER BY expressions in the SELECT list. Without explicit ORDER BY, grouped query row order is not promised. GROUP BY without a summary function acts as ordering and retains duplicates, matching SAS's documented transformation; the app records a note.
- Searched/simple CASE, earlier SELECT aliases via CALCULATED, arithmetic, comparisons, AND/OR/NOT, concatenation of character expressions, IN lists, BETWEEN, IS [NOT] MISSING/NULL and LIKE (`%` and `_`; no ESCAPE clause).

## Summaries and scalar functions

| Form | Behavior |
| --- | --- |
| `COUNT(*)` | All rows, including outer-join rows and rows with missing values |
| `COUNT(x)`, `N(x)` | Nonmissing values |
| `COUNT(DISTINCT x)` | Distinct nonmissing values |
| `NMISS(x)` | Missing values |
| `SUM(x)`, `MEAN(x)` / `AVG(x)` | Across eligible nonmissing numeric rows |
| `STD(x)`, `VAR(x)` | Sample standard deviation/variance using N−1; missing for fewer than two nonmissing values |
| `MIN(x)`, `MAX(x)` | Across nonmissing numeric or character values |
| `SUM(x,y)`, `MEAN(x,y)`, `MIN(x,y)`, `MAX(x,y)` | DATA-step-style numeric calculation within each row, not a grouped summary |

Use `STD(x)` in PROC SQL. The tested SAS environment does not recognize `STDDEV(x)` there, so Sassy now rejects it with guidance to use STD. PROC MEANS continues to support its own STDDEV alias.

Single-argument summaries also accept DISTINCT, except COUNT(*). An empty ungrouped summary produces one row: zero counts and missing SUM/MEAN/STD/etc. Empty grouped input produces no groups. There is no SQL WEIGHT statement; an explicit expression such as `sum(w*x)/sum(w)` has the inclusion policy expressed by your query.

Pure implemented DATA-step scalar functions such as ABS, SQRT, EXP, LOG/LOG10/LOG2, string/date helpers and COALESCE are available with the same subset limitations. INPUT/PUT accept a value plus a literal supported informat/format, for example `input(text,best32.)` and `put(amount,12.2)`. INPUT quiet modifiers and PUT alignment modifiers are not supported in SQL. Stateful RAND and LAG are deliberately unavailable in SQL; generate them in a DATA step first. Row-functions' missing-value/type/coercion limits remain as documented for DATA steps; this is not full SAS implicit conversion or fixed-length character behavior.

Missing numeric values compare below nonmissing values and compare equal to each other, so missing join keys can match. Blank character values are missing for summaries; comparisons/grouping/distinctness ignore trailing blanks. This follows the targeted SAS behavior rather than ANSI NULL's three-valued logic. Special SAS missing codes, locale/host collation and exact descriptor lengths/formats for computed columns remain unsupported. Direct selected columns inherit known formats and character lengths. Use INPUT/PUT explicitly across numeric/character types.

## Explicit boundaries

Queries requiring SAS automatic **remerging** fail. With summaries present, non-summary SELECT/HAVING/ORDER expressions must be derivable from GROUP BY expressions. For example, `select id,mean(amount) from claims` fails; group by id, or create a summary table and explicitly join it back. Nested summaries also fail.

This release does not implement subqueries, correlated queries, UNION/INTERSECT/EXCEPT, SQL macro INTO, INSERT/UPDATE/DELETE/ALTER/DROP, views, table/column modifiers such as FORMAT=/LABEL=/LENGTH=, SAS name literals, dataset options, dictionary tables, pass-through connections or full query optimization. CALCULATED in ON is unsupported; repeat the expression. Unsupported syntax fails rather than being silently delegated to another dialect.

Limits: eight sources per query, 256 explicit SELECT expressions (star expansion up to 1,024 output columns), expression depth 64 / 2,000 nodes per procedure, 100 queries per PROC SQL, and at most 100,000 rows / 2,000,000 cells for sources/intermediates/results (ordering keys count toward result work). Each query has a 10-million-operation budget plus the app worker timeout. A displayed SELECT is limited to 1,000 observations / 100,000 cells; use OUTOBS or CREATE TABLE. These bounds can reject large joins even when a later aggregate/OUTOBS would return few rows.

## Editor and validation

The syntax guide includes PROC SQL and a complete template. Automatic header help offers OUTOBS/NOPRINT; query starters are available automatically at a statement boundary and through `??`. Known FROM/JOIN tables and SQL alias-qualified fields have suggestions; accepting `c.amount` preserves the SQL qualifier. Simple SELECT/WHERE/ON/GROUP/HAVING/ORDER and summary argument slots use known metadata, including authorized native headers. For SELECT fields before FROM, only source references later in the same query statement are considered; future statements are not scanned for file reads. Parsing advanced/unfinished query text remains conservative; SQL output-schema inference before execution and complete clause autocomplete are not promised.

Open Examples → **PROC SQL: joins and grouped statistics** for a self-contained demonstration. The first actual SAS run passed fifteen groups / 68 records with exact equality reported. The sixteenth group did not run because STDDEV could not be located; that was function-name resolution, so its grouped numeric results were not compared. Version 0.4.21 removes the alias and redundant sd2 column; STD/VAR formulas are unchanged. See [first-run evidence](validation/sql-sas-2026-10-29.md).

The focused **02-sas-grouped-comparison.sas** has now passed actual SAS: three rows and eleven variables, with all values exactly equal and no executed errors or warnings. Together with the prior fifteen groups this completes all sixteen corrected comparisons / 71 matched records. The original skipped STDDEV case and repeat of that old program remain preserved as history. No additional SQL-kit run is outstanding.

The kits remain available for future optional regression runs: `examples/sql-validation/sql-grouped-retest.zip` contains the single grouped program plus README; `sql-validation.zip` also includes the full sixteen-group program and references. Value comparisons sort all columns at relative criterion 1e-10; original query order/full descriptors/layout remain outside certification. The focused report notes g length 4 versus 128: the expected-table helper deliberately uses wide character columns, while compared values are equal. This is not evidence of a native-table descriptor mismatch.
