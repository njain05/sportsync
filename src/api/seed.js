// Demo data for the mock API. Dates are relative to the moment the data is
// seeded so there is always one event with an open registration window.

export const DEMO_ADMIN = { username: 'admin', password: 'admin123' }
export const DEMO_STUDENT_PASSWORD = 'student123'

const STUDENTS = [
  ['Arshdeep Anand', '2302481', '2315025', 'CSE', '2023-27'],
  ['Nishtha Jain', '2302627', '2315172', 'CSE', '2023-27'],
  ['Balkrishan Singh', '2302492', '2315036', 'CSE', '2023-27'],
  ['Harmanpreet Kaur', '2302511', '2315061', 'IT', '2023-27'],
  ['Gurjot Singh', '2302533', '2315088', 'ME', '2023-27'],
  ['Simran Kaur', '2302547', '2315094', 'ECE', '2023-27'],
  ['Karan Mehta', '2402105', '2415012', 'CSE', '2024-28'],
  ['Jasleen Kaur', '2402118', '2415027', 'IT', '2024-28'],
  ['Rohit Sharma', '2402131', '2415039', 'CE', '2024-28'],
  ['Manpreet Singh', '2402146', '2415044', 'ME', '2024-28'],
  ['Ananya Verma', '2402159', '2415058', 'ECE', '2024-28'],
  ['Prabhjot Gill', '2502204', '2515006', 'CSE', '2025-29'],
  ['Ishaan Kapoor', '2502217', '2515019', 'IT', '2025-29'],
  ['Navneet Kaur', '2502230', '2515031', 'CE', '2025-29'],
  ['Arjun Malhotra', '2502243', '2515047', 'EE', '2025-29'],
]

// Deterministic PRNG so every reset produces the same demo data.
function rng(seed) {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296
    return s / 4294967296
  }
}

// Fixed per event so the seeded QR codes match across devices in mock mode
// (each browser keeps its own copy of the demo data).
function token(id) {
  return `demo${id.replace(/\W/g, '')}`.padEnd(16, '0')
}

const DAY = 86400000
const HOUR = 3600000

function at(base, dayOffset, hour, minute = 0) {
  const d = new Date(base + dayOffset * DAY)
  d.setHours(hour, minute, 0, 0)
  return d.toISOString()
}

export function buildSeed() {
  const now = Date.now()
  const rand = rng(42)

  const students = STUDENTS.map(([name, urn, crn, branch, batch], i) => ({
    id: `stu_${i + 1}`,
    name,
    urn,
    crn,
    branch,
    batch,
    password: DEMO_STUDENT_PASSWORD,
  }))

  const ev = (id, name, sport, category, dayOffset, venue, extra = {}) => ({
    id,
    name,
    sport,
    category,
    venue,
    date: at(now, dayOffset, 0),
    regWindow: { start: at(now, dayOffset, 9), end: at(now, dayOffset, 11) },
    status: 'scheduled',
    qrToken: token(id),
    createdAt: at(now, dayOffset - 7, 10),
    ...extra,
  })

  const events = [
    ev('evt_1', 'Intra-College Chess Championship', 'Chess', 'intra', -62, 'Student Activity Centre'),
    ev('evt_2', 'Intra-College Weightlifting Meet', 'Weightlifting', 'intra', -47, 'College Gymnasium'),
    ev('evt_3', 'Intra-College Volleyball Tournament', 'Volleyball', 'intra', -33, 'Volleyball Court'),
    ev('evt_4', 'PTU Inter-College Cricket', 'Cricket', 'inter', -21, 'PTU Main Campus, Kapurthala'),
    ev('evt_5', 'PTU Inter-College Athletics', 'Athletics', 'inter', -11, 'Guru Nanak Stadium, Ludhiana'),
    ev('evt_6', 'Intra-College Badminton Open', 'Badminton', 'intra', 0, 'Indoor Sports Hall', {
      regWindow: {
        start: new Date(now - 30 * 60000).toISOString(),
        end: new Date(now + 4 * HOUR).toISOString(),
      },
    }),
    ev('evt_7', 'Intra-College Table Tennis', 'Table Tennis', 'intra', 5, 'Indoor Sports Hall'),
    ev('evt_8', 'PTU Inter-College Chess', 'Chess', 'inter', 12, 'PTU Main Campus, Kapurthala'),
  ]

  const registrations = []
  let regN = 1
  const addReg = (event, student, minutesIn, extra = {}) => {
    registrations.push({
      id: `reg_${regN++}`,
      eventId: event.id,
      studentId: student.id,
      registeredAt: new Date(new Date(event.regWindow.start).getTime() + minutesIn * 60000).toISOString(),
      method: 'qr',
      verified: true,
      attended: true,
      position: null,
      ...extra,
    })
  }

  // Completed events: a random subset of students, top three get positions.
  const completed = events.slice(0, 5)
  for (const event of completed) {
    const isInter = event.category === 'inter'
    const pool = students.filter(() => rand() < (isInter ? 0.35 : 0.6))
    // Shuffle a rank order so podium places land on random participants.
    const ranks = pool.map((_, i) => i)
    for (let i = ranks.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1))
      ;[ranks[i], ranks[j]] = [ranks[j], ranks[i]]
    }
    pool.forEach((s, i) => {
      addReg(event, s, Math.floor(rand() * 110), {
        method: isInter ? 'manual' : 'qr',
        position: ranks[i] < 3 ? ranks[i] + 1 : null,
        attended: isInter ? true : rand() > 0.08,
      })
    })
  }

  // Live event: a few students already registered.
  students.slice(3, 8).forEach((s, i) => addReg(events[5], s, 2 + i * 4))

  return { students, events, registrations, certificates: [], seededAt: new Date(now).toISOString(), completeIds: completed.map((e) => e.id) }
}
