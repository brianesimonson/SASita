# Charts in Sassy v0.4.4

Chart.js 4.5.1 is embedded in the standalone HTML and loaded from a local vendor file in the modular app. No internet connection or CDN request is needed. All dataset processing and chart rendering stay in the browser.

Open demo-project/charts-demo.sas and Run to generate all five chart types. This program creates its own dataset and does not require connecting a project folder. Charts append to Output alongside table snapshots; the Session output dropdown selects earlier plots. Download PNG saves the rendered chart with a white background and its title. Tooltips and legend toggles work through Chart.js. Clear output destroys the active chart and clears all output history, preserving WORK and log text. Histories reset on page reload; download important charts before closing. Output retains at most 100 entries/250,000 rows or plotted values, preserving the newest entry and logging any trimming.

## Supported syntax

Each plotting procedure requires DATA= and exactly one plot statement. WORK and assigned LIBNAME tables are supported. Multiple procedures produce multiple charts. Macro expansion is available before parsing.

```sas
title 'Paid versus allowed';
proc sgplot data=claims;
  scatter x=allowed_amount y=paid_amount / group=provider;
  xaxis label='Allowed amount';
  yaxis label='Paid amount';
run;
proc sgplot data=claims;
  hbar provider / response=paid_amount stat=sum;
run;
proc sgplot data=claims;
  vbar provider / response=paid_amount stat=mean;
run;
proc sgplot data=claims;
  histogram paid_amount / nbins=10 scale=count;
run;
proc sgpie data=claims;
  pie provider / response=paid_amount stat=sum;
run;
title;
```

SCATTER requires X= and Y= numeric variables. GROUP= is optional. Missing/nonfinite X/Y or missing groups are excluded. Points are kept individually; no sampling or regression is performed.

HBAR/VBAR require a category variable. Optional RESPONSE= must be numeric. STAT= supports FREQ, SUM and MEAN. Default FREQ counts observations without a response; default SUM sums a specified response. SUM/MEAN require a response; FREQ does not accept one. Optional GROUP= produces separate series, and GROUPDISPLAY=STACK/CLUSTER controls their layout; default STACK. Categories and groups follow their first appearance in the input. Missing categories, groups, and responses are excluded. Categories with no valid responses disappear. Missing category/group combinations show zero for sums/frequencies and a gap for means. Means use bounded online arithmetic and sums use ordinary double arithmetic; SAS bit equivalence is not claimed.

PIE uses PROC SGPIE, a category variable, and the same response/stat rules. Grouping and axis statements are unsupported. Slice totals must be nonnegative, finite, and have a positive finite total. Categories are not automatically combined into an Other slice.

HISTOGRAM requires a numeric variable. NBINS= accepts 1–100. SCALE= is COUNT, PERCENT (default), or PROPORTION. Automatic bins use ceil(log2(n)+1), capped at 50; constant data uses one bin even when NBINS is specified. Bins have equal width across min/max, are closed on the left and open on the right, with the final bin including max. Numeric precision/range problems fail clearly. Missing/nonfinite values are excluded; percent/proportion use the number of valid values as denominator. Labels abbreviate edges to five significant digits; calculations use their full numeric values. The current bin algorithm is defined by Sassy and is not SAS's exact default binning.

TITLE 'text'; sets the chart title across procedures and later runs in the current tab. TITLE; resets it to generated titles. Numbered titles, multiple titles and titles inside procedures are unsupported. XAXIS/YAXIS accept LABEL='text' only. Titles/axis labels are limited to 200 characters; category/group labels to 256. Plot labels and values are rendered as data, never HTML or JavaScript. Source formats do not currently change chart ticks/tooltips; plots use raw numbers.

## Limits and validation

At most 20 charts and 100,000 plotted values per program; 20,000 points per scatter, 200 categories, and 50 groups. Scatter overflow ranges, overflowing bar statistics and pie totals are rejected. Unsupported options fail explicitly. PROC PLOT, overlays, density/regression curves, WHERE/BY in plotting procedures, log axes, date axes, weights, frequency variables, style attributes and other procedures remain unsupported. The synchronous engine run() retains its original DATA/SORT scope; charts use the asynchronous runFileProgram/browser worker workflow.

Chart models capture dataset values at each procedure's position, so later dataset replacement does not alter earlier charts. On successful completion, final table snapshots are appended to Output followed by the run's charts in procedure order. A parse/data error produces no new charts or dataset commits and saves no prepared exports. Multi-file storage failures retain the existing explicit partial-write warning. TITLE and library changes commit only on success.

Node tests verify chart data, aggregation, grouping, bin boundaries/scales, missing values, titles/macros, native library reads, limits and failed-run rollback. Chromium verifies actual Chart.js rendering of all five types, PNG data, snapshot preservation, history clearing/instance cleanup and the original file/numeric workflows in modular and standalone builds. There is no new SAS-runtime graph/statistics comparison or supplied SGPLOT manual fixture; full SAS graphical equivalence is not claimed. OS download dialogs and Windows file:// remain manual checks.

Chart.js release integrity and licensing are recorded in dist/vendor/README.md; the full MIT license is embedded in the HTML and included in the ZIP.
