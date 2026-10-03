import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { Award, FileSpreadsheet, ListChecks, QrCode } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { USE_MOCK } from '../api/client'
import { DEMO_ADMIN, DEMO_STUDENT_PASSWORD } from '../api/seed'
import { Button, ErrorNote, Field, Input } from '../components/ui'
import Logo from '../components/Logo'

const FEATURES = [
  { icon: ListChecks, title: 'One record per student', text: 'Intra- and inter-college participation, consolidated.' },
  { icon: QrCode, title: 'Presence-verified registration', text: 'Scan the venue QR during the registration window.' },
  { icon: Award, title: 'Automatic certificates', text: 'Issued to your portal the moment an event completes.' },
  { icon: FileSpreadsheet, title: 'Excel reports', text: 'Participation summary ready for the Sports In-Charge.' },
]

export default function Login() {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const [role, setRole] = useState('student')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  if (user) return <Navigate to={user.role === 'admin' ? '/admin' : '/student'} replace />

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const u = await login({ role, username, password })
      navigate(u.role === 'admin' ? '/admin' : '/student', { replace: true })
    } catch (err) {
      setError(err)
    } finally {
      setBusy(false)
    }
  }

  const fillDemo = () => {
    if (role === 'admin') {
      setUsername(DEMO_ADMIN.username)
      setPassword(DEMO_ADMIN.password)
    } else {
      setUsername('2302627')
      setPassword(DEMO_STUDENT_PASSWORD)
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <section className="relative hidden overflow-hidden bg-brand-900 p-12 text-white lg:flex lg:flex-col">
        <div className="absolute -top-32 -right-32 size-96 rounded-full bg-brand-600/40 blur-3xl" />
        <div className="absolute -bottom-40 -left-20 size-[28rem] rounded-full bg-emerald-400/20 blur-3xl" />
        <div className="relative flex items-center gap-2.5 text-xl font-extrabold">
          <svg viewBox="0 0 32 32" className="size-10"><rect width="32" height="32" rx="9" fill="#fff" fillOpacity=".15" /><circle cx="16" cy="16" r="8" fill="none" stroke="#fff" strokeWidth="2.5" /><path d="M8 16h16M16 8c3 3 3 13 0 16M16 8c-3 3-3 13 0 16" fill="none" stroke="#fff" strokeWidth="2" /></svg>
          SportSync
        </div>
        <div className="relative mt-auto">
          <h1 className="max-w-md text-4xl leading-tight font-extrabold">Every match, every meet — in one record.</h1>
          <p className="mt-4 max-w-md text-brand-100">
            Sports participation for Guru Nanak Dev Engineering College, Ludhiana.
          </p>
          <ul className="mt-10 grid max-w-lg gap-5">
            {FEATURES.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex gap-4">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white/10">
                  <Icon className="size-5" />
                </span>
                <span>
                  <span className="block font-semibold">{title}</span>
                  <span className="block text-sm text-brand-100/80">{text}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="flex items-center justify-center px-4 py-12 sm:px-8">
        <div className="w-full max-w-sm">
          <Logo className="mb-10 lg:hidden" />
          <h2 className="text-2xl font-bold tracking-tight">Sign in</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Use your college credentials to continue.</p>

          <div className="mt-6 grid grid-cols-2 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
            {[
              ['student', 'Student'],
              ['admin', 'Sports In-Charge'],
            ].map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => {
                  setRole(key)
                  setError(null)
                  setUsername('')
                  setPassword('')
                }}
                className={`rounded-lg py-2 text-sm font-semibold transition ${
                  role === key ? 'bg-white shadow-sm dark:bg-slate-950' : 'text-slate-500'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="mt-6 space-y-4">
            <Field label={role === 'admin' ? 'Username' : 'University Roll No. (URN)'}>
              <Input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={role === 'admin' ? 'admin' : 'e.g. 2302627'}
                inputMode={role === 'admin' ? 'text' : 'numeric'}
                autoComplete="username"
                required
              />
            </Field>
            <Field label="Password">
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
            </Field>
            <ErrorNote error={error} />
            <Button type="submit" size="lg" className="w-full" loading={busy}>
              Sign in
            </Button>
          </form>

          {USE_MOCK && (
            <div className="mt-8 rounded-xl border border-dashed border-slate-300 p-4 text-sm dark:border-slate-700">
              <div className="font-semibold">Demo mode</div>
              <p className="mt-1 text-slate-500 dark:text-slate-400">
                No backend connected. Use the demo {role === 'admin' ? 'admin' : 'student'} account.
              </p>
              <button type="button" onClick={fillDemo} className="mt-2 font-semibold text-brand-600 hover:underline">
                Fill demo credentials
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
