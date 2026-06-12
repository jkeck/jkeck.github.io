Update the Now page (`_data/now.yml`) with current content.

Ask the user about each section they want to change — only ask about what they bring up, don't require all sections. Walk through these in order:

1. **Ticker blurb** — "What's the one-line summary for the home page ticker? (Keep it short and specific — what you're doing right now.)"
2. **Work** — "What's your current work focus? (1–2 sentences for the Now page Work section.)"
3. **Building** — "Anything new you're building, or updates to existing projects? (Name + one-line description.)"
4. **Watching / Reading** — "Anything new to add? Give me title, type (book / show / film), author if it's a book, and an optional short note."
5. **Date** — Update `date:` to today's date in the format `DAY · MON DD` (e.g. `WED · JUN 11`) and `updated:` to the full date (e.g. `June 11, 2026`).

Edit `_data/now.yml` only — the page template handles rendering.

Supported `type` values for `watching_reading` items: `book`, `show`, `film`.

If the user provides content upfront (e.g. "update my work section to X"), skip asking about that section and apply it directly. After making changes, show a brief summary of what was updated.
