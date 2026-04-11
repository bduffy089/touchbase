'use client'

import { useState, useRef } from 'react'
import { Lightbulb, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react'
import type { ContactWithStatus } from '@/types'

interface AiInsightsPanelProps {
  contact: ContactWithStatus
}

export default function AiInsightsPanel({ contact }: AiInsightsPanelProps) {
  const [expanded, setExpanded] = useState(false)
  const [completion, setCompletion] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasLoaded, setHasLoaded] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  async function fetchInsights() {
    setError(null)
    setCompletion('')
    setIsLoading(true)

    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'insights', contactId: contact.id }),
        signal: controller.signal,
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || `Request failed (${res.status})`)
      }

      const reader = res.body?.getReader()
      if (!reader) throw new Error('No response body')
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        setCompletion((prev) => prev + chunk)
      }

      setHasLoaded(true)
    } catch (err) {
      if ((err as Error).name === 'AbortError') return
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }

  function handleToggle() {
    const willExpand = !expanded
    setExpanded(willExpand)
    if (willExpand && !hasLoaded && !isLoading) {
      fetchInsights()
    }
  }

  return (
    <div className="bg-white dark:bg-sand-900/50 rounded-xl border border-sand-100 dark:border-white/[0.06] shadow-card dark:shadow-none overflow-hidden">
      <button
        onClick={handleToggle}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-sand-50 dark:hover:bg-white/[0.04] transition-colors"
      >
        <div className="flex items-center gap-2">
          <Lightbulb size={14} className="text-amber-500" />
          <span className="text-sm font-semibold text-sand-900 dark:text-white">Relationship Insights</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-sand-400 dark:text-sand-500">AI-powered</span>
          {expanded ? (
            <ChevronUp size={14} className="text-sand-400 dark:text-sand-500" />
          ) : (
            <ChevronDown size={14} className="text-sand-400 dark:text-sand-500" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t border-sand-100 dark:border-white/[0.06]">
          <div className="mt-3">
            {isLoading && !completion ? (
              <div className="flex items-center gap-2 text-sm text-sand-500 py-2">
                <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
                Analyzing relationship...
              </div>
            ) : error ? (
              <div className="space-y-2">
                <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p>
                <button
                  onClick={fetchInsights}
                  className="flex items-center gap-1.5 text-sm text-sand-600 dark:text-sand-400 hover:text-sand-800 dark:hover:text-sand-300 transition-colors"
                >
                  <RefreshCw size={12} />
                  Retry
                </button>
              </div>
            ) : (
              <>
                <div className="text-sm text-sand-700 dark:text-sand-300 leading-relaxed whitespace-pre-wrap">
                  {completion}
                  {isLoading && (
                    <span className="inline-block w-[5px] h-[15px] bg-amber-400 ml-0.5 animate-pulse rounded-sm align-text-bottom" />
                  )}
                </div>
                {hasLoaded && !isLoading && (
                  <button
                    onClick={fetchInsights}
                    className="flex items-center gap-1.5 mt-3 text-xs text-sand-400 dark:text-sand-500 hover:text-sand-600 dark:hover:text-sand-400 transition-colors"
                  >
                    <RefreshCw size={12} />
                    Refresh
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
