# Start testing SASita

SASita starts from the supplied DATA Step Lab v0.2.0 prototype. The application runs locally in a browser and supports a defined SAS-style subset; it is not the SAS runtime.

## Use the app

For an existing local checkout, Fetch/Pull branch `feature/editor-dataset-completion`, then open or refresh `dist/data-step-lab.html` in desktop Chrome/Edge. No build is needed. A ZIP fallback is `dist/Sassy-v0.4.18.zip`. The ZIP avoids a raw HTML link displaying source code. For the folder workflow, choose the included demo-project folder, Browse files, open project-demo.sas, and Run. See docs/project-files.md for CSV/permission behavior and docs/native-tables.md for LIBNAME. The demo-project also contains library-demo.sas and its existing tables folder, plus charts-demo.sas for all five chart types without a folder connection. See docs/charts.md. Use the Program, Output, and Log tabs. Open a saved program or type your own, then click **Run**. See docs/app-guide.md. The app requires no Python, server, account, API key, or internet connection to compute results.

Start with the supplied synthetic data. Inspect the rolling Log, session Output snapshots, and Expanded code, import `examples/claims.csv` or `examples/providers.csv`, and export results. Programs support file open/save and a browser-local recovery draft; datasets remain in tab memory until explicitly exported. Remembered project-folder permissions may need reconnecting. Save or export before closing. Macro definitions reset on each Run.

## Develop in Codex or locally

Use the existing SASita checkout. Cloud tasks already have isolated environments; do not create another worktree unless explicitly requested. Read `AGENTS.md`, `VALIDATION-STATUS.md`, `PROJECT-STATUS.md`, and `HANDOFF.md` before changing the application.

Development uses Node.js 24 and Python 3.12. There are no third-party npm dependencies to install. Python is only a build tool and an optional development server.

```sh
npm run build
npm test
npm run test:browser
npm run dev
```

`npm run dev` serves the modular app on port 8000. Stop it with Ctrl+C. The browser suite requires Chromium on PATH, or `CHROME_BIN` set to a Chrome/Chromium executable. It starts and stops its own local server and browser. It tests both the modular app and the self-contained HTML over HTTP. Use `npm run test:browser -- --file` to additionally open the HTML through file:// when browser policy permits; the current cloud browser blocks file:// navigation. GitHub Actions requests the file:// check as well.

Edit the modules under `dist/` (including formats.mjs and random.mjs), then regenerate `dist/data-step-lab.html` with `npm run build`. Commit source and generated HTML together. GitHub Actions checks the build, detects a stale generated HTML file, runs the original regression suite, and runs browser tests.

## Keep progress safe

GitHub is the durable source record. Start changes from the latest agreed feature milestone; keep main and v1.0 unchanged until explicitly authorized, use small commits and feature branches for subsequent work, and push completed changes. Keep `PROJECT-STATUS.md` current with actual checks, limitations, and next steps. Use version tags for known milestones. The initial imported baseline is tagged `v0.2.0` after validation.

The supplied `source-history.bundle` preserves the original two commits. `docs/imported/` contains the original handoff documents and manifest for provenance; those documents describe the pre-import package and do not supersede current project guidance. Their manifest describes original archive bytes, not the evolving repository.

See `PROJECT-STATUS.md` for the testing gaps and next milestone. Test failures should be investigated, not bypassed to make checks pass.

Previous milestone: Sassy v0.4.5 on feature/sassy-context-help. Click Syntax guide in Program or press Ctrl+Space to open contextual references and templates.

Previous milestone: Sassy v0.4.6 on feature/sassy-portable-wrapper. Code & export opens the actual runtime-source viewer and runnable demo exporter; see docs/portable-demo.md. v0.4.5 is preserved on GitHub as a snapshot branch and tag.

Previous milestone: Sassy v0.4.7 on feature/sassy-proc-means. Use Examples in the upper-right header to open PROC MEANS or another snippet without running. See docs/means.md and examples/means-validation.

Previous app milestone: Sassy v0.4.10 on feature/sassy-normal-cache. NORMAL now caches pairs, preserving the second value across UNIFORM calls. The tested SAS normal/mixed sequences agree within rounding tolerance and subsequent uniform witnesses match exactly; bit-identical normals are not guaranteed. Open demo-project/normal-demo.sas to generate all four contexts without a folder connection. See docs/random-numbers.md and docs/procedure-support.md for evidence/deployment scope. Main and prior milestones remain preserved.

Latest app milestone: Sassy v0.4.11 on feature/sassy-glm. Open Examples → PROC GLM for CLASS/interactions, Type I/III and MODEL / SOLUTION. See docs/glm.md and the included glm-validation.zip for the self-contained SAS comparison; upload and run only its 01-sas-glm-comparison.sas file. Fresh SAS runtime validation is pending. Main and prior tags remain preserved.

Latest app milestone: Sassy v0.4.12 on feature/report-only-output. Only reports/charts accumulate in session Output. Stored datasets require an explicit sidebar click to inspect/export; DATA-only runs stay in Program. The ZIP includes the corrected GLM validation kit, whose ten actual SAS comparisons passed. Main and earlier tags preserved.

Latest app milestone: Sassy v0.4.13 on feature/proc-print. PROC PRINT explicitly lists selected observations via OBS/FIRSTOBS, VAR and NOOBS without changing the source. Eleventh Examples program and print.md describe it. WEIGHT remains a separate future change for MEANS/GLM.

Latest app milestone: Sassy v0.4.14 on feature/weighted-means-glm. WEIGHT now works in both procedures; read weights.md and the twelfth example. The included weights-validation.zip needs only its 01-sas-weight-comparison.sas uploaded/run in SAS Studio. Actual weighted SAS validation remains pending.

Latest app milestone: Sassy v0.4.15 on feature/editor-dataset-completion. WORK/library datasets and variables have dot-triggered suggestions; variable shorthand inserts a bare SAS name. See docs/editor-completion.md. Read VALIDATION-STATUS.md whenever asked about outstanding tests; the weighted SAS run remains explicitly deferred.

Latest app milestone: Sassy v0.4.16 stays on feature/editor-dataset-completion so local clones can pull normally. Type ?? at a new statement inside MEANS/SORT/GLM/SGPLOT to choose an editable starter. See docs/editor-completion.md. Main/previous tags and pending validation remain unchanged.

Latest app milestone: Sassy v0.4.17 on the same feature/editor-dataset-completion branch adds automatic incremental help for all nine supported procedures. Start typing a known PROC header; choose unused pieces with Tab. Plain Enter remains a newline unless you first navigate a choice. ?? whole-line starters remain available. Read docs/editor-completion.md for bounds. Deferred validation is unchanged.

Latest app milestone: Sassy v0.4.18 corrects weighted MEANS source counts from actual SAS evidence. All ten weighted GLM comparisons passed. Revised weight kit needs only its single comparison program run; MEANS counts need a fresh SAS rerun. See VALIDATION-STATUS.md.
