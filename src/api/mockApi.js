// Mock implementation of the SportSync REST API, backed by localStorage.
// Every function mirrors an endpoint in API_CONTRACT.md and is async so the
// UI behaves the same once httpApi.js talks to the real backend.
// NOTE: validation here (QR token, time window) is for the demo only — the
// real backend must enforce these rules server-side.
import { load, save, remove } from './storage'
import { buildSeed, DEMO_ADMIN } from './seed'
import { ApiError } from './errors'
import { parseQrPayload, buildQrPayload } from '../lib/qrToken'
import { buildSummary, publicStudent } from '../lib/summary'
import { eventPhase } from '../lib/eventStatus'

const DB_KEY = 'db'
const SESSION_KEY = 'session'

const delay = (ms = 120) => new Promise((r) => setTimeout(r, ms))
const newId = (prefix) => `${prefix}_${crypto.randomUUID().slice(0, 8)}`
const newToken = () => crypto.randomUUID().replace(/-/g, '').slice(0, 16)

function db() {
  let data = load(DB_KEY)
  if (!data) data = reseed()
  return data
}

function commit(data) {
  save(DB_KEY, data)
}

function reseed() {
  const { completeIds, ...data } = buildSeed()
  for (const id of completeIds) issueCertificates(data, id, data.events.find((e) => e.id === id).regWindow.end)
  commit(data)
  return data
}

function session() {
  const s = load(SESSION_KEY)
  if (!s) throw new ApiError('UNAUTHORIZED', 'Please log in again.', 401)
  return s
}

function requireRole(role) {
  const s = session()
  if (s.role !== role) throw new ApiError('FORBIDDEN', 'You do not have access to this action.', 403)
  return s
}

function certNo(data, event) {
  const year = new Date(event.date).getFullYear()
  const n = String(data.certificates.length + 1).padStart(4, '0')
  return `GNDEC/SPORTS/${year}/${n}`
}

function issueCertificates(data, eventId, completedAt = new Date().toISOString()) {
  const event = data.events.find((e) => e.id === eventId)
  event.status = 'completed'
  event.completedAt = completedAt
  let issued = 0
  for (const reg of data.registrations) {
    if (reg.eventId !== eventId || !reg.verified || !reg.attended) continue
    if (data.certificates.some((c) => c.registrationId === reg.id)) continue
    data.certificates.push({
      id: newId('cert'),
      certNo: certNo(data, event),
      registrationId: reg.id,
      eventId,
      studentId: reg.studentId,
      position: reg.position,
      issuedAt: event.completedAt,
    })
    issued++
  }
  return issued
}

function withCounts(data, event) {
  const regs = data.registrations.filter((r) => r.eventId === event.id)
  const { qrToken: _qrToken, ...rest } = event
  return { ...rest, registrationCount: regs.length, phase: eventPhase(event) }
}

function expandCertificate(data, cert) {
  const event = data.events.find((e) => e.id === cert.eventId)
  const student = data.students.find((s) => s.id === cert.studentId)
  return {
    ...cert,
    event: { id: event.id, name: event.name, sport: event.sport, category: event.category, date: event.date, venue: event.venue },
    student: publicStudent(student),
  }
}

function validateEvent(input) {
  const required = ['name', 'sport', 'category', 'date', 'venue']
  for (const k of required) if (!input[k]) throw new ApiError('VALIDATION', `Field "${k}" is required.`, 422)
  if (!['intra', 'inter'].includes(input.category)) throw new ApiError('VALIDATION', 'Category must be intra or inter.', 422)
  const start = new Date(input.regWindow?.start).getTime()
  const end = new Date(input.regWindow?.end).getTime()
  if (!start || !end) throw new ApiError('VALIDATION', 'Registration window start and end are required.', 422)
  if (end <= start) throw new ApiError('VALIDATION', 'Registration window must end after it starts.', 422)
}

// ---------- Auth ----------

