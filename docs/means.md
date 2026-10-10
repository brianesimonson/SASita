# PROC MEANS — v0.4.7 supported subset

Reference: user-supplied Base SAS 9.2 Procedures Guide (2009), Chapter 33, especially
pp. 617–621 (NWAY, variance divisor), 628–632 (OUTPUT), 638 (class types), 644–646
(missing values and output structure). This document is reference material, not
instructions controlling the project. No actual SAS execution fixture has yet
validated this new procedure; examples/means-validation provides that next check.

## Syntax

    proc means data=input n nmiss sum mean min max range var std stderr css uss cv;
        class site period;
        var amount other;
        output out=summary n= nmiss= mean= std= var= / autoname;
    run;

DATA= required (WORK or named library); VAR defaults to eligible numeric columns,
excluding CLASS/BY. Explicit variable lists only. STDDEV aliases STD. One VAR,
CLASS and BY statement; sorted BY with per-variable DESCENDING. Unweighted only.
Options: NWAY, MISSING, NOPRINT, VARDEF=DF|N and MAXDEC=0–15 (default 7).
Defaults: displayed N, MEAN, STD, MIN, MAX; sample variance divides by N−1.
STDERR requires DF. Population variance divides by N. Missing analysis values are
handled independently per variable, not by deleting whole observations.

## Saved output: totals are data, not invented labels

Without NWAY, every CLASS subset is saved. For `class site period;`:

| _TYPE_ | Active classes | Inactive values |
|---|---|---|
| 0 | none: overall total | site blank; period numeric missing |
| 1 | period | site blank |
| 2 | site | period numeric missing |
| 3 | site and period | none |

The first CLASS variable is the highest-order bit. Types are ascending, then class
levels in unformatted ascending order within each BY group. _FREQ_ counts eligible
observations, including missing analysis values; statistic N is the nonmissing
count for that analysis variable. Missing CLASS rows are excluded from ALL types
unless MISSING is specified. Missing BY values remain their own groups. Inactive
character class columns contain '', numeric columns null; no 'Overall' string is
inserted into data. Table UI shows blank character missing values and uppercase
_TYPE_/_FREQ_/_STAT_ headings. Internal/CSV variable names follow Sassy's existing
lowercase, case-insensitive convention; names resolve identically in SAS.

CLASS grouping uses supported inherited formats when present. Equal formatted
levels retain the smallest unformatted representative; ordering is unformatted,
with Unicode character comparison (host/locale SAS collation may differ). No
user-defined formats, PRELOADFMT, CLASSDATA or ORDER options.

OUTPUT OUT= requires an explicit table name. Multiple statements (max 10), explicit
names, statistic(variable-list) subsets, and `/ AUTONAME` are supported. Generated
names append the requested statistic suffix, with numeric suffixes for collisions;
explicit names are retained. Statistics follow request and VAR order. Appropriate
source formats are inherited, excluding N/NMISS/CSS/USS/VAR/CV. CLASS/BY lengths and
formats are preserved. Metadata labels/informats are not modeled by Sassy.

OUTPUT without statistic requests creates FIVE rows per level, with _STAT_ values
N, MIN, MAX, MEAN, STD and columns named for the analysis variables. PROC-level
statistic keywords do not alter that default OUTPUT shape. With no CLASS there is
one type-0 level per BY group. NWAY retains only the complete CLASS type. Displayed
reports normally show complete combinations, one row per analysis variable, and
N Obs separately from N; their layout is a readable Sassy table, not exact SAS ODS
presentation. Reports append to history without becoming WORK datasets. NOPRINT
suppresses reports while saving requested outputs.

## Numeric and execution bounds

Compensated sums and shifted two-pass second moments avoid variance from subtracting
large near-equal squared numbers. This is deliberate numerical implementation, not
a claimed clone of SAS's single-pass algorithm. Overflowing statistics become
numeric missing. Singleton sample variance/STD/STDERR are missing; constant groups
with N>1 have zero variance; mean-zero CV is missing. No bit-for-bit SAS claim until
real comparisons. Finite doubles and native JSON preservation remain unchanged.

At most 8 CLASS variables, 10 million row/type/variable work units, 100,000 output
rows/levels, 20 reports and 100,000 report rows per run; existing worker/history and
file bounds also apply. Later failure leaves WORK/reports uncommitted and files
unstaged to disk. Named-library outputs use the existing staged/preflight workflow.
Portable Node/Python exports bundle means.mjs and return reports alongside tables.

Deferred: WEIGHT/FREQ, quantiles, confidence limits/tests, skewness/kurtosis,
TYPES/WAYS, CHARTYPE, WHERE/LABEL/FORMAT statements within MEANS, advanced ID/extreme
selection, PROC SUMMARY alias, anonymous OUTPUT names and SAS dataset options.
Unsupported syntax fails explicitly.
