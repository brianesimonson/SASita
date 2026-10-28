Verification for v0.4.19: npm test passed; both Chromium modular/standalone builds passed, including disk-only library suggestions and actual browser ZIP execution through Python/Node with LAG/math/conversions. App and wrapper ZIPs verified; no fresh SAS fixtures for new LAG/math.

Additional v0.4.19 scope: LAG/LAGn (n1–1000) uses independent per-call queues, executed-call rather than observation lag, missing initialization, DATA-step reset and no BY reset; ring buffers capped100,000 slots per step. EXP/LOG/LOG10/LOG2 now implemented (they were not previously), missing/domain/overflow handling, one-argument checks. INPUT/PUT functions, CSV-only PROC IMPORT and sorted match MERGE confirmed already present; standalone PUT/INPUT statements remain unsupported. Thirteenth example covers lag/math/conversions. DATA-LAG-MATH ledger item awaits fresh SAS fixtures; completed weighted fixtures remain valid.

Latest app v0.4.19 adds authorized header-only metadata loading for referenced, assigned/listed native-library members. PROC fields, qualified variables and simple SET inference no longer require opening/running a table first. Pure completion remains I/O-free; library-completion.mjs orchestrates bounded project.readDescriptor and caches descriptor-only objects, dedupes aliases/requests and invalidates on runs/refresh/project changes/reconnect. No prompt or observation parsing; 16KB–512KB prefix, descriptors must precede rows. LIBNAME must already be assigned by a successful run. New tests cover permissions/races/cache/header and disk-only tables in both browser builds. WEIGHT-SAS remains complete; main and stable update branch preserved. Earlier notes historical.

Validation update 2026-10-28: actual corrected v0.4.18 weight SAS rerun passes all15 groups / 96 matched records, zero unequal values under relative1e-10 statistics/absolute1e-12 P/R, no executed errors/warnings. WEIGHT-SAS is complete for these tested cases, including MEANS _FREQ_. fixtures/sas/weights-validation-v2-pass.json records provenance/outcomes. Original failure evidence preserved. App remains v0.4.18; no math changes. Main and update branch preserved. Earlier pending/partial notes below are historical.

Latest app v0.4.18 corrects weighted MEANS _FREQ_/N Obs source counts independently of analysis weight exclusions. Actual user SAS Results/Log received 2026-10-28 ran all15 groups: weighted GLM all10/81 records pass; MEANS all5 differed only in eleven _FREQ_ values, all requested statistics passed. Original kit preserved in fixtures/sas/weights-validation-v1-original.zip; structured provenance/results and frozen confirmed expectations in weights-validation-v1.json. Corrected local replay passes recorded counts; regenerated kit requires fresh SAS rerun, not yet a full weighted MEANS SAS pass. Read docs/validation/weights-sas-2026-10-28.md and VALIDATION-STATUS. Full npm test and both Chromium browser builds passed, including exported Python/Node packages. Stable update branch and main preserved. Earlier notes historical.

# SASita project status

## Sassy v0.4.17: automatic incremental assistance across supported procedures

Same update branch feature/editor-dataset-completion. A shared header/catalog mechanism covers MEANS, SORT, GLM, SGPLOT, SGPIE, PRINT, SURVEYSELECT, IMPORT and EXPORT. It offers unused header options, source datasets, enum/sample values, typed source fields, MODEL/plot/output pieces and PRINT ranges. Singletons/aliases/listed fields/statistics and basic future-statement duplication are suppressed. Metadata-only source inference is reused. Free-form values remain editable. Automatic fragment menus preserve plain Enter as newline until arrow navigation; Tab/mouse accept and may chain to the next slot. Existing dots and ?? whole-line menus remain. Unknown/macro/unloaded/advanced syntax is conservative, not a full compiler.

Validation: full npm test; pure checks for all nine procedures, types, aliases, middle-of-line/future edits, comments/strings, bounds and no observation access. Programs assembled from fragments execute all nine procedures, including scoped CSV adapters. Modular/standalone Chromium exercises all nine headers, chained MEANS DATA/VAR/OUTPUT choices, duplicate/character-field suppression, Enter behavior, existing metadata/??/history/file/chart checks and actual exported Node/Python ZIPs. Popup visually inspected. Archives verified. Engine statistics and deferred SAS validation remain unchanged; main/prior tags preserved.


## Sassy v0.4.16: small in-context procedure starters

Continuing on feature/editor-dataset-completion, so the user's local checkout can update via Fetch/Pull. Type ?? at a new statement boundary within MEANS, SORT, GLM or SGPLOT for a short supported-line menu. Existing popup/keys are reused; selecting replaces ?? and highlights the first placeholder. Prefix filtering (??cl/??out), used-singleton suppression and basic GLM/SGPLOT order rules keep it small. MEANS OUTPUT offers common/all supported statistics; non-DF headers omit STDERR. SORT uses valid BY DESCENDING syntax. The data catalog lives beside syntax-help, with no runtime/compiler changes or new dependencies.

Validation: full npm test plus context/comment/string/INPUT-modifier/boundary/order/indentation checks. Every filled starter executed against the interpreter. Modular/standalone browser checks cover menus, placeholder selection, metadata completion inside inserted VAR, resulting MEANS/SORT execution, and existing regressions/exported wrappers. Popup visually reviewed; app/wrapper archives verified. Weighted SAS and other pending tests remain unchanged in VALIDATION-STATUS.md. Main and earlier tags preserved.


## Sassy v0.4.15: metadata completion and persistent validation checklist

Branch feature/editor-dataset-completion implements dot-triggered editor suggestions: WORK/known library member names insert after the library dot; variable shortcuts such as temp.pa or work.claims.pa replace the entire qualifier with a bare variable. Simple DATA SET/MERGE output schemas are inferred from metadata before execution, with bounded KEEP/DROP/RENAME/assignment handling. Suggestions are filtered, keyboard/mouse selectable, dismissed by Escape, and limited to 200 matches / programs up to 100k characters. Existing Tab indentation and Ctrl+Space help remain. Strings/comments/macros/unknown schemas are guarded; no observations/files are read and no code runs for completion. Runtime SAS syntax and calculations are unchanged.

VALIDATION-STATUS.md now records outstanding and completed reference/manual tests. AGENTS/START-HERE direct future sessions to it, especially for questions about pending tests. WEIGHT-SAS is explicitly deferred at the user's request; this editor release does not turn local weighted tests into actual SAS certification. The ledger and completion guide are included in the app ZIP.

