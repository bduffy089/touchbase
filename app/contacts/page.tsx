export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { Plus, UserX } from 'lucide-react'
import { Suspense } from 'react'
import { getDb, getContactsQuery } from '@/lib/db'
import { parseTagsFromRow, formatDaysAgo, formatCadence } from '@/lib/utils'
import TagBadge from '@/components/TagBadge'
import Avatar from '@/components/Avatar'
import SearchFilter from '@/components/SearchFilter'
import type { ContactWithStatus } from '@/types'

interface PageProps {
  searchParams: { q?: string; tagId?: string }
}

export default function ContactsPage({ searchParams }: PageProps) {
  const db = getDb()
  const { q = '', tagId = '' } = searchParams

  const rows = getContactsQuery(db, {
    q: q || undefined,
    tagId: tagId ? parseInt(tagId) : undefined,
  }) as any[]

  const contacts = rows.map((r) => ({ ...r, tags: parseTagsFromRow(r) })) as ContactWithStatus[]
  const allTags = (db.prepare('SELECT * FROM tags ORDER BY name COLLATE NOCASE ASC').all() as any[]).map((t) => ({ ...t }))

  return (
    <div className="px-8 py-8">
      <div className="max-w-5xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-sand-900 tracking-tight">Contacts</h1>
            <p className="text-sand-500 text-sm mt-1">
              {contacts.length} contact{contacts.length !== 1 ? 's' : ''}
              {q && ` matching "${q}"`}
            </p>
          </div>
          <Link
            href="/contacts/new"
            className="flex items-center gap-2 px-4 py-2 bg-brand-500 text-white rounded-xl text-sm font-semibold hover:bg-brand-600 transition-colors"
          >
            <Plus size={16} />
            Add Contact
          </Link>
        </div>

        {/* Search + Filter */}
        <div className="mb-6">
          <Suspense>
            <SearchFilter tags={allTags} currentQ={q} currentTagId={tagId} />
          </Suspense>
        </div>

        {/* Contacts grid */}
        {contacts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {contacts.map((contact) => (
              <ContactCard key={contact.id} contact={contact} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <UserX size={40} className="text-sand-300 mx-auto mb-3" />
            <p className="font-medium text-sand-600">No contacts found</p>
            {(q || tagId) ? (
              <p className="text-sm text-sand-400 mt-1">
                Try adjusting your search or filter.
              </p>
            ) : (
              <Link
                href="/contacts/new"
                className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-brand-500 text-white rounded-xl text-sm font-semibold hover:bg-brand-600 transition-colors"
              >
                <Plus size={16} />
                Add your first contact
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function ContactCard({ contact }: { contact: ContactWithStatus }) {
  const isOverdue = contact.days_overdue > 0
  const isUpcoming = contact.days_overdue <= 0 && contact.days_overdue > -7

  const statusColor = isOverdue
    ? 'bg-rose-50 text-rose-600'
    : isUpcoming
      ? 'bg-amber-50 text-amber-600'
      : 'bg-emerald-50 text-emerald-600'

  const statusText = isOverdue
    ? `${Math.round(contact.days_overdue)}d overdue`
    : isUpcoming
      ? contact.days_overdue === 0
        ? 'Due today'
        : `Due in ${Math.abs(Math.round(contact.days_overdue))}d`
      : 'Up to date'

  return (
    <Link
      href={`/contacts/${contact.id}`}
      className="bg-white rounded-xl border border-sand-100 shadow-card p-4 hover:shadow-card-hover hover:border-sand-200 transition-all group flex flex-col gap-3"
    >
      <div className="flex items-start gap-3">
        <Avatar name={contact.name} size="md" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-sand-900 group-hover:text-brand-600 transition-colors truncate">
            {contact.name}
          </p>
          {contact.company && (
            <p className="text-xs text-sand-500 truncate mt-0.5">{contact.company}</p>
          )}
        </div>
      </div>

      {/* Tags */}
      {contact.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {contact.tags.slice(0, 3).map((tag) => (
            <TagBadge key={tag.id} tag={tag} />
          ))}
          {contact.tags.length > 3 && (
            <span className="text-[11px] text-sand-400 px-1.5 py-0.5">+{contact.tags.length - 3}</span>
          )}
        </div>
      )}

      <div className="flex items-center justify-between pt-1 border-t border-sand-50">
        <div className="text-xs text-sand-400">
          {contact.last_interaction_date
            ? formatDaysAgo(contact.days_since)
            : 'Never contacted'}
        </div>
        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${statusColor}`}>
          {statusText}
        </span>
      </div>
    </Link>
  )
}
