const locale = 'en-IN'

export const fmtDate = (d) => new Date(d).toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' })
export const fmtTime = (d) => new Date(d).toLocaleTimeString(locale, { hour: 'numeric', minute: '2-digit' })
export const fmtDateTime = (d) => `${fmtDate(d)}, ${fmtTime(d)}`

export function fmtDuration(ms) {
  if (ms <= 0) return '0s'
  const s = Math.floor(ms / 1000)
  const d = Math.floor(s / 86400)
  const h = Math.floor((s % 86400) / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  if (d) return `${d}d ${h}h`
  if (h) return `${h}h ${m}m`
  if (m) return `${m}m ${String(sec).padStart(2, '0')}s`
  return `${sec}s`
}

// Value for <input type="datetime-local"> in local time.
export function toLocalInput(d) {
  const date = new Date(d)
  const off = date.getTimezoneOffset() * 60000
  return new Date(date.getTime() - off).toISOString().slice(0, 16)
}