Validation: full npm test, new pure metadata/replacement/inference/comment/string/macro/bounds tests (including an observation-access trap), and both browser builds for WORK/native variables, unrun targets, Tab/arrows/Enter/Escape/mouse, dirty state and execution of resulting SAS. Browser-exported Node/Python packages and previous statistical/file/chart/history checks pass. Archives/source fidelity verified. Inference is lightweight rather than a full SAS compiler; unsupported schema transformations need loaded runtime metadata. Main and prior tags preserved.


## Sassy v0.4.14: WEIGHT in MEANS and GLM

Branch feature/weighted-means-glm adds WEIGHT with numeric noninteger weights, preserving SAS procedure-specific inclusion. MEANS excludes missing weights, includes zero/clipped-negative counts unless EXCLNPWGT, adds SUMWGT, VARDEF=DF/N/WDF/WEIGHT/WGT and weighted moments/standard errors. Existing CLASS/BY/totals/output paths remain. GLM uses positive complete observations, weighted mean/SS and normalized weighted QR, count-based DF and weighted Type I/III/SOLUTION. Scaling all weights preserves coefficients/SE/F. Rank/complete-cell/resource bounds remain. FREQ and complex-survey inference remain deferred.

Validation passed: full npm test including independent NumPy/SciPy 33-row weighted CLASS/covariate/interactions reference, Type I/III/predictions, scale invariance, documented MEANS eligibility/counts/divisors/missingness and unweighted actual SAS fixtures. Both browser builds, portable Python/Node and actual browser-export ZIPs pass the weighted example. Twelve examples included; new fifteen-group self-contained weighted SAS kit needs no CSV/path setup. Actual weighted SAS run is pending, including prediction behavior for excluded weights and fit statistics; no statistical/metadata/bit certification beyond tested evidence. Main and earlier milestones preserved.


## Sassy v0.4.13: explicit PROC PRINT

Branch feature/proc-print adds observation reporting via DATA=table(OBS=10 FIRSTOBS=1), VAR, NOOBS, inherited formats and TITLE. Reports preserve original observation indices and independent small snapshots; NOOBS hides the number column. Source datasets remain untouched and no PRINT dataset is written. Native library reads and portable report models use the existing interpreter. Limits are 1,000 observations / 100,000 cells; larger unrestricted requests fail with guidance. WHERE/BY/ID/SUM/LABEL/FORMAT and other options remain unsupported. Eleventh example and ninth procedure syntax entry included. WEIGHT remains deferred in both MEANS/GLM as a separate statistical change.

Validation: full npm test passes including new range/column/empty-range/title/format/native/snapshot/no-write/limit checks and all actual statistical fixtures. Browser checks verify FIRSTOBS numbering, VAR order and NOOBS in both builds; portable Python/Node and actual browser-export ZIPs include PRINT. App/wrapper ZIP CRC/manifests verified. No fresh SAS PRINT runtime/layout certification. Main and prior tags preserved.


## Sassy v0.4.12: reports/charts only in session Output

Branch feature/report-only-output removes automatic dataset observation snapshots from output history. DATA/SORT results, GLM input/prediction tables and ODS-created tables remain in WORK/native libraries; viewing/exporting requires explicit sidebar selection. Only procedure reports/charts accumulate in history. GLM's six reports remain; its six written datasets no longer create six extra history entries. DATA-only runs return to Program and leave report history intact. A replaced WORK dataset has current contents only; users must explicitly save/export observations they want to retain. The paged dataset viewer still renders 50 rows at a time.

Validation passed: full npm test; modular and standalone Chromium including GLM report-only entries and retained datasets, a 50,000-row DATA-only run with unchanged report history and explicit 50-row viewing, immutable PROC MEANS report history, clear controls, failed-run rollback, CSV exports, native library reopening and actual browser-exported Python/Node packages. No statistical engine changes. The new app ZIP includes the corrected GLM helper already validated in SAS (ten groups / 89 records under documented tolerances). App/wrapper archives verified. Main and earlier tags preserved.


## GLM validation revision 2: all ten SAS comparisons pass

Branch test/sas-glm-validation-pass preserves the user's actual revision-2 Results and Log evidence via SHA256 hashes and parsed summaries in fixtures/sas/glm-validation-v2-pass.json. All ten comparisons ran: OverallANOVA, Type I/III ModelANOVA, ParameterEstimates, FitStatistics and P/R output for both the seven-row and 33-row ANCOVA models. All 89 matched records have zero compared values unequal under the stated tolerances. SAS log has no ERROR or WARNING lines and confirms CV mappings for both fit checks. Largest statistical relative criterion is 9.6233e-14 (criterion 1e-10); P/R use absolute 1e-12. The previously unmatched interaction rows and absent fit checks are now included.

This validates numeric results for these two supported models, using the explicitly documented label/special-missing/CV mappings. It does not certify original app ODS descriptors, special missing codes, numeric Biased metadata, interaction-label parity or bit identity. No app calculations were changed to obtain this pass. App v0.4.11, validation tag glm-validation-v2, main and previous tags remain intact. Earlier pending notes below are historical.

## GLM comparison log received; helper revision 2

Branch fix/glm-validation-kit: the uploaded log explicitly reports missing coeffvar in both SAS FitStatistics tables. Thus both missing comparisons were stopped by the guard, not statistical failures. The log does not expose the replacement column name. Revised helper maps CV to coeffvar if present and otherwise fails visibly with PROC CONTENTS. It also maps A*X to X*A in the fixture keys, normalizes special numeric missing codes for value checks, and uses absolute 1e-12 for the modest-scale prediction/residual fixtures while other statistics retain relative 1e-10. Original SAS tables and embedded expected numbers are not altered; no app/engine label or metadata parity claim. Both parameter and fit descriptors are now printed. Models and expected CSVs remain unchanged.

Regenerated standalone examples/glm-validation/glm-validation.zip, saved as tag glm-validation-v2. Existing GLM regressions/reference checks and ZIP integrity pass locally. The revised SAS-only helper still needs execution in SAS; local generation checks are not SAS execution. The app package/tag v0.4.11 still contains the original kit, so use the separate revision-2 ZIP. Main remains unchanged.

## Actual two-model SAS GLM comparison received

On test/sas-glm-two-models, the actual uploaded comparison Results confirm full-precision agreement at relative 1e-10 for all six published effect-test rows and nine parameter rows, eight matched ANCOVA test rows, 13 matched ANCOVA parameter rows and all 33 ANCOVA prediction/residual rows. Largest reported relative difference criterion among these groups is 3.2567e-13. This is not an unconditional pass: two ANCOVA test rows and three parameter rows do not match keys because SAS names the mixed interaction X*A while Sassy uses A*X. Both OverallANOVA comparisons have five `._` versus `.` special-missing differences. Published residual id=7 is 3.553e-15 in SAS versus zero in Sassy and fails the purely relative criterion near zero. Both FitStatistics PROC COMPARE groups are absent; the log is needed to diagnose them. CONTENTS also shows SAS Biased is numeric, whereas the app currently uses character B flags. Labels/attributes/metadata are not fully compatible.

