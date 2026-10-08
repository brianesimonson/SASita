# SASita baseline

## Purpose

A standalone HTML application for entering a practical SAS-style subset and processing datasets in the browser. Preserve local computation and offline single-file delivery. The source modules and interpreter are the supplied DATA Step Lab v0.2.0 baseline; setup has not expanded language behavior.

## Current capabilities

DATA steps, SET, BY groups, match MERGE, PROC SORT, bounded macro expansion, CSV import/export, result tables, logs, and expanded-code inspection. README.md describes the supported subset and its limits.

## Baseline validation

The four original Node test programs pass under Node 24.19.0. They exercise filtering, grouping, loops, output, missing values, merge/sort/macros, failure paths, all seven example programs, and the embedded offline worker.

The Python 3.12.14 build reproduces the supplied 96,800-byte offline HTML exactly.

The real-browser suite uses headless Linux Chromium. It checks the modular application over HTTP and the standalone HTML over HTTP: all seven examples and expected observation counts, expanded code, CSV import and export content, and rollback when a later DATA step fails. Browser tests intercept the export link to verify its Blob contents; they do not test an OS download dialog.

These tests are regression evidence, not certification against SAS. Opening file:// in this cloud Chromium is blocked by administrator policy (net::ERR_BLOCKED_BY_ADMINISTRATOR); this is an environment restriction, not an observed application failure. The optional `--file` browser check is configured in CI but has not passed locally. There has been no Windows Chrome/Edge manual testing, no installed SAS reference comparison, no full visual/accessibility audit, and no UI timeout/termination check yet. GitHub Actions results must be checked on GitHub; local passes do not establish a hosted CI pass.

## Next milestone

1. Manually open the standalone HTML in Windows Edge/Chrome and follow START-HERE.md. Record browser version, program, expected result, actual result, and reproduction steps for failures.
2. Add representative SAS programs and reference output fixtures, including variable types and lengths. Prioritize missing values, BY boundaries, repeated merge keys, shared variables, macro scope, and output rules. Label fixtures not checked against SAS.
3. Add save/open programs and workspace export/import so closing a tab does not lose analyst work.
4. Expand syntax based on concrete programs; retain explicit errors for unsupported features.

## Working agreement

Use Git commits and version tags for recoverable milestones. Update this file when capabilities or validation change. Keep application data local. No deployment or hosted-site changes are included in baseline setup.

## Function and format reference branch

Branch `docs/function-format-catalog` adds a categorized in-app inventory of all 32 current DATA step functions and six format families, including callable examples and implementation limits. All 32 function examples and six format examples were exercised against the current runtime; npm test and npm run test:browser pass. No engine or macro semantics changed. The offline HTML was rebuilt.

See docs/current-functions-formats.md for the inventory and docs/function-format-expansion.md for proposed batches. Official SAS catalog retrieval remains blocked by egress policy (403 Forbidden). SAS documentation domains were saved in a configuration draft but access is not established. The exhaustive SAS-wide inventory is pending; proposed additions are not documentation-verified or approved implementation scope. Main and v1.0 are preserved.

## Official catalogs from uploaded PDFs

The catalog branch now includes complete dictionary-topic indexes from the uploaded September 2026 functions/CALL manual and April 2026 formats/informats manual. All 1,118 topic titles and printed pages were matched independently against chapter contents: 655 function topics, 65 CALL routine topics, 289 format topics, and 109 informat topics. All 32 current functions and six supported format families are mapped to their reference entries. SUBSTR assignment form is explicitly unsupported. See docs/catalogs/README.md and its CSVs for source metadata, current support, and proposed priorities.

The earlier network blocker is resolved for catalog research by the uploaded PDFs; live website access remains unverified. No new functions/formats have been implemented, no SAS runtime comparison has been performed, and selections are still pending. Main and v1.0 remain unchanged.
