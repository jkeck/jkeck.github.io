Set a time-bound snapshot image on the `/now` page.

While active, the image appears between the live-alert banner and the Work section. It is shown and hidden client-side — no rebuild needed when the window passes.

Ask the user for:
1. **Image path** — path to the image asset (e.g. `/images/now.jpg`). The file must exist at this path under the site root.
2. **Alt text** — a brief accessibility description of the image
3. **Caption** (optional) — a short line of text shown below the image in mono style (e.g. `"Marin Headlands · Jun 2026"`)
4. **Start time** — date and time the image should appear (include timezone, e.g. `2026-06-16T09:00:00-07:00`)
5. **End time** — date and time it should stop showing

Then set the `snapshot:` key in `_data/now.yml`:

```yaml
snapshot:
  image: /images/now.jpg
  alt: "Brief accessibility description"
  caption: "Optional caption"          # omit if not wanted
  start: "2026-06-16T09:00:00-07:00"  # ISO 8601, include timezone
  end:   "2026-06-30T23:59:00-07:00"
```

To clear the snapshot, remove the `snapshot:` key entirely or set it to an empty map: `snapshot: {}`.

If the user provides details upfront (e.g. `/set-snapshot /images/now.jpg through end of June`), parse what's given and ask only for what's missing before writing.
