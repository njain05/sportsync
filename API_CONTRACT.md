# SportSync — Backend API Contract

This document is the agreement between the **SportSync frontend** (React, this repo) and the **backend** (Node.js + Express + MongoDB, built separately).

The frontend already runs end-to-end against a mock (`src/api/mockApi.js`). To switch it to the real server, set in `.env`:

```env
VITE_USE_MOCK=false
VITE_API_URL=http://localhost:5000/api
```

Every call goes through `src/api/httpApi.js`. If the backend follows this contract, **no UI code needs to change**. When in doubt about behaviour, `src/api/mockApi.js` is the reference implementation of every rule below.

---

## 1. Conventions

| Item | Rule |
|---|---|
| Base URL | `VITE_API_URL`, e.g. `http://localhost:5000/api` |
| Format | JSON request and response bodies, `Content-Type: application/json` |
| Auth | `Authorization: Bearer <token>` (JWT) on every request except `POST /auth/login` |
| Dates | ISO-8601 strings in UTC, e.g. `"2026-10-02T09:00:00.000Z"` |
| IDs | Strings. Any format is fine (Mongo `ObjectId` as a string works). The field must be called `id`, not `_id` |
| CORS | Allow the frontend origin (`http://localhost:5173` in dev) |
| Success | `200` with the JSON body described below. `DELETE` may return `204` with no body |
| Errors | Non-2xx status with body `{ "error": { "code": "STRING_CODE", "message": "Human readable" } }` |

The frontend shows `error.message` directly to users and branches on `error.code`, so both matter. A `401` response clears the stored session on the client.

### Error codes

| Code | HTTP | When |
|---|---|---|
| `UNAUTHORIZED` | 401 | Missing, invalid or expired token |
| `INVALID_CREDENTIALS` | 401 | Wrong URN/username or password |
| `FORBIDDEN` | 403 | Wrong role, or a student accessing another student's data |
| `VALIDATION` | 422 | Bad or missing fields |
| `EVENT_NOT_FOUND` | 404 | |
| `STUDENT_NOT_FOUND` | 404 | |
| `REGISTRATION_NOT_FOUND` | 404 | |
| `CERTIFICATE_NOT_FOUND` | 404 | |
| `EVENT_COMPLETED` | 409 | Trying to change or register for a completed event |
| `EVENT_HAS_REGISTRATIONS` | 409 | Deleting an event that has registrations |
| `ALREADY_REGISTERED` | 409 | Student already registered for this event |
| `INVALID_QR` | 400 | Scanned text is not a SportSync payload |
| `QR_MISMATCH` | 400 | The payload's token does not match the event's current token |
| `WINDOW_NOT_OPEN` | 403 | Scan happened before `regWindow.start` |
| `WINDOW_CLOSED` | 403 | Scan happened after `regWindow.end` |

---

## 2. Data models (MongoDB collections)

### Student
```json
{
  "id": "stu_1",
  "name": "Nishtha Jain",
  "urn": "2302627",
  "crn": "2315172",
  "branch": "CSE",
  "batch": "2023-27"
}
```
The server also stores a **hashed** password (bcrypt). It must never be returned. `urn` is unique.

### Event
```json
{
  "id": "evt_6",
  "name": "Intra-College Badminton Open",
  "sport": "Badminton",
  "category": "intra",
  "venue": "Indoor Sports Hall",
  "date": "2026-10-02T00:00:00.000Z",
  "regWindow": { "start": "2026-10-02T09:00:00.000Z", "end": "2026-10-02T11:00:00.000Z" },
  "status": "scheduled",
  "completedAt": null,
  "createdAt": "2026-09-25T10:00:00.000Z"
}
```
- `category`: `"intra"` (intra-college) or `"inter"` (inter-college / PTU).
- `status`: `"scheduled"` or `"completed"`. The only transition is scheduled → completed, through `POST /events/:id/complete`.
- The server also stores a secret **`qrToken`** (a random string of at least 16 chars). **Never include `qrToken` in event responses.** It is only exposed through `GET /events/:id/qr`, which is admin-only.

**Computed fields** that are returned with every event (not stored):
- `registrationCount`: the number of registrations for the event.
- `phase`: computed at request time from `status` and `regWindow`:
  - `"completed"` if `status === "completed"`
  - otherwise `"upcoming"` if now < `regWindow.start`
  - otherwise `"closed"` if now > `regWindow.end`
  - otherwise `"open"`

