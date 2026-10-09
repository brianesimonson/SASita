# Start testing SASita

SASita starts from the supplied DATA Step Lab v0.2.0 prototype. The application runs locally in a browser and supports a defined SAS-style subset; it is not the SAS runtime.

## Use the app

Download `dist/Sassy-v0.4.1.zip`, unzip it, and open `data-step-lab.html` in a modern desktop Chrome or Edge browser. The ZIP avoids a raw HTML link displaying source code. For the folder workflow, choose the included demo-project folder, Browse files, open project-demo.sas, and Run. See docs/project-files.md for syntax and permission behavior. Use the Program, Output, and Log tabs. Open a saved program or type your own, then click **Run**. See docs/app-guide.md. The app requires no Python, server, account, API key, or internet connection to compute results.

Start with the supplied synthetic data. Inspect the rolling Log, session Output snapshots, and Expanded code, import `examples/claims.csv` or `examples/providers.csv`, and export results. Programs support file open/save and a browser-local recovery draft; datasets remain in tab memory until explicitly exported. Remembered project-folder permissions may need reconnecting. Save or export before closing. Macro definitions reset on each Run.

## Develop in Codex or locally

Use the existing SASita checkout. Cloud tasks already have isolated environments; do not create another worktree unless explicitly requested. Read `AGENTS.md`, `PROJECT-STATUS.md`, and `HANDOFF.md` before changing the application.

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
