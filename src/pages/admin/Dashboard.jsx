import { Link } from 'react-router-dom'
import { Award, CalendarDays, ClipboardList, MonitorPlay, Plus, RotateCcw, Users } from 'lucide-react'
import { api, USE_MOCK } from '../../api/client'
import { useAsync } from '../../lib/useAsync'
import { fmtDate } from '../../lib/format'
import { Button, Card, CategoryBadge, ErrorNote, PageHeader, PhaseBadge, Spinner, StatCard } from '../../components/ui'

export default function AdminDashboard() {
  const { data, loading, error, reload } = useAsync(async () => {
    const [stats, events] = await Promise.all([api.getDashboardStats(), api.listEvents()])
    return { stats, events }
  }, [])

  if (loading) return <Spinner />
  if (error) return <ErrorNote error={error} />
  const { stats, events } = data
  const open = events.filter((e) => e.phase === 'open')
  const awaiting = events.filter((e) => e.phase === 'closed')
  const recent = events.slice(0, 6)

  const reset = async () => {
    if (!confirm('Reset all demo data? Events, registrations and certificates you created will be lost.')) return
    await api.resetDemoData()
    reload()
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Dashboard"
        subtitle="Sports participation at a glance."
        actions={
          <Link to="/admin/events?new=1">
            <Button>
              <Plus className="size-4" /> New event
            </Button>
          </Link>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={Users} label="Students" value={stats.students} />
        <StatCard icon={CalendarDays} label="Events" value={stats.events} hint={`${stats.intraEvents} intra · ${stats.interEvents} inter`} tone="sky" />
        <StatCard icon={ClipboardList} label="Registrations" value={stats.registrations} tone="violet" />
        <StatCard icon={Award} label="Certificates issued" value={stats.certificates} tone="amber" />
      </div>

      {(open.length > 0 || awaiting.length > 0) && (
        <div className="grid gap-4 lg:grid-cols-2">
          {open.map((e) => (
            <Card key={e.id} className="flex flex-wrap items-center gap-4 p-5 ring-2 ring-brand-500/40">
              <div className="min-w-0 flex-1">
                <PhaseBadge phase={e.phase} />
                <div className="mt-2 font-bold">{e.name}</div>
                <div className="text-sm text-slate-500">{e.registrationCount} registered so far</div>
              </div>
              <Link to={`/admin/events/${e.id}/live`}>
                <Button>
                  <MonitorPlay className="size-4" /> Show QR
                </Button>
              </Link>
            </Card>
          ))}
          {awaiting.map((e) => (
            <Card key={e.id} className="flex flex-wrap items-center gap-4 p-5">
              <div className="min-w-0 flex-1">
                <PhaseBadge phase={e.phase} />
                <div className="mt-2 font-bold">{e.name}</div>
                <div className="text-sm text-slate-500">Record results and issue certificates</div>
              </div>
              <Link to={`/admin/events/${e.id}`}>
                <Button variant="secondary">Complete event</Button>
              </Link>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <div className="flex items-center justify-between px-5 pt-5">
          <h2 className="font-bold">Recent events</h2>
          <Link to="/admin/events" className="text-sm font-semibold text-brand-600">
            View all
          </Link>
        </div>
        <ul className="mt-3 divide-y divide-slate-100 dark:divide-slate-800">
          {recent.map((e) => (
            <li key={e.id}>
              <Link to={`/admin/events/${e.id}`} className="flex flex-wrap items-center gap-3 px-5 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium">{e.name}</div>
                  <div className="text-xs text-slate-500">
                    {fmtDate(e.date)} · {e.registrationCount} participants
                  </div>
                </div>
                <CategoryBadge category={e.category} />
                <PhaseBadge phase={e.phase} />
              </Link>
            </li>
          ))}
        </ul>
      </Card>

      {USE_MOCK && (
        <div className="flex justify-end">
          <Button variant="ghost" size="sm" onClick={reset}>
            <RotateCcw className="size-4" /> Reset demo data
          </Button>
        </div>
      )}
    </div>
  )
}
