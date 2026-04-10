import { DatabaseSync, type SQLInputValue } from 'node:sqlite'
import path from 'node:path'

const globalForDb = globalThis as unknown as { __touchbaseDb: DatabaseSync }

export function getDb(): DatabaseSync {
  if (!globalForDb.__touchbaseDb) {
    const dbPath = process.env.VERCEL === '1'
      ? '/tmp/touchbase.db'
      : path.join(process.cwd(), 'touchbase.db')
    globalForDb.__touchbaseDb = new DatabaseSync(dbPath, {
      enableForeignKeyConstraints: true,
    })
    globalForDb.__touchbaseDb.exec('PRAGMA journal_mode = WAL')
    initializeSchema(globalForDb.__touchbaseDb)
    seedIfEmpty(globalForDb.__touchbaseDb)
  }
  return globalForDb.__touchbaseDb
}

function initializeSchema(db: DatabaseSync) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS contacts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      company TEXT,
      how_met TEXT,
      notes TEXT,
      cadence_days INTEGER NOT NULL DEFAULT 30,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      color TEXT NOT NULL DEFAULT '#6366F1'
    );

    CREATE TABLE IF NOT EXISTS contact_tags (
      contact_id INTEGER NOT NULL,
      tag_id INTEGER NOT NULL,
      PRIMARY KEY (contact_id, tag_id),
      FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE,
      FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS interactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      contact_id INTEGER NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('call', 'text', 'email', 'in-person', 'other')),
      note TEXT,
      date TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_interactions_contact_id ON interactions(contact_id);
    CREATE INDEX IF NOT EXISTS idx_interactions_date ON interactions(date);
    CREATE INDEX IF NOT EXISTS idx_contact_tags_contact_id ON contact_tags(contact_id);
  `)
}

function seedIfEmpty(db: DatabaseSync) {
  const row = db.prepare('SELECT COUNT(*) as count FROM contacts').get() as { count: number }
  if (row.count > 0) return

  // ── Tags ──────────────────────────────────────────────────────────────────
  const insertTag = db.prepare('INSERT OR IGNORE INTO tags (name, color) VALUES (?, ?)')
  const tagDefs = [
    { name: 'investor',  color: '#7C3AED' },
    { name: 'friend',    color: '#10B981' },
    { name: 'colleague', color: '#3B82F6' },
    { name: 'client',    color: '#F59E0B' },
    { name: 'mentor',    color: '#EC4899' },
    { name: 'family',    color: '#EF4444' },
  ]

  const tagIds: Record<string, number> = {}
  for (const tag of tagDefs) {
    const result = insertTag.run(tag.name, tag.color)
    tagIds[tag.name] = Number(result.lastInsertRowid)
  }

  // ── Contacts ──────────────────────────────────────────────────────────────
  const insertContact = db.prepare(`
    INSERT INTO contacts (name, email, phone, company, how_met, notes, cadence_days)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `)
  const insertContactTag = db.prepare(
    'INSERT OR IGNORE INTO contact_tags (contact_id, tag_id) VALUES (?, ?)',
  )
  const insertInteraction = db.prepare(`
    INSERT INTO interactions (contact_id, type, note, date)
    VALUES (?, ?, ?, ?)
  `)

  // Dates relative to 2026-03-31 for a realistic dashboard
  const contacts = [
    {
      name: 'Sarah Chen',
      email: 'sarah.chen@horizonvc.com',
      phone: '+1 (415) 555-0192',
      company: 'Horizon Ventures',
      how_met: 'Met at TechCrunch Disrupt 2024',
      notes:
        'Interested in B2B SaaS deals. Very well connected in the SF startup scene. Prefers email over calls. Always asks about traction metrics.',
      cadence_days: 90,
      tags: ['investor'],
      interactions: [
        { type: 'email',     note: 'Sent Q4 update deck. She replied with positive feedback and asked about runway.',   date: '2025-12-21' },
        { type: 'in-person', note: 'Coffee at Blue Bottle in SF. Discussed Series A timing and market conditions.',     date: '2025-09-15' },
        { type: 'email',     note: 'Introduced her to the team via email after initial meeting.',                       date: '2025-06-20' },
      ],
    },
    {
      name: 'Marcus Johnson',
      email: 'marcus.j@gmail.com',
      phone: '+1 (312) 555-0847',
      company: null,
      how_met: 'College roommate at University of Michigan',
      notes:
        "Works at a hedge fund in Chicago. Always up for dinner when I'm in town. Just got promoted to VP. His partner Emma is an architect.",
      cadence_days: 30,
      tags: ['friend'],
      interactions: [
        { type: 'call',      note: 'Quick catch-up. He just got promoted to VP — great news!',          date: '2026-02-24' },
        { type: 'text',      note: 'Sent him a happy birthday message.',                                date: '2026-01-12' },
        { type: 'in-person', note: 'Dinner in Chicago during my trip. Great to catch up in person.',   date: '2025-11-30' },
      ],
    },
    {
      name: 'Alex Rivera',
      email: 'alex@pixelandco.io',
      phone: '+1 (646) 555-0234',
      company: 'Pixel & Co Design',
      how_met: 'Worked together at Stripe 2021–2023',
      notes:
        'Incredible product designer, now freelancing. Good person to bring in on design challenges. Very responsive over email.',
      cadence_days: 14,
      tags: ['colleague'],
      interactions: [
        { type: 'email',     note: 'Shared a design systems article. He had great feedback and offered to consult.', date: '2026-03-21' },
        { type: 'in-person', note: "Lunch in SoHo. He's working on an exciting new fintech product.",               date: '2026-03-07' },
        { type: 'call',      note: 'Caught up on his freelance work and discussed a potential collaboration.',       date: '2026-02-20' },
      ],
    },
    {
      name: 'Jordan Kim',
      email: 'jordan.kim@acmecorp.com',
      phone: '+1 (213) 555-0661',
      company: 'Acme Corp',
      how_met: 'Intro from David Park at a product networking event in LA',
      notes:
        'Head of Digital Transformation at Acme. Key decision-maker for our enterprise contract. Renewal under review for Q2 2026.',
      cadence_days: 7,
      tags: ['client'],
      interactions: [
        { type: 'call',  note: 'Weekly sync. Contract renewal looks very likely for Q2. Legal review in progress.', date: '2026-03-29' },
        { type: 'email', note: 'Sent revised proposal with updated pricing. Awaiting legal sign-off.',              date: '2026-03-22' },
        { type: 'call',  note: 'Discovery call — mapped out their integration requirements.',                       date: '2026-03-15' },
      ],
    },
    {
      name: 'Dr. Emily Foster',
      email: 'efoster@stanford.edu',
      phone: '+1 (650) 555-0128',
      company: 'Stanford Graduate School of Business',
      how_met: 'She was my MBA advisor — stayed in touch since graduating in 2022',
      notes:
        "Professor of Entrepreneurship. Brilliant sounding board for strategic decisions. Keep meetings brief — she's extremely busy but always makes time.",
      cadence_days: 30,
      tags: ['mentor'],
      interactions: [
        { type: 'email', note: 'Asked for advice on co-founder equity split. She shared excellent frameworks.',   date: '2026-03-06' },
        { type: 'call',  note: '30-min call. Discussed go-to-market strategy and hiring plan for Q2.',           date: '2026-01-20' },
        { type: 'email', note: 'Shared my annual review doc for feedback. Her response was invaluable.',         date: '2025-12-10' },
      ],
    },
    {
      name: 'Tom Bradley',
      email: 'tombradley@outlook.com',
      phone: '+1 (503) 555-0399',
      company: 'Bradley Woodworks',
      how_met: "Neighbors in Portland — met at the block party in 2020",
      notes:
        "Runs a custom woodworking business. Great perspective outside of tech. His wife Rachel and our family are close. Hosts great summer BBQs.",
      cadence_days: 90,
      tags: ['friend'],
      interactions: [
        { type: 'in-person', note: 'BBQ at his place. Great evening with the families.',                date: '2026-02-14' },
        { type: 'call',      note: "New Year catch-up. He's expanding his workshop space.",             date: '2026-01-01' },
        { type: 'text',      note: 'Checked in after he mentioned a minor health scare.',               date: '2025-11-15' },
      ],
    },
  ]

  db.exec('BEGIN')
  try {
    for (const contact of contacts) {
      const result = insertContact.run(
        contact.name,
        contact.email ?? null,
        contact.phone ?? null,
        contact.company ?? null,
        contact.how_met ?? null,
        contact.notes ?? null,
        contact.cadence_days,
      )
      const contactId = Number(result.lastInsertRowid)

      for (const tagName of contact.tags) {
        if (tagIds[tagName]) insertContactTag.run(contactId, tagIds[tagName])
      }

      for (const interaction of contact.interactions) {
        insertInteraction.run(contactId, interaction.type, interaction.note, interaction.date)
      }
    }
    db.exec('COMMIT')
  } catch (err) {
    db.exec('ROLLBACK')
    throw err
  }
}

// ── Query helpers ──────────────────────────────────────────────────────────────

export function getContactsQuery(
  db: DatabaseSync,
  filter?: { q?: string; tagId?: number },
): unknown[] {
  let sql = `
    SELECT
      c.*,
      MAX(i.date)  AS last_interaction_date,
      CAST(JULIANDAY('now') - JULIANDAY(COALESCE(MAX(i.date), c.created_at)) AS INTEGER) AS days_since,
      CAST(JULIANDAY('now') - JULIANDAY(COALESCE(MAX(i.date), c.created_at)) - c.cadence_days AS REAL) AS days_overdue,
      GROUP_CONCAT(DISTINCT t.id)    AS tag_ids,
      GROUP_CONCAT(DISTINCT t.name)  AS tag_names,
      GROUP_CONCAT(DISTINCT t.color) AS tag_colors
    FROM contacts c
    LEFT JOIN interactions  i  ON i.contact_id  = c.id
    LEFT JOIN contact_tags  ct ON ct.contact_id = c.id
    LEFT JOIN tags          t  ON t.id          = ct.tag_id
  `
  const conditions: string[] = []
  const params: SQLInputValue[] = []

  if (filter?.q) {
    conditions.push('(c.name LIKE ? OR c.company LIKE ? OR c.email LIKE ?)')
    const q = `%${filter.q}%`
    params.push(q, q, q)
  }
  if (filter?.tagId) {
    conditions.push('c.id IN (SELECT contact_id FROM contact_tags WHERE tag_id = ?)')
    params.push(filter.tagId)
  }

  if (conditions.length > 0) sql += ` WHERE ${conditions.join(' AND ')}`
  sql += ' GROUP BY c.id ORDER BY c.name COLLATE NOCASE ASC'

  return db.prepare(sql).all(...params)
}

export function getContactByIdQuery(db: DatabaseSync, id: number): unknown {
  return db
    .prepare(
      `SELECT
        c.*,
        MAX(i.date)  AS last_interaction_date,
        CAST(JULIANDAY('now') - JULIANDAY(COALESCE(MAX(i.date), c.created_at)) AS INTEGER) AS days_since,
        CAST(JULIANDAY('now') - JULIANDAY(COALESCE(MAX(i.date), c.created_at)) - c.cadence_days AS REAL) AS days_overdue,
        GROUP_CONCAT(DISTINCT t.id)    AS tag_ids,
        GROUP_CONCAT(DISTINCT t.name)  AS tag_names,
        GROUP_CONCAT(DISTINCT t.color) AS tag_colors
      FROM contacts c
      LEFT JOIN interactions  i  ON i.contact_id  = c.id
      LEFT JOIN contact_tags  ct ON ct.contact_id = c.id
      LEFT JOIN tags          t  ON t.id          = ct.tag_id
      WHERE c.id = ?
      GROUP BY c.id`,
    )
    .get(id)
}