### Registration
```json
{
  "id": "reg_12",
  "eventId": "evt_6",
  "studentId": "stu_2",
  "registeredAt": "2026-10-02T09:14:00.000Z",
  "method": "qr",
  "verified": true,
  "attended": true,
  "position": null
}
```
- `method`: `"qr"` (the student scanned at the venue) or `"manual"` (the admin added them, for example to digitise a paper team list for an inter-college event).
- `position`: `1`, `2`, `3` or `null`.
- Use a unique compound index on `(eventId, studentId)`.

### Certificate
```json
{
  "id": "cert_ab12",
  "certNo": "GNDEC/SPORTS/2026/0042",
  "registrationId": "reg_12",
  "eventId": "evt_6",
  "studentId": "stu_2",
  "position": 1,
  "issuedAt": "2026-10-02T12:00:00.000Z"
}
```
`certNo` must be unique and sequential (`GNDEC/SPORTS/<event year>/<4-digit running number>`).

**Expanded certificate** (what the certificate endpoints return) adds:
```json
{
  "event": { "id": "", "name": "", "sport": "", "category": "", "date": "", "venue": "" },
  "student": { "id": "", "name": "", "urn": "", "crn": "", "branch": "", "batch": "" }
}
```

---

## 3. Core business rules (must be enforced server-side)

### 3.1 QR + time-window registration (anti-proxy)
- The admin's venue screen shows a **fixed QR per event**. Its payload is the plain string:
  ```
  sportsync:<eventId>:<qrToken>
  ```
- `POST /registrations/scan` must run these checks **in this order** and return the first failure:
  1. The caller is a logged-in **student** → otherwise `UNAUTHORIZED` / `FORBIDDEN`
  2. The payload has exactly 3 `:`-separated parts and the first is `sportsync` → otherwise `INVALID_QR`
  3. The event exists → otherwise `EVENT_NOT_FOUND`
  4. The token equals the event's current `qrToken` → otherwise `QR_MISMATCH`
  5. `status !== "completed"` → otherwise `EVENT_COMPLETED`
  6. **Server time** ≥ `regWindow.start` → otherwise `WINDOW_NOT_OPEN` (put the opening time in the message)
  7. **Server time** ≤ `regWindow.end` → otherwise `WINDOW_CLOSED`
  8. No existing registration for (event, student) → otherwise `ALREADY_REGISTERED`
- On success, create the registration with `method:"qr"`, `verified:true`, `attended:true`, `position:null`.
- Always use the **server clock**. Never trust a time sent by the client.
- `POST /events/:id/qr/regenerate` replaces `qrToken`, which invalidates every printed or photographed copy.

### 3.2 Event completion → automatic certificates
`POST /events/:id/complete`:
- Reject if already completed (`EVENT_COMPLETED`) or if now < `regWindow.start` (`VALIDATION`).
- Set `status:"completed"` and `completedAt: now`.
- For **every registration of that event with `verified && attended`**, create one certificate, unless one already exists for that registration. Copy `position` across.
- Return the number issued.
- After completion, results are **locked**. `PATCH /registrations/:id` and manual adds must return `EVENT_COMPLETED`.

### 3.3 Participation summary (per student)
A participation **counts** when `attended === true` **and** the event's `status === "completed"`.
- `intra` = counted participations in `category:"intra"` events
- `inter` = counted participations in `category:"inter"` events
- `total` = `intra + inter`
- `podiums` = counted participations with a non-null `position`
- `pending` = registrations whose event is not completed yet
- `bySport` = `{ "<sport>": count }` over counted participations

---

## 4. Endpoints

`[S]` = student only, `[A]` = admin only, `[S/A]` = either role (with ownership checks).

### Auth

#### `POST /auth/login`
Request:
```json
{ "role": "student", "username": "2302627", "password": "..." }
```
For `role:"student"`, `username` is the **URN**. For `role:"admin"`, it is the admin username.

Response:
```json
{
  "token": "<jwt>",
  "user": { "id": "stu_2", "role": "student", "name": "Nishtha Jain", "urn": "2302627", "crn": "2315172", "branch": "CSE", "batch": "2023-27" }
}
```
The admin user object is `{ "id", "role": "admin", "name" }`.

#### `GET /auth/me` `[S/A]`
Returns the same `user` object as login. Returns `401` if the token is invalid.

#### `POST /auth/logout` `[S/A]`
Returns `204`. Optional; the frontend discards the token either way.

### Events