fixtures/sas/glm-two-model-comparison.json preserves actual printed GLM tables, eight PROC COMPARE summaries and original upload SHA256 without importing unrelated host/user metadata. scripts/check-glm-two-model-reference.mjs verifies 172 printed numeric cells, 46 missing cells and 25 displayed B flags, explicitly mapping the five mixed-label mismatches for numeric checking only. Printed fit values agree, but that does not establish the absent full-precision fit comparison. No source/runtime/package edits yet; v0.4.11 and main remain unchanged. Next: obtain SAS log, align mixed interaction labels, repair the comparison helper for special missing/near-zero tolerances, and investigate fit output fields before regenerating the kit.

## Actual SAS GLM seven-row results received

On branch test/sas-glm-reference, the uploaded 10-glm log/results establish a clean actual SAS run of the catalog example. Automated comparison against current Sassy checks 69 numeric cells at printed precision, 20 missing cells and nine B flags: all match. Type I/III, overall ANOVA, SOLUTION, fit statistics, CLASS levels and observation counts agree. The SAS singular-matrix note is expected for redundant CLASS indicators. Output row/column counts match; the seven scored values themselves are not displayed. This upload is not a run of the two-model comparison kit. Full-precision values, ANCOVA and exact ODS metadata remain pending. Original file hashes/printed tables are in fixtures/sas/glm-seven-row-printed.json and are checked by scripts/check-glm-reference.mjs via test-glm. No runtime/app package change; v0.4.11 and main remain unchanged.

## Sassy v0.4.11: first fixed-effects PROC GLM

Branch feature/sassy-glm implements one-response OLS with CLASS, hierarchical crossed interactions through degree three, Type I sequential and Type III block tests, MODEL / SOLUTION, predicted/residual outputs and six scoped ODS OUTPUT names. The tenth catalog example reproduces the published unbalanced two-factor SAS example. See docs/glm.md for exact boundaries and output fields. Empty interaction cells, nonhierarchical categorical interactions and additional rank deficiency fail explicitly; random/repeated effects and broad PROC GLM syntax remain deferred.

Validation: complete npm test and modular/standalone Chromium checks passed, including actual browser-export ZIP execution through Python/Node. Published SAS SS and F tests agree to displayed precision; independent NumPy/SciPy checks cover an unbalanced 33-row CLASS/covariate/interactions model and F/t distributions. SOLUTION, formatted levels, missing-response prediction, native output and failed-run rollback are checked. The actual seven-row SAS run now passes at printed precision (see above). Full-precision two-model comparison and exact ODS metadata parity remain pending; no bit-identical guarantee. examples/glm-validation/glm-validation.zip embeds Sassy expected values in one SAS-only program without folder edits/CSV imports. Main and all earlier tags are preserved.


## Sassy v0.4.10: cached NORMAL pairs integrated

Branch feature/sassy-normal-cache changes RAND NORMAL to return x and cache the unscaled y value from each accepted polar pair. UNIFORM and ignored reinitialization calls preserve the cache; each NORMAL call applies its own mean/sigma, and each DATA step starts fresh. Normal and mixed sequences intentionally change from v0.4.9. Default/MT32 uniform-only streams and SURVEYSELECT remain unchanged. Updated syntax help, reference catalogs, random/deployment docs and an included demo-project/normal-demo.sas explain scope and the migration.

Full npm test passed with new test-normal.mjs: all 52 printed SAS normals agree (38 bit-identical, max absolute difference 4.440892098500626e-16), all 28 uniform witnesses exact, including post-512 positions; parameter scaling, intervening uniform/reinitialization and new-step reset checks pass. SAS probe's full 512 candidate comparisons per context remain separate evidence; the direct app test does not claim access to every unprinted SAS value. Portable Python/Node and modular/standalone Chromium checks execute all four contexts and validate the same references, including packages actually exported from the browser. All prior sampling/MEANS/charts/folders/editor/history tests pass. App/wrapper ZIP integrity and source fidelity are checked. Normal last-bit equivalence, broader seeds/parameters/tails and Windows OS-dialog checks remain outside certification. Main and earlier tags remain unchanged.

## NORMAL probe received: paired polar method with caching

User's clean SAS log/results identify polar_pair_x as the matching candidate: 512/512 normals within tolerance in each default/MT32 normal/mixed context; exact normal counts 413/417/440/442, max absolute difference 7.6328e-16. All subsequent uniform checks match exactly (normal-only tail 1/1, mixed 512/512). Current app's uncached polar_x diverges after the first value. Independent JavaScript paired-polar research prototype checks all 52 printed normal hex values: 38 exact, all within tolerance, max absolute error 4.4409e-16; all 28 uniform witnesses exact. Evidence/limits: docs/validation/normal-generation-results.md; fixture: fixtures/sas/normal-method-probe.json; run node scripts/check-normal-reference.mjs. The research does not change the app: pair caching/integration, full JavaScript fixtures and broader parameter/seed/tail checks remain future work. Main/v0.4.9 unchanged; prior pending notes are historical.

## NORMAL generation research (app unchanged)

Branch research/sas-normal-generation reads the user's modern functions manual and official RAND reference. Legacy RANNOR/CALL RANNOR explicitly use Box–Muller; inspected modern RAND NORMAL docs identify the distribution but not the named transform. Do not assume the legacy method or claim Ziggurat without evidence. examples/normal-investigation/normal-method-probe.zip contains a SAS-only experiment comparing ten inverse-CDF/trig Box–Muller/polar variants (cached/discarded pairs), default/MT32 and normal-only/mixed contexts, 512 normals each. It reports exact HEX/tolerance matches and subsequent uniform-stream witnesses; no input files or CSV downloads needed. Actual SAS results are pending. docs/validation/normal-generation-research.md records sources and limits. Sassy v0.4.9, main and existing tags are unchanged.

## Sassy v0.4.9: SURVEYSELECT and default RAND integrated

