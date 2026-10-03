import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Award, CheckCircle2, MonitorPlay, UserPlus } from 'lucide-react'
import { api } from '../../api/client'
import { useAsync } from '../../lib/useAsync'
import { fmtDate, fmtDateTime, fmtTime } from '../../lib/format'
import { Button, Card, CategoryBadge, EmptyState, ErrorNote, Input, Modal, PhaseBadge, Select, Spinner, Table, td, th } from '../../components/ui'

export default function Participants() {
  const { id } = useParams()
  const [urn, setUrn] = useState('')
  const [actionError, setActionError] = useState(null)
  const [adding, setAdding] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [completing, setCompleting] = useState(false)
  const [done, setDone] = useState(null)

  const { data, loading, error, reload, setData } = useAsync(async () => {
    const [event, regs] = await Promise.all([api.getEvent(id), api.listEventRegistrations(id)])
    return { event, regs }
  }, [id])

  if (loading && !data) return <Spinner />
  if (error) return <ErrorNote error={error} />
  const { event, regs } = data
  const locked = event.phase === 'completed'
  const attended = regs.filter((r) => r.attended).length

  const patch = async (reg, change) => {
    setActionError(null)
    try {
      const updated = await api.updateRegistration(reg.id, change)
      setData({ event, regs: regs.map((r) => (r.id === reg.id ? { ...r, ...updated } : r)) })
    } catch (err) {
      setActionError(err)
    }
  }

  const addManual = async (e) => {
    e.preventDefault()
    setAdding(true)
    setActionError(null)
    try {
      await api.addManualRegistration(id, urn)
      setUrn('')
      reload()
    } catch (err) {
      setActionError(err)
    } finally {
      setAdding(false)
    }
  }

  const complete = async () => {
    setCompleting(true)
    setActionError(null)
    try {
      const out = await api.completeEvent(id)
      setDone(out.certificatesIssued)
      setConfirming(false)
      reload()
    } catch (err) {
      setActionError(err)
      setConfirming(false)
    } finally {
      setCompleting(false)
    }
  }

  return (
    <div>
      <Link to="/admin/events" className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white">
        <ArrowLeft className="size-4" /> All events
      </Link>

      <Card className="mb-6 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <PhaseBadge phase={event.phase} />
              <CategoryBadge category={event.category} />
            </div>
            <h1 className="mt-3 text-2xl font-bold tracking-tight">{event.name}</h1>
            <p className="mt-1 text-sm text-slate-500">
              {event.sport} · {event.venue} · {fmtDate(event.date)}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Registration window: {fmtDateTime(event.regWindow.start)} – {fmtTime(event.regWindow.end)}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {!locked && (
              <Link to={`/admin/events/${id}/live`}>
                <Button variant="secondary">
                  <MonitorPlay className="size-4" /> Venue QR
                </Button>
              </Link>
            )}
            {!locked && event.phase !== 'upcoming' && (
              <Button onClick={() => setConfirming(true)}>
                <Award className="size-4" /> Complete & issue certificates
              </Button>
            )}
          </div>
        </div>
        <div className="mt-5 grid grid-cols-3 gap-3 border-t border-slate-100 pt-5 text-center dark:border-slate-800">
          <Metric label="Registered" value={regs.length} />
          <Metric label="Attended" value={attended} />
          <Metric label="Podium" value={regs.filter((r) => r.position).length} />
        </div>
      </Card>

      {done !== null && (
        <div className="mb-4 flex items-center gap-2 rounded-xl bg-brand-50 px-4 py-3 text-sm font-medium text-brand-800 dark:bg-brand-900/30 dark:text-brand-300">
          <CheckCircle2 className="size-4" /> Event completed. {done} certificate{done === 1 ? '' : 's'} issued to student portals.
        </div>
      )}
      <ErrorNote error={actionError} className="mb-4" />

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 pt-5">
          <h2 className="font-bold">Participants</h2>
          {!locked && (
            <form onSubmit={addManual} className="flex gap-2">
              <Input value={urn} onChange={(e) => setUrn(e.target.value)} placeholder="Add by URN" className="w-40" inputMode="numeric" required />
              <Button type="submit" variant="secondary" loading={adding} title="Digitise a paper record, e.g. inter-college team list">
                <UserPlus className="size-4" /> Add
              </Button>
            </form>
          )}
        </div>
        {regs.length === 0 ? (
          <EmptyState title="No registrations yet">Students appear here as they scan the venue QR.</EmptyState>
        ) : (
          <Table>
            <thead className="border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className={th}>#</th>
                <th className={th}>Student</th>
                <th className={th}>Registered</th>
                <th className={th}>Attended</th>
                <th className={th}>Position</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {regs.map((r, i) => (
                <tr key={r.id}>
                  <td className={`${td} text-slate-400 tabular-nums`}>{i + 1}</td>
                  <td className={td}>
                    <Link to={`/admin/students/${r.student.id}`} className="font-semibold hover:text-brand-600">
                      {r.student.name}
                    </Link>
                    <div className="text-xs text-slate-500">
                      {r.student.urn} · {r.student.branch} · {r.student.batch}
                    </div>
                  </td>
                  <td className={`${td} whitespace-nowrap`}>
                    <div className="text-slate-600 dark:text-slate-300">{fmtTime(r.registeredAt)}</div>
                    <span className={`text-xs font-semibold ${r.method === 'qr' ? 'text-brand-600' : 'text-slate-500'}`}>
                      {r.method === 'qr' ? 'QR verified' : 'Added manually'}
                    </span>
                  </td>
                  <td className={td}>
                    <input
                      type="checkbox"
                      className="size-4 accent-brand-600"
                      checked={r.attended}
                      disabled={locked}
                      onChange={(e) => patch(r, { attended: e.target.checked })}
                      aria-label={`${r.student.name} attended`}
                    />
                  </td>
                  <td className={td}>
                    <Select
                      className="w-32 py-1.5"
                      value={r.position ?? ''}
                      disabled={locked || !r.attended}
                      onChange={(e) => patch(r, { position: e.target.value ? Number(e.target.value) : null })}
                    >
                      <option value="">—</option>
                      <option value="1">1st</option>
                      <option value="2">2nd</option>
                      <option value="3">3rd</option>
                    </Select>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>

      <Modal open={confirming} onClose={() => setConfirming(false)} title="Complete event?">
        <p className="text-sm text-slate-600 dark:text-slate-300">
          This locks the results and issues certificates to the <b>{attended}</b> student{attended === 1 ? '' : 's'} marked as
          attended. Students see them in their portal immediately.
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setConfirming(false)}>
            Cancel
          </Button>
          <Button onClick={complete} loading={completing}>
            Complete & issue
          </Button>
        </div>
      </Modal>
    </div>
  )
}

function Metric({ label, value }) {
  return (
    <div>
      <div className="text-2xl font-bold tabular-nums">{value}</div>
      <div className="text-xs font-medium text-slate-500">{label}</div>
    </div>
  )
}
