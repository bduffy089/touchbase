'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Users, Plus } from 'lucide-react'
import clsx from 'clsx'
import ThemeToggle from './ThemeToggle'

interface SidebarProps {
  totalContacts: number
  overdueCount: number
}

const navItems = [
  { href: '/',          label: 'Dashboard', icon: LayoutDashboard },
  { href: '/contacts',  label: 'Contacts',  icon: Users },
]

export default function Sidebar({ totalContacts, overdueCount }: SidebarProps) {
  const pathname = usePathname()

  return (
    <aside className="fixed inset-y-0 left-0 w-56 flex flex-col bg-sand-50 dark:bg-sand-950 text-sand-900 dark:text-white border-r border-sand-200 dark:border-transparent z-20 transition-colors">
      {/* Logo */}
      <div className="px-5 pt-6 pb-4 border-b border-sand-200 dark:border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-brand-500 flex items-center justify-center shrink-0">
            <span className="text-white font-bold text-xs tracking-tight">TB</span>
          </div>
          <span className="font-semibold text-sm tracking-tight text-sand-900 dark:text-white">TouchBase</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive =
            href === '/' ? pathname === '/' : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-brand-600 text-white'
                  : 'text-sand-500 dark:text-sand-400 hover:bg-sand-200 dark:hover:bg-white/[0.08] hover:text-sand-900 dark:hover:text-white',
              )}
            >
              <Icon size={16} strokeWidth={isActive ? 2.5 : 2} />
              {label}
              {label === 'Contacts' && overdueCount > 0 && (
                <span className="ml-auto bg-rose-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                  {overdueCount}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Quick add + theme toggle */}
      <div className="px-3 pb-4 border-t border-sand-200 dark:border-white/10 pt-3">
        <Link
          href="/contacts/new"
          className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm font-medium text-sand-500 dark:text-sand-400 hover:bg-sand-200 dark:hover:bg-white/[0.08] hover:text-sand-900 dark:hover:text-white transition-colors"
        >
          <Plus size={16} />
          Add Contact
        </Link>
        <ThemeToggle />
        <div className="mt-3 px-3 text-[11px] text-sand-400 dark:text-sand-600">
          {totalContacts} contact{totalContacts !== 1 ? 's' : ''}
        </div>
      </div>
    </aside>
  )
}
