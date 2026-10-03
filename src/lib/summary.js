// Consolidated participation summary for one student.
// A participation counts when the student attended an event that is completed.
export function buildSummary(student, events, registrations) {
  const byId = new Map(events.map((e) => [e.id, e]))
  const mine = registrations
    .filter((r) => r.studentId === student.id)
    .map((r) => ({ ...r, event: byId.get(r.eventId) }))
    .filter((r) => r.event)
    .sort((a, b) => new Date(b.event.date) - new Date(a.event.date))

  const counted = mine.filter((r) => r.attended && r.event.status === 'completed')
  const intra = counted.filter((r) => r.event.category === 'intra').length
  const inter = counted.filter((r) => r.event.category === 'inter').length
  const podiums = counted.filter((r) => r.position).length

  const bySport = {}
  for (const r of counted) bySport[r.event.sport] = (bySport[r.event.sport] || 0) + 1

  return {
    student: publicStudent(student),
    intra,
    inter,
    total: intra + inter,
    podiums,
    pending: mine.filter((r) => r.event.status !== 'completed').length,
    bySport,
    history: mine.map(({ event, ...r }) => ({
      ...r,
      event: {
        id: event.id,
        name: event.name,
        sport: event.sport,
        category: event.category,
        date: event.date,
        venue: event.venue,
        status: event.status,
      },
    })),
  }
}

export function publicStudent({ password: _password, ...s }) {
  return s
}
