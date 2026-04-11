'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Sparkles, AlertTriangle, Upload, Linkedin } from 'lucide-react'
import Avatar from '@/components/Avatar'
import type { ParsedLinkedInContact, AiStatusResponse } from '@/types'

type ImportStep = 'paste' | 'preview' | 'success'

export default function LinkedInImportPage() {
  const router = useRouter()
  const [step, setStep] = useState<ImportStep>('paste')
  const [text, setText] = useState('')
  const [parsing, setParsing] = useState(false)
  const [parseError, setParseError] = useState('')
  const [parsedContacts, setParsedContacts] = useState<ParsedLinkedInContact[]>([])
  const [importing, setImporting] = useState(false)
  const [importedCount, setImportedCount] = useState(0)
  const [importErrors, setImportErrors] = useState<string[]>([])
  const [aiAvailable, setAiAvailable] = useState<boolean | null>(null)

  useEffect(() => {
    fetch('/api/ai/status')
      .then((r) => r.json())
      .then((data: AiStatusResponse) => setAiAvailable(data.available))
      .catch(() => setAiAvailable(false))
  }, [])

  async function handleParse() {
    if (!text.trim()) return
    setParsing(true)
    setParseError('')

    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'parse-linkedin', text }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to parse')
      }

      const data = await res.json()
      if (!data.contacts || data.contacts.length === 0) {
        throw new Error('No contacts could be extracted from the text. Try pasting more profile content.')
      }

      setParsedContacts(data.contacts)
      setStep('preview')
    } catch (err) {
      setParseError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setParsing(false)
    }
  }

  function updateContact(index: number, field: keyof ParsedLinkedInContact, value: string) {
    setParsedContacts((prev) => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: value || null }
      return updated
    })
  }

  async function handleImport() {
    setImporting(true)
    const errors: string[] = []
    let successCount = 0

    for (const contact of parsedContacts) {
      if (!contact.name?.trim()) {
        errors.push(`Skipped: missing name`)
        continue
      }

      try {
        const res = await fetch('/api/contacts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: contact.name.trim(),
            company: contact.company?.trim() || null,
            notes: contact.notes?.trim() || null,
            cadence_days: 30,
          }),
        })

        if (!res.ok) {
          const data = await res.json()
          errors.push(`${contact.name}: ${data.error || 'Failed to import'}`)
        } else {
          successCount++
        }
      } catch {
        errors.push(`${contact.name}: Network error`)
      }
    }

    setImportedCount(successCount)
    setImportErrors(errors)
    setStep('success')
    setImporting(false)
  }

  return (
    <div className="px-8 py-8 max-w-2xl">
      <Link
        href="/contacts"
        className="inline-flex items-center gap-1.5 text-sm text-sand-500 hover:text-sand-300 transition-colors mb-6"
      >
        <ArrowLeft size={15} />
        Back to Contacts
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white tracking-tight mb-1">Import from LinkedIn</h1>
        <p className="text-sm text-sand-400">Paste a LinkedIn profile and AI extracts the contact details automatically</p>
      </div>

      {step === 'paste' && (
        <>
          {aiAvailable === false && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mb-4">
              <div className="flex items-start gap-2">
                <AlertTriangle size={16} className="text-amber-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-amber-300">AI parsing unavailable</p>
                  <p className="text-xs text-amber-400/70 mt-0.5">
                    Set <code className="bg-amber-500/20 px-1 rounded text-amber-300">ANTHROPIC_API_KEY</code> to enable AI-powered parsing.
                    You can still add contacts manually from the{' '}
                    <Link href="/contacts/new" className="underline text-amber-300">Add Contact</Link> page.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 mb-5">
            <div className="flex items-center gap-2 mb-3">
              <Linkedin size={15} className="text-[#0077B5]" />
              <p className="text-sm font-semibold text-sand-200">How to copy from LinkedIn</p>
            </div>
            <ol className="text-sm text-sand-400 space-y-1.5 list-decimal list-inside">
              <li>Go to someone&apos;s LinkedIn profile</li>
              <li>Select all text on the page <span className="text-sand-500">(⌘A / Ctrl+A)</span></li>
              <li>Copy and paste below <span className="text-sand-500">(⌘C / Ctrl+C)</span></li>
            </ol>
          </div>

          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={8}
            placeholder="Paste LinkedIn profile text here… Works with single or multiple profiles."
            className="w-full px-4 py-3 border border-white/[0.08] rounded-xl text-sm text-sand-200 placeholder:text-sand-600 focus:outline-none focus:border-brand-500/50 focus:ring-2 focus:ring-brand-500/20 transition-all resize-none mb-4 bg-sand-900/50"
          />

          {parseError && (
            <p className="text-sm text-rose-400 bg-rose-500/10 border border-rose-500/20 px-3 py-2 rounded-lg mb-4">{parseError}</p>
          )}

          <button
            onClick={handleParse}
            disabled={!text.trim() || parsing || aiAvailable === false}
            className="w-full py-3.5 bg-brand-500 text-white rounded-xl text-sm font-semibold hover:bg-brand-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-brand-500/20"
          >
            {parsing ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Parsing with AI…
              </>
            ) : (
              <>
                <Sparkles size={16} />
                Parse with AI
              </>
            )}
          </button>
          <p className="text-center text-xs text-sand-600 mt-3">Powered by Claude · Your data stays local</p>
        </>
      )}

      {step === 'preview' && (
        <>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-white">
                {parsedContacts.length} contact{parsedContacts.length !== 1 ? 's' : ''} parsed
              </h2>
              <p className="text-sm text-sand-400">Review and edit before importing</p>
            </div>
            <button
              onClick={() => {
                setStep('paste')
                setParsedContacts([])
              }}
              className="text-sm text-sand-500 hover:text-sand-300 transition-colors"
            >
              ← Paste again
            </button>
          </div>

          <div className="space-y-3 mb-4">
            {parsedContacts.map((contact, i) => {
              const isReady = Boolean(contact.name?.trim())
              return (
                <div
                  key={i}
                  className="bg-sand-900/50 border border-white/[0.06] rounded-xl p-4"
                >
                  <div className="flex items-start gap-3">
                    <Avatar name={contact.name || '?'} size="md" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-3">
                        <input
                          value={contact.name}
                          onChange={(e) => updateContact(i, 'name', e.target.value)}
                          placeholder="Name (required)"
                          className="text-base font-semibold text-white bg-transparent border-b border-transparent hover:border-white/10 focus:border-brand-500/50 focus:outline-none transition-colors pb-0.5 w-full"
                        />
                        <span
                          className={`text-[11px] font-medium px-2 py-0.5 rounded-full ml-2 shrink-0 ${
                            isReady
                              ? 'bg-emerald-500/15 text-emerald-400'
                              : 'bg-amber-500/15 text-amber-400'
                          }`}
                        >
                          {isReady ? '✓ Ready' : '⚠ Name required'}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 gap-2">
                        <div>
                          <label className="text-[11px] text-sand-500 uppercase tracking-wider">Company</label>
                          <input
                            value={contact.company ?? ''}
                            onChange={(e) => updateContact(i, 'company', e.target.value)}
                            placeholder="Company"
                            className="w-full text-sm text-sand-300 bg-white/[0.04] border border-white/[0.06] rounded-md px-2.5 py-1.5 mt-0.5 focus:outline-none focus:border-brand-500/40 transition-colors"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] text-sand-500 uppercase tracking-wider">AI-extracted notes</label>
                          <textarea
                            value={contact.notes ?? ''}
                            onChange={(e) => updateContact(i, 'notes', e.target.value)}
                            rows={2}
                            className="w-full text-sm text-sand-300 bg-brand-500/[0.06] border border-brand-500/20 rounded-md px-2.5 py-1.5 mt-0.5 focus:outline-none focus:border-brand-500/40 transition-colors resize-none"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleImport}
              disabled={importing || parsedContacts.every((c) => !c.name?.trim())}
              className="flex-1 py-3.5 bg-brand-500 text-white rounded-xl text-sm font-semibold hover:bg-brand-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-brand-500/20"
            >
              {importing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Importing…
                </>
              ) : (
                <>
                  <Upload size={16} />
                  Import {parsedContacts.filter((c) => c.name?.trim()).length} contact{parsedContacts.filter((c) => c.name?.trim()).length !== 1 ? 's' : ''}
                </>
              )}
            </button>
            <button
              onClick={() => router.push('/contacts')}
              className="px-6 py-3 text-sm font-medium text-sand-400 border border-white/[0.08] rounded-xl hover:bg-white/[0.04] transition-colors"
            >
              Cancel
            </button>
          </div>
        </>
      )}

      {step === 'success' && (
        <div className="text-center py-12">
          <div className="text-5xl mb-4">🎉</div>
          <h2 className="text-xl font-bold text-white mb-2">
            {importedCount} contact{importedCount !== 1 ? 's' : ''} imported!
          </h2>
          <p className="text-sm text-sand-400 mb-2">They&apos;ve been added to your contacts list.</p>

          {importErrors.length > 0 && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 mb-6 text-left max-w-md mx-auto">
              <p className="text-xs font-medium text-amber-300 mb-1">Some issues occurred:</p>
              {importErrors.map((err, i) => (
                <p key={i} className="text-xs text-amber-400/70">{err}</p>
              ))}
            </div>
          )}

          <div className="flex justify-center gap-3 mt-6">
            <button
              onClick={() => router.push('/contacts')}
              className="px-5 py-2.5 bg-brand-500 text-white rounded-xl text-sm font-semibold hover:bg-brand-600 transition-colors"
            >
              View contacts
            </button>
            <button
              onClick={() => {
                setStep('paste')
                setText('')
                setParsedContacts([])
                setImportErrors([])
                setImportedCount(0)
              }}
              className="px-5 py-2.5 text-sand-300 border border-white/[0.08] rounded-xl text-sm font-semibold hover:bg-white/[0.04] transition-colors"
            >
              Import more
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
