'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'

export default function DeleteInteractionButton({ interactionId }: { interactionId: number }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    if (!confirm('Delete this interaction?')) return
    setLoading(true)
    try {
      await fetch(`/api/interactions/${interactionId}`, { method: 'DELETE' })
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="opacity-0 group-hover:opacity-100 p-1 text-sand-400 hover:text-rose-500 transition-all rounded"
      title="Delete interaction"
    >
      <Trash2 size={13} />
    </button>
  )
}
