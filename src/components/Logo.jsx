export default function Logo({ className = '' }) {
  return (
    <span className={`flex items-center gap-2.5 ${className}`}>
      <svg viewBox="0 0 32 32" className="size-9 shrink-0" aria-hidden="true">
        <rect width="32" height="32" rx="9" fill="#059669" />
        <circle cx="16" cy="16" r="8" fill="none" stroke="#fff" strokeWidth="2.5" />
        <path d="M8 16h16M16 8c3 3 3 13 0 16M16 8c-3 3-3 13 0 16" fill="none" stroke="#fff" strokeWidth="2" />
      </svg>
      <span className="leading-tight">
        <span className="block text-lg font-extrabold tracking-tight">
          Sport<span className="text-brand-600">Sync</span>
        </span>
        <span className="block text-[11px] font-medium text-slate-500 dark:text-slate-400">GNDEC Ludhiana</span>
      </span>
    </span>
  )
}
