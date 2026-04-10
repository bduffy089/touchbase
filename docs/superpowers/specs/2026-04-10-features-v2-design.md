# TouchBase Features v2 — Design Spec

**Date:** 2026-04-10
**Status:** Approved
**Build order:** Command Palette → AI Message Suggestions → LinkedIn Import

---

## Overview

Three features to elevate TouchBase from a functional CRM into a portfolio-defining project:

1. **Cmd+K Command Palette** — global keyboard-driven overlay for search, navigation, and quick actions
2. **AI Message Suggestions** — context-aware message drafts for overdue contacts across LinkedIn, email, and text channels
3. **LinkedIn Import** — paste LinkedIn profile text, AI parses it into contacts with editable preview and bulk import

All features share a common AI backend (`/api/ai`) powered by Vercel AI SDK + Anthropic Claude. AI features degrade gracefully when no API key is configured.

---

## Dependencies

### New packages
- `ai` (Vercel AI SDK)
- `@ai-sdk/anthropic` (Anthropic provider for Vercel AI SDK)

### Environment variables
- `ANTHROPIC_API_KEY` — required for AI features, optional for app to function
- Existing `NEXT_PUBLIC_DEMO_MODE` unchanged

---

## Feature 1: Command Palette

### Component
`components/CommandPalette.tsx` — client component rendered in `app/layout.tsx`

### Trigger
- `Cmd+K` (macOS) / `Ctrl+K` (Windows/Linux)
- Global keydown listener registered in layout

### UI States

**Default (empty query):**
- Quick Actions group: Add new contact, Log interaction, Import from LinkedIn
- Navigate group: Dashboard, All Contacts

**Searching (typing):**
- Contacts group: fuzzy-matched results showing avatar, name, company, tags, overdue status
- Actions group: contextual actions based on matched contacts (e.g., "Log interaction with Sarah Chen")
- Pages group: navigation items matching query

### Behavior
- Opens as a centered modal with backdrop blur
- Dark theme matching sidebar aesthetic (sand-950 background)
- Arrow keys navigate results, Enter selects, Escape closes
- Clicking backdrop closes
- Results grouped with section headers: Contacts → Actions → Pages
- Fuzzy search across contact name, company, email

### Data
- Fetches all contacts from `GET /api/contacts` on open
- Contacts cached client-side for the duration the palette is open
- Fuzzy matching performed client-side for instant filtering (no API roundtrip per keystroke)

### Actions
| Action | Behavior |
|--------|----------|
| Select a contact | Navigate to `/contacts/[id]` |
| Add new contact | Navigate to `/contacts/new` |
| Log interaction | Navigate to selected contact's page with modal auto-opened (via query param `?log=true`) |
| Import from LinkedIn | Navigate to `/contacts/import` |
| Dashboard / Contacts | Navigate to `/` or `/contacts` |

### Keyboard shortcut hint
Footer bar showing `↑↓ navigate`, `↵ select`, `esc close`

---

## Feature 2: AI Message Suggestions

### Trigger
"Suggest message" button on the contact detail page (`app/contacts/[id]/page.tsx`), visible only when `ANTHROPIC_API_KEY` is configured.

### UI Flow

1. User clicks "✨ Suggest message" on a contact's detail page
2. Suggestion panel expands below the contact hero card
3. Channel tabs: LinkedIn (default), Email, Text
4. Message streams in via Vercel AI SDK with typing cursor animation
5. Actions: Copy to clipboard, Regenerate
6. "Context used" footer shows what data informed the draft (tags, last interaction, how_met, cadence)

### API

**Endpoint:** `POST /api/ai`

**Request:**
```json
{
  "action": "suggest-message",
  "contactId": 1,
  "channel": "linkedin"
}
```

**Server-side flow:**
1. Validate `ANTHROPIC_API_KEY` exists, return 503 if not
2. Fetch contact + last 3 interactions + tags from SQLite
3. Build prompt with contact context
4. Stream response via Vercel AI SDK `streamText`

**Prompt strategy:**
- System prompt: "You write warm, authentic messages to reconnect with people. Never salesy. Match the tone to the channel and relationship."
- Channel shapes format:
  - LinkedIn: short, casual, 2-4 sentences
  - Email: subject line + body, slightly more formal
  - Text: brief, informal, 1-2 sentences
- Context injected: name, company, tags, how_met, notes, last 3 interactions (type + note + date), cadence, days overdue
- Output: just the message text, no preamble or explanation

