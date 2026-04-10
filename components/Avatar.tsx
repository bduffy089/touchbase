import { getInitials, getAvatarColor } from '@/lib/utils'
import clsx from 'clsx'

interface AvatarProps {
  name: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

const sizeClasses = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-lg',
}

export default function Avatar({ name, size = 'md' }: AvatarProps) {
  return (
    <div
      className={clsx(
        'rounded-full flex items-center justify-center font-semibold shrink-0',
        sizeClasses[size],
        getAvatarColor(name),
      )}
    >
      {getInitials(name)}
    </div>
  )
}
