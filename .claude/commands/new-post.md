Create a new blog post in `_posts/`.

Gather the following — ask only for what hasn't been provided:

1. **Title** — ask if not given
2. **Content** — ask if not provided; if the user provides full content, use it as-is
3. **Summary** — ask for a 1–2 sentence TL;DR shown on the home page and archive; if the user provided the full post content, write a summary from it instead of asking
4. **Tags** — ask for optional tags (e.g. `Ruby`, `Machine Learning`); skip if they say none

Create the file at `_posts/YYYY-MM-DD-slug.markdown` where:
- `YYYY-MM-DD` is today's date
- `slug` is a lowercase, hyphenated version of the title

Use this frontmatter:

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

After creating the file, confirm the path and show the frontmatter so the user can verify it looks right.
