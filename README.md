# SportSync — Frontend

Sports participation records, QR registration and certificates for **Guru Nanak Dev Engineering College, Ludhiana** (B.Tech CSE major project).

**Objectives**
1. Keep one consolidated record per student of their participation in intra- and inter-college sports events.
2. Use QR-code registration that only works inside a set time window. This checks that the student is actually at the venue and prevents proxy registration.
3. Issue certificates automatically in the student portal, and give the Sports In-Charge an Excel participation report.

This repo is the **frontend only** (React + Tailwind CSS). A teammate is building the backend (Express + MongoDB) separately against [`API_CONTRACT.md`](API_CONTRACT.md). Until it's ready, the app runs on a built-in mock API that saves data in the browser.

## Run it

```bash
npm install
npm run dev
```

Open http://localhost:5173.

### Demo accounts (mock mode)

| Role | Login | Password |
|---|---|---|
| Sports In-Charge (admin) | `admin` | `admin123` |
| Student | any seeded URN, e.g. `2302627` | `student123` |

The login screen has a **Fill demo credentials** button. The admin dashboard has a **Reset demo data** button.

## Demo walkthrough

1. **Admin** → Dashboard → *Show QR* on the event that is open for registration. In the real setup, this screen goes on a projector at the venue.
2. **Student** (on a phone, or in another browser) → *Scan* → point the camera at the QR. If there's no camera, use *Copy code* on the admin screen and paste the code on the student's scan page.
3. These scans are rejected: a scan before the window opens, after it closes, a second scan by the same student, and a scan of an old (regenerated) code.
4. **Admin** → Events → open the event → mark attendance and positions → *Complete & issue certificates*.
5. **Student** → *Certificates* → view the certificate or download it as a PDF.
6. **Admin** → *Student Records* shows intra/inter/total counts per student. *Reports* → *Download Excel* gives a workbook with 3 sheets: Participation Summary, Events and Registrations.

> The camera only works over **HTTPS or localhost**. To test on a phone on the same Wi-Fi, use an HTTPS tunnel (for example `npx localtunnel --port 5173`) or the paste-code fallback.

## Connecting the real backend

```env
# .env
VITE_USE_MOCK=false
VITE_API_URL=http://localhost:5000/api
```

All pages call `src/api/client.js`. It switches between `mockApi.js` (localStorage) and `httpApi.js` (fetch + JWT). Both have the same function signatures. Every endpoint, data model and validation rule is in **[API_CONTRACT.md](API_CONTRACT.md)**.

## Tech

Vite · React 19 · React Router · Tailwind CSS v4 · `qrcode.react` (QR display) · `html5-qrcode` (camera scanning) · `jspdf` (certificate PDFs) · SheetJS `xlsx` (Excel reports) · `lucide-react` (icons)

## Project structure

```
src/
  api/          client.js (mock/real switch), mockApi.js, httpApi.js, seed.js, storage.js, errors.js
  context/      AuthContext, ThemeContext
  lib/          summary.js (participation counts), qrToken.js, eventStatus.js,
                certificate.js (PDF), excel.js (xlsx), format.js, useAsync.js
  components/   Layout, ui primitives, ParticipationSummary, CertificateView, ProtectedRoute
  pages/
    Login.jsx, CertificatePage.jsx
    student/    Dashboard, Events, ScanRegister, MyParticipation, Certificates
    admin/      Dashboard, Events, EventForm, EventLive (venue QR), Participants,
                StudentRecords, StudentDetail, Reports
```
