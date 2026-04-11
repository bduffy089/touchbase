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
        <span className="text-sm text-sand-600 dark:text-sand-400">Delete {contactName}?</span>
        <button
          onClick={handleDelete}
          disabled={loading}
          className="px-3 py-1.5 text-sm font-medium bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors disabled:opacity-60"
        >
          {loading ? 'Deleting…' : 'Yes, delete'}
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="px-3 py-1.5 text-sm font-medium text-sand-600 dark:text-sand-300 hover:text-sand-800 dark:hover:text-white hover:bg-sand-100 dark:hover:bg-white/[0.06] rounded-lg transition-colors"
        >
          Cancel
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-sand-500 dark:text-sand-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors border border-sand-200 dark:border-white/[0.08] hover:border-rose-200 dark:hover:border-rose-500/30"
    >
      <Trash2 size={14} />
      Delete
    </button>
  )
}
