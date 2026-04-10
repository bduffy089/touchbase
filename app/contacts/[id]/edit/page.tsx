export const dynamic = 'force-dynamic'

import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import ContactForm from '@/components/ContactForm'
import { getDb, getContactByIdQuery } from '@/lib/db'
import { parseTagsFromRow } from '@/lib/utils'

interface PageProps {
  params: { id: string }
}

export default function EditContactPage({ params }: PageProps) {
  const db = getDb()
  const id = parseInt(params.id)
  if (isNaN(id)) notFound()

  const row = getContactByIdQuery(db, id) as any
  if (!row) notFound()

  const contact = { ...row, tags: parseTagsFromRow(row) }

  return (
    <div className="px-8 py-8 max-w-2xl">
      <div className="mb-6">
        <Link
          href={`/contacts/${params.id}`}
          className="inline-flex items-center gap-1.5 text-sm text-sand-500 hover:text-sand-700 transition-colors mb-4"
        >
          <ArrowLeft size={15} />
          Back to {contact.name}
        </Link>
        <h1 className="text-2xl font-bold text-sand-900 tracking-tight">Edit contact</h1>
        <p className="text-sand-500 text-sm mt-1">Update {contact.name}'s information.</p>
      </div>

      <div className="bg-white rounded-2xl border border-sand-100 shadow-card p-6">
        <ContactForm contact={contact} />
      </div>
    </div>
  )
}
