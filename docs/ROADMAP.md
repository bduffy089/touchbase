# TouchBase Roadmap

Feature ideas generated 2026-04-10. Organized by effort. Check off as shipped.

## Shipped

- [x] Cmd+K command palette
- [x] AI message suggestions (LinkedIn/Email/Text, streaming)
- [x] LinkedIn import with AI parsing
- [x] Turso persistent storage
- [x] `?log=true` auto-open interaction modal

## Quick wins (30-60 min each)

- [ ] **Birthday tracking** — add `birthday` field, dashboard widget for "birthdays this week," auto-remind
- [ ] **Reminders / follow-ups** — "remind me to follow up in 2 weeks" → shows on dashboard on that date
- [ ] **Global search everywhere** — extend Cmd+K to search interaction notes, not just names
- [ ] **Contact photos** — upload or paste image URL, replaces initials avatar
- [ ] **Export to CSV** — one-click download of all contacts for backup
- [ ] **Dark mode toggle** — the palette is already dark; extend to whole app

## Medium (2-4 hours each)

- [ ] **AI relationship insights** — "You haven't talked to Sarah in 90 days, last time she mentioned X, here's what to ask" — uses interaction history for real context. **[NEXT UP]**
- [ ] **Smart cadence suggestions** — Claude analyzes actual interaction frequency and suggests realistic cadences ("You text Marcus weekly, not monthly")
- [ ] **Email draft → Gmail** — "Suggest" button drafts message, second button opens pre-filled Gmail compose
- [ ] **Tags autocomplete + management** — create/edit/delete tags from a settings page, color picker
- [ ] **Interaction templates** — "Coffee chat" template pre-fills type=in-person, notes prompt
- [ ] **Map view** — if contacts have locations, show them on a map (helps plan trips)

## Ambitious (weekend project each)

- [ ] **Chrome extension for LinkedIn** — button on any LinkedIn profile: "Add to TouchBase" — one-click import, no copy/paste. **[QUEUED]**
- [ ] **Weekly digest email** — every Monday, AI brief: who's overdue, who to prioritize, suggested openers
- [ ] **Voice notes** — record a voice memo after a call, AI transcribes and summarizes as interaction note
- [ ] **Contact merge / dedupe** — detect duplicates and offer to merge
- [ ] **Timeline / relationship graph** — visualize all your interactions with someone over time
- [ ] **Multi-user / sharing** — auth + per-user contacts (turns it into a real product)

## Build order

1. **AI relationship insights** (medium) — fastest AI win, reuses `/api/ai` route
2. **Smart cadence suggestions** (medium) — another AI win, shows up on contact detail page
3. **Chrome extension** (ambitious) — biggest UX win, removes copy-paste friction entirely