| Method & path | Role | Body / query | Response |
|---|---|---|---|
| `GET /events` | S/A | query: `category?` (`intra`/`inter`), `phase?` | `Event[]` (with `registrationCount`, `phase`), newest `date` first |
| `GET /events/:id` | S/A | | `Event` |
| `POST /events` | A | `{ name, sport, category, venue, date, regWindow:{start,end} }` | created `Event` (server generates `qrToken`) |
| `PATCH /events/:id` | A | any subset of the create fields | updated `Event`. `EVENT_COMPLETED` if completed. Validate `end > start` |
| `DELETE /events/:id` | A | | `204`. `EVENT_HAS_REGISTRATIONS` if any exist |
| `GET /events/:id/qr` | A | | `{ "payload": "sportsync:<id>:<qrToken>", "regWindow": {start,end} }` |
| `POST /events/:id/qr/regenerate` | A | | same shape as above, with the new token |
| `POST /events/:id/complete` | A | | `{ "event": Event, "certificatesIssued": 5 }` |

Validation for create/update: `name`, `sport`, `venue`, `date`, `category` are required. `category` must be `intra` or `inter`. `regWindow.start` and `regWindow.end` are required, with `end > start`. Use `VALIDATION` with a clear message.

### Registrations

| Method & path | Role | Body | Response |
|---|---|---|---|
| `POST /registrations/scan` | S | `{ "qr": "sportsync:evt_6:92ea…" }` | `{ "registration": Registration, "event": Event }` (see §3.1) |
| `GET /registrations/me` | S | | the caller's history: `Registration & { event: {id,name,sport,category,date,venue,status} }[]`, newest first |
| `GET /events/:id/registrations` | A | | `Registration & { student: Student }[]`, oldest `registeredAt` first |
| `POST /events/:id/registrations` | A | `{ "urn": "2302627" }` | `Registration & { student }` with `method:"manual"`. Errors: `STUDENT_NOT_FOUND`, `ALREADY_REGISTERED`, `EVENT_COMPLETED` |
| `PATCH /registrations/:id` | A | `{ "position"?: 1\|2\|3\|null, "attended"?: boolean }` | updated `Registration`. Setting `attended:false` also clears `position`. `EVENT_COMPLETED` if locked |

### Students & summaries

#### `GET /students/summaries` `[A]`
One entry per student (no `history`):
```json
[
  {
    "student": { "id": "stu_2", "name": "Nishtha Jain", "urn": "2302627", "crn": "2315172", "branch": "CSE", "batch": "2023-27" },
    "intra": 3, "inter": 1, "total": 4, "podiums": 2, "pending": 1,
    "bySport": { "Chess": 1, "Cricket": 1, "Volleyball": 1, "Weightlifting": 1 }
  }
]
```

#### `GET /students/:id/summary` `[S/A]`
Same as one entry above **plus** `history` (the same shape as `GET /registrations/me`). A student may only request their own `id`; otherwise return `FORBIDDEN`.

### Certificates

| Method & path | Role | Response |
|---|---|---|
| `GET /certificates/me` | S | expanded `Certificate[]`, newest event first |
| `GET /certificates/:id` | S/A | expanded `Certificate`. A student may only fetch their own (`FORBIDDEN`) |

The frontend draws the certificate PDF itself from this data, so the backend does not need to generate PDFs.

### Dashboard & reports

#### `GET /dashboard/stats` `[A]`
```json
{ "students": 15, "events": 8, "openEvents": 1, "registrations": 41, "certificates": 34, "intraEvents": 5, "interEvents": 3 }
```

#### `GET /reports/participation` `[A]`
Query (all optional): `from`, `to` (`YYYY-MM-DD`, inclusive, filter on event `date`), `category`, `branch`, `batch`.

Returns **raw rows**. The frontend builds the 3-sheet `.xlsx` (Participation Summary / Events / Registrations) itself.
```json
{
  "generatedAt": "2026-10-02T12:00:00.000Z",
  "filters": { "from": null, "to": null, "category": null, "branch": null, "batch": null },
  "students": [Student],
  "events": [Event],
  "registrations": [Registration]
}
```
- `events`: the events that match the date and category filters. Each `registrationCount` counts only the filtered registrations.
- `students`: the students that match the branch and batch filters.
- `registrations`: only those whose event **and** student are both in the lists above.

---

## 5. Suggested backend checklist
- [ ] Express app with CORS and JSON body parser, mounted at `/api`
- [ ] Mongoose models: `Student`, `Admin`, `Event` (with a hidden `qrToken`), `Registration` (unique `eventId+studentId`), `Certificate` (unique `registrationId`, unique `certNo`)
- [ ] bcrypt passwords and JWT auth middleware with role guard
- [ ] A seed script that imports students (name, URN, CRN, branch, batch)
- [ ] The rules in §3, using the server clock
- [ ] `toJSON` transform: `_id` → `id`, strip `__v`, `password`, `qrToken`
- [ ] Postman collection that covers every endpoint above
