'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, X } from 'lucide-react'
import type { Contact, Tag } from '@/types'

interface ContactFormProps {
  contact?: Contact & { tags: Tag[] }
}

const CADENCE_OPTIONS = [
  { label: 'Weekly',        value: 7 },
  { label: 'Every 2 weeks', value: 14 },
  { label: 'Monthly',       value: 30 },
  { label: 'Quarterly',     value: 90 },
  { label: 'Custom…',       value: -1 },
]

const STANDARD_VALUES = [7, 14, 30, 90]

export default function ContactForm({ contact }: ContactFormProps) {
  const router = useRouter()
  const isEditing = !!contact

  const initialCadence = contact?.cadence_days ?? 30
  const isStandardCadence = STANDARD_VALUES.includes(initialCadence)

  const [name, setName] = useState(contact?.name ?? '')
  const [email, setEmail] = useState(contact?.email ?? '')
  const [phone, setPhone] = useState(contact?.phone ?? '')
  const [company, setCompany] = useState(contact?.company ?? '')
  const [howMet, setHowMet] = useState(contact?.how_met ?? '')
  const [notes, setNotes] = useState(contact?.notes ?? '')
  const [cadencePreset, setCadencePreset] = useState(isStandardCadence ? initialCadence : -1)
  const [cadenceCustom, setCadenceCustom] = useState(isStandardCadence ? 30 : initialCadence)

  const [allTags, setAllTags] = useState<Tag[]>([])
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>(contact?.tags.map((t) => t.id) ?? [])
  const [newTagName, setNewTagName] = useState('')
  const [showNewTag, setShowNewTag] = useState(false)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/tags')
      .then((r) => r.json())
      .then(setAllTags)
      .catch(console.error)
  }, [])

  function toggleTag(tagId: number) {
    setSelectedTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId],
    )
  }

  async function handleAddTag() {
    const trimmed = newTagName.trim().toLowerCase()
    if (!trimmed) return
    try {
      const res = await fetch('/api/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmed }),
      })
      const tag = await res.json()
      if (res.ok) {
        setAllTags((prev) => [...prev, tag].sort((a, b) => a.name.localeCompare(b.name)))
        setSelectedTagIds((prev) => [...prev, tag.id])
        setNewTagName('')
        setShowNewTag(false)
      } else if (res.status === 409) {
        const existing = allTags.find((t) => t.name === trimmed)
        if (existing && !selectedTagIds.includes(existing.id)) {
          setSelectedTagIds((prev) => [...prev, existing.id])
        }
        setNewTagName('')
        setShowNewTag(false)
      }
    } catch (err) {
      console.error(err)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const cadence = cadencePreset === -1 ? cadenceCustom : cadencePreset

    const payload = {
      name: name.trim(),
      email: email.trim() || null,
      phone: phone.trim() || null,
      company: company.trim() || null,
      how_met: howMet.trim() || null,
      notes: notes.trim() || null,
      cadence_days: cadence,
      tagIds: selectedTagIds,
    }

    try {
      const url = isEditing ? `/api/contacts/${contact!.id}` : '/api/contacts'
      const method = isEditing ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Something went wrong')
      }

      const saved = await res.json()
      router.push(`/contacts/${saved.id}`)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const inputClass = "w-full px-3 py-2.5 border border-sand-200 dark:border-white/[0.08] rounded-xl text-sm text-sand-900 dark:text-sand-100 placeholder:text-sand-400 bg-white dark:bg-sand-900/50 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-colors"

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Name */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label htmlFor="name" className="block text-sm font-medium text-sand-700 dark:text-sand-300 mb-1.5">
            Name <span className="text-rose-500">*</span>
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="Full name"
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-sand-700 dark:text-sand-300 mb-1.5">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@example.com"
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-sand-700 dark:text-sand-300 mb-1.5">
            Phone
          </label>
          <input
            id="phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+1 (555) 000-0000"
            className={inputClass}
          />
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="company" className="block text-sm font-medium text-sand-700 dark:text-sand-300 mb-1.5">
            Company
          </label>
          <input
            id="company"
            type="text"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="Company or role"
            className={inputClass}
          />
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="how_met" className="block text-sm font-medium text-sand-700 dark:text-sand-300 mb-1.5">
            How you met
          </label>
          <input
            id="how_met"
            type="text"
            value={howMet}
            onChange={(e) => setHowMet(e.target.value)}
            placeholder="e.g. Conference, mutual friend, colleague at Acme"
            className={inputClass}
          />
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="notes" className="block text-sm font-medium text-sand-700 dark:text-sand-300 mb-1.5">
            Notes
          </label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            placeholder="Anything useful to remember about this person…"
            className={`${inputClass} resize-none`}
          />
        </div>
      </div>

      {/* Cadence */}
      <div>
        <label className="block text-sm font-medium text-sand-700 dark:text-sand-300 mb-2">
          Touch-base frequency
        </label>
        <div className="flex flex-wrap gap-2">
          {CADENCE_OPTIONS.map(({ label, value }) => (
            <button
              key={value}
              type="button"
              onClick={() => setCadencePreset(value)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                cadencePreset === value
                  ? 'bg-brand-500 text-white border-brand-500'
                  : 'bg-white dark:bg-sand-900/50 text-sand-600 dark:text-sand-300 border-sand-200 dark:border-white/[0.08] hover:border-sand-300 dark:hover:border-white/[0.12]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        {cadencePreset === -1 && (
          <div className="mt-2 flex items-center gap-2">
            <input
              type="number"
              min={1}
              max={365}
              value={cadenceCustom}
              onChange={(e) => setCadenceCustom(parseInt(e.target.value) || 30)}
              className="w-20 px-3 py-2 border border-sand-200 dark:border-white/[0.08] rounded-xl text-sm text-sand-900 dark:text-sand-100 bg-white dark:bg-sand-900/50 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
            />
            <span className="text-sm text-sand-500">days</span>
          </div>
        )}
      </div>

      {/* Tags */}
      <div>
        <label className="block text-sm font-medium text-sand-700 dark:text-sand-300 mb-2">Tags</label>
        <div className="flex flex-wrap gap-2">
          {allTags.map((tag) => {
            const selected = selectedTagIds.includes(tag.id)
            return (
              <button
                key={tag.id}
                type="button"
                onClick={() => toggleTag(tag.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                  selected ? 'opacity-100' : 'opacity-50 hover:opacity-75'
                }`}
                style={
                  selected
                    ? { backgroundColor: `${tag.color}18`, color: tag.color, borderColor: `${tag.color}40` }
                    : { backgroundColor: '#f5f4f1', color: '#6e6a62', borderColor: '#e8e4dc' }
                }
              >
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: selected ? tag.color : '#b8b4ac' }}
                />
                {tag.name}
              </button>
            )
          })}

          {showNewTag ? (
            <div className="flex items-center gap-1">
              <input
                type="text"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') { e.preventDefault(); handleAddTag() }
                  if (e.key === 'Escape') { setShowNewTag(false); setNewTagName('') }
                }}
                placeholder="tag name"
                autoFocus
                className="w-24 px-2 py-1 border border-sand-200 dark:border-white/[0.08] rounded-full text-xs text-sand-900 dark:text-sand-100 bg-white dark:bg-sand-900/50 focus:outline-none focus:border-brand-500"
              />
              <button type="button" onClick={handleAddTag} className="text-brand-500 hover:text-brand-700">
                <Plus size={14} />
              </button>
              <button type="button" onClick={() => { setShowNewTag(false); setNewTagName('') }} className="text-sand-400">
                <X size={14} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowNewTag(true)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium text-sand-400 border border-dashed border-sand-300 dark:border-sand-600 hover:border-sand-400 dark:hover:border-sand-500 hover:text-sand-600 dark:hover:text-sand-300 transition-colors"
            >
              <Plus size={12} />
              New tag
            </button>
          )}
        </div>
      </div>

      {error && (
        <p className="text-sm text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 px-4 py-2.5 rounded-xl border border-rose-100 dark:border-rose-500/20">
          {error}
        </p>
      )}

      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-5 py-2.5 text-sm font-medium text-sand-600 dark:text-sand-400 hover:text-sand-800 dark:hover:text-sand-200 hover:bg-sand-100 dark:hover:bg-white/[0.06] rounded-xl transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-5 py-2.5 text-sm font-semibold bg-brand-500 text-white rounded-xl hover:bg-brand-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? 'Saving…' : isEditing ? 'Save changes' : 'Add contact'}
        </button>
      </div>
    </form>
  )
}