export async function login({ role, username, password }) {
  await delay()
  const data = db()
  let user
  if (role === 'admin') {
    if (username !== DEMO_ADMIN.username || password !== DEMO_ADMIN.password)
      throw new ApiError('INVALID_CREDENTIALS', 'Incorrect username or password.', 401)
    user = { id: 'admin_1', name: 'Sports In-Charge', role: 'admin' }
  } else {
    const s = data.students.find((x) => x.urn === String(username).trim())
    if (!s || s.password !== password) throw new ApiError('INVALID_CREDENTIALS', 'Incorrect URN or password.', 401)
    user = { ...publicStudent(s), role: 'student' }
  }
  const token = `mock.${btoa(`${user.id}:${user.role}`)}`
  save(SESSION_KEY, { token, userId: user.id, role: user.role })
  return { token, user }
}

export async function logout() {
  remove(SESSION_KEY)
}

export async function me() {
  await delay(40)
  const s = load(SESSION_KEY)
  if (!s) return null
  if (s.role === 'admin') return { id: s.userId, name: 'Sports In-Charge', role: 'admin' }
  const stu = db().students.find((x) => x.id === s.userId)
  return stu ? { ...publicStudent(stu), role: 'student' } : null
}

// ---------- Events ----------

export async function listEvents({ category, phase } = {}) {
  await delay()
  session()
  const data = db()
  return data.events
    .map((e) => withCounts(data, e))
    .filter((e) => (!category || e.category === category) && (!phase || e.phase === phase))
    .sort((a, b) => new Date(b.date) - new Date(a.date))
}

export async function getEvent(id) {
  await delay()
  session()
  const data = db()
  const e = data.events.find((x) => x.id === id)
  if (!e) throw new ApiError('EVENT_NOT_FOUND', 'Event not found.', 404)
  return withCounts(data, e)
}

export async function createEvent(input) {
  await delay()
  requireRole('admin')
  validateEvent(input)
  const data = db()
  const event = {
    id: newId('evt'),
    name: input.name.trim(),
    sport: input.sport.trim(),
    category: input.category,
    venue: input.venue.trim(),
    date: new Date(input.date).toISOString(),
    regWindow: { start: new Date(input.regWindow.start).toISOString(), end: new Date(input.regWindow.end).toISOString() },
    status: 'scheduled',
    qrToken: newToken(),
    createdAt: new Date().toISOString(),
  }
  data.events.push(event)
  commit(data)
  return withCounts(data, event)
}

export async function updateEvent(id, input) {
  await delay()
  requireRole('admin')
  const data = db()
  const event = data.events.find((x) => x.id === id)
  if (!event) throw new ApiError('EVENT_NOT_FOUND', 'Event not found.', 404)
  if (event.status === 'completed') throw new ApiError('EVENT_COMPLETED', 'Completed events cannot be edited.', 409)
  const next = { ...event, ...input, regWindow: { ...event.regWindow, ...input.regWindow } }
  validateEvent(next)
  Object.assign(event, {
    name: next.name.trim(),
    sport: next.sport.trim(),
    category: next.category,
    venue: next.venue.trim(),
    date: new Date(next.date).toISOString(),
    regWindow: { start: new Date(next.regWindow.start).toISOString(), end: new Date(next.regWindow.end).toISOString() },
  })
  commit(data)
  return withCounts(data, event)
}

export async function deleteEvent(id) {
  await delay()
  requireRole('admin')
  const data = db()
  const event = data.events.find((x) => x.id === id)
  if (!event) throw new ApiError('EVENT_NOT_FOUND', 'Event not found.', 404)
  if (data.registrations.some((r) => r.eventId === id))
    throw new ApiError('EVENT_HAS_REGISTRATIONS', 'This event already has registrations and cannot be deleted.', 409)
  data.events = data.events.filter((x) => x.id !== id)
  commit(data)
}

export async function getEventQr(id) {
  await delay(60)
  requireRole('admin')
  const e = db().events.find((x) => x.id === id)
  if (!e) throw new ApiError('EVENT_NOT_FOUND', 'Event not found.', 404)
  return { payload: buildQrPayload(e.id, e.qrToken), regWindow: e.regWindow }
}

export async function regenerateEventQr(id) {
  await delay()
  requireRole('admin')
  const data = db()
  const e = data.events.find((x) => x.id === id)
  if (!e) throw new ApiError('EVENT_NOT_FOUND', 'Event not found.', 404)
  e.qrToken = newToken()
  commit(data)
  return { payload: buildQrPayload(e.id, e.qrToken), regWindow: e.regWindow }
}