Branch feature/sassy-surveyselect adds the bounded equal-probability PROC SURVEYSELECT runtime: SRS/Floyd, URS hits/expanded OUTHITS, SYS fractional N/n, sorted unformatted numeric/character/missing STRATA, automatic seeds from one main seed, STRATUMSEED=NONE, scalar N/SAMPSIZE or SRS/URS RATE/SAMPRATE, unstratified REPS, STATS/OUTSIZE/OUTSEED/NOPRINT. Output types/order/source descriptors are preserved; JSON library reads/staged writes, worker execution, Output report history and portable engine include the procedure. A ninth self-contained example and contextual syntax entry are included. Full options, bounds and unsupported designs: docs/surveyselect.md.

RAND now accepts CALL STREAMINIT(seed) and explicit MTHYBRID/MT1998/MT32/MT2002; absent initialization/nonpositive seeds choose/log an automatic seed. Default older initialization reproduces the 400-value SAS uniform fixture; explicit MT32's 40,000-value fixture remains exact. Hybrid exceptional seeds select the 2002 initialization but lack actual SAS fixture checks. NORMAL remains the existing polar approximation, not SAS sequence-identical. docs/random-numbers.md distinguishes seed choice, generator initialization and distribution transforms; prior explicit-only documentation is updated. docs/procedure-support.md lists implementation and browser/Node/Python-wrapper deployment limits for all seven supported procedures, and is included in the app ZIP.

Verification: full npm test passed, including actual integrated comparisons for all twelve SAS CSV sampling outputs (schema, IDs/hits/seeds/order/probabilities and decimal-tolerant weights), all 35 focused automatic-stratum rows, both 400-value RNG hex streams, native outputs, character/missing strata, invalid options/bounds and portable ZIP execution. Chromium modular and standalone checks passed: example execution, reports, sampled CSV IDs/fifth seed, unsupported-option rollback and actual browser ZIP exported to Python/Node. All prior MEANS/charts/folders/editor/history checks passed. Main and earlier versions remain unchanged. Broader seed/hybrid/legacy/replicated-stratum semantics, Windows OS dialogs and exact SAS graphical/report layouts remain outside reference certification.

## Automatic stratum seed probe passed

The user returned clean five-stratum probe results/log. SAS chose fifth seed 1841400341, rejecting scale 2^31 and confirming floor(U*(2^31-1)) for these cases. A separate master stream initialized from the main seed supplies seeds for strata 2 onward; stratum 1 retains the main seed. All 35 observed rows match automatic seed derivation and selection in JavaScript, including a second main seed 24680, sample sizes 1/2, and SRS/SYS. No saved InitialSeed is used as algorithm input. Original twelve-case checks still pass. Fixture provenance/rows: fixtures/sas/surveyselect-9.4m8/stratum-seed-probe.json; evidence/limits: docs/validation/surveyselect-stratum-seeds.md. The requested seed ambiguity is resolved for these reference cases. App integration and broader seed/legacy/replicated-strata semantics remain separate work; older pending notes below are superseded. Main/app unchanged.

## Automatic stratum seeds: candidate derivation and focused probe

The investigation now generates all four recorded stratum seeds from the single main seed 12345 and independently reproduces the default stratified SRS/SYS selections. A separate master stream supplies seeds after stratum 1. Two conversions, floor(U*2^31) and floor(U*(2^31-1)), fit every existing seed but diverge at stratum 5 (1841400342 vs 1841400341). Thus the exact rule is not resolved. examples/surveyselect-validation/stratum-seed-probe.zip contains a self-contained SAS program testing five strata, two sample sizes, SRS/SYS and main seed 24680; no external CSV or folder setup is needed. Actual probe results remain pending. User explicitly prioritizes resolving this gap before app integration.

## SURVEYSELECT exports received: twelve-case JavaScript replay

All 15 unmodified CSVs and export-result/log hashes are stored in fixtures/sas/surveyselect-9.4m8. The corrected export ran successfully. scripts/check-surveyselect-reference.mjs independently generates both explicit MT32 and candidate older-initialization default streams, matching 400/400 HEX16 values for each. It reproduces selected IDs/hits/order/replicates for all twelve cases; default stratified replay uses SAS-provided InitialSeed columns, not a claimed automatic seed algorithm. Observed expansion retains total NumberHits on each repeated row. Actual Sassy PROC SURVEYSELECT parser/runtime is not integrated. Broader hybrid/seed/boundary/stratum semantics and schema support remain work. Evidence/limits: docs/validation/surveyselect-exported-reference.md. Main/app v0.4.8 unchanged; earlier pending export notes below are superseded.

## SURVEYSELECT initial SAS run: export-helper correction

Uploaded log/results confirm all twelve sampling cases ran in SAS 9.4 M8/SAS/STAT 15.3, explicit MT32 matches all 400 Sassy hex values, default RAND differs in all 400, and collapsed NumberHits matches OUTHITS counts for 17 selected units/40 draws. This is not a Sassy SURVEYSELECT sample match. The final helper failed because SAVE is a reserved macro name; no print/export steps executed. It now uses sassy_export_reference, and a generated 02-export-existing-reference.sas helper exports the already-created WORK tables without repeating sampling. Corrected ZIP/member hashes are checked locally; new SAS export execution and selected-ID evidence remain pending. See docs/validation/surveyselect-initial-run.md. App/main/milestones unchanged.

## SURVEYSELECT reference collection and successful MEANS comparison

Branch test/surveyselect-reference-kit prepares a SAS-only investigation ZIP in examples/surveyselect-validation. Twelve sampling cases exercise SRS, a second seed, sample rate/census, collapsed and expanded URS, replicates, integer/fractional SYS, and default/single-stream stratified selection. Two RAND probes distinguish explicit MT32 from default RAND. The actual Sassy engine's first 400 uniform HEX16 values are checked against the existing SAS fixture and packaged for direct comparison. No SURVEYSELECT runtime has been added; actual execution of this new SAS program is pending. Modern SAS 9.4 is the target, not the historical PDF's RANUNI default. ZIP manifests/member bytes/CRC are checked locally. Main and v0.4.8 remain unchanged.

The user's corrected MEANS report now validates all six datasets at relative criterion 1e-12: no unequal compared values, 17 non-bit-identical values, maximum relative criterion 2.5879e-16. NWAY and the large-offset test are exactly equal. Detailed evidence and limits: docs/validation/means-successful-comparison.md. Earlier pending/aborted-run notes below describe the history and are superseded for these six numeric tests.

## Sassy v0.4.8: PROC MEANS AUTONAME correction

