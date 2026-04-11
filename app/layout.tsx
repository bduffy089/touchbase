export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Sidebar from '@/components/Sidebar'
import DemoBanner from '@/components/DemoBanner'
import CommandPalette from '@/components/CommandPalette'
import { ThemeProvider } from '@/components/ThemeProvider'
import { getDb, getContactsQuery } from '@/lib/db'
import { parseTagsFromRow } from '@/lib/utils'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'TouchBase',
  description: 'Your local-first personal CRM',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const db = await getDb()

  const rows = (await getContactsQuery(db)) as any[]
  const contacts = rows.map((r) => ({ ...r, tags: parseTagsFromRow(r) }))

  const totalContacts = contacts.length
  const overdueCount = contacts.filter((c) => c.days_overdue > 0).length

  return (
    <html lang="en" className={`${inter.variable} dark`} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var t=localStorage.getItem('theme')||'dark';document.documentElement.classList.toggle('dark',t==='dark')})()`,
          }}
        />
      </head>
      <body>
        <ThemeProvider>
          <DemoBanner />
          <CommandPalette />
          <div className="flex min-h-screen">
            <Sidebar totalContacts={totalContacts} overdueCount={overdueCount} />
            <main className="flex-1 ml-56 min-h-screen">
              {children}
            </main>
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}
