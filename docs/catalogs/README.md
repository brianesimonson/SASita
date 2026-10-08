# SAS reference catalog and app comparison

These catalogs were extracted from the official SAS PDFs uploaded for this project. They list every top-level dictionary topic in those editions; they are not a claim to cover every SAS product or user-defined extension.

| Catalog | Dictionary topics | Current app support | Source edition |
|---|---:|---|---|
| [Functions](functions.csv) | 655 | 35 topics implemented as a subset | Functions and CALL Routines, September 14, 2026; version range 2020.1–2026.09 |
| [CALL routines](call-routines.csv) | 65 | STREAMINIT subset | Same functions reference |
| [Formats](formats.csv) | 289 | 20 families with explicit subset limits | Formats and Informats, April 8, 2026; version range 2020.1–2026.04 |
| [Informats](informats.csv) | 109 | Common INPUT subset | Same formats/informats reference |

## How to read and choose

Each CSV includes the documented name, family, category, current support, proposed batch, selection, PDF filename, PDF page, printed page, and topic title. Open a CSV on GitHub or in a spreadsheet. All selections start as **Unselected**; suggested batches are recommendations, not approval to implement. Mark desired entries or tell Codex the names and priorities.

Use `pdf_page` to navigate the uploaded PDF and `printed_page` for the number printed in the manual. They differ by ten pages in these dictionary sections. CAS in a category describes SAS's distributed execution support, not a dependency or feature of this browser application.

The function count includes multiple documented variants of shared callables, including CDF, PDF, RAND, and FINANCE. SUBSTR's left-of-assignment and right-of-assignment forms are separate topics: only the right-hand expression form is supported by this app. Format topics can represent width/delimiter families; current supported families do not mean complete support for every width or variant. Twelve LDAP CALL entries have no extracted category; consult their reference pages for applicability and restrictions.

Current support was matched to the actual interpreter and format parser, not inferred from example programs. Existing support remains a practical subset; matching a name is not SAS conformance certification. SAS manuals include host-, service-, and environment-dependent features, such as Git operations, operating-system/file access, and CAS. Those are not automatically appropriate for a local-only HTML app.

## Source and extraction validation

- Source filenames, publication dates, version ranges, PDF page counts, and SHA-256 checksums are recorded in [sources.json](sources.json).
- Dictionary entries came from the PDFs' level-4 bookmarks beneath Dictionary headings. Counts exclude unrelated introductory sections and appendixes.
- Every one of the 1,118 topic titles and printed page references was independently matched against the chapter contents in the extracted PDF text. No topics were unmatched or duplicated within a catalog.
- Categories were read from each entry's Category/Categories field and normalized to remove running page headers. Category extraction is a convenience aid, not an independently certified transcription of all applicability metadata.
- Original PDFs and full manual text are not copied into the GitHub repository. This is an index and app-support comparison, not a replacement for the manuals.
- Network access to SAS's sites is no longer needed for this catalog. These PDFs are newer Viya-era reference editions, rather than the earlier proposed SAS 9.4 web references; their actual scope is recorded above.

## Suggested next implementation groups

### Batch 1

| Kind | Name | Current support | Source printed page |
|---|---|---|---:|
| function | `CMISS` | Not implemented | 513 |
| function | `COMPRESS` | Not implemented | 545 |
| function | `COUNTW` | Not implemented | 574 |
| function | `FIND` | Not implemented | 762 |
| function | `FINDW` | Not implemented | 775 |
| function | `LENGTHC` | Not implemented | 1152 |
| function | `REVERSE` | Not implemented | 1448 |
| function | `SCAN` | Not implemented | 1472 |
| function | `SUBSTRN` | Not implemented | 1533 |
| function | `TRANSLATE` | Not implemented | 1568 |
| function | `TRANWRD` | Not implemented | 1575 |
| format | `$CHARw.` | Not implemented | 108 |
| format | `$w.` | Not implemented | 142 |
| format | `DATEw.` | Partial: DATE9. only | 173 |
| format | `DDMMYYw.` | Not implemented | 181 |
| format | `MMDDYYw.` | Not implemented | 245 |
| format | `YYMMDDw.` | Partial: YYMMDD10. only | 550 |
| format | `Zw.d` | Not implemented | 572 |
| format | `w.d` | Not implemented | 526 |

### Batch 2

| Kind | Name | Current support | Source printed page |
|---|---|---|---:|
| function | `DATE` | Not implemented | 596 |
| function | `DATEPART` | Not implemented | 599 |
| function | `DATETIME` | Not implemented | 600 |
| function | `DHMS` | Not implemented | 621 |
| function | `HMS` | Not implemented | 1005 |
| function | `INPUT` | Not implemented | 1052 |
| function | `INTCK` | Not implemented | 1064 |
| function | `INTNX` | Not implemented | 1103 |
| function | `PUT` | Not implemented | 1385 |
| function | `QTR` | Not implemented | 1395 |
| function | `TIME` | Not implemented | 1559 |
| function | `TIMEPART` | Not implemented | 1561 |
| function | `WEEKDAY` | Not implemented | 1682 |
| format | `DATETIMEw.d` | Not implemented | 177 |
| format | `E8601DAw.` | Not implemented | 199 |
| format | `E8601DTw.d` | Not implemented | 202 |
| format | `HHMMw.d` | Not implemented | 230 |
| format | `MONYYw.` | Not implemented | 258 |
| format | `TIMEw.d` | Not implemented | 514 |
| format | `WEEKDATEw.` | Not implemented | 528 |
| format | `WORDDATEw.` | Not implemented | 540 |
| format | `YEARw.` | Not implemented | 547 |

### Batch 3

| Kind | Name | Current support | Source printed page |
|---|---|---|---:|
| function | `EXP` | Not implemented | 667 |
| function | `LOG` | Not implemented | 1177 |
| function | `LOG10` | Not implemented | 1177 |
| function | `MEDIAN` | Not implemented | 1206 |
| function | `RANGE` | Not implemented | 1433 |
| function | `SIGN` | Not implemented | 1497 |
| function | `STD` | Not implemented | 1517 |
| function | `SUMABS` | Not implemented | 1539 |
| function | `VAR` | Not implemented | 1604 |
| format | `BESTw.` | Partial: ordinary number text; width ignored | 143 |
| format | `COMMAw.d` | Partial: width ignored; decimal display supported | 167 |
| format | `COMMAXw.d` | Not implemented | 169 |
| format | `DOLLARw.d` | Partial: width ignored; decimal display supported | 185 |
| format | `PERCENTw.d` | Partial: width ignored; decimal display supported | 473 |

Batch 1 focuses on text cleaning and everyday display. Batch 2 adds date/time manipulation and conversion. Batch 3 adds numeric/statistical helpers and improves existing numeric formats. Scope and edge cases are discussed in [expansion planning](../function-format-expansion.md).

Before implementing each group, read its cited pages, choose a supported argument/modifier scope, create reference-backed examples, and test boundaries. INPUT and PUT require parser and format/informat integration, while INTNX/INTCK require interval/alignment semantics. Adding these names alone would not implement the documented behaviors.

## Implementation status update

The feature/formats-conversions-rand branch updates current_support in these CSVs for INPUT, PUT, RAND, STREAMINIT, and common formats/informats. Proposed batches remain historical suggestions; use current_support when selecting remaining work. See ../formats-conversions-rand.md for supported widths/modifiers, aliases, and limits. RAND support is explicit MT32 only, and SAS uniform/normal sequences remain unverified.
