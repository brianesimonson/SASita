# First actual SAS SURVEYSELECT reference run

Sources supplied by the user:

- Results: `01-surveyselect-reference-results.html`, upload file_000000002bc481f581e05437a835e765.
- Log: `01-surveyselect-reference-log.html`, upload file_0000000015f881fb9b91f67682c1e98d.

The log identifies SAS 9.04.01M8P02222023, SAS/STAT 15.3, Linux. All twelve
SURVEYSELECT steps completed, creating these WORK tables (rows/variables):

| Table | Rows | Variables |
| --- | ---: | ---: |
| ss_srs | 7 | 7 |
| ss_srs_second_seed | 7 | 7 |
| ss_srs_rate | 6 | 7 |
| ss_srs_census | 20 | 7 |
| ss_urs_collapsed | 17 | 8 |
| ss_urs_hits | 40 | 8 |
| ss_urs_reps | 14 | 9 |
| ss_sys_integer | 5 | 7 |
| ss_sys_fractional | 6 | 7 |
| ss_strata_srs | 8 | 8 |
| ss_strata_single_stream | 8 | 7 |
| ss_strata_sys | 8 | 8 |

Explicit CALL STREAMINIT('MT32',12345) matches Sassy's 400 hexadecimal values
exactly. Default CALL STREAMINIT(12345) differs in all 400 hexadecimal values;
this establishes a stream difference, not a numerical calculation defect or
the identity of SURVEYSELECT's own stream. Collapsed NumberHits agrees exactly
with counts from expanded OUTHITS rows for all 17 selected units.

No Sassy SURVEYSELECT comparison has occurred: the procedure is not yet
implemented. Selected IDs and full descriptors are not in the uploaded results.

The collector's print/export macro failed because SAVE is reserved in SAS:
`ERROR: Macro SAVE has been given a reserved name.`
SAS compiled a dummy macro and rejected all 15 calls. No PROC EXPORT executed.
The corrected macro is sassy_export_reference. The generated
02-export-existing-reference.sas helper can list/export existing WORK tables
without rerunning any selections. If WORK is gone, corrected 01 recreates them.
Actual execution of the corrected export section remains pending.
