# jessiekeck.com — Claude Code instructions

## Stack & local dev

Jekyll + GitHub Pages. Ruby gems managed with Bundler.

```
bundle exec jekyll serve --livereload   # dev server → localhost:4000
bundle exec jekyll build                # production build → _site/
```

No worktrees. Edits go directly to `master`.

---

## Key files

| Path | Purpose |
|---|---|
| `index.html` | Home page — standalone (`layout: null`), all CSS inline |
| `_data/now.yml` | Now page + ticker content — **primary content file** |
| `_data/projects.yml` | Home sidebar projects (Now section — 2 entries) |
| `_data/open_source.yml` | OSS history entries on `/projects/` page |
| `_data/experiments.yml` | Side experiments on `/projects/` page |
| `_posts/` | Blog posts (Markdown, Jekyll naming convention) |
| `_includes/head.html` | `<head>` with fonts, CSS tokens, shared styles |
| `_includes/site-nav.html` | Inner-page nav strip (used by all non-home layouts) |
| `_layouts/default.html` | Base layout: nav + theme toggle + footer |
| `_layouts/post.html` | Blog post reading layout (extends default) |
| `_layouts/page.html` | Generic page layout (extends default) |
| `blog/index.html` | Blog archive page |
| `now.html` | /now page — rendered from `_data/now.yml` |
| `projects.html` | /projects/ page — three sections: Now, Open Source, Experiments |
| `about.md` | About page |

## Design system

Warm editorial dark theme. Tokens live in `_includes/head.html` under `:root`.

- **Background:** `#1a1714` (dark) / `#f5f0ea` (light)
- **Accent:** `--amber: #d4a574`
- **Fonts:** Fraunces (display/headings), Newsreader (body serif), IBM Plex Mono (mono), Inter (sans)
- Theme persists in `localStorage` under key `jk-theme` (`dark` | `light`)

---

## Content update workflows

### Update the Now page

When the user asks to update the Now page (or ticker), ask these questions in order. Only ask about sections they want to change — don't require all of them.

1. **Ticker blurb** — "What's the one-line summary for the home page ticker? (Keep it short and specific — what you're doing right now.)"
2. **Work** — "What's your current work focus? (1–2 sentences for the Now page Work section.)"
3. **Building** — "Anything new you're building, or updates to existing projects? (Name + one-line description.)"
4. **Watching / Reading** — "Anything new to add? Give me title, type (book / show / film), author if it's a book, and an optional short note."
5. **Date** — Update `date:` in `now.yml` to today's date in the format `DAY · MON DD` (e.g. `MON · MAY 25`) and `updated:` to the full date (e.g. `May 25, 2026`).

Edit `_data/now.yml` only — the page template handles rendering.

Supported `type` values for `watching_reading` items: `book`, `show`, `film`.

### Set a time-bound live ticker

Add an entry to the `tickers:` array in `_data/now.yml`. While active the home page bar scrolls the message and `/now` shows a live alert banner above the Work section. After the window passes both revert automatically (client-side JS, no rebuild needed).

```yaml
tickers:
  - message: "Speaking at RailsConf today — Room 201 at 2pm, come say hi"
    start: "2026-07-15T09:00:00-07:00"   # ISO 8601, include timezone
    end:   "2026-07-15T17:00:00-07:00"
    date:  "TUE · JUL 15"                # optional — overrides normal NOW date display
```

Multiple entries are supported; the first one whose window is currently active wins. Set `tickers: []` (or remove entries) to disable.

---

### Set a time-bound snapshot image

Set the `snapshot:` key in `_data/now.yml`. While active, a photo appears on `/now` between the live-alert banner and the Work section. Shown/hidden client-side — no rebuild needed when the window passes.

```yaml
snapshot:
  image: /images/now.jpg              # path to the image asset under site root
  alt: "Brief accessibility description"
  caption: "Marin Headlands · Jun 2026"  # optional — shown below the image
  start: "2026-06-16T09:00:00-07:00"     # ISO 8601, include timezone
  end:   "2026-06-30T23:59:00-07:00"
```

To clear, remove the `snapshot:` key or set it to `snapshot: {}`. Start and end are required — the feature is always time-bounded.

---

### Add a blog post

When the user asks to write or add a blog post:

1. **Title** — ask if not provided
2. **Summary** — ask for a 1–2 sentence TL;DR (shown on home page and archive); write one from the content if they provide the full post
3. **Tags** — ask for optional tags (e.g. `Ruby`, `Machine Learning`)
4. Create the file at `_posts/YYYY-MM-DD-slug.markdown` with this frontmatter:

```yaml
---
layout: post
title: "Title here"
date: YYYY-MM-DD HH:MM:SS
tags:
  - Tag One
  - Tag Two
summary: "TL;DR sentence here."
---
```

---

