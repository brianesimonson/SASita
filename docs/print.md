# PROC PRINT — Sassy v0.4.13

PRINT explicitly requests observation output. Creating a DATA/SORT/prediction/ODS dataset still does not add observations to session Output. The same interpreter supports PRINT in the offline browser and portable Node/Python wrapper.

```sas
proc print data=study(obs=10);
    var id amount;
run;

proc print data=study(firstobs=5 obs=10) noobs;
    var amount id;
run;
```

OBS and FIRSTOBS are dataset options inside DATA=table(...), not PROC options. OBS is the final observation index, not a row count: FIRSTOBS=5 OBS=10 lists six observations, 5 through 10. FIRSTOBS defaults to 1; omitted OBS or OBS=MAX uses the end of the table. OBS=0, a starting index after the dataset end, or OBS smaller than FIRSTOBS gives an empty listing. Observation indices are nonnegative integers through 2,147,483,647; FIRSTOBS must be positive.

DATA= is required, including WORK or an assigned native JSON library. VAR optionally selects and orders explicit variable names; omitted VAR lists all columns. NOOBS hides the observation-number column. Numbered listings use original observation indices. Existing formats are inherited, and the current TITLE prefixes the report title. PRINT creates no output dataset, does not modify its source, and retains a small independent report snapshot for session history. CSV downloads contain the selected variables; the display-only Obs column is separate metadata. Sidebar viewing remains available for inspection without running PRINT.

A listing may contain at most 1,000 observations and 100,000 cells. An unrestricted larger request fails with instructions to use OBS and VAR; it is not silently truncated. Existing per-run report and session history limits also apply. These are bounded quick-inspection reports, not a bulk observation renderer.

Not implemented: WHERE, BY, ID, SUM, LABEL, FORMAT statements, dataset WHERE/KEEP/DROP options, variable ranges/lists such as _ALL_, custom PRINT styling and most SAS PRINT options. Unsupported syntax fails explicitly. Styling is Sassy's table viewer; exact SAS ODS layout/metadata is not claimed.

Open Examples → PROC PRINT for a generated dataset and three short listings. Local checks cover ranges/empty ranges, column order, numbering/NOOBS, inherited formats/titles, untouched source data, native reads, report snapshots and bounds. Browser checks exercise modular and standalone builds; exported wrappers retain PRINT reports. No fresh SAS runtime PRINT comparison has been performed.

WEIGHT is supported in PROC MEANS and PROC GLM starting in v0.4.14; see weights.md for procedure-specific rules and validation.
