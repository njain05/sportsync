// The only API module pages should import. Switch between the mock API and
// the real backend with VITE_USE_MOCK in .env.
import * as mock from './mockApi'
import * as http from './httpApi'

export const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false'
export const api = USE_MOCK ? mock : http
export { ApiError } from './errors'
