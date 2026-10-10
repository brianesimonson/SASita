# Portable execution proof of concept — Sassy v0.4.8

Use the small **Code & export** button in the upper-right project controls. The
modal shows current SAS source, the Node runner, Python wrapper, and eight actual
JavaScript runtime modules. Sources are captured at build time and checked against
the modular files; the offline HTML contains them without a network fetch. No new
workspace tab or editor change. Source is read-only and displayed as text.

**Export runnable demo ZIP** downloads the current editor program and all current
WORK table snapshots, including formats, types, lengths, finite numeric values and
signed zero through the native codec. It includes remembered library bindings,
chart title, the runtime, Node/Python runners and instructions. Export does not run
the program or read/copy external project files. Snapshots are the CURRENT inputs
at export time, not original inputs from an earlier submission; recreate those
inputs first when reproducing a previous result. Empty source/invalid programs or
unrepresentable table data fail clearly. Package limit: 50 MB, uncompressed ZIP.

Open demo-project/portable-demo.sas in a fresh app and export it for a ready example
using default WORK.CLAIMS. dist/Sassy-wrapper-demo-v0.4.8.zip is also a prepackaged
version using examples/claims.csv; scripts/package-portable-demo.mjs regenerates it.

Extract the ZIP. With Node.js 24+ installed, run `node run.mjs`. With Python 3 also
installed, run `python run.py`, or import `run_sassy` from run.py. The Python bridge
uses subprocess arguments (no shell), checks the exit status, reads JSON and has a
30-second timeout. Neither npm nor pip dependencies are required. Python never
reimplements the numerical engine. The browser app itself still needs neither.

The result envelope has written names, logs, native table JSON strings, chart
models and saved file paths. Decode a table string with json.loads to obtain its
column descriptors/rows. Chart models are not PNGs; rendering remains in Sassy's
browser UI. JSON libraries are not SAS7BDAT. Program text is retained unchanged.

For project dependencies, run `node run.mjs --project "folder"` or
`python run.py --project "folder"`. Relative CSV and LIBNAME paths resolve there.
Alternatively copy dependencies into the supplied project/ directory. Native
library folders mentioned in the program/bindings are included empty, not populated
from cached sidebar data. That avoids presenting stale cached tables as disk input.
Explicit PROC EXPORT and permanent DATA/SORT operations save to that folder.

The demo host checks relative paths, existing parent directories, symlink escapes,
input size and all output targets before writes. Existing CSV targets require
REPLACE; native outputs preserve current runtime replacement semantics. Table
serialization is checked before disk writes. Each output uses a temporary file and
rename; multiple files are not a single transaction. Later save failures report
previous saves. Concurrent filesystem changes are outside this local demo's scope;
this is not a multiuser sandbox. Run trusted local packages only.

Verified: catalog source fidelity, ZIP CRC/extraction, JavaScript/Python DATA/SORT,
100 exact same-engine RAND draws, signed zero, native writes/reloads, CSV import/
export, inherited library bindings, chart models, missing dependencies, all-target
preflight, computation-failure no-write and symlink escape rejection. Browser tests
capture the actual ZIP from both modular and standalone builds, compare viewed
engine source exactly, extract and execute run.py, and verify returned rows. Full
baseline and existing UI/chart/library/file checks passed. Windows OS paths/rename
behavior remain manual validation; no new SAS runtime equivalence claim.

The v0.4.8 runtime also includes PROC MEANS; result envelopes include descriptive report tables as reports, in addition to saved tables.
