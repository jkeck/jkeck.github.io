Update the `/projects/` page by adding or editing entries in the appropriate data file.

The page has three sections:

| Section | Data file | Notes |
|---|---|---|
| Now | `_data/projects.yml` | Active work — also appears on the home page sidebar |
| Open Source | `_data/open_source.yml` | OSS history (Blacklight, Samvera, etc.) |
| Experiments | `_data/experiments.yml` | Side projects and demos |

Ask the user which section they want to update, then gather the fields for that section:

**Now** (`_data/projects.yml`) — ask for: name, blurb, tags, URL (optional), badge (`live` or `oss`, optional). Adding here also updates the home page sidebar.

**Open Source** (`_data/open_source.yml`) — ask for: name, blurb, tags, source URL (optional), note like "formerly X" (optional).

**Experiments** (`_data/experiments.yml`) — ask for: name, blurb, tags, demo URL (optional), related blog post URL (optional).

Entry format for all three files:

```yaml
- name: Project Name
  blurb: One or two sentence description.
  tags: [tag one, tag two]
  url: https://...      # optional — live demo or project site
  source: https://...   # optional — GitHub link (open_source.yml)
  post: /YYYY/MM/DD/slug/  # optional — related post (experiments.yml)
  badge: live           # optional — "live" (green) or "oss" (amber); projects.yml only
  note: "formerly X"    # optional — shown inline next to name (open_source.yml)
```

Omit optional fields that aren't provided. After making changes, confirm which file was edited and show the new entry.
