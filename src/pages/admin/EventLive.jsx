import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { QRCodeCanvas } from 'qrcode.react'
import { ArrowLeft, Copy, Download, Expand, MapPin, RefreshCw, Users } from 'lucide-react'
import { api, USE_MOCK } from '../../api/client'
import { eventPhase } from '../../lib/eventStatus'
import { fmtDateTime, fmtDuration, fmtTime } from '../../lib/format'
import { Button, ErrorNote, Spinner } from '../../components/ui'

// Projector view shown at the venue. Students scan this QR to register.
export default function EventLive() {
  const { id } = useParams()
  const [event, setEvent] = useState(null)
  const [qr, setQr] = useState(null)
  const [regs, setRegs] = useState([])
  const [error, setError] = useState(null)
  const [now, setNow] = useState(() => Date.now())
  const [copied, setCopied] = useState(false)
  const canvasWrap = useRef(null)

  useEffect(() => {
    Promise.all([api.getEvent(id), api.getEventQr(id)])
      .then(([e, q]) => {
        setEvent(e)
        setQr(q)
      })
      .catch(setError)
  }, [id])

  // Live registration feed + clock.
  useEffect(() => {
    let alive = true
    const poll = () => api.listEventRegistrations(id).then((r) => alive && setRegs(r)).catch(() => {})
    poll()
    const p = setInterval(poll, 3000)
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => {
      alive = false
      clearInterval(p)
      clearInterval(t)
    }
  }, [id])

  if (error) return <div className="p-6"><ErrorNote error={error} /></div>
  if (!event || !qr) return <Spinner />

  const phase = eventPhase(event, now)
  const start = new Date(event.regWindow.start).getTime()
  const end = new Date(event.regWindow.end).getTime()
  const isOpen = phase === 'open'

  const download = () => {
    const canvas = canvasWrap.current?.querySelector('canvas')
    if (!canvas) return
    const a = document.createElement('a')
    a.href = canvas.toDataURL('image/png')
    a.download = `${event.name.replace(/\s+/g, '_')}_QR.png`
    a.click()
  }

  const regenerate = async () => {
    if (!confirm('Generate a new QR code? The current code (including printed copies) will stop working.')) return
    setQr(await api.regenerateEventQr(id))
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(qr.payload)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      /* clipboard blocked */
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="no-print flex flex-wrap items-center justify-between gap-2 px-4 py-3 sm:px-8">
        <Link to={`/admin/events/${id}`} className="flex items-center gap-2 text-sm font-semibold text-slate-400 hover:text-white">
          <ArrowLeft className="size-4" /> Back to event
        </Link>
        <div className="flex flex-wrap gap-2">
          {USE_MOCK && (
            <Button variant="ghost" size="sm" className="text-slate-300 hover:bg-slate-800" onClick={copy}>
              <Copy className="size-4" /> {copied ? 'Copied!' : 'Copy code'}
            </Button>
          )}
          <Button variant="ghost" size="sm" className="text-slate-300 hover:bg-slate-800" onClick={download}>
            <Download className="size-4" /> PNG
          </Button>
          <Button variant="ghost" size="sm" className="text-slate-300 hover:bg-slate-800" onClick={regenerate}>
            <RefreshCw className="size-4" /> New code
          </Button>
          <Button variant="ghost" size="sm" className="text-slate-300 hover:bg-slate-800" onClick={() => document.documentElement.requestFullscreen?.()}>
            <Expand className="size-4" /> Fullscreen
          </Button>
        </div>
      </div>

      <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-6 sm:px-8 lg:grid-cols-[auto_1fr] lg:py-12">
        <div className="relative mx-auto" ref={canvasWrap}>
          <div className={`rounded-[2rem] bg-white p-6 transition ${isOpen ? '' : 'opacity-20 blur-sm'}`}>
            <QRCodeCanvas value={qr.payload} size={360} level="M" marginSize={0} className="size-[min(72vw,360px)]!" />
          </div>
          {!isOpen && (
            <div className="absolute inset-0 grid place-items-center text-center">
              <div className="rounded-2xl bg-slate-900/90 px-6 py-4">
                <div className="text-lg font-bold">{phase === 'upcoming' ? 'Opens soon' : 'Registration closed'}</div>
                <div className="text-sm text-slate-400">
                  {phase === 'upcoming' ? `Opens at ${fmtDateTime(start)}` : 'This code no longer accepts registrations'}
                </div>
              </div>
            </div>
          )}
          {USE_MOCK && <div className="mt-3 text-center font-mono text-xs break-all text-slate-500">{qr.payload}</div>}
        </div>

        <div>
          <div className="text-sm font-semibold tracking-widest text-brand-400 uppercase">
            {event.category === 'inter' ? 'Inter-College' : 'Intra-College'} · {event.sport}
          </div>
          <h1 className="mt-2 text-3xl font-extrabold sm:text-5xl">{event.name}</h1>
          <div className="mt-3 flex items-center gap-2 text-slate-400">
            <MapPin className="size-4" /> {event.venue}
          </div>

          <div
            className={`mt-8 inline-flex items-center gap-3 rounded-2xl px-5 py-3 text-lg font-bold ${
              isOpen ? 'bg-brand-500/15 text-brand-300' : phase === 'upcoming' ? 'bg-amber-500/15 text-amber-300' : 'bg-rose-500/15 text-rose-300'
            }`}
          >
            <span className={`size-3 rounded-full ${isOpen ? 'animate-pulse bg-brand-400' : phase === 'upcoming' ? 'bg-amber-400' : 'bg-rose-400'}`} />
            {isOpen ? 'REGISTRATION OPEN' : phase === 'upcoming' ? 'NOT OPEN YET' : 'CLOSED'}
          </div>
          <div className="mt-4 text-slate-300">
            {isOpen && (
              <>
                Closes in <span className="font-mono text-2xl font-bold text-white tabular-nums">{fmtDuration(end - now)}</span>
                <span className="ml-2 text-sm text-slate-500">at {fmtTime(end)}</span>
              </>
            )}
            {phase === 'upcoming' && (
              <>
                Opens in <span className="font-mono text-2xl font-bold text-white tabular-nums">{fmtDuration(start - now)}</span>
              </>
            )}
            {(phase === 'closed' || phase === 'completed') && <>Window was {fmtTime(start)} – {fmtTime(end)}</>}
          </div>

          <div className="mt-10 rounded-3xl bg-slate-900 p-6">
            <div className="flex items-center gap-3">
              <Users className="size-6 text-brand-400" />
              <span className="text-5xl font-extrabold tabular-nums">{regs.length}</span>
              <span className="text-slate-400">registered</span>
            </div>
            <ul className="mt-5 space-y-2">
              {regs.slice(-5).reverse().map((r) => (
                <li key={r.id} className="flex items-center justify-between rounded-xl bg-slate-800/60 px-4 py-2.5 text-sm">
                  <span className="font-semibold">{r.student.name}</span>
                  <span className="text-slate-400">{fmtTime(r.registeredAt)}</span>
                </li>
              ))}
            </ul>
          </div>
          <p className="mt-6 text-sm text-slate-500">Open SportSync on your phone → Scan → point at this code.</p>
        </div>
      </div>
    </div>
  )
}
