'use client'

export default function DemoBanner() {
  if (process.env.NEXT_PUBLIC_DEMO_MODE !== 'true') return null

  return (
    <div className="bg-indigo-600 text-white text-center text-sm py-1.5 px-4">
      Demo mode — data resets on reload.{' '}
      <a
        href="https://github.com/YOUR_USERNAME/touchbase"
        target="_blank"
        rel="noopener noreferrer"
        className="underline underline-offset-2 hover:text-indigo-200 transition-colors"
      >
        Run locally
      </a>{' '}
      for persistence.
    </div>
  )
}
