'use client'

import { useState, useEffect } from 'react'
import { Activity, Check, X, RefreshCw } from 'lucide-react'
import type { ContactWithStatus, CadenceSuggestion } from '@/types'

interface CadenceMismatchBannerProps {
  contact: ContactWithStatus
  onCadenceUpdated: () => void
}

export default function CadenceMismatchBanner({ contact, onCadenceUpdated }: CadenceMismatchBannerProps) {
  const [suggestion, setSuggestion] = useState<CadenceSuggestion | null>(null)
  const [loading, setLoading] = useState(true)
  const [applying, setApplying] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchSuggestion()
  }, [contact.id])

  async function fetchSuggestion() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'suggest-cadence', contactId: contact.id }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || `Request failed (${res.status})`)
      }
      const data: CadenceSuggestion = await res.json()
      setSuggestion(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze cadence')
    } finally {
      setLoading(false)
    }
  }

  async function applySuggestion() {
    if (!suggestion) return
    setApplying(true)
    try {
      const res = await fetch(`/api/contacts/${contact.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cadence_days: suggestion.suggestedCadence }),
      })
      if (!res.ok) throw new Error('Failed to update cadence')
      setDismissed(true)
      onCadenceUpdated()
    } catch {
      setError('Failed to apply cadence. Try again.')
    } finally {
      setApplying(false)
    }
  }

  if (dismissed) return null
  if (loading) return null
  if (error) {
    return (
      <div className="bg-white rounded-xl border border-sand-100 shadow-card px-4 py-3">
        <div className="flex items-center justify-between">
          <p className="text-sm text-rose-600">{error}</p>
          <button
            onClick={fetchSuggestion}
            className="flex items-center gap-1 text-xs text-sand-500 hover:text-sand-700 transition-colors"
          >
            <RefreshCw size={12} />
            Retry
          </button>
        </div>
      </div>
    )
  }
  if (!suggestion?.hasMismatch) return null

  return (
    <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200/60 shadow-card px-4 py-3">
      <div className="flex items-start gap-3">
        <div className="w-7 h-7 rounded-full bg-amber-100 flex items-center justify-center shrink-0 mt-0.5">
          <Activity size={14} className="text-amber-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-sand-800">Cadence mismatch</p>
          <p className="text-sm text-sand-600 mt-0.5">{suggestion.suggestion}</p>
          <div className="flex items-center gap-3 mt-2 text-xs text-sand-500">
            <span>
              Set: <span className="font-medium text-sand-700">every {suggestion.currentCadence}d</span>
            </span>
            <span className="text-sand-300">vs</span>
            <span>
              Actual: <span className="font-medium text-sand-700">every {suggestion.actualAvgDays}d</span>
            </span>
          </div>
          <div className="flex items-center gap-2 mt-3">
            <button
              onClick={applySuggestion}
              disabled={applying}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors disabled:opacity-50"
            >
              <Check size={12} />
              {applying ? 'Applying...' : `Set to every ${suggestion.suggestedCadence} days`}
            </button>
            <button
              onClick={() => setDismissed(true)}
              className="flex items-center gap-1 px-2 py-1.5 text-xs text-sand-500 hover:text-sand-700 transition-colors"
            >
              <X size={12} />
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
