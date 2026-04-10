import type { Tag } from '@/types'

export function formatDaysAgo(days: number): string {
  if (days === 0) return 'today'
  if (days === 1) return 'yesterday'
  if (days < 7) return `${days}d ago`
  if (days < 30) return `${Math.floor(days / 7)}w ago`
  if (days < 365) return `${Math.floor(days / 30)}mo ago`
  return `${Math.floor(days / 365)}y ago`
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function formatCadence(days: number): string {
  if (days === 7) return 'Weekly'
  if (days === 14) return 'Every 2 weeks'
  if (days === 30) return 'Monthly'
  if (days === 90) return 'Quarterly'
  return `Every ${days} days`
}

export function getNextDueDate(lastInteraction: string | null, createdAt: string, cadenceDays: number): Date {
  const base = lastInteraction ? new Date(lastInteraction) : new Date(createdAt)
  const next = new Date(base)
  next.setDate(next.getDate() + cadenceDays)
  return next
}

export function formatNextDue(daysOverdue: number, cadenceDays: number): string {
  if (daysOverdue > 0) {
    return `${daysOverdue}d overdue`
  }
  const daysUntil = Math.abs(daysOverdue)
  if (daysUntil === 0) return 'Due today'
  if (daysUntil === 1) return 'Due tomorrow'
  return `Due in ${daysUntil}d`
}

const AVATAR_COLORS = [
  'bg-violet-100 text-violet-700',
  'bg-blue-100 text-blue-700',
  'bg-emerald-100 text-emerald-700',
  'bg-rose-100 text-rose-700',
  'bg-amber-100 text-amber-700',
  'bg-cyan-100 text-cyan-700',
  'bg-fuchsia-100 text-fuchsia-700',
  'bg-indigo-100 text-indigo-700',
  'bg-teal-100 text-teal-700',
  'bg-orange-100 text-orange-700',
]

export function getAvatarColor(name: string): string {
  const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return AVATAR_COLORS[hash % AVATAR_COLORS.length]
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function parseTagsFromRow(row: { tag_ids?: string | null; tag_names?: string | null; tag_colors?: string | null }): Tag[] {
  if (!row.tag_ids) return []
  const ids = row.tag_ids.split(',')
  const names = row.tag_names?.split(',') ?? []
  const colors = row.tag_colors?.split(',') ?? []
  return ids.map((id, i) => ({
    id: parseInt(id),
    name: names[i] ?? '',
    color: colors[i] ?? '#6366F1',
  }))
}

export function getStatusLabel(daysOverdue: number): 'overdue' | 'upcoming' | 'ok' {
  if (daysOverdue > 0) return 'overdue'
  if (daysOverdue > -7) return 'upcoming'
  return 'ok'
}
