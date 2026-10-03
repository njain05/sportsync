import { Link } from 'react-router-dom'
import { ArrowRight, Award, Building2, CalendarClock, MapPin, ScanLine, University } from 'lucide-react'
import { api } from '../../api/client'
import { useAuth } from '../../context/AuthContext'
import { useAsync } from '../../lib/useAsync'
import { fmtDateTime } from '../../lib/format'
import { Card, CategoryBadge, ErrorNote, PhaseBadge, Spinner, StatCard } from '../../components/ui'

export default function StudentDashboard() {
  const { user } = useAuth()
  const { data, loading, error } = useAsync(async () => {
    const [summary, events, certs] = await Promise.all([
      api.getStudentSummary(user.id),
      api.listEvents(),
      api.myCertificates(),
    ])
    return { summary, events, certs }
  }, [user.id])

  if (loading) return <Spinner />
  if (error) return <ErrorNote error={error} />

  const { summary, events, certs } = data
  const registered = new Set(summary.history.map((h) => h.event.id))
  const open = events.filter((e) => e.phase === 'open')
  const upcoming = events.filter((e) => e.phase === 'upcoming').reverse().slice(0, 3)

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm font-medium text-slate-500">Welcome back,</p>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{user.name}</h1>
        <p className="mt-1 text-sm text-slate-500">
          {user.branch} · Batch {user.batch} · URN {user.urn}
        </p>
      </div>

      <Link
        to="/student/scan"
        className="group flex items-center gap-4 rounded-3xl bg-gradient-to-br from-brand-600 to-brand-800 p-6 text-white shadow-lg shadow-brand-700/20"
      >
        <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-white/15">
          <ScanLine className="size-7" />
        </span>
        <span className="flex-1">
          <span className="block text-lg font-bold">Scan to register</span>
          <span className="block text-sm text-brand-100">
            At the venue? Scan the event QR while registration is open.
          </span>
        </span>
        <ArrowRight className="size-6 transition group-hover:translate-x-1" />
      </Link>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={Building2} label="Intra-college" value={summary.intra} tone="sky" />
        <StatCard icon={University} label="Inter-college" value={summary.inter} tone="violet" />
        <StatCard icon={CalendarClock} label="Total events" value={summary.total} />
        <StatCard icon={Award} label="Certificates" value={certs.length} tone="amber" />
      </div>

      <section>
        <h2 className="mb-3 text-lg font-bold">Open for registration now</h2>
        {open.length === 0 ? (
          <Card className="p-5 text-sm text-slate-500">No event has an open registration window right now.</Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {open.map((e) => (
              <EventTile key={e.id} event={e} registered={registered.has(e.id)} />
            ))}
          </div>
        )}
      </section>

      {upcoming.length > 0 && (
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-bold">Coming up</h2>
            <Link to="/student/events" className="text-sm font-semibold text-brand-600">
              All events
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {upcoming.map((e) => (
              <EventTile key={e.id} event={e} registered={registered.has(e.id)} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

export function EventTile({ event, registered }) {
  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-center gap-2">
        <PhaseBadge phase={event.phase} />
        <CategoryBadge category={event.category} />
        {registered && (
          <span className="rounded-full bg-brand-600 px-2.5 py-0.5 text-xs font-semibold text-white">Registered</span>
        )}
      </div>
      <h3 className="mt-3 font-bold">{event.name}</h3>
      <div className="mt-2 space-y-1 text-sm text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-2">
          <MapPin className="size-4 shrink-0" /> {event.venue}
        </div>
        <div className="flex items-center gap-2">
          <CalendarClock className="size-4 shrink-0" />
          {fmtDateTime(event.regWindow.start)} – {new Date(event.regWindow.end).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })}
        </div>
      </div>
    </Card>
  )
}
