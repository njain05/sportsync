import { useState } from 'react'
import { api } from '../../api/client'
import { toLocalInput } from '../../lib/format'
import { Button, ErrorNote, Field, Input, Select } from '../../components/ui'

const SPORTS = ['Athletics', 'Badminton', 'Basketball', 'Chess', 'Cricket', 'Football', 'Hockey', 'Kabaddi', 'Table Tennis', 'Volleyball', 'Weightlifting']

function defaults() {
  const start = new Date()
  start.setMinutes(0, 0, 0)
  start.setHours(start.getHours() + 1)
  const end = new Date(start.getTime() + 2 * 3600000)
  return {
    name: '',
    sport: '',
    category: 'intra',
    venue: '',
    date: toLocalInput(start).slice(0, 10),
    start: toLocalInput(start),
    end: toLocalInput(end),
  }
}

export default function EventForm({ event, onSaved, onCancel }) {
  const [form, setForm] = useState(() =>
    event
      ? {
          name: event.name,
          sport: event.sport,
          category: event.category,
          venue: event.venue,
          date: toLocalInput(event.date).slice(0, 10),
          start: toLocalInput(event.regWindow.start),
          end: toLocalInput(event.regWindow.end),
        }
      : defaults(),
  )
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    const payload = {
      name: form.name,
      sport: form.sport,
      category: form.category,
      venue: form.venue,
      date: new Date(`${form.date}T00:00`).toISOString(),
      regWindow: { start: new Date(form.start).toISOString(), end: new Date(form.end).toISOString() },
    }
    try {
      const saved = event ? await api.updateEvent(event.id, payload) : await api.createEvent(payload)
      onSaved(saved)
    } catch (err) {
      setError(err)
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="Event name">
        <Input value={form.name} onChange={set('name')} placeholder="Intra-College Football Tournament" required />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Sport">
          <Input value={form.sport} onChange={set('sport')} list="sports" placeholder="Football" required />
          <datalist id="sports">
            {SPORTS.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
        </Field>
        <Field label="Category">
          <Select value={form.category} onChange={set('category')}>
            <option value="intra">Intra-College</option>
            <option value="inter">Inter-College (PTU)</option>
          </Select>
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Venue">
          <Input value={form.venue} onChange={set('venue')} placeholder="Main Ground" required />
        </Field>
        <Field label="Event date">
          <Input type="date" value={form.date} onChange={set('date')} required />
        </Field>
      </div>
      <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/50">
        <div className="mb-3 text-sm font-semibold">Registration window</div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Opens">
            <Input type="datetime-local" value={form.start} onChange={set('start')} required />
          </Field>
          <Field label="Closes">
            <Input type="datetime-local" value={form.end} onChange={set('end')} required />
          </Field>
        </div>
        <p className="mt-3 text-xs text-slate-500">Students can only register by scanning the venue QR within this window.</p>
      </div>
      <ErrorNote error={error} />
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loading={busy}>
          {event ? 'Save changes' : 'Create event'}
        </Button>
      </div>
    </form>
  )
}
