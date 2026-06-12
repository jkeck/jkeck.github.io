Set a time-bound live ticker in `_data/now.yml`.

The ticker shows a scrolling message on the home page bar and a live alert banner on `/now` while the window is active. Both revert automatically when the window passes — no rebuild needed.

Ask the user for:
1. **Message** — the text to display (keep it short and specific)
2. **Start time** — date and time the ticker should go live (include timezone)
3. **End time** — date and time it should stop showing
4. **Date label** (optional) — a short date string like `TUE · JUL 15` that overrides the normal NOW date display while active

Then add an entry to the `tickers:` array in `_data/now.yml`:

```yaml
tickers:
  - message: "Speaking at RailsConf today — Room 201 at 2pm, come say hi"
    start: "2026-07-15T09:00:00-07:00"   # ISO 8601, include timezone
    end:   "2026-07-15T17:00:00-07:00"
    date:  "TUE · JUL 15"                # optional
```

Multiple entries are supported; the first one whose window is currently active wins. If the user wants to clear all tickers, set `tickers: []`.

If the user provides the details upfront (e.g. `/set-ticker Speaking at RailsConf on July 15 2-5pm`), parse them and confirm before writing rather than asking each question.
