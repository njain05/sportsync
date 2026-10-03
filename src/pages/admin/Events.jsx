import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { MonitorPlay, Pencil, Plus, Search, Trash2, Users } from 'lucide-react'
import { api } from '../../api/client'
import { useAsync } from '../../lib/useAsync'
import { fmtDate, fmtTime } from '../../lib/format'
import { Button, Card, CategoryBadge, EmptyState, ErrorNote, Input, Modal, PageHeader, PhaseBadge, Select, Spinner, Table, td, th } from '../../components/ui'
import EventForm from './EventForm'

export default function AdminEvents() {
  const [params, setParams] = useSearchParams()
  const [editing, setEditing] = useState(null)
  const [q, setQ] = useState('')
  const [category, setCategory] = useState('')
  const [phase, setPhase] = useState('')
  const [actionError, setActionError] = useState(null)
  const { data, loading, error, reload } = useAsync(() => api.listEvents(), [])

  const creating = params.get('new') === '1'
  const closeForm = () => {
    setEditing(null)
    if (creating) setParams({})
  }

  const remove = async (e) => {
    if (!confirm(`Delete "${e.name}"?`)) return
    setActionError(null)
    try {
      await api.deleteEvent(e.id)
      reload()
    } catch (err) {
      setActionError(err)
    }
  }

  const rows = (data || []).filter(
    (e) =>
      (!category || e.category === category) &&
      (!phase || e.phase === phase) &&
      (!q || `${e.name} ${e.sport} ${e.venue}`.toLowerCase().includes(q.toLowerCase())),
  )

  return (
    <div>
      <PageHeader
        title="Events"
        subtitle="Create events, display the venue QR, record results."
        actions={
          <Button onClick={() => setParams({ new: '1' })}>
            <Plus className="size-4" /> New event
          </Button>
        }
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-[1fr_auto_auto]">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
          <Input className="pl-9" placeholder="Search events" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <Select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">All categories</option>
          <option value="intra">Intra-College</option>
          <option value="inter">Inter-College</option>
        </Select>
        <Select value={phase} onChange={(e) => setPhase(e.target.value)}>
          <option value="">Any status</option>
          <option value="open">Registration open</option>
          <option value="upcoming">Upcoming</option>
          <option value="closed">Registration closed</option>
          <option value="completed">Completed</option>
        </Select>
      </div>
      <ErrorNote error={actionError} className="mb-4" />

      <Card>
        {loading ? (
          <Spinner />
        ) : error ? (
          <ErrorNote error={error} className="m-4" />
        ) : rows.length === 0 ? (
          <EmptyState title="No events found" />
        ) : (
          <Table>
            <thead className="border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className={th}>Event</th>
                <th className={th}>Registration window</th>
                <th className={th}>Status</th>
                <th className={`${th} text-right`}>Participants</th>
                <th className={th}></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {rows.map((e) => (
                <tr key={e.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                  <td className={`${td} min-w-64`}>
                    <Link to={`/admin/events/${e.id}`} className="font-semibold hover:text-brand-600">
                      {e.name}
                    </Link>
                    <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
                      <CategoryBadge category={e.category} />
                      <span>
                        {e.sport} · {e.venue}
                      </span>
                    </div>
                  </td>
                  <td className={`${td} whitespace-nowrap text-slate-600 dark:text-slate-300`}>
                    {fmtDate(e.regWindow.start)}
                    <div className="text-xs text-slate-500">
                      {fmtTime(e.regWindow.start)} – {fmtTime(e.regWindow.end)}
                    </div>
                  </td>
                  <td className={td}>
                    <PhaseBadge phase={e.phase} />
                  </td>
                  <td className={`${td} text-right font-semibold tabular-nums`}>{e.registrationCount}</td>
                  <td className={td}>
                    <div className="flex justify-end gap-1">
                      {e.phase !== 'completed' && (
                        <Link to={`/admin/events/${e.id}/live`} title="Show venue QR">
                          <Button variant="ghost" size="sm">
                            <MonitorPlay className="size-4" />
                          </Button>
                        </Link>
                      )}
                      <Link to={`/admin/events/${e.id}`} title="Participants">
                        <Button variant="ghost" size="sm">
                          <Users className="size-4" />
                        </Button>
                      </Link>
                      {e.phase !== 'completed' && (
                        <Button variant="ghost" size="sm" title="Edit" onClick={() => setEditing(e)}>
                          <Pencil className="size-4" />
                        </Button>
                      )}
                      {e.registrationCount === 0 && (
                        <Button variant="ghost" size="sm" title="Delete" onClick={() => remove(e)}>
                          <Trash2 className="size-4 text-rose-500" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>

      <Modal open={creating || !!editing} onClose={closeForm} title={editing ? 'Edit event' : 'New event'}>
        <EventForm
          key={editing?.id || 'new'}
          event={editing}
          onCancel={closeForm}
          onSaved={() => {
            closeForm()
            reload()
          }}
        />
      </Modal>
    </div>
  )
}
