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
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-sand-500 pointer-events-none" />
        <input
          type="text"
          defaultValue={currentQ}
          onChange={(e) => updateParam('q', e.target.value)}
          placeholder="Search by name, company, or email…"
          className={`w-full pl-9 pr-8 py-2.5 border border-sand-200 dark:border-white/[0.08] rounded-xl text-sm text-sand-800 dark:text-sand-100 placeholder:text-sand-400 dark:placeholder:text-sand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500/50 transition-colors bg-white dark:bg-sand-900/50 ${isPending ? 'opacity-60' : ''}`}
        />
        {currentQ && (
          <button
            onClick={() => updateParam('q', '')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-sand-400 dark:text-sand-500 hover:text-sand-600 dark:hover:text-sand-300 transition-colors"
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
                ? 'bg-brand-500 text-white border-brand-500'
                : 'bg-transparent text-sand-500 dark:text-sand-400 border-sand-200 dark:border-white/[0.08] hover:border-sand-300 dark:hover:border-white/20 hover:text-sand-700 dark:hover:text-sand-300'
            }`}
          >
            All
          </button>
          {tags.map((tag) => (
            <button
              key={tag.id}
              onClick={() => updateParam('tagId', currentTagId === String(tag.id) ? '' : String(tag.id))}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                currentTagId === String(tag.id) ? 'opacity-100' : 'opacity-50 hover:opacity-75'
              }`}
              style={
                currentTagId === String(tag.id)
                  ? { backgroundColor: `${tag.color}20`, color: tag.color, borderColor: `${tag.color}50` }
                  : { backgroundColor: 'transparent', color: tag.color, borderColor: `${tag.color}30` }
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
