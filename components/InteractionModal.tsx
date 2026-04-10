'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { X, Phone, MessageSquare, Mail, Users, MoreHorizontal } from 'lucide-react'
import type { InteractionType } from '@/types'

interface InteractionModalProps {
  contactId: number
  contactName: string
  onClose: () => void
}

const INTERACTION_TYPES: { value: InteractionType; label: string; icon: React.ReactNode }[] = [
  { value: 'call',      label: 'Call',      icon: <Phone size={16} /> },
  { value: 'email',     label: 'Email',     icon: <Mail size={16} /> },
  { value: 'text',      label: 'Text',      icon: <MessageSquare size={16} /> },
  { value: 'in-person', label: 'In Person', icon: <Users size={16} /> },
  { value: 'other',     label: 'Other',     icon: <MoreHorizontal size={16} /> },
]

export default function InteractionModal({ contactId, contactName, onClose }: InteractionModalProps) {
  const router = useRouter()
  const today = new Date().toISOString().split('T')[0]

  const [type, setType] = useState<InteractionType>('call')
  const [date, setDate] = useState(today)
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/interactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contact_id: contactId, type, date, note }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to log interaction')
      }

      router.refresh()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-modal w-full max-w-md animate-slide-up">
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-sand-200">
          <div>
            <h2 className="text-base font-semibold text-sand-900">Log interaction</h2>
            <p className="text-sm text-sand-500 mt-0.5">with {contactName}</p>
          </div>
          <button
            onClick={onClose}
            className="text-sand-400 hover:text-sand-600 transition-colors p-1 rounded-lg hover:bg-sand-100"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {/* Type selector */}
          <div>
            <label className="block text-sm font-medium text-sand-700 mb-2">Type</label>
            <div className="flex gap-2 flex-wrap">
              {INTERACTION_TYPES.map(({ value, label, icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setType(value)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                    type === value
                      ? 'bg-brand-500 text-white border-brand-500'
                      : 'bg-white text-sand-600 border-sand-200 hover:border-sand-300 hover:bg-sand-50'
                  }`}
                >
                  {icon}
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Date */}
          <div>
            <label htmlFor="date" className="block text-sm font-medium text-sand-700 mb-1.5">
              Date
            </label>
            <input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="w-full px-3 py-2 border border-sand-200 rounded-lg text-sm text-sand-900 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-colors"
            />
          </div>

          {/* Note */}
          <div>
            <label htmlFor="note" className="block text-sm font-medium text-sand-700 mb-1.5">
              Note <span className="text-sand-400 font-normal">(optional)</span>
            </label>
            <textarea
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              placeholder="What did you talk about?"
              className="w-full px-3 py-2 border border-sand-200 rounded-lg text-sm text-sand-900 placeholder:text-sand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-colors resize-none"
            />
          </div>

          {error && (
            <p className="text-sm text-rose-600 bg-rose-50 px-3 py-2 rounded-lg">{error}</p>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-sand-600 hover:text-sand-800 hover:bg-sand-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving…' : 'Log interaction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
