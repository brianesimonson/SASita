# Common formats, conversions, and random samples

Implemented on feature/formats-conversions-rand. Main and v1.0 are preserved. The browser runtime remains JavaScript only, and the build still produces one standalone HTML file.

## Try it

Open the new HTML, choose **Example: INPUT & PUT**, **Example: format gallery**, or **Example: seeded RAND**, click Load example, then Run program. The random example produces eight observations; rerunning it gives the same numbers in this app. The Supported syntax dialog lists the full supported scope.

```sas
data demo;
    amount = input('$1,234.50', comma12.);
    day = input('03/15/2018', mmddyy10.);
    id_text = put(1350, z8.);
    date_text = put(day, e8601da10.);
    call streaminit('MT32', 12345);
    do id = 1 to 8;
        uniform = rand('uniform');
        normal = rand('normal', 10, 2);
        uniform_hex = put(uniform, hex16.);
        output;
    end;
    format amount dollar12.2 day date11. uniform 10.6 normal 10.4;
run;
```

## Width and conversion contract

Formats assigned by FORMAT change the table display, while CSV export keeps raw values. PUT creates a character value and returns width-padded text. Numeric text is right-aligned by default, character text left-aligned; -L/-C/-R override alignment. The table omits alignment padding. Z uses leading zeros and preserves a minus sign. DATE and separated date families select their representations by width; character formats truncate by width.

Supported format families: w.d/Fw.d, Z, BEST, COMMA, DOLLAR, PERCENT, HEX16 only, DATE, MMDDYY, DDMMYY, YYMMDD, MONYY, TIME, HHMM, DATETIME, E8601DA, E8601DT, $/$F, $CHAR, and $UPCASE. B/C/D/N/P/S separator variants of MMDDYY/DDMMYY/YYMMDD are supported. Counting those variants within their parent date family gives 20 families.

This is still a defined subset. Numeric overflow shows stars instead of SAS adaptive precision/BEST fallback. BEST currently uses ordinary JavaScript number text. Numeric rounding uses JavaScript floating-point operations; DECIMALCONV modes are not implemented. Decimals are bounded to 0–15. Full TIME/DATETIME representations are supported; shorter width-dependent representations are rejected. HHMM supports fractional minutes and limits values to 0–24 hours. ISO output requires a full-width representation; timezones are not included. Character widths count UTF-16 units, not encoded SAS bytes. Automatic fixed-length descriptors and complete SAS coercion remain outside the interpreter's subset.

INPUT accepts a character source and a literal supported informat. Width limits the characters read. Numeric input without a decimal point or exponent applies implied precision d. COMMA/DOLLAR handle common comma/currency/parenthesized numbers; exotic embedded punctuation is outside the subset. Percent input divides by 100 only when the value has a percent sign. Impossible dates return missing, with a diagnostic and _ERROR_=1; ? suppresses the diagnostic, and ?? also prevents setting _ERROR_. Two-digit years use a fixed 1926–2025 window rather than a configurable SAS YEARCUTOFF. Dates use days since 1960; time/datetime use seconds. Calculations use UTC.

Format arguments to INPUT/PUT are literal specifications such as comma12.2 or date9.; dynamic INPUTN/PUTN and statements named INPUT/PUT are not implemented. The application requires source/format types to match; it does not add SAS's implicit numeric-to-character conversion.

## Randomness contract and limits (v0.4.10)

Default CALL STREAMINIT(seed), explicit MT32/MT2002, MT1998 and MTHYBRID are
implemented. RAND without initialization and nonpositive seeds choose an
automatic seed and log it for reuse. First initialization wins per DATA step.
See [random-numbers.md](random-numbers.md) for initialization rules, examples,
reference evidence, exceptional-seed limits and deployment behavior.

Explicit MT32 matches all 40,000 seed-12345 uniform HEX16 values. Default RAND
matches all 400 new seed-12345 uniform values. Actual SURVEYSELECT sampling
and automatically derived stratum seeds match the supplied reference cases.
These results do not establish all seeds/distributions. Paired NORMAL now matches the printed reference values and stream witnesses; see random-numbers.md.

UNIFORM with optional bounds and NORMAL with optional mean/sigma remain the
only distributions. NORMAL now returns paired polar values and caches the second;
the tested SAS sequences match within rounding tolerance, with exact subsequent uniforms. Uniform conversion retains the exact constant
2.328306436538696e-10. The original independent core and format tests remain
in the baseline suite.

## Validation and future SAS comparison

- The new test program verifies examples in the supplied manuals, including numeric/date conversion (function manual printed pp. 1053 and 1387), DATE widths (format manual pp. 174–175), MMDDYY widths (p. 246), YYMMDD widths (p. 551), Z (p. 573), w.d (p. 527), COMMA input (p. 674), PERCENT input (p. 726), and HHMM (p. 232).
- Regression tests exercise width/padding, negative values, exact HEX16 representations, invalid dates/types/specifications, implied decimals, ?/?? diagnostics, mixed stream reproducibility, repeated initialization, separate steps, and normal mean/variance sanity.
- The rebuilt offline worker executes the new features. Real browser checks run all ten examples, import/export, expanded code, the reference dialog, and failed-run rollback in both modular and standalone builds over HTTP.
- Windows file opening remains a manual check; cloud Chromium blocks file:// navigation by administrator policy. Hosted GitHub Actions results are not established by local passes.

For exact SAS comparison, run fixtures/sas/rand-reference.sas in an actual SAS runtime and record its release/host. It exports rand-reference.csv with HEX16 values for uniform-only, normal-only, and mixed draws using four explicit MT32 seeds, including a seed divisible by 8192 and the largest positive 32-bit seed. Then run:

```
node scripts/compare-sas-rand.mjs path/to/rand-reference.csv
```

The checker requires all 384 rows, performs 512 exact hexadecimal comparisons, reports differences, and fails for mismatches or incomplete/malformed data. The seed-12345 uniform input fixture is supplied and checked by `node test-sas-mt32.mjs`; the four-seed uniform/normal/mixed fixture has not yet been supplied. The script's own success/rejection paths can be tested with app-generated data, but that is harness validation only and cannot establish SAS equivalence.
