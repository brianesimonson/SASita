Continue development of the DATA Step Lab project in this folder. Read START-HERE.md, HANDOFF.md, README.md, and AGENTS.md first, then inspect the modules and run the existing checks.

This is a working JavaScript prototype of a SAS-style DATA step editor, macro text generator, match-merge runtime, and PROC SORT. Preserve the modular source and its self-contained offline HTML distribution. It must process data locally without Python at run time, a backend, or AI API calls.

For the first development milestone:

1. Verify all current checks and run the actual browser UI and offline file in Edge/Chrome when the environment allows it. Test import/export, all examples, expanded code, failed-run rollback, and worker termination. State any testing gap honestly.
2. Audit SAS compatibility of the implemented subset. Prioritize descriptors/types/character lengths, numeric missing values, MERGE duplicate-key and shared-variable rules, IN= behavior, BY boundaries, stable PROC SORT/NODUPKEY, macro expansion and scope, and output rules.
3. Create a small actionable roadmap separating confirmed defects, unverified compatibility risks, and new features. Fix the highest-impact reproducible defects with meaningful regression checks. Refactor incrementally where it helps correctness and maintainability.
4. Build a fixture-based comparison workflow that can accept actual SAS reference outputs and descriptor metadata. Do not claim equivalence without those references; lack of SAS access should not block other useful work.
5. Rebuild the standalone HTML from the same source and check that it still has no external dependencies. Summarize changes, checks, remaining gaps, and the next recommended development milestone.

Use small reviewed Git changes. If this extracted folder has no Git repository, initialize one and commit the baseline; source-history.bundle is available if retaining original history is useful. Do not publish to GitHub, alter the existing Site, or change sharing merely as part of setup.

After the first milestone, develop additional functions, arrays, dataset options, program saving, and editor improvements around my actual SAS examples. Treat full SAS compatibility as a defined roadmap rather than an assumption.
