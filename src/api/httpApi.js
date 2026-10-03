// Real backend implementation. Same function signatures as mockApi.js;
// endpoint details are documented in API_CONTRACT.md.
import { ApiError } from './errors'
import { load, save, remove } from './storage'

const BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/$/, '')
const SESSION_KEY = 'session'

async function request(method, path, body) {
  const s = load(SESSION_KEY)
  let res
  try {
    res = await fetch(BASE + path, {
      method,
      headers: {
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(s?.token ? { Authorization: `Bearer ${s.token}` } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new ApiError('NETWORK', 'Cannot reach the SportSync server.', 0)
  }
  if (res.status === 204) return null
  const json = await res.json().catch(() => ({}))
  if (!res.ok) {
    if (res.status === 401) remove(SESSION_KEY)
    throw new ApiError(json.error?.code || 'ERROR', json.error?.message || `Request failed (${res.status})`, res.status)
  }
  return json
}

const qs = (params = {}) => {
  const q = new URLSearchParams(Object.entries(params).filter(([, v]) => v != null && v !== ''))
  const str = q.toString()
  return str ? `?${str}` : ''
}

// Auth
export async function login(creds) {
  const out = await request('POST', '/auth/login', creds)
  save(SESSION_KEY, { token: out.token, userId: out.user.id, role: out.user.role })
  return out
}
export async function logout() {
  await request('POST', '/auth/logout').catch(() => {})
  remove(SESSION_KEY)
}
export async function me() {
  if (!load(SESSION_KEY)) return null
  return request('GET', '/auth/me').catch(() => null)
}

// Events
export const listEvents = (filters) => request('GET', `/events${qs(filters)}`)
export const getEvent = (id) => request('GET', `/events/${id}`)
export const createEvent = (input) => request('POST', '/events', input)
export const updateEvent = (id, input) => request('PATCH', `/events/${id}`, input)
export const deleteEvent = (id) => request('DELETE', `/events/${id}`)
export const getEventQr = (id) => request('GET', `/events/${id}/qr`)
export const regenerateEventQr = (id) => request('POST', `/events/${id}/qr/regenerate`)
export const completeEvent = (id) => request('POST', `/events/${id}/complete`)

// Registrations
export const scanRegister = (qrText) => request('POST', '/registrations/scan', { qr: qrText })
export const listEventRegistrations = (eventId) => request('GET', `/events/${eventId}/registrations`)
export const addManualRegistration = (eventId, urn) => request('POST', `/events/${eventId}/registrations`, { urn })
export const updateRegistration = (id, patch) => request('PATCH', `/registrations/${id}`, patch)
export const myRegistrations = () => request('GET', '/registrations/me')

// Students & summaries
export const listStudentSummaries = () => request('GET', '/students/summaries')
export const getStudentSummary = (id) => request('GET', `/students/${id}/summary`)

// Certificates
export const myCertificates = () => request('GET', '/certificates/me')
export const getCertificate = (id) => request('GET', `/certificates/${id}`)

// Dashboard & reports
export const getDashboardStats = () => request('GET', '/dashboard/stats')
export const getParticipationReport = (filters) => request('GET', `/reports/participation${qs(filters)}`)
export const resetDemoData = () => Promise.reject(new ApiError('UNSUPPORTED', 'Demo reset is only available in mock mode.'))
