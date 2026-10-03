import { Activity, Building2, Medal, University } from 'lucide-react'
import { Card, CategoryBadge, EmptyState, StatCard, Table, td, th } from './ui'
import { fmtDate } from '../lib/format'
import { positionLabel } from '../lib/eventStatus'

// Consolidated record shared by the student "My Record" page and the
// admin student-detail page.
export default function ParticipationSummary({ summary }) {
  const sports = Object.entries(summary.bySport).sort((a, b) => b[1] - a[1])
  const max = Math.max(1, ...sports.map(([, n]) => n))

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={Activity} label="Total events" value={summary.total} hint="Completed & attended" />
        <StatCard icon={Building2} label="Intra-college" value={summary.intra} tone="sky" />
        <StatCard icon={University} label="Inter-college" value={summary.inter} tone="violet" />
        <StatCard icon={Medal} label="Podium finishes" value={summary.podiums} tone="amber" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="p-5">
          <h3 className="font-semibold">By sport</h3>
          {sports.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">No completed events yet.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {sports.map(([sport, n]) => (
                <li key={sport}>
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{sport}</span>
                    <span className="tabular-nums text-slate-500">{n}</span>
                  </div>
                  <div className="mt-1.5 h-2 rounded-full bg-slate-100 dark:bg-slate-800">
                    <div className="h-2 rounded-full bg-brand-500" style={{ width: `${(n / max) * 100}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between px-5 pt-5">
            <h3 className="font-semibold">Participation history</h3>
            {summary.pending > 0 && (
              <span className="text-xs text-slate-500">{summary.pending} awaiting completion</span>
            )}
          </div>
          {summary.history.length === 0 ? (
            <EmptyState title="No participation yet">Register at an event venue by scanning its QR code.</EmptyState>
          ) : (
            <Table>
              <thead>
                <tr>
                  <th className={th}>Event</th>
                  <th className={th}>Date</th>
                  <th className={th}>Result</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {summary.history.map((r) => (
                  <tr key={r.id}>
                    <td className={td}>
                      <div className="font-medium">{r.event.name}</div>
                      <div className="mt-1 flex items-center gap-2">
                        <CategoryBadge category={r.event.category} />
                        <span className="text-xs text-slate-500">{r.event.sport}</span>
                      </div>
                    </td>
                    <td className={`${td} whitespace-nowrap text-slate-500`}>{fmtDate(r.event.date)}</td>
                    <td className={td}>
                      <ResultCell reg={r} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card>
      </div>
    </div>
  )
}

function ResultCell({ reg }) {
  if (reg.event.status !== 'completed') return <span className="text-xs font-medium text-amber-600">Registered</span>
  if (!reg.attended) return <span className="text-xs font-medium text-rose-600">Absent</span>
  if (reg.position)
    return (
      <span className="inline-flex items-center gap-1 text-sm font-semibold text-amber-600">
        <Medal className="size-4" /> {positionLabel(reg.position)}
      </span>
    )
  return <span className="text-sm text-slate-600 dark:text-slate-300">Participated</span>
}
