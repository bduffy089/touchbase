import type { Tag } from '@/types'

interface TagBadgeProps {
  tag: Tag
  size?: 'sm' | 'md'
}

export default function TagBadge({ tag, size = 'sm' }: TagBadgeProps) {
  const textSize = size === 'md' ? 'text-xs' : 'text-[11px]'
  const padding = size === 'md' ? 'px-2.5 py-1' : 'px-2 py-0.5'

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-medium ${textSize} ${padding}`}
      style={{
        backgroundColor: `${tag.color}18`,
        color: tag.color,
        border: `1px solid ${tag.color}30`,
      }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full shrink-0"
        style={{ backgroundColor: tag.color }}
      />
      {tag.name}
    </span>
  )
}
