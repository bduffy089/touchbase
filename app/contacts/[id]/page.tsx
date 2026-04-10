'use client'

import { useState, useEffect } from 'react'
import { useParams, notFound } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, Mail, Phone, Building2, MessageCircle,
  Edit2, CalendarClock, Handshake,
  PhoneCall, MessageSquare, MailIcon, Users, MoreHorizontal, Plus,
} from 'lucide-react'
import TagBadge from '@/components/TagBadge'
import Avatar from '@/components/Avatar'
import DeleteContactButton from '@/components/DeleteContactButton'
import DeleteInteractionButton from '@/components/DeleteInteractionButton'
import InteractionModal from '@/components/InteractionModal'
import { formatDate, formatCadence, formatDaysAgo } from '@/lib/utils'
import type { ContactWithStatus, Interaction } from '@/types'

const INTERACTION_ICONS: Record<string, React.ReactNode> = {
  call:        <PhoneCall size={14} />,
  email:       <MailIcon size={14} />,
  text:        <MessageSquare size={14} />,
  'in-person': <Users size={14} />,
  other:       <MoreHorizontal size={14} />,
}

const INTERACTION_COLORS: Record<string, string> = {
  call:        'bg-blue-100 text-blue-600',
  email:       'bg-violet-100 text-violet-600',
  text:        'bg-emerald-100 text-emerald-600',
  'in-person': 'bg-amber-100 text-amber-600',
  other:       'bg-sand-100 text-sand-500',
}