User-supplied initial SAS logs confirm all six base datasets have the same dimensions as Sassy, with clean 01 execution. Original 02 guessed all numeric CSV columns as character and aborted comparisons; first compare also failed because SAS lacks AMOUNT_STD/OTHER_STD. STD AUTONAME uses the canonical StdDev suffix. Branch fix/sassy-means-autoname changes generated STD/STDDEV names to *_stddev, preserves explicit names, tests repeated *_stddev2 requests, updates fixture headers and bundles the typed SAS helper (plus first-table PROC CONTENTS). Numeric CSV values are unchanged. Evidence hashes and exact diagnostic summary: docs/validation/means-initial-logs.md. Actual numerical comparison remains pending.

Validation: full baseline npm test and modular/standalone Chromium checks, including returned Python/Node tables, example execution and canonical header checks. App and portable ZIPs are rebuilt with the corrected runtime; corrected comparison ZIP contains six CSVs and the typed helper. Main and earlier tags/branches remain unchanged.


## Initial PROC MEANS SAS report: typed-import correction

User-uploaded October 10 report contains five dataset summaries with matching row counts (14, 6, 5, 3, 1), but numeric-column type conflicts (6, 5, 4, 5, 7) and no value comparisons. The first comparison section is empty. This does not validate the calculations. Evidence/hash are in docs/validation/means-initial-comparison.md. Branch fix/means-sas-comparison-types replaces the SAS-only test importer with schema-generated explicit LENGTH/INFILE DSD/INPUT, preserving the six app CSVs unchanged and adding table titles. Corrected harness ZIP is available on that branch; v0.4.7 app ZIP/tag remains the existing milestone. Actual corrected SAS run and log remain pending; main and prior milestones unchanged.


## Sassy v0.4.7: PROC MEANS and example catalog

Branch feature/sassy-proc-means adds 13 unweighted descriptive statistics, numeric VAR, sorted BY, formatted CLASS grouping, default all-type totals/subtotals, NWAY, MISSING, NOPRINT, DF/N variance, MAXDEC, named OUTPUT statements and AUTONAME. Saved datasets preserve _TYPE_ bit order, _FREQ_, blank/missing inactive classes, per-variable N/NMISS, and five _STAT_ rows when OUTPUT requests are omitted. Displayed reports show full combinations and append to session Output. Native library staging and portable runtime include the new procedure. docs/means.md defines boundaries and SAS 9.2 PDF provenance; no actual new SAS reference results have been received.

Eight previewable/downloadable examples in a compact header dialog cover DATA/SORT/MERGE, uniform MT32, five charts, MEANS total/NWAY/default outputs, macros, project CSV, JSON libraries and formats. Opening never runs and prompts before replacing unsaved edits. Source .sas files generate the embedded example catalog. Six deterministic result CSVs and SAS-only PROC COMPARE helper are packaged in examples/means-validation/means-validation.zip and included in the app ZIP.

Validation passed: npm test including new hand-derived CLASS/type/frequency/missingness/statistics/large-offset/singleton/formatted-group/BY/native/example checks; portable ZIP-to-Python MEANS execution/report checks; modular and standalone Chromium for example opening/no-auto-run, 12-row two-CLASS saved structure, exact counts and all existing charts/folders/history/export checks. Table screenshot inspected. Remaining SAS runtime comparison, Windows/locale validation and unsupported advanced statistics/options are explicit in docs/means.md. Main/v1.0 and v0.4.5/v0.4.6 milestones remain unchanged.


## Sassy v0.4.6: portable wrapper proof of concept

Branch feature/sassy-portable-wrapper adds a small Code & export control in the upper-right project file box. Its read-only modal shows current SAS, Node/Python runners and exact build-snapshotted runtime modules. The exported ZIP includes current WORK native table snapshots, unchanged program.sas, remembered bindings/title, runtime and runners. This remains an interpreter, not generated JavaScript per program. External project files are intentionally not copied; --project selects the actual data folder. Default project library folders are empty. Chart models are returned, not rendered PNGs. The app stays one offline HTML (~95 KB added); the optional local runner needs Node.js 24+, and Python is optional.

Validation: npm test passed with new source/ZIP CRC/Node/Python/RAND/signed-zero/library/CSV/chart/rollback/preflight/symlink checks. Modular and standalone Chromium checks export the actual ZIP, compare visible source byte-for-byte, extract and execute the Python wrapper, and verify output rows. Existing editor/history/charts/library/files checks also passed; modal screenshot inspected. docs/portable-demo.md records precise snapshot semantics, limits and filesystem scope; OS-specific Windows validation and multiuser/concurrent filesystem hardening are not claimed. Main/v1.0 unchanged; v0.4.5 tag and snapshot branch point at b30711e.


## Sassy v0.4.5: contextual syntax guide

Branch feature/sassy-context-help adds an initially collapsed right-side Program syntax guide. Cursor scanning ignores comments/strings, tracks procedure boundaries and nested function calls, and supports a searchable catalog of all five procedures, 35 DATA step functions, 20 format families and six statement/macro references (66 entries). Manual browsing pauses cursor following; a checkbox resumes it. Ctrl+Space opens help; Tab keeps indentation. Templates insert only at the current selection/caret, mark edits unsaved, preserve surrounding code and never execute. Formats are reference-only. No AI/network/runtime dependency; modular catalog embedded in standalone HTML adds about 24 KB (1.6%).

Validation: npm test passed, including catalog/engine function coverage, runnable function examples, comments/quotes/nested calls and procedure/caret boundaries. Chromium browser checks passed in modular and standalone builds for live function tracking, PROC SORT options, catalog search/browse, non-destructive template insertion, dirty-state tracking, collapse/full-width restoration, and existing charts/libraries/files/calculation examples. Screenshot inspected. Scanner is tolerant source guidance rather than a complete SAS parser; macro-generated/incomplete contexts may need manual browsing. No engine semantics changed. Main and v1.0 remain unchanged.


## Sassy v0.4.4: offline Chart.js plotting

Branch feature/sassy-chartjs-plots adds bounded PROC SGPLOT SCATTER/HBAR/VBAR/HISTOGRAM and PROC SGPIE PIE, TITLE/reset, axis labels, scatter/bar grouping, bar/pie FREQ/SUM/MEAN, grouped stack/cluster layouts, histogram counts/percent/proportion and explicit/automatic bins. Sources can be WORK or named JSON libraries; macros expand before parsing. Unsupported options, overlays and PROC PLOT fail clearly. docs/charts.md and in-app Help define the implemented subset and non-SAS-exact defaults.

Chart.js 4.5.1 was vendored from the verified npm release with MIT attribution; its UMD renderer is embedded directly in the standalone HTML. No CDN/internet dependency was introduced. Pure chart models are prepared in the worker, capture values at procedure execution, and append to session Output after successful final table snapshots. Output history can select prior plots after dataset replacement. Canvas instances are destroyed on table selection/clear, and PNG downloads include the title and white background. Titles commit across runs only on success. Programmatic CSV/native writes retain staging/preflight/partial-write safeguards.

