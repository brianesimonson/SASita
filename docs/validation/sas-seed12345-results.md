# Confirmed SAS validation: MT32 seed 12345

The user uploaded the final `03-sas-comparison-results.html` after replacing the SAS validation programs and all six app CSVs with the corrected test package. All seven reported PROC COMPARE checks pass. No conflicting column types are reported.

| Comparison | Scope | Result |
| --- | --- | --- |
| Uniform RAND input HEX16 strings | 20,000 rows, two draws per row, seed 12345, explicit MT32 | All 40,000 draws match exactly |
| Systematic arithmetic | 20,000 rows, 21 selected numeric variables | Pass at relative criterion 1e-12; 26 nonexact values; maximum criterion 2.0648e-16 |
| Integer summary | One row, five values including missing count | Exact match |
| Match-MERGE results | 40,000 rows | Exact match |
| Merge summary | One row, five values | Exact match |
| Shared-variable reverse-exhaustion fixture | Six rows | Exact match |
| Random arithmetic on imported app inputs | 20,000 rows, 15 selected numeric variables | Pass at relative criterion 1e-12; 5,343 nonexact values; maximum criterion 5.6717e-16 |

This confirms the tested unbounded uniform sequence and specific calculation/merge programs against the user's SAS runtime. Arithmetic tolerance passes do not imply bit-for-bit numeric equality. The maximum reported criterion value is a comparison metric, not an absolute difference. Other seeds, bounded uniform transformations, zero-integer endpoint behavior, and normal distribution bit sequences remain unverified. SAS release and host details were not provided. Local Windows file opening remains a separate testing gap.

The corrected app and CSV package come from implementation commit `dbc8f9cfb60c00730c16168c45b341c8828a4054` on `fix/mt32-sas-uniform-conversion`. This confirmation updates documentation only. No new app download or SAS rerun is required for this validation round. Main and v1.0 remain preserved.

Source report: 03-sas-comparison-results.html, 82,836 bytes. SHA-256: `c7afe9f3122cbcc54dc0820a742adc1196ca9e511e2ca55ce36a4ab02bd2541f`. The reported SAS dataset timestamps are 09OCT26:01:25:59 and 09OCT26:01:26:00; timezone is not supplied. The source upload is user-provided SAS output, not app-generated expectations.
