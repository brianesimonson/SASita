# Procedure support and deployment — Sassy v0.4.10

All supported computation runs locally in the single offline HTML and in the
exported Node.js 24+ interpreter. The optional Python wrapper invokes Node.
Programs remain SAS-style source plus the engine; no per-program JavaScript
translation is produced. External data files must be supplied separately.

| Procedure | Implemented | Unsupported / compatibility boundary | Portable deployment |
| --- | --- | --- | --- |
| SORT | DATA/OUT, ascending/DESCENDING BY, EQUALS, NODUPKEY | Other options, locale-specific collation, complete SAS descriptors | Browser and Node tables; JSON libraries supported |
| IMPORT | DBMS=CSV, DATAFILE, OUT, REPLACE, GETNAMES=YES, GUESSINGROWS=MAX | Excel/SAS7BDAT/other engines, per-field schema options; CSV typing is inferred | Browser requires an authorized project folder; Node requires --project or packaged project inputs |
| EXPORT | DBMS=CSV, DATA, OUTFILE, REPLACE | Other file formats/options | Same project-path model; staged writes and preflight retained |
| MEANS | 13 unweighted statistics, VAR, CLASS all-type totals/subtotals, NWAY/MISSING, sorted BY, OUTPUT/AUTONAME, DF/N | WEIGHT/FREQ, quantiles, CI/t/skew/kurtosis, TYPES/WAYS, full ODS metadata/layout | Browser reports and tables; Node returns report models and native table strings |
| SURVEYSELECT | SRS/URS/SYS, scalar size/rate (rate SRS/URS), sorted raw STRATA, automatic stratum seeds, unstratified REPS, hits/output options | PPS, clusters, CONTROL, formatted strata, stratified REPS, legacy RNGs, per-stratum input tables; see surveyselect.md | Browser reports/tables and Node report models/native table strings; identical sampling engine |
| SGPLOT | One SCATTER/HBAR/VBAR/HISTOGRAM per procedure; grouping, supported statistics/bins/labels | Overlays, regression/density, most styles/options, exact SAS automatic histogram bins/ODS visuals | Browser renders bundled Chart.js and downloads PNG; Node returns chart models, not PNG |
| SGPIE | PIE; supported categories/responses/grouping/statistics/title | Advanced styling/options and exact SAS visual equivalence | Browser renders Chart.js; Node returns chart models |

PROC PLOT, SUMMARY, SQL, SURVEYMEANS, SURVEYFREQ and procedures not listed here
are not implemented. Read the corresponding scope documents for exact syntax:
means.md, surveyselect.md, charts.md, project-files.md and native-tables.md.

DATA steps, macros and RAND are language features rather than procedures.
Their supported subset is listed in the app's syntax guide. Default and explicit
MT32 uniform and paired NORMAL reference agreement is documented in random-numbers.md;
NORMAL last bits and broader seed/parameter cases are not certified.

Browser LIBNAME points to authorized relative folders containing
`.sassy-table.json`, not `.sas7bdat`. Node's --project selects the equivalent
folder structure. Browser permission dialogs do not exist in the local Node
runner: local OS permissions apply. Absolute SAS paths and native SAS library
files require adaptation before deployment. This is a trusted local runner,
not a server sandbox for untrusted programs.

Exporting a program packages its SAS source, engine and current WORK snapshots;
it does not automatically copy external project files or recover the inputs
from before earlier runs. Normal resource limits and unsupported syntax checks
still apply. Exact reference matches concern the tested values/selections, not
complete SAS language, metadata or graphical equivalence.
