'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useCallback, useTransition } from 'react'
import { Search, X } from 'lucide-react'
import type { Tag } from '@/types'

interface SearchFilterProps {
  tags: Tag[]
  currentQ: string
  currentTagId: string
}

export default function SearchFilter({ tags, currentQ, currentTagId }: SearchFilterProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }
      startTransition(() => {
        router.replace(`${pathname}?${params.toString()}`)
      })
    },
    [router, pathname, searchParams],
  )

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      {/* Search input */}
      <div className="relative flex-1">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-sand-400 pointer-events-none" />
        <input
          type="text"
          defaultValue={currentQ}
          onChange={(e) => updateParam('q', e.target.value)}
          placeholder="Search by name, company, or email…"
          className={`w-full pl-9 pr-8 py-2.5 border border-sand-200 rounded-xl text-sm text-sand-900 placeholder:text-sand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-colors bg-white ${isPending ? 'opacity-60' : ''}`}
        />
        {currentQ && (
          <button
            onClick={() => updateParam('q', '')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-sand-400 hover:text-sand-600"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Tag filters */}
      {tags.length > 0 && (
        <div className="flex gap-1.5 flex-wrap items-center">
          <button
            onClick={() => updateParam('tagId', '')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              !currentTagId
                ? 'bg-sand-900 text-white border-sand-900'
                : 'bg-white text-sand-600 border-sand-200 hover:border-sand-300'
            }`}
          >
            All
          </button>
          {tags.map((tag) => (
            <button
              key={tag.id}
              onClick={() => updateParam('tagId', currentTagId === String(tag.id) ? '' : String(tag.id))}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                currentTagId === String(tag.id) ? 'opacity-100' : 'opacity-60 hover:opacity-80'
              }`}
              style={
                currentTagId === String(tag.id)
                  ? { backgroundColor: `${tag.color}18`, color: tag.color, borderColor: `${tag.color}40` }
                  : { backgroundColor: '#fff', color: '#6e6a62', borderColor: '#e8e4dc' }
              }
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: tag.color }} />
              {tag.name}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
