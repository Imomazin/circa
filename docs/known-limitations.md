# Known limitations

- Scores are transparent prototype heuristics without scientific or investor validation.
- All business records and evidence descriptions are synthetic.
- Financial assumptions omit financing, tax, depreciation, discounting, seasonality and ramp-up.
- Circular opportunity uses a material-expenditure proxy; no carbon or physical-flow metric is claimed.
- Evidence descriptions are readable, but real document upload and source verification are not implemented.
- Assessment creation and stage updates are supported. Editing every original assessment field after creation is future work; scenario assumptions remain editable.
- Sector comparisons show first six sectors on the chart and all filtered sectors in the analytics/programme table.
- Programme groups are small because the cohort is synthetic. Production disclosure control remains future work.
- Demo sessions expire after 30 days. Automatic data deletion and rate limiting need implementation before open public or production use.
- No enterprise identity, role hierarchy, benchmark feed, sponsor integration or external LLM is connected.
- Reset preserves audit history but replaces the current workspace's business records and identifiers.
- Local PostgreSQL DNS was unavailable during initial construction. The committed generated migration and ORM-generated fixture were applied through the connected Neon transaction tool. Hosted and CI persistence verification must be recorded separately from local unit checks.

See `docs/verification.md` for the actual checks completed at the delivered revision.
