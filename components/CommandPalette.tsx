'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Plus, FileDown, LayoutDashboard, Users, MessageSquare,
  Search,
} from 'lucide-react'
import Avatar from '@/components/Avatar'
import type { ContactWithStatus } from '@/types'

interface PaletteItem {
  id: string
  type: 'contact' | 'action' | 'page'
  label: string
  sublabel?: string
  icon?: React.ReactNode
  href?: string
  contact?: ContactWithStatus
  onSelect?: () => void
}

export default function CommandPalette() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [contacts, setContacts] = useState<ContactWithStatus[]>([])
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    fetch('/api/contacts')
      .then((r) => r.json())
      .then((data) => setContacts(data))
      .catch(() => setContacts([]))
  }, [open])

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen((prev) => !prev)
      }
      if (e.key === 'Escape') {
        setOpen(false)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  useEffect(() => {
    if (open) {
      setQuery('')
      setActiveIndex(0)
      setTimeout(() => inputRef.current?.focus(), 0)
    }
  }, [open])

  const navigate = useCallback(
    (href: string) => {
      setOpen(false)
      router.push(href)
    },
    [router],
  )

  const items: PaletteItem[] = []
  const q = query.toLowerCase().trim()

  if (q) {
    const matched = contacts.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.company && c.company.toLowerCase().includes(q)) ||
        (c.email && c.email.toLowerCase().includes(q)),
    )
    for (const contact of matched.slice(0, 5)) {
      items.push({
        id: `contact-${contact.id}`,
        type: 'contact',
        label: contact.name,
        sublabel: [contact.company, contact.tags.map((t) => t.name).join(', ')].filter(Boolean).join(' · '),
        contact,
        href: `/contacts/${contact.id}`,
      })
    }
    if (matched.length > 0) {
      items.push({
        id: `log-${matched[0].id}`,
        type: 'action',
        label: `Log interaction with ${matched[0].name}`,
        icon: <MessageSquare size={15} />,
        href: `/contacts/${matched[0].id}?log=true`,
      })
    }
  }

  const staticActions: PaletteItem[] = [
    { id: 'new-contact', type: 'action', label: 'Add new contact', icon: <Plus size={15} />, href: '/contacts/new' },
    { id: 'import', type: 'action', label: 'Import from LinkedIn', icon: <FileDown size={15} />, href: '/contacts/import' },
  ]
  const staticPages: PaletteItem[] = [
    { id: 'dashboard', type: 'page', label: 'Dashboard', icon: <LayoutDashboard size={15} />, href: '/' },
    { id: 'contacts', type: 'page', label: 'All Contacts', icon: <Users size={15} />, href: '/contacts' },
  ]

  const filteredActions = q
    ? staticActions.filter((a) => a.label.toLowerCase().includes(q))
    : staticActions
  const filteredPages = q
    ? staticPages.filter((p) => p.label.toLowerCase().includes(q))
    : staticPages

  items.push(...filteredActions, ...filteredPages)

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((prev) => Math.min(prev + 1, items.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((prev) => Math.max(prev - 1, 0))
    } else if (e.key === 'Enter' && items[activeIndex]) {
      e.preventDefault()
      const item = items[activeIndex]
      if (item.href) navigate(item.href)
      else if (item.onSelect) item.onSelect()
    }
  }

  useEffect(() => {
    if (!listRef.current) return
    const active = listRef.current.querySelector('[data-active="true"]')
    active?.scrollIntoView({ block: 'nearest' })
  }, [activeIndex])

  if (!open) return null

  const contactItems = items.filter((i) => i.type === 'contact')
  const actionItems = items.filter((i) => i.type === 'action')
  const pageItems = items.filter((i) => i.type === 'page')

  let flatIndex = -1
  function nextIndex() {
    flatIndex++
    return flatIndex
  }

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
        onClick={() => setOpen(false)}
      />

      <div className="relative flex justify-center pt-[20vh]">
        <div
          className="w-full max-w-[560px] bg-white dark:bg-sand-950 border border-sand-200 dark:border-sand-800 rounded-xl shadow-modal overflow-hidden animate-slide-up"
          onKeyDown={handleKeyDown}
        >
          <div className="flex items-center gap-3 px-4 py-3.5 border-b border-sand-200 dark:border-sand-800">
            <Search size={16} className="text-brand-400 shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setActiveIndex(0)
              }}
              placeholder="Search contacts, actions, pages..."
              className="flex-1 bg-transparent text-sand-900 dark:text-sand-100 text-[15px] placeholder:text-sand-400 dark:placeholder:text-sand-600 outline-none"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="text-sand-400 dark:text-sand-600 hover:text-sand-600 dark:hover:text-sand-400 text-xs"
              >
                Clear
              </button>
            )}
          </div>

          <div ref={listRef} className="max-h-[340px] overflow-y-auto py-2 px-2">
            {items.length === 0 && (
              <div className="py-8 text-center text-sand-600 text-sm">No results found</div>
            )}

            {contactItems.length > 0 && (
              <>
                <div className="px-3 pt-1 pb-2">
                  <span className="text-[11px] font-medium text-sand-400 dark:text-sand-600 uppercase tracking-wider">
                    Contacts
                  </span>
                </div>
                {contactItems.map((item) => {
                  const idx = nextIndex()
                  const isActive = idx === activeIndex
                  return (
                    <button
                      key={item.id}
                      data-active={isActive}
                      onClick={() => item.href && navigate(item.href)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                        isActive ? 'bg-sand-800' : 'hover:bg-sand-900'
                      }`}
                    >
                      {item.contact && <Avatar name={item.contact.name} size="sm" />}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-sand-100 font-medium truncate">{item.label}</div>
                        {item.sublabel && (
                          <div className="text-xs text-sand-500 truncate">{item.sublabel}</div>
                        )}
                      </div>
                      {item.contact && item.contact.days_overdue > 0 && (
                        <span className="text-[11px] text-rose-400 font-medium shrink-0">
                          {Math.round(item.contact.days_overdue)}d overdue
                        </span>
                      )}
                    </button>
                  )
                })}
              </>
            )}

            {actionItems.length > 0 && (
              <>
                <div className="px-3 pt-3 pb-2">
                  <span className="text-[11px] font-medium text-sand-400 dark:text-sand-600 uppercase tracking-wider">
                    {q ? 'Actions' : 'Quick Actions'}
                  </span>
                </div>
                {actionItems.map((item) => {
                  const idx = nextIndex()
                  const isActive = idx === activeIndex
                  return (
                    <button
                      key={item.id}
                      data-active={isActive}
                      onClick={() => item.href && navigate(item.href)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                        isActive ? 'bg-sand-800' : 'hover:bg-sand-900'
                      }`}
                    >
                      <span className="text-brand-400">{item.icon}</span>
                      <span className="text-sm text-sand-200">{item.label}</span>
                      <span className="ml-auto text-[11px] text-sand-600">action</span>
                    </button>
                  )
                })}
              </>
            )}

            {pageItems.length > 0 && (
              <>
                <div className="px-3 pt-3 pb-2">
                  <span className="text-[11px] font-medium text-sand-400 dark:text-sand-600 uppercase tracking-wider">
                    Navigate
                  </span>
                </div>
                {pageItems.map((item) => {
                  const idx = nextIndex()
                  const isActive = idx === activeIndex
                  return (
                    <button
                      key={item.id}
                      data-active={isActive}
                      onClick={() => item.href && navigate(item.href)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                        isActive ? 'bg-sand-800' : 'hover:bg-sand-900'
                      }`}
                    >
                      <span className="text-sand-500">{item.icon}</span>
                      <span className="text-sm text-sand-300">{item.label}</span>
                      <span className="ml-auto text-[11px] text-sand-600">page</span>
                    </button>
                  )
                })}
              </>
            )}
          </div>

          <div className="flex items-center gap-4 px-4 py-2.5 border-t border-sand-800 text-[11px] text-sand-600">
            <span>↑↓ navigate</span>
            <span>↵ select</span>
            <span>esc close</span>
          </div>
        </div>
      </div>
    </div>
  )
}