Bounds: 20 charts/100,000 plotted values per run, 20,000 scatter points, 200 categories, 50 groups, 1–100 explicit histogram bins; output history shares the 100-entry/250,000-row-or-point cap. Missing/nonfinite observations are omitted and counted. Pie totals must be positive/nonnegative and finite, and overflowing ranges/statistics fail clearly. Histograms use defined bounded Sturges bins rather than SAS's exact default algorithm; means use online double arithmetic. Source formats do not currently alter chart ticks/tooltips. No new SAS runtime graph/statistics comparison or SGPLOT manual fixture has been supplied.

Validation passed: npm test, including new chart grouping/statistics/bin-edge/missing/title/macro/native-library/snapshot/bounds/rollback checks and all existing numeric fixtures; npm run test:browser -- --validation --large-numbers --screenshots in modular and standalone Chromium for all five rendered chart types, histogram totals, PNG bytes, history snapshots, Clear/instance cleanup, failed-chart rollback, library reads/writes and the full calculation CSV suites. A final focused browser run verifies titled PNG export dimensions. The desktop chart screenshot and titled PNG were inspected. charts-demo.sas generates all five plots without a project folder; ZIP/license/member checksums are verified. Cloud file://, Windows OS dialogs and hosted CI remain outside this local validation. Download dist/Sassy-v0.4.4.zip. Main and v1.0 remain unchanged.


## Sassy v0.4.3: native JSON libraries and SPI logo

Branch feature/sassy-json-libraries adds LIBNAME bindings for existing relative project subfolders (or '.' for the project root), session-persistent bindings/CLEAR, permanent DATA and PROC SORT targets, named-library CSV import/export, and sidebar discovery/refresh/open. One-level/WORK datasets remain temporary. Changing/disconnecting a project clears bindings. Reopening the app requires reassignment; disk tables remain. Permanent PROC IMPORT requires REPLACE; native DATA/SORT targets replace on success. Libraries cannot be reassigned/cleared after writing through them in one run.

Native .sassy-table.json files have a version marker, ordered column descriptors and ordinary row objects. Codecs validate names, types, supported formats, character lengths, row shape, finite numeric values, version and file bounds. Finite doubles including signed zero round-trip exactly in JavaScript. The engine now carries declared character-length metadata through input selection/rename, SET/MERGE and SORT and enforces inherited lengths on assignments. This is a bounded descriptor subset, not full SAS descriptor semantics. See docs/native-tables.md and its included machine-readable JSON Schema.

First library reads per run refresh from disk; same-run reads see staged writes, including shared-folder aliases. Repeated native writes save the final version; ambiguous case-colliding paths fail. CSV/native exports share staging, all-target preflight, 20 MB/file and 50 MB/run bounds; partial disk failures remain explicitly non-atomic. WORK and library bindings commit after saves. The offline build includes the codec. The SPI header uses an image_gen-prepared adaptation of the supplied logo, embedded in the HTML; provenance is in dist/spi-logo-provenance.md.

Validation passed: npm test, with new native-schema/finite-double/alias/replacement/reload/CLEAR/rollback/library-demo checks and the prior 40,000-draw SAS fixture; npm run test:browser -- --validation --large-numbers --screenshots for modular and standalone builds. Browser checks cover actual sandbox native writes, metadata, later-run and reopened-session reads, library discovery, rendered logo, failed-run disk preservation, and prior full CSV validation suites. The desktop screenshot was inspected. Latest packaged library demo writes and reloads six formatted observations; ZIP member checksums are verified. No fresh SAS-runtime comparison was performed for LIBNAME or inherited character-length semantics. OS picker dialogs and cloud-blocked file:// remain manual checks. Download dist/Sassy-v0.4.3.zip. Main and v1.0 are unchanged.


## Sassy v0.4.2: more editor space

Branch feature/sassy-compact-header moves the program/project file box into the upper-right brand header and puts Supported syntax inside it. The separate full-width toolbar row is gone; the editor gains about 70 pixels at a 1400×900 desktop viewport. The brand and favicon use temporary SPI text because the actual SPI logo asset is not available in the checkout. Replace this placeholder when supplied; do not invent the graphic.

Validation: npm test passes. Modular and standalone Chromium checks pass for tab visibility, editor dimensions, help placement, rolling histories, prior snapshot preservation, all ten regression programs, program open/save, folder streams and persistence, import/export and failed-run rollback. The desktop screenshot was visually inspected. The ZIP and member checksums are verified. OS picker dialogs and cloud-blocked file:// navigation remain manual checks. Main and v1.0 are unchanged.

LIBNAME is not implemented in this release. docs/library-storage-proposal.md records the requested design discussion: versioned native .sassy-table.json files preserving rows and descriptors, scoped folder libraries, temporary WORK, CSV interchange, and required replacement/validation semantics. SAS7BDAT is not the recommended first implementation. Storage decisions remain for discussion before that feature is built.


## Sassy v0.4.1: compact tabbed workspace

Branch `feature/sassy-tabbed-workspace` builds on v0.4.0. The app is now Sassy, with a compact filename/file toolbar, Run beside program controls, full-size Program/Output/Log panes, and WORK datasets kept at the left. Introductory, example-loading, browser/offline-download chrome has been removed. Supported syntax and macro-expanded source remain available. A fresh editor starts blank; recovered drafts are never executed automatically.

Log entries append across runs and file actions. Output keeps final successful-run dataset snapshots with a run/program selector; replacing WORK datasets does not replace earlier snapshots. Independent Clear buttons preserve WORK. Histories reset on reload and have documented memory bounds. Dataset selection opens Output, successful Run opens Output, errors open Log.

PrismJS 1.30.0 SAS syntax coloring is vendored from the verified npm release, with MIT attribution included in the generated HTML and ZIP. No network request or runtime dependency is required. Large programs fall back to plain coloring. Syntax coloring does not imply additional engine support. See docs/app-guide.md and dist/vendor/README.md. Download: dist/Sassy-v0.4.1.zip. Main and v1.0 remain unchanged.

Validation passed: npm test and npm run test:browser -- --validation --large-numbers --screenshots, for both modular and standalone builds. Browser checks cover tab visibility, SAS token coloring and escaped HTML, accumulated histories, independent clears, prior snapshot preservation, all ten regression programs, full validation CSV exports, file open/save, directory streams, persisted folder handles, draft recovery, and failed-run rollback. The desktop Program pane was also visually inspected in a 1400×900 Chromium screenshot. The ZIP and member checksums are verified. The user reports the prior folder workflow works on their computer; browser/version details were not supplied. OS permission dialogs and cloud-blocked file:// navigation remain outside automated coverage.


