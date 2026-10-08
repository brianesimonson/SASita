# Continue DATA Step Lab in Codex

This folder contains the complete version-2 source project, its runnable offline app, tests, documentation, and original Git history. It can be developed independently of the hosted Site. No private hosting credentials are included, and no GitHub repository has been created.

## Open the project

1. Extract the ZIP on your computer.
2. Open the extracted `data-step-lab` folder as the project in your coding environment.
3. Give Codex the request in `CODEX-FIRST-TASK.md`. It can read the other project files directly.
4. Start with the compatibility audit and browser checks described in `HANDOFF.md`, then add features in small reviewed changes.

## Run the app

Double-click `dist/data-step-lab.html`. It is self-contained and processes data locally in a browser worker. No server or Python installation is needed to use this file. Windows browser execution still needs to be verified.

To serve the modular app during development, with Python installed, run from this folder:

```sh
python -m http.server 8000 --directory dist
```

Then open `http://localhost:8000`. On Windows, `py -3` may be used instead of `python`.

## Run tests and rebuild

With Node.js 20 or later installed, run the four commands listed in `README.md`, or use `npm test`. There are no third-party dependencies to install. The baseline was checked with Node.js 24.19.0.

With Python 3 installed, run `python build-offline.py` to regenerate the standalone HTML after editing the modules. Then run `node test-offline.mjs` to check the embedded worker. A Python-free packaging script could be a future convenience improvement.

## Git history

You can initialize a new Git repository in this extracted folder. `source-history.bundle` also preserves the original two commits if you prefer to retain that history. The exported working folder intentionally omits the existing Site identity, but the original historical commits contain it.

For an optional history-preserving migration, clone the bundle into a SEPARATE directory:

```sh
git clone source-history.bundle ../data-step-lab-with-history
```

Then remove `.openai/hosting.json` from that cloned working tree before using it as an independent project or creating a new hosted Site. Copy the additional handoff documents, package.json, and examples from this extracted folder into the clone and commit those changes. Historical Site IDs are identifiers, not credentials, but should not be reused to publish a different project.

The two original commits are:

- `13d94a86b074e44624828ca345245d2a9ba349e3`: initial prototype.
- `c86cb40a1a44c89e222ba31d11ab237300803efe`: MERGE, PROC SORT, macro expansion, and offline packaging.

GitHub hosting remains a separate step. Create a private repository in your own account and push the chosen working repository when ready. This package does not authorize Codex to publish it or change the existing Site.
