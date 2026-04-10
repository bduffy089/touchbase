'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Sparkles, AlertTriangle, Upload } from 'lucide-react'
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
        className="inline-flex items-center gap-1.5 text-sm text-sand-500 hover:text-sand-700 transition-colors mb-6"
      >
        <ArrowLeft size={15} />
        Back to Contacts
      </Link>

      <h1 className="text-2xl font-bold text-sand-900 tracking-tight mb-1">Import from LinkedIn</h1>
      <p className="text-sm text-sand-500 mb-6">Paste LinkedIn profile text to auto-fill contact details</p>

      {step === 'paste' && (
        <>
          {aiAvailable === false && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
              <div className="flex items-start gap-2">
                <AlertTriangle size={16} className="text-amber-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-amber-800">AI parsing unavailable</p>
                  <p className="text-xs text-amber-600 mt-0.5">
                    Set <code className="bg-amber-100 px-1 rounded">ANTHROPIC_API_KEY</code> to enable AI-powered parsing.
                    You can still add contacts manually from the{' '}
                    <Link href="/contacts/new" className="underline">Add Contact</Link> page.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="bg-brand-50 border border-brand-200 rounded-xl p-4 mb-5">
            <p className="text-sm font-semibold text-brand-700 mb-2">How to copy from LinkedIn</p>
            <ol className="text-sm text-brand-600 space-y-1 list-decimal list-inside">
              <li>Go to someone's LinkedIn profile</li>
              <li>Select all text on the page (⌘A / Ctrl+A)</li>
              <li>Copy (⌘C / Ctrl+C) and paste below</li>
            </ol>
          </div>

          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={8}
            placeholder="Paste LinkedIn profile text here... Works with single or multiple profiles."
            className="w-full px-4 py-3 border-2 border-dashed border-sand-200 rounded-xl text-sm text-sand-900 placeholder:text-sand-400 focus:outline-none focus:border-brand-300 transition-colors resize-none mb-4"
          />

          {parseError && (
            <p className="text-sm text-rose-600 bg-rose-50 px-3 py-2 rounded-lg mb-4">{parseError}</p>
          )}

          <button
            onClick={handleParse}
            disabled={!text.trim() || parsing || aiAvailable === false}
            className="w-full py-3 bg-brand-500 text-white rounded-xl text-sm font-semibold hover:bg-brand-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {parsing ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Parsing...
              </>
            ) : (
              <>
                <Sparkles size={16} />
                Parse with AI
              </>
            )}
          </button>
          <p className="text-center text-xs text-sand-400 mt-2">Powered by Claude · Your data stays local</p>
        </>
      )}

      {step === 'preview' && (
        <>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-sand-900">
                {parsedContacts.length} contact{parsedContacts.length !== 1 ? 's' : ''} parsed
              </h2>
              <p className="text-sm text-sand-500">Review and edit before importing</p>
            </div>
            <button
              onClick={() => {
                setStep('paste')
                setParsedContacts([])
              }}
              className="text-sm text-sand-500 hover:text-sand-700 transition-colors"
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
                  className="bg-white border border-sand-100 rounded-xl p-4 shadow-card"
                >
                  <div className="flex items-start gap-3">
                    <Avatar name={contact.name || '?'} size="md" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-3">
                        <input
                          value={contact.name}
                          onChange={(e) => updateContact(i, 'name', e.target.value)}
                          placeholder="Name (required)"
                          className="text-base font-semibold text-sand-900 bg-transparent border-b border-transparent hover:border-sand-200 focus:border-brand-500 focus:outline-none transition-colors pb-0.5 w-full"
                        />
                        <span
                          className={`text-[11px] font-medium px-2 py-0.5 rounded-full ml-2 shrink-0 ${
                            isReady
                              ? 'bg-emerald-50 text-emerald-600'
                              : 'bg-amber-50 text-amber-600'
                          }`}
                        >
                          {isReady ? '✓ Ready' : '⚠ Name required'}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 gap-2">
                        <div>
                          <label className="text-[11px] text-sand-400 uppercase tracking-wider">Company</label>
                          <input
                            value={contact.company ?? ''}
                            onChange={(e) => updateContact(i, 'company', e.target.value)}
                            placeholder="Company"
                            className="w-full text-sm text-sand-700 bg-sand-50 border border-sand-100 rounded-md px-2.5 py-1.5 mt-0.5 focus:outline-none focus:border-brand-300 transition-colors"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] text-sand-400 uppercase tracking-wider">AI-extracted notes</label>
                          <textarea
                            value={contact.notes ?? ''}
                            onChange={(e) => updateContact(i, 'notes', e.target.value)}
                            rows={2}
                            className="w-full text-sm text-sand-700 bg-brand-50 border border-brand-100 rounded-md px-2.5 py-1.5 mt-0.5 focus:outline-none focus:border-brand-300 transition-colors resize-none"
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
              className="flex-1 py-3 bg-brand-500 text-white rounded-xl text-sm font-semibold hover:bg-brand-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {importing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Importing...
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
              className="px-6 py-3 text-sm font-medium text-sand-600 border border-sand-200 rounded-xl hover:bg-sand-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </>
      )}

      {step === 'success' && (
        <div className="text-center py-12">
          <div className="text-5xl mb-4">🎉</div>
          <h2 className="text-xl font-bold text-sand-900 mb-2">
            {importedCount} contact{importedCount !== 1 ? 's' : ''} imported!
          </h2>
          <p className="text-sm text-sand-500 mb-2">They&apos;ve been added to your contacts list.</p>

          {importErrors.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-6 text-left max-w-md mx-auto">
              <p className="text-xs font-medium text-amber-700 mb-1">Some issues occurred:</p>
              {importErrors.map((err, i) => (
                <p key={i} className="text-xs text-amber-600">{err}</p>
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
              className="px-5 py-2.5 text-brand-600 border border-brand-200 rounded-xl text-sm font-semibold hover:bg-brand-50 transition-colors"
            >
              Import more
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
