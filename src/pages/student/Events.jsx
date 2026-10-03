import { useState } from 'react'
import { Info } from 'lucide-react'
import { api } from '../../api/client'
import { useAuth } from '../../context/AuthContext'
import { useAsync } from '../../lib/useAsync'
import { EmptyState, ErrorNote, PageHeader, Spinner } from '../../components/ui'
import { EventTile } from './Dashboard'

const FILTERS = [
  ['', 'All'],
  ['open', 'Open now'],
  ['upcoming', 'Upcoming'],
  ['completed', 'Past'],
]

export default function StudentEvents() {
  const { user } = useAuth()
  const [phase, setPhase] = useState('')
  const [category, setCategory] = useState('')
  const { data, loading, error } = useAsync(async () => {
    const [events, summary] = await Promise.all([api.listEvents(), api.getStudentSummary(user.id)])
    return { events, registered: new Set(summary.history.map((h) => h.event.id)) }
  }, [user.id])

  const events = (data?.events || []).filter(
    (e) => (!phase || e.phase === phase || (phase === 'completed' && e.phase === 'closed')) && (!category || e.category === category),
  )

  return (
    <div>
      <PageHeader title="Events" subtitle="Intra- and inter-college sports events this session." />
      <div className="mb-5 flex items-start gap-3 rounded-2xl bg-sky-50 p-4 text-sm text-sky-800 dark:bg-sky-950/40 dark:text-sky-300">
        <Info className="mt-0.5 size-4 shrink-0" />
        Registration is only possible by scanning the QR code displayed at the venue while the registration window is open.
      </div>
      <div className="mb-5 flex flex-wrap gap-2">
        {FILTERS.map(([key, label]) => (
          <Chip key={key} active={phase === key} onClick={() => setPhase(key)}>
            {label}
          </Chip>
        ))}
        <span className="mx-1 w-px bg-slate-200 dark:bg-slate-800" />
        {[
          ['', 'Any type'],
          ['intra', 'Intra'],
          ['inter', 'Inter'],
        ].map(([key, label]) => (
          <Chip key={key} active={category === key} onClick={() => setCategory(key)}>
            {label}
          </Chip>
        ))}
      </div>
      {loading ? (
        <Spinner />
      ) : error ? (
        <ErrorNote error={error} />
      ) : events.length === 0 ? (
        <EmptyState title="No events match these filters" />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {events.map((e) => (
            <EventTile key={e.id} event={e} registered={data.registered.has(e.id)} />
          ))}
        </div>
      )}
    </div>
  )
}

export function Chip({ active, children, ...props }) {
  return (
    <button
      className={`rounded-full px-3.5 py-1.5 text-sm font-semibold transition ${
        active
          ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
          : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-700'
      }`}
      {...props}
    >
      {children}
    </button>
  )
}
