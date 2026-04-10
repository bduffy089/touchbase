'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'

export default function DeleteContactButton({ contactId, contactName }: { contactId: number; contactName: string }) {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    setLoading(true)
    try {
      await fetch(`/api/contacts/${contactId}`, { method: 'DELETE' })
      router.push('/contacts')
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-sand-600">Delete {contactName}?</span>
        <button
          onClick={handleDelete}
          disabled={loading}
          className="px-3 py-1.5 text-sm font-medium bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors disabled:opacity-60"
        >
          {loading ? 'Deleting…' : 'Yes, delete'}
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="px-3 py-1.5 text-sm font-medium text-sand-600 hover:text-sand-800 hover:bg-sand-100 rounded-lg transition-colors"
        >
          Cancel
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-sand-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-sand-200 hover:border-rose-200"
    >
      <Trash2 size={14} />
      Delete
    </button>
  )
}
