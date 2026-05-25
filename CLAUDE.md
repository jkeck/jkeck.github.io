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
| `_data/projects.yml` | Projects list on home page |
| `_posts/` | Blog posts (Markdown, Jekyll naming convention) |
| `_includes/head.html` | `<head>` with fonts, CSS tokens, shared styles |
| `_includes/site-nav.html` | Inner-page nav strip (used by all non-home layouts) |
| `_layouts/default.html` | Base layout: nav + theme toggle + footer |
| `_layouts/post.html` | Blog post reading layout (extends default) |
| `_layouts/page.html` | Generic page layout (extends default) |
| `blog/index.html` | Blog archive page |
| `now.html` | /now page — rendered from `_data/now.yml` |
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

### Update the projects list

Edit `_data/projects.yml`. Each entry:

```yaml
- name: Project Name
  blurb: One or two sentence description.
  tags:
    - tag one
    - tag two
  url: https://... # optional — omit if no public URL
  badge: live      # optional — "live" (green) or "oss" (amber)
```

When the user asks to add or update a project, ask for: name, blurb, tags, URL (optional), and whether it has a `live` or `oss` badge (or none).

---

## Constraints

- No placeholder or hardcoded content (fake stats, lorem ipsum, etc.) without a plan to make it real.
- No Bootstrap, jQuery, or external CSS frameworks — the design system is self-contained in `_includes/head.html`.
- Don't enter a git worktree (`EnterWorktree`) unless the user explicitly asks.
- Present options before implementing when the task involves architectural decisions.
