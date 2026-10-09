# Sassy portable wrapper demo (v0.4.6)

This package interprets program.sas with the same JavaScript runtime as Sassy.
It is not translated standalone JavaScript or the SAS runtime. No npm or pip
packages are required. Install Node.js 24+; Python 3 is optional.

After extracting the ZIP, open a terminal in this folder:

    node run.mjs
    python run.py

Both return JSON with logs, written table names, tables (native JSON documents
stored as strings to preserve numeric details), chart models and saved paths.
From Python you can import run_sassy from run.py and call it. To decode a table:

    import json
    from run import run_sassy
    result = run_sassy()
    table = json.loads(result['tables']['results'])
    rows = table['rows']

All current WORK tables are snapshots taken WHEN EXPORT IS CLICKED, not the
original inputs from a previous Run. To reproduce that previous run, restore its
inputs first. program.sas contains the current editor source, not expanded SAS.
inputs.json contains remembered library bindings and chart title. Macros expand
at execution just as in the browser. Empty LIBNAME directories from the program
are supplied under project/.

External project CSV/native files are NOT copied automatically. For a program
that reads them, run against a folder containing them in the same structure:

    node run.mjs --project "/path/to/project"
    python run.py --project "/path/to/project"

Alternatively copy the required inputs into project/. No SAS7BDAT reader.
LIBNAME tables are .sassy-table.json files. Relative paths and existing parent
folders are required. The local runner checks traversal and symlink escapes.
Run only trusted local packages; this proof of concept is not a multiuser sandbox.

Explicit PROC EXPORT and permanent DATA/SORT outputs DO save to the chosen
project folder. Targets are preflighted together; existing CSVs require REPLACE.
Individual writes use temporary files and rename, but multiple saves are not one
transaction. A later failure can leave earlier files saved; the error lists them.
WORK results are returned to stdout, not saved as project tables automatically.

Plots are exported as chart models, not rendered PNGs. No browser UI is included.
SAS compatibility, row/operation limits, JSON schema and numerical behavior remain
those of the bundled Sassy engine. Python does not reimplement the calculations.
The Python bridge times out after 30 seconds; local folder writes may have already
occurred. It can run from any working directory because package paths are resolved
relative to run.mjs, while --project is relative to the invoking directory.