export async function completeEvent(id) {
  await delay(250)
  requireRole('admin')
  const data = db()
  const e = data.events.find((x) => x.id === id)
  if (!e) throw new ApiError('EVENT_NOT_FOUND', 'Event not found.', 404)
  if (e.status === 'completed') throw new ApiError('EVENT_COMPLETED', 'Event is already completed.', 409)
  if (Date.now() < new Date(e.regWindow.start).getTime())
    throw new ApiError('VALIDATION', 'An event cannot be completed before registration has opened.', 422)
  const certificatesIssued = issueCertificates(data, id)
  commit(data)
  return { event: withCounts(data, e), certificatesIssued }
}

// ---------- Registrations ----------

export async function scanRegister(qrText) {
  await delay(200)
  const s = requireRole('student')
  const parsed = parseQrPayload(qrText)
  if (!parsed) throw new ApiError('INVALID_QR', 'This is not a SportSync event QR code.', 400)
  const data = db()
  const event = data.events.find((e) => e.id === parsed.eventId)
  if (!event) throw new ApiError('EVENT_NOT_FOUND', 'This event no longer exists.', 404)
  if (event.qrToken !== parsed.qrToken)
    throw new ApiError('QR_MISMATCH', 'This QR code is no longer valid. Scan the code displayed at the venue.', 400)
  if (event.status === 'completed') throw new ApiError('EVENT_COMPLETED', 'This event has already been completed.', 409)
  const now = Date.now()
  const start = new Date(event.regWindow.start).getTime()
  const end = new Date(event.regWindow.end).getTime()
  if (now < start) throw new ApiError('WINDOW_NOT_OPEN', `Registration has not opened yet. It opens at ${fmtTime(start)}.`, 403)
  if (now > end) throw new ApiError('WINDOW_CLOSED', `Registration closed at ${fmtTime(end)}.`, 403)
  if (data.registrations.some((r) => r.eventId === event.id && r.studentId === s.userId))
    throw new ApiError('ALREADY_REGISTERED', 'You are already registered for this event.', 409)
  const reg = {
    id: newId('reg'),
    eventId: event.id,
    studentId: s.userId,
    registeredAt: new Date(now).toISOString(),
    method: 'qr',
    verified: true,
    attended: true,
    position: null,
  }
  data.registrations.push(reg)
  commit(data)
  return { registration: reg, event: withCounts(data, event) }
}

function fmtTime(ms) {
  return new Date(ms).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
}

export async function listEventRegistrations(eventId) {
  await delay()
  requireRole('admin')
  const data = db()
  return data.registrations
    .filter((r) => r.eventId === eventId)
    .map((r) => ({ ...r, student: publicStudent(data.students.find((s) => s.id === r.studentId)) }))
    .sort((a, b) => new Date(a.registeredAt) - new Date(b.registeredAt))
}

// For inter-college events, results recorded on paper are digitised by the admin.
export async function addManualRegistration(eventId, urn) {
  await delay()
  requireRole('admin')
  const data = db()
  const event = data.events.find((e) => e.id === eventId)
  if (!event) throw new ApiError('EVENT_NOT_FOUND', 'Event not found.', 404)
  if (event.status === 'completed') throw new ApiError('EVENT_COMPLETED', 'Event is already completed.', 409)
  const student = data.students.find((s) => s.urn === String(urn).trim())
  if (!student) throw new ApiError('STUDENT_NOT_FOUND', `No student with URN ${urn}.`, 404)
  if (data.registrations.some((r) => r.eventId === eventId && r.studentId === student.id))
    throw new ApiError('ALREADY_REGISTERED', `${student.name} is already registered.`, 409)
  const reg = {
    id: newId('reg'),
    eventId,
    studentId: student.id,
    registeredAt: new Date().toISOString(),
    method: 'manual',
    verified: true,
    attended: true,
    position: null,
  }
  data.registrations.push(reg)
  commit(data)
  return { ...reg, student: publicStudent(student) }
}

