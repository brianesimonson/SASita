# Exported SURVEYSELECT reference and selection replay

The user supplied all 15 ss_*.csv files, the corrected export log, and HTML
results. All CSV bytes are preserved under fixtures/sas/surveyselect-9.4m8 with
SHA-256 hashes, row counts, columns and HTML evidence hashes in manifest.json.
The export log reports all 15 files successfully created. Its apparent ERROR
text is the printed source of the missing-table branch; there are no executed
ERROR/WARNING diagnostics. The runtime context is SAS 9.4 M8/SAS/STAT 15.3 Linux.

Run the independent investigation with:

```sh
node scripts/check-surveyselect-reference.mjs
```

This is not app integration. It generates random values and selections from
algorithms and compares them to actual SAS outputs, without copying selected
IDs/hit counts into the implementation.

## Findings

- Existing explicit MT32 (2002 initialization) matches all 400 exported HEX16
  values, retaining the earlier 40,000-value match.
- A candidate older MT19937 initialization, state[0]=seed and
  state[i]=69069*state[i-1] modulo 2^32, matches all 400 default RAND HEX16 values
  for seed 12345. The twist/tempering and double conversion are the same as our
  explicit MT32 core; initialization differs. This is a narrowly verified
  candidate, not support for every SAS default/hybrid initialization rule.
- Using this candidate stream, Floyd sampling matches SRS at seeds 12345 and
  24680, rate 0.3, and the complete-frame census.
- floor(U*N)+1 replacement draws match all NumberHits, all expanded rows, their
  ascending ID order, and two seven-draw replicates on a continuous stream.
- A single random start with interval N/n matches both integer and fractional
  systematic samples exactly by selected IDs.
- Continuous-stream stratified SRS matches all eight selected IDs.
- Default stratified SRS and SYS originally matched using SAS-saved InitialSeed
  values. The updated check derives the same four seeds from the procedure seed
  alone: a separate master stream supplies draws for strata 2 onward, while
  stratum 1 retains the procedure seed. No CSV seed is used as algorithm input.
  Two integer-conversion scales (2^31 and 2^31-1) both fit these four strata,
  but differ at stratum 5. The automatic rule remains ambiguous beyond this
  fixture; 03-stratum-seed-probe.sas tests five strata and a second main seed.

All twelve sampling cases match selected rows; exact assertions cover IDs,
NumberHits, Replicate, stratum and the saved seed where applicable. Checked
design fields include source values, Total, probabilities/ExpectedHits and
weights. CSV weights are checked within 1e-13 absolute error because their
decimal exports are shorter than full binary precision. No claim is made that
displayed reports, labels, formats or all descriptor semantics match yet.

In the observed expanded sample, each repeated row retains the unit's total
NumberHits: a three-hit unit appears three times, each with NumberHits=3. Do not
sum NumberHits over an expanded sample.

## Remaining work

Resolve the automatic stratum-seed conversion ambiguity first; the focused
probe needs no external inputs or CSV exports. Then install a bounded PROC
SURVEYSELECT parser/runtime in Sassy and its portable engine, choosing explicit
compatibility scope for generator defaults. Verify additional seeds (including SAS hybrid exceptions),
sequences across 624-output boundaries, missing/character strata, size/rate
rounding, zero/oversized strata, output options and schema preservation before
claiming broader SAS equivalence. These uploads are sufficient to start that
work; no further user upload is needed to inspect this reference set.
