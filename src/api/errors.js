// Error shape shared by the mock and HTTP APIs. The backend should return
// { error: { code, message } } with a matching HTTP status (see API_CONTRACT.md).
export class ApiError extends Error {
  constructor(code, message, status = 400) {
    super(message)
    this.code = code
    this.status = status
  }
}
