# Dataset and variable completion — Sassy v0.4.15

The source editor uses dataset column metadata to help type ordinary SAS. It does not execute the program or add object access to the language.

- Type `work.` to list known WORK datasets. Type a prefix to filter, use Up/Down to select, then Tab or Enter to insert a dataset name. Choosing claims leaves `work.claims` in the program.
- After writing `data temp; set work.claims;`, type `temp.` to list its inferred variables before running. Choosing paid_amount replaces the entire `temp.` shortcut with `paid_amount`.
- You can also type `claims.pa` or `work.claims.pa`; choosing paid_amount inserts only `paid_amount`. For example, `amount=temp.pa` becomes `amount=paid_amount`.
- Named libraries use the same approach: `saved.` lists known/cached members; `saved.claims.` lists variables only when that table's descriptor is loaded.
- Escape dismisses the menu without changing text. Mouse selection also works. Tab indents normally when no completion menu is open. Ctrl+Space continues to open the supported syntax guide.

The final program can look like this:

```sas
data temp;
    set work.claims;
    amount=paid_amount;
run;
```

WORK is the temporary library. DATA temp still creates a dataset from SET input when run; temp is not a live pointer to claims. The editor infers available column names to help author that program. Dataset-qualified variables such as temp.paid_amount are not added as runtime SAS expressions. Accepting a suggestion removes that qualifier; manually leaving unsupported shorthand in the source can still fail when run in Sassy or SAS.

## Scope and limits

Known metadata comes from current/imported datasets and previously loaded library tables. Library-member names can also come from cached sidebar listings. Completion never reads observations, runs code, requests permissions or opens files. Select/load a saved library table through the sidebar first when its columns are unknown. Saving/opening/running programs keeps the existing workflows and permission rules.

The scanner masks strings, block comments, statement/macro comments and does not expand macros. Simple DATA output schemas are inferred from explicit SET or MERGE source names, with straightforward KEEP/DROP/RENAME statements after the source and simple assignments. These suggestions are labeled “inferred from source”; this is not full SAS semantic validation. Dataset options, macro-generated sources, PROC SQL, complex control flow/schema transformations and full procedure-output inference are outside this first implementation. In uncertain source lookups it offers no inferred target schema. Existing runtime descriptors remain the reliable source after a successful run.

Suggestions use standard SAS identifier names supported by this interpreter. Up to 200 matches are displayed; type more to narrow the list. Programs over 100,000 characters disable this lightweight assistance. Metadata inference operates on source before the caret and may not know columns introduced later. Unloaded files cannot supply column names. No code or dataset is sent outside the browser.
