export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { Phone, Mail, MessageSquare, Users, MoreHorizontal, ArrowRight, Calendar, Zap } from 'lucide-react'
import { getDb, getContactsQuery } from '@/lib/db'
import { parseTagsFromRow, formatDaysAgo, formatCadence } from '@/lib/utils'
import TagBadge from '@/components/TagBadge'
import Avatar from '@/components/Avatar'
import type { ContactWithStatus, InteractionWithContact } from '@/types'

const INTERACTION_ICONS = {
  call:       <Phone size={13} />,
  email:      <Mail size={13} />,
  text:       <MessageSquare size={13} />,
  'in-person': <Users size={13} />,
  other:      <MoreHorizontal size={13} />,
}

export default async function DashboardPage() {
  const db = await getDb()

  const rows = (await getContactsQuery(db)) as any[]
  const contacts = rows.map((r) => ({ ...r, tags: parseTagsFromRow(r) })) as ContactWithStatus[]

  const overdueContacts = contacts
    .filter((c) => c.days_overdue > 0)
    .sort((a, b) => b.days_overdue - a.days_overdue)

  const upcomingContacts = contacts
    .filter((c) => c.days_overdue <= 0 && c.days_overdue > -7)
    .sort((a, b) => b.days_overdue - a.days_overdue)

  const totalContacts = contacts.length

  const recentInteractions = (await db
    .prepare(
      `SELECT i.*, c.name AS contact_name
       FROM interactions i
       JOIN contacts c ON c.id = i.contact_id
       ORDER BY i.date DESC, i.created_at DESC
       LIMIT 8`,
    )
    .all()) as unknown as InteractionWithContact[]

  return (
    <div className="px-8 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-sand-900 dark:text-white tracking-tight">Dashboard</h1>
        <p className="text-sand-500 dark:text-sand-400 text-sm mt-1">
          {overdueContacts.length > 0
            ? `${overdueContacts.length} contact${overdueContacts.length > 1 ? 's' : ''} need your attention`
            : 'You\'re all caught up!'}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white dark:bg-sand-900/50 rounded-xl p-4 border border-sand-200 dark:border-white/[0.06]">
          <div className="text-2xl font-bold text-sand-900 dark:text-white">{totalContacts}</div>
          <div className="text-sm text-sand-500 dark:text-sand-400 mt-0.5">Total contacts</div>
        </div>
        <div className={`rounded-xl p-4 border ${
          overdueContacts.length > 0
            ? 'bg-rose-500/10 border-rose-500/20'
            : 'bg-white dark:bg-sand-900/50 border-sand-200 dark:border-white/[0.06]'
        }`}>
          <div className={`text-2xl font-bold ${overdueContacts.length > 0 ? 'text-rose-400' : 'text-sand-900 dark:text-white'}`}>
            {overdueContacts.length}
          </div>
          <div className={`text-sm mt-0.5 ${overdueContacts.length > 0 ? 'text-rose-400/70' : 'text-sand-500 dark:text-sand-400'}`}>
            Overdue
          </div>
        </div>
        <div className={`rounded-xl p-4 border ${
          upcomingContacts.length > 0
            ? 'bg-amber-500/10 border-amber-500/20'
            : 'bg-white dark:bg-sand-900/50 border-sand-200 dark:border-white/[0.06]'
        }`}>
          <div className={`text-2xl font-bold ${upcomingContacts.length > 0 ? 'text-amber-400' : 'text-sand-900 dark:text-white'}`}>
            {upcomingContacts.length}
          </div>
          <div className={`text-sm mt-0.5 ${upcomingContacts.length > 0 ? 'text-amber-400/70' : 'text-sand-500 dark:text-sand-400'}`}>
            Due this week
          </div>
        </div>
      </div>

      {/* Overdue */}
      {overdueContacts.length > 0 && (
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <Zap size={15} className="text-rose-400" />
            <h2 className="text-xs font-semibold text-sand-500 dark:text-sand-400 uppercase tracking-wider">Overdue</h2>
          </div>
          <div className="space-y-2">
            {overdueContacts.map((contact) => (
              <ContactRow key={contact.id} contact={contact} status="overdue" />
            ))}
          </div>
        </section>
      )}

      {/* Upcoming */}
      {upcomingContacts.length > 0 && (
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <Calendar size={15} className="text-amber-400" />
            <h2 className="text-xs font-semibold text-sand-500 dark:text-sand-400 uppercase tracking-wider">Due this week</h2>
          </div>
          <div className="space-y-2">
            {upcomingContacts.map((contact) => (
              <ContactRow key={contact.id} contact={contact} status="upcoming" />
            ))}
          </div>
        </section>
      )}

      {/* Empty state */}
      {overdueContacts.length === 0 && upcomingContacts.length === 0 && totalContacts > 0 && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-6 text-center mb-8">
          <div className="text-3xl mb-2">🎉</div>
          <p className="font-medium text-emerald-400">You're all caught up!</p>
          <p className="text-sm text-emerald-400/70 mt-1">No contacts overdue or due this week.</p>
        </div>
      )}

      {/* Recent Activity */}
      {recentInteractions.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold text-sand-500 dark:text-sand-400 uppercase tracking-wider">Recent activity</h2>
            <Link href="/contacts" className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1 font-medium transition-colors">
              All contacts <ArrowRight size={12} />
            </Link>
          </div>
          <div className="bg-white dark:bg-sand-900/50 rounded-xl border border-sand-200 dark:border-white/[0.06] divide-y divide-sand-100 dark:divide-white/[0.04]">
            {recentInteractions.map((interaction) => (
              <div key={interaction.id} className="flex items-start gap-3 px-4 py-3">
                <div className="w-7 h-7 rounded-full bg-sand-100 dark:bg-white/[0.06] flex items-center justify-center text-sand-500 dark:text-sand-400 shrink-0 mt-0.5">
                  {INTERACTION_ICONS[interaction.type]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <Link
                      href={`/contacts/${interaction.contact_id}`}
                      className="text-sm font-medium text-sand-800 dark:text-sand-100 hover:text-brand-400 transition-colors"
                    >
                      {interaction.contact_name}
                    </Link>
                    <span className="text-xs text-sand-500 capitalize">{interaction.type.replace('-', ' ')}</span>
                  </div>
                  {interaction.note && (
                    <p className="text-sm text-sand-500 mt-0.5 truncate">{interaction.note}</p>
                  )}
                </div>
                <span className="text-xs text-sand-500 shrink-0 mt-0.5">{formatDate(interaction.date)}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {totalContacts === 0 && (
        <div className="text-center py-20">
          <div className="text-5xl mb-4">👋</div>
          <h2 className="text-xl font-semibold text-sand-900 dark:text-white mb-2">Welcome to TouchBase</h2>
          <p className="text-sand-500 dark:text-sand-400 mb-6">Start by adding your first contact.</p>
          <Link
            href="/contacts/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-500 text-white rounded-xl text-sm font-semibold hover:bg-brand-600 transition-colors"
          >
            Add your first contact
          </Link>
        </div>
      )}
    </div>
  )
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function ContactRow({ contact, status }: { contact: ContactWithStatus; status: 'overdue' | 'upcoming' }) {
  const daysLabel =
    status === 'overdue'
      ? `${Math.round(contact.days_overdue)}d overdue`
      : contact.days_overdue === 0
        ? 'Due today'
        : `Due in ${Math.abs(Math.round(contact.days_overdue))}d`

  return (
    <Link
      href={`/contacts/${contact.id}`}
      className="flex items-center gap-3 bg-white dark:bg-sand-900/50 rounded-xl border border-sand-200 dark:border-white/[0.06] px-4 py-3 hover:border-brand-500/30 hover:bg-sand-50 dark:hover:bg-sand-800/60 transition-all group"
    >
      <Avatar name={contact.name} size="sm" />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-sand-800 dark:text-sand-100 group-hover:text-sand-900 dark:group-hover:text-white transition-colors">
            {contact.name}
          </span>
          {contact.tags.slice(0, 2).map((tag) => (
            <TagBadge key={tag.id} tag={tag} />
          ))}
        </div>
        <div className="text-xs text-sand-500 mt-0.5">
          {contact.company && <span>{contact.company} · </span>}
          <span>{formatCadence(contact.cadence_days)}</span>
          {contact.last_interaction_date && (
            <span> · Last: {formatDaysAgo(contact.days_since)}</span>
          )}
        </div>
      </div>

      <div className={`text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${
        status === 'overdue'
          ? 'bg-rose-500/15 text-rose-400'
          : 'bg-amber-500/15 text-amber-400'
      }`}>
        {daysLabel}
      </div>

      <ArrowRight size={14} className="text-sand-400 dark:text-sand-600 group-hover:text-brand-400 transition-colors shrink-0" />
    </Link>
  )
}
