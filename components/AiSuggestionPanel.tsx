'use client'

import { useState, useRef } from 'react'
import { Copy, RefreshCw, Check, Sparkles } from 'lucide-react'
import type { MessageChannel, ContactWithStatus } from '@/types'

interface AiSuggestionPanelProps {
  contact: ContactWithStatus
}

const CHANNELS: { value: MessageChannel; label: string }[] = [
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'email', label: 'Email' },
  { value: 'text', label: 'Text' },
]

export default function AiSuggestionPanel({ contact }: AiSuggestionPanelProps) {
  const [channel, setChannel] = useState<MessageChannel>('linkedin')
  const [completion, setCompletion] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  async function handleGenerate() {
    setCopied(false)
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
        body: JSON.stringify({
          action: 'suggest-message',
          contactId: contact.id,
          channel,
        }),
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
    } catch (err) {
      if ((err as Error).name === 'AbortError') return
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }

  function handleChannelChange(newChannel: MessageChannel) {
    setChannel(newChannel)
    setCopied(false)
  }

  async function handleCopy() {
    if (!completion) return
    await navigator.clipboard.writeText(completion)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const contextItems: string[] = []
  if (contact.tags.length > 0) contextItems.push(contact.tags.map((t) => t.name).join(', '))
  if (contact.last_interaction_date) contextItems.push(`Last: ${contact.last_interaction_date}`)
  if (contact.how_met) contextItems.push(contact.how_met.slice(0, 40))
  if (contact.cadence_days) contextItems.push(`${contact.cadence_days}d cadence`)

  return (
    <div className="bg-white rounded-xl border border-sand-100 shadow-card overflow-hidden">
      <div className="px-4 py-3 border-b border-sand-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles size={14} className="text-brand-500" />
          <span className="text-sm font-semibold text-sand-900">AI Message Suggestion</span>
        </div>
        <span className="text-xs text-sand-400">for {contact.name}</span>
      </div>

      <div className="flex border-b border-sand-100">
        {CHANNELS.map((ch) => (
          <button
            key={ch.value}
            onClick={() => handleChannelChange(ch.value)}
            className={`flex-1 text-center py-2.5 text-sm font-medium transition-colors ${
              channel === ch.value
                ? 'text-brand-600 border-b-2 border-brand-500'
                : 'text-sand-400 hover:text-sand-600'
            }`}
          >
            {ch.label}
          </button>
        ))}
      </div>

      <div className="p-4">
        {!completion && !isLoading && !error ? (
          <button
            onClick={handleGenerate}
            className="w-full py-6 text-center text-sm text-brand-500 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors border border-dashed border-brand-200"
          >
            <Sparkles size={16} className="inline mr-2" />
            Generate a {channel} message
          </button>
        ) : (
          <>
            <div className="bg-sand-50 border border-sand-100 rounded-lg p-4 min-h-[80px]">
              {isLoading && !completion ? (
                <div className="flex items-center gap-2 text-sm text-sand-500">
                  <div className="w-2 h-2 bg-brand-500 rounded-full animate-pulse" />
                  Generating...
                </div>
              ) : error ? (
                <p className="text-sm text-rose-600">{error}</p>
              ) : (
                <p className="text-sm text-sand-800 leading-relaxed whitespace-pre-wrap">
                  {completion}
                  {isLoading && (
                    <span className="inline-block w-[5px] h-[15px] bg-brand-500 ml-0.5 animate-pulse rounded-sm align-text-bottom" />
                  )}
                </p>
              )}
            </div>

            {(completion || error) && !isLoading && (
              <div className="flex items-center gap-2 mt-3">
                {completion && (
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors"
                  >
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                )}
                <button
                  onClick={handleGenerate}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-sand-600 border border-sand-200 rounded-lg hover:bg-sand-50 transition-colors"
                >
                  <RefreshCw size={14} />
                  {error ? 'Retry' : 'Regenerate'}
                </button>
              </div>
            )}
          </>
        )}

        {contextItems.length > 0 && (completion || isLoading) && (
          <div className="mt-4 pt-3 border-t border-sand-100">
            <div className="text-[11px] text-sand-400 uppercase tracking-wider mb-1.5">Context used</div>
            <div className="flex flex-wrap gap-1">
              {contextItems.map((item) => (
                <span
                  key={item}
                  className="text-[11px] text-sand-500 bg-sand-100 px-2 py-0.5 rounded"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