export async function updateRegistration(id, { position, attended }) {
  await delay(80)
  requireRole('admin')
  const data = db()
  const reg = data.registrations.find((r) => r.id === id)
  if (!reg) throw new ApiError('REGISTRATION_NOT_FOUND', 'Registration not found.', 404)
  const event = data.events.find((e) => e.id === reg.eventId)
  if (event.status === 'completed') throw new ApiError('EVENT_COMPLETED', 'Results are locked once the event is completed.', 409)
  if (position !== undefined) {
    if (![null, 1, 2, 3].includes(position)) throw new ApiError('VALIDATION', 'Position must be 1, 2, 3 or null.', 422)
    reg.position = position
  }
  if (attended !== undefined) {
    reg.attended = !!attended
    if (!reg.attended) reg.position = null
  }
  commit(data)
  return reg
}

export async function myRegistrations() {
  await delay()
  const s = requireRole('student')
  const data = db()
  const student = data.students.find((x) => x.id === s.userId)
  return buildSummary(student, data.events, data.registrations).history
}

// ---------- Students & summaries ----------

export async function listStudentSummaries() {
  await delay()
  requireRole('admin')
  const data = db()
  return data.students.map((s) => {
    const { history: _history, ...rest } = buildSummary(s, data.events, data.registrations)
    return rest
  })
}

export async function getStudentSummary(studentId) {
  await delay()
  const s = session()
  if (s.role === 'student' && s.userId !== studentId) throw new ApiError('FORBIDDEN', 'You can only view your own record.', 403)
  const data = db()
  const student = data.students.find((x) => x.id === studentId)
  if (!student) throw new ApiError('STUDENT_NOT_FOUND', 'Student not found.', 404)
  return buildSummary(student, data.events, data.registrations)
}

// ---------- Certificates ----------

export async function myCertificates() {
  await delay()
  const s = requireRole('student')
  const data = db()
  return data.certificates
    .filter((c) => c.studentId === s.userId)
    .map((c) => expandCertificate(data, c))
    .sort((a, b) => new Date(b.event.date) - new Date(a.event.date))
}

export async function getCertificate(id) {
  await delay()
  const s = session()
  const data = db()
  const cert = data.certificates.find((c) => c.id === id)
  if (!cert) throw new ApiError('CERTIFICATE_NOT_FOUND', 'Certificate not found.', 404)
  if (s.role === 'student' && cert.studentId !== s.userId) throw new ApiError('FORBIDDEN', 'Not your certificate.', 403)
  return expandCertificate(data, cert)
}

// ---------- Dashboard & reports ----------

export async function getDashboardStats() {
  await delay()
  requireRole('admin')
  const data = db()
  const events = data.events.map((e) => withCounts(data, e))
  return {
    students: data.students.length,
    events: data.events.length,
    openEvents: events.filter((e) => e.phase === 'open').length,
    registrations: data.registrations.length,
    certificates: data.certificates.length,
    intraEvents: data.events.filter((e) => e.category === 'intra').length,
    interEvents: data.events.filter((e) => e.category === 'inter').length,
  }
}

// Raw rows for the Excel report; the frontend builds the .xlsx file.
export async function getParticipationReport({ from, to, category, branch, batch } = {}) {
  await delay(200)
  requireRole('admin')
  const data = db()
  const fromMs = from ? new Date(from).getTime() : -Infinity
  const toMs = to ? new Date(to).getTime() + 86399999 : Infinity
  const events = data.events.filter((e) => {
    const t = new Date(e.date).getTime()
    return t >= fromMs && t <= toMs && (!category || e.category === category)
  })
  const eventIds = new Set(events.map((e) => e.id))
  const students = data.students.filter((s) => (!branch || s.branch === branch) && (!batch || s.batch === batch))
  const studentIds = new Set(students.map((s) => s.id))
  const registrations = data.registrations.filter((r) => eventIds.has(r.eventId) && studentIds.has(r.studentId))
  return {
    generatedAt: new Date().toISOString(),
    filters: { from: from || null, to: to || null, category: category || null, branch: branch || null, batch: batch || null },
    students: students.map(publicStudent),
    events: events.map((e) => withCounts({ ...data, registrations }, e)),
    registrations,
  }
}

export async function resetDemoData() {
  await delay()
  requireRole('admin')
  reseed()
}