## v0.4.0: program files and remembered project folders

Branch `feature/project-folder-program-files` adds New/Open/Save/Save As program controls, filename and unsaved status, keyboard saves, recovery drafts, project folder selection/browsing, IndexedDB directory-handle persistence and permission-aware reconnect, plus manual Save CSV to project and download fallbacks. Source and generated standalone HTML remain offline and browser-local. The new download is dist/SASita-v0.4.0.zip, containing the app and a ready-to-select demo-project folder.

The asynchronous worker adapter supports bounded FILENAME aliases and CSV PROC IMPORT/EXPORT with relative project paths, macros, GETNAMES=YES, GUESSINGROWS=MAX, and REPLACE. Absolute paths/URLs/parent traversal are rejected. Exports are staged until all computations succeed; all targets are preflighted, existing files require REPLACE, and individual disk writes follow. Partial write failures report possibly changed files and leave WORK uncommitted. Same-path imports can read a prior staged export. CSVs are capped at 20 MB each, aggregate program exports at 50 MB, project programs at 200 steps, and program files at 1 MB. Existing numeric/merge behavior is preserved.

Validation passed: npm test, including exact 40,000-draw SAS fixture and new file-program/project-adapter edge cases; npm run test:browser -- --validation --large-numbers for modular and standalone builds, all existing examples and full validation CSVs, program open/direct save, native browser sandbox directory streams, remembered handles, draft recovery, overwrite refusal, and failed-run no-write behavior. Packaged demo produces six reviewed rows and a prepared CSV; ZIP integrity and checksums are verified.

Real OS picker dialogs and Windows file:// folder access remain manual checks. Chromium tests substitute native browser sandbox handles for the OS picker and run the standalone HTML over HTTP, because cloud browser file:// navigation is blocked by policy. Unsupported browsers retain upload/download workflows. Permission persistence is browser-controlled and is never promised as permanent. Existing validation ZIPs preserve previous app milestones; use the new v0.4.0 ZIP for this workflow. Main and v1.0 are unchanged.


## Large-number SAS validation confirmed

The uploaded 05-sas-large-number-comparison-results.html confirms all 3,000 large-number rows pass both 1e-10 and 1e-15 SAS/app comparison thresholds. There are 761 nonexact values and a maximum criterion of 2.219e-16. All nine integer-boundary observations match exactly. Per-operation summaries show no missing results or threshold failures; multiplication, division, squares, square roots, cube roots, and mixed expressions have zero absolute difference. Cubes and fourth powers have small differences relative to their magnitude.

This actual SAS comparison complements the independent 100-digit reference. Cube roots via **(1/3) agree exactly with SAS for this program, while sharing the approximate-exponent accuracy limitation observed against mathematical reference values. Evidence and source checksum are recorded in docs/validation/large-number-sas-results.md on branch docs/large-number-sas-confirmed. This validation round is complete. The following sections preserve earlier milestones; no app/package changes or additional SAS reruns are required. Main and v1.0 remain unchanged.


## Large-number precision test

Branch `test/large-number-precision` adds a separate examples/large-numbers/large-number-tests.zip: unchanged standalone HTML, a portable 3,000-row large-number program, a SAS-only comparison helper, app CSVs, 100-digit independent decimal-reference report, and integer-boundary demonstration. Ordinary SAS and JavaScript calculations use double precision; this tests significant-digit error thresholds, not 15 fractional digits at arbitrary magnitudes.

All 24,000 computed values pass 1e-10 error versus 100-digit Decimal references on exact stored binary inputs. Seven operations pass 1e-15 on all cases; cube roots via **(1/3) exceed that tighter threshold on 2,028 cases, with maximum relative error 4.45287319e-15. Basic multiplication/division/squares/cubes/square roots max out around 1.1e-16. This does not certify all expressions, powers, overflow behavior or exact decimal input storage.

The new program and its two complete CSV exports pass modular and standalone Chromium checks using npm run test:browser -- --large-numbers. The generated SAS helper runs fresh references itself and reports absolute differences and precision threshold failures; the user needs only the two CSVs, helper, app_path, and one run. Actual SAS execution of the new test remains pending. Existing seed-12345 validation files and app runtime are unchanged; main and v1.0 are preserved.


## Final SAS confirmation: all seven comparisons pass

The final uploaded 03-sas-comparison-results.html confirms all 40,000 explicit MT32 seed-12345 uniform draws match exactly after the conversion fix. Integer summary, 40,000 merge observations, merge summary, and six shared-variable observations also match exactly. All 21 selected systematic numeric variables and 15 same-input random numeric variables pass relative tolerance 1e-12 across 20,000 rows each. Nonexact counts are 26 and 5,343 respectively, with maximum reported criteria 2.0648e-16 and 5.6717e-16. No conflicting column types remain.

Evidence, report checksum, implementation commit, and scope limits are recorded in docs/validation/sas-seed12345-results.md on branch docs/sas-validation-confirmed. This round is complete; no additional SAS run or app changes are required. Other seeds and normal sequences remain unverified. The following sections preserve earlier milestones and do not supersede this confirmation. Main and v1.0 remain untouched.


## Uniform MT32 conversion fixed against full SAS sequence

Branch `fix/mt32-sas-uniform-conversion` corrects the mapping from MT32 integers to uniform decimals. All 40,000 exact HEX16 values in the uploaded sas_mt32_inputs.csv match the app after changing (integer + 0.5)/2^32 to integer * 2.328306436538696e-10. All 40,000 underlying integers also agree. The exact constant is significant; rounding it to 1/2^32 changes bits.

The actual SAS CSV is preserved in fixtures/sas/mt32-seed12345.csv with its source SHA-256, provenance, and unknown SAS release recorded in the adjacent metadata JSON. A new mandatory npm regression test checks all 20,000 IDs/systematic inputs and 40,000 random bit patterns and recovered integers. The embedded offline worker also checks actual SAS bit patterns. Evidence applies to unbounded uniform draws with seed 12345 in the supplied run; other seeds, zero-integer endpoint behavior, bound transformations and normal bit sequences remain unverified against SAS.

The normal sampler uses the same corrected uniform conversion, so its app sequence changes too, without a claim of SAS normal equivalence. Source, Help, generated standalone HTML, and test-pack CSVs are refreshed together. Main and v1.0 are preserved. Validation passed: npm test (including the 40,000-draw SAS fixture and offline worker), analytic/CSV-schema pack checks, and npm run test:browser -- --validation for modular and standalone builds. Both full-sized programs complete within the worker timeout and browser exports match engine results. Updated archive checksums and HTML are verified. Windows file:// testing remains pending.


