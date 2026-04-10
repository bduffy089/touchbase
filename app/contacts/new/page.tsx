import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import ContactForm from '@/components/ContactForm'

export default function NewContactPage() {
  return (
    <div className="px-8 py-8 max-w-2xl">
      <div className="mb-6">
        <Link
          href="/contacts"
          className="inline-flex items-center gap-1.5 text-sm text-sand-500 hover:text-sand-700 transition-colors mb-4"
        >
          <ArrowLeft size={15} />
          Back to contacts
        </Link>
        <h1 className="text-2xl font-bold text-sand-900 tracking-tight">New contact</h1>
        <p className="text-sand-500 text-sm mt-1">Add someone to your network.</p>
      </div>

      <div className="bg-white rounded-2xl border border-sand-100 shadow-card p-6">
        <ContactForm />
      </div>
    </div>
  )
}
