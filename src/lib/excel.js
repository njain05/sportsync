import { buildSummary } from './summary'
import { CATEGORY_LABEL, PHASE_LABEL, positionLabel } from './eventStatus'
import { fmtDate, fmtDateTime } from './format'

// Turns the participation report (see API_CONTRACT.md) into sheet rows.
export function reportRows(report) {
  const summaries = report.students.map((s) => buildSummary(s, report.events, report.registrations))
  const studentsById = new Map(report.students.map((s) => [s.id, s]))
  const eventsById = new Map(report.events.map((e) => [e.id, e]))

  const summary = summaries
    .sort((a, b) => b.total - a.total || a.student.name.localeCompare(b.student.name))
    .map((s, i) => ({
      'S.No.': i + 1,
      Name: s.student.name,
      URN: s.student.urn,
      CRN: s.student.crn,
      Branch: s.student.branch,
      Batch: s.student.batch,
      'Intra-College Events': s.intra,
      'Inter-College Events': s.inter,
      'Total Events': s.total,
      'Podium Finishes': s.podiums,
      Sports: Object.keys(s.bySport).join(', '),
    }))

  const events = [...report.events]
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .map((e) => {
      const regs = report.registrations.filter((r) => r.eventId === e.id)
      return {
        Event: e.name,
        Sport: e.sport,
        Category: CATEGORY_LABEL[e.category],
        Date: fmtDate(e.date),
        Venue: e.venue,
        Status: PHASE_LABEL[e.phase] || e.status,
        Registered: regs.length,
        Attended: regs.filter((r) => r.attended).length,
      }
    })

  const registrations = report.registrations
    .map((r) => ({ r, s: studentsById.get(r.studentId), e: eventsById.get(r.eventId) }))
    .filter((x) => x.s && x.e)
    .sort((a, b) => new Date(a.e.date) - new Date(b.e.date) || a.s.name.localeCompare(b.s.name))
    .map(({ r, s, e }) => ({
      Event: e.name,
      Category: CATEGORY_LABEL[e.category],
      'Event Date': fmtDate(e.date),
      Name: s.name,
      URN: s.urn,
      Branch: s.branch,
      Batch: s.batch,
      'Registered At': fmtDateTime(r.registeredAt),
      Method: r.method === 'qr' ? 'QR (presence verified)' : 'Manual entry',
      Attended: r.attended ? 'Yes' : 'No',
      Result: e.status === 'completed' && r.attended ? positionLabel(r.position) : '',
    }))

  return { summary, events, registrations }
}

function sheet(XLSX, rows, header) {
  const ws = XLSX.utils.json_to_sheet(rows, { header })
  const keys = header || Object.keys(rows[0] || {})
  ws['!cols'] = keys.map((k) => ({
    wch: Math.min(48, Math.max(k.length, ...rows.map((r) => String(r[k] ?? '').length)) + 2),
  }))
  return ws
}

export async function downloadParticipationExcel(report) {
  const XLSX = await import('xlsx')
  const { summary, events, registrations } = reportRows(report)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, sheet(XLSX, summary), 'Participation Summary')
  XLSX.utils.book_append_sheet(wb, sheet(XLSX, events), 'Events')
  XLSX.utils.book_append_sheet(wb, sheet(XLSX, registrations), 'Registrations')
  const stamp = new Date().toISOString().slice(0, 10)
  XLSX.writeFile(wb, `SportSync_Participation_Report_${stamp}.xlsx`)
}