### Update the projects page

The `/projects/` page has three sections, each driven by a data file:

| Section | Data file | When to edit |
|---|---|---|
| Now | `_data/projects.yml` | Current / active work — also appears on home sidebar |
| Open Source | `_data/open_source.yml` | OSS history (Blacklight, Samvera, etc.) |
| Experiments | `_data/experiments.yml` | Side projects and demos |

**Adding to Now** (`_data/projects.yml`) — ask for: name, blurb, tags, URL (optional), badge (`live` or `oss`, optional). This also updates the home page sidebar.

**Adding an experiment** (`_data/experiments.yml`) — ask for: name, blurb, tags, URL to the demo (optional), URL to the related blog post (optional).

Entry format for all three files:

```yaml
- name: Project Name
  blurb: One or two sentence description.
  tags: [tag one, tag two]
  url: https://...    # optional — live demo or project site
  source: https://... # optional — GitHub link (open_source.yml)
  post: /YYYY/MM/DD/slug/  # optional — related post (experiments.yml)
  badge: live         # optional — "live" (green) or "oss" (amber); projects.yml only
  note: "formerly X"  # optional — shown inline next to name (open_source.yml)
```

---

### Update the ⌘K command palette

All palette code lives in `_includes/cmdk.html`. It is included in both `index.html` and `_layouts/default.html` — no layout changes needed when editing it.

**Adding a nav item** — extend the `NAV` array in the JS:

```js
{ label: 'Label', path: '/path/', hint: '/path' },
```

`label` is shown to the user and matched against search input. `hint` is the path displayed on the right and also matched. Both are searched case-insensitively.

**Adding a TTY easter egg command** — extend the `TTY` object:

```js
'command': 'output text shown to the user',
```

The key is the exact string the user must type (lowercase). The value is the output — use `\n` for line breaks, `pre-wrap` is applied. To render the command's output in red (error style), set the key to match the `sudo` branch check in `render()`, or add a new condition there. `clear` is a special reserved key that resets the input.

**Dynamic data** — post titles/dates and the site uptime year are injected via the `#cmdk-data` JSON block at the top of the include using Liquid. If you need to inject additional site data (e.g. project names), add it there and read it from `siteData` in the JS rather than hardcoding.

---

## Comments & Likes (Supabase)

Blog posts load `assets/js/comments/index.js` as a module. The widget talks directly to Supabase from the browser — no server required.

**Key files:**
- `assets/js/comments/config.js` — Supabase project URL + anon key (public, safe to ship)
- `assets/js/comments/` — gateways / domain / ui layers
- `supabase/migrations/` — all schema migrations (apply with `supabase db push`)
- `assets/js/vendor/supabase-2.108.2.js` — vendored ESM SDK (update by re-fetching + bumping version in import map)

**Local dev / testing:**
```bash
supabase start          # start local Docker stack
supabase db reset       # wipe + replay all migrations (required before integration tests)
npm test                # unit + integration suite (57 tests)
npm run typecheck       # tsc --noEmit JSDoc type check
```

**Deploying schema changes:**
```bash
supabase link --project-ref bgapignqwufzcjprycuj   # one-time, prompts for DB password
supabase migration repair --status applied <name>   # mark manually-applied migrations as done
supabase db push                                    # apply pending migrations to remote
```

**Manual Supabase dashboard steps (one-time):**
- **Auth → Providers → Anonymous** — enable anonymous sign-ins (required for likes)
- **Auth → Providers → Google** — enable Google OAuth, paste client ID + secret from Google Cloud Console; set callback URL in GCP to the Supabase OAuth callback shown in the dashboard
- **Auth → URL Configuration → Redirect URLs** — add `http://localhost:4000` for local testing
- **Auth → Attack Protection → CAPTCHA** — enable Cloudflare Turnstile and paste the Turnstile secret key to gate anonymous sign-in against bots (Turnstile site key also needed in the UI — Slice 4)

**Rate limiting:** a DB trigger (`check_comment_rate_limit`) enforces max 5 comments per user per 60 seconds at the Postgres level. No client-side enforcement needed.

**Bumping the vendored SDK:**
1. `curl -L 'https://esm.sh/@supabase/supabase-js@<new-version>?bundle&target=es2020' -o assets/js/vendor/supabase-<new-version>.js`
2. Update the import map version in `_layouts/post.html`
3. Update `@supabase/supabase-js` version in `package.json` + `npm install`
4. Commit both files

---

## Constraints

- No placeholder or hardcoded content (fake stats, lorem ipsum, etc.) without a plan to make it real.
- No Bootstrap, jQuery, or external CSS frameworks — the design system is self-contained in `_includes/head.html`.
- Don't enter a git worktree (`EnterWorktree`) unless the user explicitly asks.
- Present options before implementing when the task involves architectural decisions.
