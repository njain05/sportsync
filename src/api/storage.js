// Tiny localStorage wrapper used by the mock API. Falls back to memory when
// storage is unavailable (private mode, blocked site data).
const PREFIX = 'sportsync:'
const memory = new Map()

export function load(key, fallback = null) {
  try {
    const raw = localStorage.getItem(PREFIX + key)
    return raw == null ? fallback : JSON.parse(raw)
  } catch {
    return memory.has(key) ? memory.get(key) : fallback
  }
}

export function save(key, value) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value))
  } catch {
    memory.set(key, value)
  }
}

export function remove(key) {
  try {
    localStorage.removeItem(PREFIX + key)
  } catch {
    memory.delete(key)
  }
}
