import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Html5Qrcode } from 'html5-qrcode'
import { Camera, CameraOff, CheckCircle2, Clock, Keyboard, ScanLine, XCircle } from 'lucide-react'
import { api, USE_MOCK } from '../../api/client'
import { fmtDateTime } from '../../lib/format'
import { Button, Card, CategoryBadge, Input, PageHeader } from '../../components/ui'

const READER_ID = 'qr-reader'
const IDLE_TIMEOUT_MS = 60000

export default function ScanRegister() {
  const [result, setResult] = useState(null) // { ok, event?, error? }
  const [busy, setBusy] = useState(false)
  const [manual, setManual] = useState('')
  const [scanning, setScanning] = useState(false)

  const submit = async (text) => {
    if (busy) return
    setBusy(true)
    try {
      const { event, registration } = await api.scanRegister(text)
      setResult({ ok: true, event, registration })
    } catch (error) {
      setResult({ ok: false, error })
    } finally {
      setBusy(false)
      setScanning(false)
    }
  }

  const reset = () => {
    setResult(null)
    setManual('')
    setScanning(false)
  }

  return (
    <div className="mx-auto max-w-lg">
      <PageHeader title="Scan to register" subtitle="Point your camera at the QR code displayed at the event venue." />

      {result ? (
        <ResultCard result={result} onRetry={reset} />
      ) : (
        <>
          {scanning ? (
            <Scanner onScan={submit} busy={busy} onStop={() => setScanning(false)} />
          ) : (
            <Card className="flex flex-col items-center p-8 text-center">
              <span className="grid size-16 place-items-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-900/40 dark:text-brand-300">
                <ScanLine className="size-8" />
              </span>
              <p className="mt-4 text-sm text-slate-500">
                At the venue? Start the camera and point it at the event QR code.
              </p>
              <Button size="lg" className="mt-5" onClick={() => setScanning(true)}>
                <Camera className="size-5" /> Start camera
              </Button>
            </Card>
          )}
          {USE_MOCK && (
            <Card className="mt-5 p-5">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Keyboard className="size-4" /> No camera? Enter the event code
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Demo fallback: copy the code shown under the QR on the admin's live screen.
              </p>
              <form
                className="mt-3 flex gap-2"
                onSubmit={(e) => {
                  e.preventDefault()
                  if (manual.trim()) submit(manual)
                }}
              >
                <Input value={manual} onChange={(e) => setManual(e.target.value)} placeholder="sportsync:evt_…" />
                <Button type="submit" loading={busy}>
                  Register
                </Button>
              </form>
            </Card>
          )}
        </>
      )}
    </div>
  )
}

function Scanner({ onScan, busy, onStop }) {
  const [camError, setCamError] = useState(null)
  const onScanRef = useRef(onScan)
  const onStopRef = useRef(onStop)
  useEffect(() => {
    onScanRef.current = onScan
    onStopRef.current = onStop
  }, [onScan, onStop])

  useEffect(() => {
    const scanner = new Html5Qrcode(READER_ID, { verbose: false })
    let stopped = false
    let handled = false
    const started = scanner
      .start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: (w, h) => { const s = Math.floor(Math.min(w, h) * 0.7); return { width: s, height: s } } },
        (text) => {
          if (handled) return
          handled = true
          onScanRef.current(text)
        },
        () => {},
      )
      .catch((err) => {
        if (!stopped) setCamError(err?.message || String(err))
      })

    // Turn the camera off if nothing is scanned for a while or the app is backgrounded.
    const idle = setTimeout(() => onStopRef.current(), IDLE_TIMEOUT_MS)
    const onHidden = () => document.hidden && onStopRef.current()
    document.addEventListener('visibilitychange', onHidden)

    return () => {
      stopped = true
      clearTimeout(idle)
      document.removeEventListener('visibilitychange', onHidden)
      // Release the camera even if start() is still pending when we unmount.
      started
        .then(() => scanner.isScanning && scanner.stop())
        .catch(() => {})
        .finally(() => {
          document.querySelectorAll(`#${READER_ID} video`).forEach((v) => {
            v.srcObject?.getTracks().forEach((t) => t.stop())
          })
          try { scanner.clear() } catch { /* already cleared */ }
        })
    }
  }, [])

  return (
    <Card className="overflow-hidden">
      <div className="relative aspect-square bg-slate-950">
        <div id={READER_ID} className="size-full [&_video]:size-full [&_video]:object-cover" />
        {camError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-8 text-center text-slate-300">
            <CameraOff className="size-10" />
            <div className="font-semibold">Camera unavailable</div>
            <p className="text-xs text-slate-400">
              Allow camera access, and open SportSync over HTTPS (or localhost) on your phone.
            </p>
          </div>
        )}
        {busy && (
          <div className="absolute inset-0 grid place-items-center bg-slate-950/70 font-semibold text-white">Verifying…</div>
        )}
      </div>
      <div className="flex items-center justify-between gap-2 p-4 text-sm text-slate-500">
        <span className="flex items-center gap-2">
          <ScanLine className="size-4 text-brand-600" /> Scanning… turns off after 1 minute
        </span>
        <Button variant="secondary" size="sm" onClick={onStop}>
          <CameraOff className="size-4" /> Stop
        </Button>
      </div>
    </Card>
  )
}

function ResultCard({ result, onRetry }) {
  if (result.ok) {
    const { event, registration } = result
    return (
      <Card className="p-8 text-center">
        <CheckCircle2 className="mx-auto size-16 text-brand-600" />
        <h2 className="mt-4 text-xl font-bold">You're registered!</h2>
        <p className="mt-1 text-sm text-slate-500">Your presence at the venue has been verified.</p>
        <div className="mt-6 rounded-2xl bg-slate-50 p-4 text-left dark:bg-slate-800/60">
          <CategoryBadge category={event.category} />
          <div className="mt-2 font-bold">{event.name}</div>
          <div className="text-sm text-slate-500">{event.venue}</div>
          <div className="mt-2 text-xs text-slate-500">Registered at {fmtDateTime(registration.registeredAt)}</div>
        </div>
        <div className="mt-6 flex justify-center gap-2">
          <Link to="/student/record">
            <Button variant="secondary">View my record</Button>
          </Link>
          <Button onClick={onRetry}>Scan another</Button>
        </div>
      </Card>
    )
  }
  const timing = ['WINDOW_NOT_OPEN', 'WINDOW_CLOSED'].includes(result.error.code)
  const Icon = timing ? Clock : XCircle
  return (
    <Card className="p-8 text-center">
      <Icon className={`mx-auto size-16 ${timing ? 'text-amber-500' : 'text-rose-500'}`} />
      <h2 className="mt-4 text-xl font-bold">{TITLES[result.error.code] || 'Registration failed'}</h2>
      <p className="mt-2 text-sm text-slate-500">{result.error.message}</p>
      <Button className="mt-6" onClick={onRetry}>
        Try again
      </Button>
    </Card>
  )
}

const TITLES = {
  WINDOW_NOT_OPEN: 'Registration not open yet',
  WINDOW_CLOSED: 'Registration closed',
  ALREADY_REGISTERED: 'Already registered',
  INVALID_QR: 'Not a SportSync code',
  QR_MISMATCH: 'QR code expired',
  EVENT_COMPLETED: 'Event completed',
}