## Fresh SAS report: arithmetic passes; uniform RAND differs

Branch `test/sas-mt32-evidence` records the third uploaded report, `03-sas-comparison-results (2).html`. Fresh references remove the type conflicts. All 21 selected systematic numeric variables across 20,000 rows pass relative tolerance 1e-12 (26 nonexact values, maximum criterion 2.0648e-16). All five integer summary values, 40,000 merge rows, merge summary, and six shared-variable observations match exactly. Same-input random arithmetic passes all 15 selected variables across 20,000 rows (5,121 nonexact values, maximum criterion 2.2194e-16).

Both random input HEX columns differ on every row: 40,000 exact mismatches. The 100 printed pairs are saved with source hash/provenance in fixtures/sas/mt32-seed12345-printed.json. In those displayed draws, recovered MT32 integers match the app's core. Multiplication by 2.328306436538696e-10 reproduces all 100 SAS bit patterns; the app currently uses (integer + 0.5)/2^32. This diagnoses a candidate uniform conversion, not full-sequence or multi-seed SAS equivalence. No runtime change has been made; normal sequences remain unverified.

The SAS helper now additionally exports ORIGINAL SAS inputs as sas_mt32_inputs.csv, preserving exact HEX16 strings. It requires the same app_path and one run; full 40,000-draw export is pending. Pack/source checks pass and packaged app inputs/HTML are unchanged. Main and v1.0 remain untouched.


## SAS report: merge and same-input arithmetic verified

Branch `fix/sas-reference-isolation` records the second supplied SAS report, `03-sas-comparison-results (1).html`. All 40,000 merge rows, the merge summary, and six shared-variable rows compare exactly. All 15 selected numeric variables on 20,000 same-input observations pass relative tolerance 1e-12; 5,121 values are not exactly equal, maximum reported criterion 2.2194e-16.

MT32 parity, original systematic calculations, and missing-value summaries remain unresolved: the original numeric reference datasets have earlier timestamps and retain character columns from the first helper run. The current SAS-only helper rebuilds both reference programs automatically before comparison, then uses separate SAME_* datasets for imported-input computations. This also prevents contamination on repeated runs. Only app_path needs editing; run the third program alone. No app code or reference CSV changes.

Validation: the pack builder executes analytic checks, enforces embedded reference source consistency and CSV schema alignment, and verifies isolated computation results plus preservation of original datasets. The archive is regenerated with unchanged CSVs and HTML. This latest helper still needs execution in SAS. Main and v1.0 are preserved.


## SAS comparison import repair

Branch `fix/sas-comparison-imports` responds to the user's uploaded SAS HTML report. Numeric CSV values were imported as text (5/37/5 type conflicts for inputs/results/summary), so the report does not establish RAND or arithmetic compatibility. The final equal-values message follows 31 type conflicts, and merge reports are absent. No SAS pass is claimed.

The SAS-only helper now uses explicit BEST32 numeric fields, $16 HEX fields, DSD quoting, and CRLF input records, replacing PROC IMPORT guessing. It checks reference-dataset presence, file presence, and imported row counts before comparisons. The downloadable pack is refreshed; CSVs and application code are unchanged. Full SAS execution of the repaired helper remains pending.

## Calculation and merge comparison pack

Branch `test/numeric-merge-comparison` builds on the formats/RAND feature branch and adds `examples/validation/validation-pack.zip`: the standalone HTML, two portable SAS/app programs, six app-generated result CSVs with checksums, a guide, and a SAS-only PROC COMPARE helper. Main and v1.0 are preserved.

The arithmetic program uses 20,000 seeded MT32 uniform input pairs plus systematic inputs 1–20,000 and 20,001–40,000. It exercises arithmetic, powers, roots, SUM/MEAN/MIN/MAX, missing propagation, and exact integer summaries. The merge program checks 40,000 rows with duplicates, unmatched groups, held values, shared-variable precedence, and a reverse-exhaustion fixture. Unique output sequence IDs enable PROC COMPARE on duplicate BY keys.

Validation: `node scripts/build-validation-pack.mjs` checks all rows against analytic expectations, seeded reproducibility, and raw CSV round-trips. `npm test` passes. `npm run test:browser -- --validation` runs both full-sized programs in modular and standalone Linux Chromium, within the existing 8-second worker timeout, and verifies all six full CSV exports against engine outputs. `python3 scripts/package-validation.py` creates a reproducible archive with fixed member timestamps. No engine or app changes were required.

These CSVs are generated by the app, not SAS reference outputs. The SAS-only helper separates exact RAND input-bit checks, systematic arithmetic with relative tolerance 1e-12, exact integer and merge checks, and random arithmetic recomputed from imported app inputs. SAS runtime execution and Windows local-file testing remain pending. The same-input random check includes SAS decimal CSV parsing; it does not prove bit-identical numeric parsing.

## Current feature branch

feature/formats-conversions-rand adds common formats, INPUT/PUT, and explicit MT32 RAND (uniform/normal), plus three examples. Main and v1.0 are unchanged. See docs/formats-conversions-rand.md for exact scope, reference pages, checks, and unresolved SAS bit equivalence. The source modules and generated HTML are saved together. No third-party browser dependencies were added.

Validation: npm test and npm run test:browser pass, including all ten examples in modular and standalone builds, reference dialog, CSV import/export, and failed-run rollback. The MT32 integer core matches 60,000 independently generated values. Format/conversion assertions include supplied-manual examples. The narrow SAS comparisons and remaining RAND parity gap are recorded above. The RAND-specific fixture/checker is prepared for a reference run. Windows file:// verification remains outstanding.

## Purpose

A standalone HTML application for entering a practical SAS-style subset and processing datasets in the browser. Preserve local computation and offline single-file delivery. The source modules and interpreter are the supplied DATA Step Lab v0.2.0 baseline; the baseline setup preserved its language behavior. Subsequent additions are described above.

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

## Next-run priorities

See docs/next-run-scope.md. The user prefers common formats, INPUT/PUT conversions, and seeded RAND (uniform/normal), with broader text cleaning deferred. SUBSTR, LENGTH, and LENGTHN already exist. Width simplification and SAS-exact random sequence requirements are documented for the implementation run. The supplied manual identifies MTHYBRID defaults and seed-dependent initialization; MT19937 alone does not establish SAS bit-for-bit RAND compatibility. No new runtime features were implemented in this planning pass.
