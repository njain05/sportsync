// QR payload format shared with the backend: sportsync:<eventId>:<qrToken>
const PREFIX = 'sportsync'

export function buildQrPayload(eventId, qrToken) {
  return `${PREFIX}:${eventId}:${qrToken}`
}

export function parseQrPayload(text) {
  const parts = String(text || '').trim().split(':')
  if (parts.length !== 3 || parts[0] !== PREFIX || !parts[1] || !parts[2]) return null
  return { eventId: parts[1], qrToken: parts[2] }
}