### Client-side
- `useCompletion` from `ai/react` for streaming (single prompt → single response, not conversational)
- Loading state: pulsing dot + cursor animation
- Copy button uses `navigator.clipboard.writeText`
- Regenerate sends the same request (new completion)

### Graceful degradation
- Server-side check: `process.env.ANTHROPIC_API_KEY` exists
- Pass `hasAI` flag to client via a lightweight `GET /api/ai/status` endpoint (or inline in page data)
- No key → "Suggest message" button not rendered

---

## Feature 3: LinkedIn Import

### Route
`/contacts/import` — new page at `app/contacts/import/page.tsx`

### Navigation entry points
- Command palette: "Import from LinkedIn" action
- Contacts list page: button in header alongside "Add Contact"
- Sidebar: not in nav (too niche), accessible via command palette

### UI Flow

**Step 1: Paste**
- Instructions card explaining how to copy from LinkedIn (Cmd+A → Cmd+C on a profile page)
- Large textarea / drop-zone with placeholder text
- "Parse with AI ✨" button (disabled until text is pasted)
- Footer: "Powered by Claude · Your data stays local"

**Step 2: Preview**
- Header: "N contacts parsed" with "← Paste again" button
- Contact cards showing parsed fields:
  - Name (required)
  - Title/role (informational, not stored separately — goes into notes)
  - Company
  - Location (informational — not in current schema, goes into notes)
  - AI-extracted notes: career highlights, education, notable context
- Each field is editable inline (click to edit)
- Status per contact: ✓ Ready or ⚠ Missing name
- "Import N contacts" button

**Step 3: Success**
- Confirmation with count
- "View contacts" and "Import more" buttons

### API

**Endpoint:** `POST /api/ai`

**Request:**
```json
{
  "action": "parse-linkedin",
  "text": "... pasted LinkedIn content ..."
}
```

**Server-side flow:**
1. Validate API key exists
2. Send text to Claude with structured output prompt
3. Return JSON (not streamed — single parse, display results)

**Prompt strategy:**
- System prompt: "Extract contact information from LinkedIn profile text. Return structured JSON."
- Output schema:
```json
{
  "contacts": [
    {
      "name": "Jessica Park",
      "company": "Notion",
      "notes": "Senior Product Manager. Previously at Google and Stripe. Stanford MBA '21. Focuses on growth and B2B product strategy."
    }
  ]
}
```
- Notes field: AI summarizes the most useful CRM context from career history, education, headline
- Handles single or multiple profiles in one paste

### Import flow
- Each confirmed contact is created via `POST /api/contacts` (existing endpoint)
- Sequential creation (not parallel) to handle potential errors per contact
- Failed imports show error inline, don't block others

### Graceful degradation
- No API key → page accessible but shows "AI parsing unavailable" message
- Fallback: manual bulk entry form with the same fields (name, company, notes)

---

## Shared AI Infrastructure

### Route: `/api/ai/route.ts`

Single route handling multiple actions via `action` field in request body.

```
POST /api/ai
├── action: "suggest-message" → streams text response
└── action: "parse-linkedin"  → returns JSON response
```

### Configuration
- Model: `claude-sonnet-4-6` (fast, good at structured tasks)
- API key: `process.env.ANTHROPIC_API_KEY`
- Error handling: 503 if no key, 400 if invalid action, 500 for API errors

### Status endpoint: `GET /api/ai/status`

Returns `{ available: boolean }` based on whether `ANTHROPIC_API_KEY` is configured. Used by client components to conditionally render AI features.

---

## Files to Create

| File | Purpose |
|------|---------|
| `components/CommandPalette.tsx` | Global command palette component |
| `app/contacts/import/page.tsx` | LinkedIn import page |
| `app/api/ai/route.ts` | Shared AI endpoint (suggest-message, parse-linkedin) |
| `app/api/ai/status/route.ts` | AI availability check |

## Files to Modify

| File | Change |
|------|--------|
| `app/layout.tsx` | Add CommandPalette component |
| `app/contacts/[id]/page.tsx` | Add "Suggest message" button + suggestion panel |
| `app/contacts/page.tsx` | Add "Import" button in header |
| `package.json` | Add `ai` and `@ai-sdk/anthropic` dependencies |

---

## Out of Scope

- LinkedIn API integration (no public API available)
- Persistent AI conversation history
- Email sending (copy to clipboard only)
- OAuth with LinkedIn
- Contact deduplication on import
- Rich text in messages
