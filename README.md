# TouchBase

A local-first personal CRM to help you stay in touch with the people who matter.

TouchBase tracks your contacts, logs interactions, and nudges you when someone is overdue for a check-in — all without sending your data to the cloud.

## Why I built it

Most CRMs are designed for sales teams. I wanted something simple for personal relationships: a place to remember how I met someone, what we last talked about, and when I should reach out again. TouchBase runs entirely on your machine using Node.js's built-in SQLite — no database server, no accounts, no subscriptions.

## Architecture

- **Framework:** Next.js 14 (App Router, server components)
- **Database:** `node:sqlite` (Node 22+ built-in SQLite)
- **Styling:** Tailwind CSS with custom design tokens
- **Icons:** Lucide React
- **Data model:** Contacts, tags, and timestamped interactions with configurable check-in cadences

All data lives in a single `touchbase.db` file in the project root. No external services required.

## Features

- Dashboard with overdue/upcoming contact reminders
- Full CRUD for contacts with tags, notes, and custom cadences
- Interaction logging (calls, texts, emails, in-person, other)
- Search and filter by name, company, or tag
- Seed data for instant demo

## Getting started

```bash
# Requires Node.js 22+
node --version  # should print v22.x or higher

# Clone and install
git clone https://github.com/YOUR_USERNAME/touchbase.git
cd touchbase
npm install

# Run locally
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The database auto-creates with sample contacts on first run.

## Live demo

A stateless demo runs on Vercel. Data resets on each cold start — run locally for persistence.

## Tech decisions

| Choice | Rationale |
|--------|-----------|
| `node:sqlite` | Zero-dependency persistence, ships with Node 22+ |
| Server components | Data fetching at the component level, no client-side waterfall |
| `force-dynamic` | SQLite reads are fast; always-fresh data is worth the tradeoff |
| `/tmp` on Vercel | Serverless has no writable project dir; `/tmp` works for demo purposes |

## License

MIT