export default function ContactDetailPage() {
  const params = useParams()
  const id = params?.id as string

  const [contact, setContact] = useState<ContactWithStatus | null>(null)
  const [interactions, setInteractions] = useState<Interaction[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)

  async function load() {
    try {
      const [contactRes, interactionsRes] = await Promise.all([
        fetch(`/api/contacts/${id}`),
        fetch(`/api/contacts/${id}/interactions`),
      ])
      if (!contactRes.ok) return
      const c = await contactRes.json()
      const ints = interactionsRes.ok ? await interactionsRes.json() : []
      setContact(c)
      setInteractions(ints)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [id])

  if (loading) {
    return (
      <div className="px-8 py-8">
        <div className="animate-pulse space-y-4 max-w-3xl">
          <div className="h-6 bg-sand-200 rounded w-32" />
          <div className="h-20 bg-sand-100 rounded-2xl" />
          <div className="h-40 bg-sand-100 rounded-2xl" />
        </div>
      </div>
    )
  }

  if (!contact) {
    return (
      <div className="px-8 py-8">
        <p className="text-sand-500">Contact not found.</p>
        <Link href="/contacts" className="text-brand-500 text-sm mt-2 inline-block">← Back to contacts</Link>
      </div>
    )
  }

  const isOverdue = contact.days_overdue > 0
  const isUpcoming = !isOverdue && contact.days_overdue > -7

  const statusText = isOverdue
    ? `${Math.round(contact.days_overdue)} days overdue`
    : isUpcoming
      ? contact.days_overdue === 0
        ? 'Due today'
        : `Due in ${Math.abs(Math.round(contact.days_overdue))} days`
      : 'Up to date'

  const statusStyle = isOverdue
    ? 'bg-rose-100 text-rose-600'
    : isUpcoming
      ? 'bg-amber-100 text-amber-600'
      : 'bg-emerald-100 text-emerald-600'

  return (
    <div className="px-8 py-8 max-w-3xl">
      {/* Back */}
      <Link
        href="/contacts"
        className="inline-flex items-center gap-1.5 text-sm text-sand-500 hover:text-sand-700 transition-colors mb-6"
      >
        <ArrowLeft size={15} />
        All contacts
      </Link>

      {/* Hero card */}
      <div className="bg-white rounded-2xl border border-sand-100 shadow-card p-6 mb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <Avatar name={contact.name} size="xl" />
            <div>
              <h1 className="text-xl font-bold text-sand-900 tracking-tight">{contact.name}</h1>
              {contact.company && (
                <p className="text-sand-500 text-sm mt-0.5 flex items-center gap-1.5">
                  <Building2 size={13} />
                  {contact.company}
                </p>
              )}
              <div className="flex flex-wrap gap-1.5 mt-2">
                {contact.tags.map((tag) => (
                  <TagBadge key={tag.id} tag={tag} size="md" />
                ))}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors"
            >
              <Plus size={14} />
              Log
            </button>
            <Link
              href={`/contacts/${contact.id}/edit`}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-sand-600 hover:text-sand-800 hover:bg-sand-100 rounded-lg transition-colors border border-sand-200"
            >
              <Edit2 size={14} />
              Edit
            </Link>
            <DeleteContactButton contactId={contact.id} contactName={contact.name} />
          </div>
        </div>

        {/* Status bar */}
        <div className="mt-4 pt-4 border-t border-sand-100 flex items-center gap-3 flex-wrap text-sm">
          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusStyle}`}>
            {statusText}
          </span>
          <span className="text-sand-400">·</span>
          <span className="text-sand-500 flex items-center gap-1.5">
            <CalendarClock size={13} />
            {formatCadence(contact.cadence_days)}
          </span>
          {contact.last_interaction_date && (
            <>
              <span className="text-sand-400">·</span>
              <span className="text-sand-500">Last contact: {formatDaysAgo(contact.days_since)}</span>
            </>
          )}
        </div>
      </div>

      {/* Contact info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        {contact.email && (
          <a
            href={`mailto:${contact.email}`}
            className="flex items-center gap-3 bg-white rounded-xl border border-sand-100 shadow-card px-4 py-3 hover:border-sand-200 transition-colors group"
          >
            <div className="w-8 h-8 rounded-lg bg-sand-100 flex items-center justify-center text-sand-500 group-hover:bg-brand-100 group-hover:text-brand-600 transition-colors">
              <Mail size={14} />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] text-sand-400 font-medium uppercase tracking-wide">Email</p>
              <p className="text-sm text-sand-700 truncate">{contact.email}</p>
            </div>
          </a>
        )}
        {contact.phone && (
          <a
            href={`tel:${contact.phone}`}
            className="flex items-center gap-3 bg-white rounded-xl border border-sand-100 shadow-card px-4 py-3 hover:border-sand-200 transition-colors group"
          >
            <div className="w-8 h-8 rounded-lg bg-sand-100 flex items-center justify-center text-sand-500 group-hover:bg-brand-100 group-hover:text-brand-600 transition-colors">
              <Phone size={14} />
            </div>
            <div>
              <p className="text-[11px] text-sand-400 font-medium uppercase tracking-wide">Phone</p>
              <p className="text-sm text-sand-700">{contact.phone}</p>
            </div>
          </a>
        )}
        {contact.how_met && (
          <div className="flex items-center gap-3 bg-white rounded-xl border border-sand-100 shadow-card px-4 py-3 sm:col-span-2">
            <div className="w-8 h-8 rounded-lg bg-sand-100 flex items-center justify-center text-sand-500 shrink-0">
              <Handshake size={14} />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] text-sand-400 font-medium uppercase tracking-wide">How you met</p>
              <p className="text-sm text-sand-700">{contact.how_met}</p>
            </div>
          </div>
        )}
      </div>

      {/* Notes */}
      {contact.notes && (
        <div className="bg-white rounded-xl border border-sand-100 shadow-card p-4 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <MessageCircle size={13} className="text-sand-400" />
            <p className="text-[11px] font-medium uppercase tracking-wide text-sand-400">Notes</p>
          </div>
          <p className="text-sm text-sand-700 leading-relaxed whitespace-pre-wrap">{contact.notes}</p>
        </div>
      )}

      {/* Interaction history */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-sand-700 uppercase tracking-wider">Interaction history</h2>
          <button
            onClick={() => setShowModal(true)}
            className="text-xs text-brand-500 hover:text-brand-600 font-medium flex items-center gap-1 transition-colors"
          >
            <Plus size={12} />
            Log interaction
          </button>
        </div>

        {interactions.length > 0 ? (
          <div className="bg-white rounded-xl border border-sand-100 shadow-card divide-y divide-sand-50">
            {interactions.map((interaction) => (
              <div key={interaction.id} className="flex items-start gap-3 px-4 py-3.5 group">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${INTERACTION_COLORS[interaction.type]}`}>
                  {INTERACTION_ICONS[interaction.type]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-sand-700 capitalize">
                      {interaction.type.replace('-', ' ')}
                    </span>
                    <span className="text-xs text-sand-400">{formatDate(interaction.date)}</span>
                  </div>
                  {interaction.note && (
                    <p className="text-sm text-sand-600 mt-1 leading-relaxed">{interaction.note}</p>
                  )}
                </div>
                <DeleteInteractionButton interactionId={interaction.id} />
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-dashed border-sand-200 p-6 text-center">
            <p className="text-sm text-sand-400">No interactions logged yet.</p>
            <button
              onClick={() => setShowModal(true)}
              className="mt-2 text-sm text-brand-500 hover:text-brand-600 font-medium transition-colors"
            >
              Log your first interaction →
            </button>
          </div>
        )}
      </div>

      {showModal && (
        <InteractionModal
          contactId={contact.id}
          contactName={contact.name}
          onClose={() => { setShowModal(false); load() }}
        />
      )}
    </div>
  )
}
