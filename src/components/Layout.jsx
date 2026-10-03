import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  Award,
  CalendarDays,
  FileSpreadsheet,
  Home,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Moon,
  ScanLine,
  Sun,
  Users,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { USE_MOCK } from '../api/client'
import Logo from './Logo'

const NAV = {
  student: [
    { to: '/student', label: 'Home', icon: Home, end: true },
    { to: '/student/events', label: 'Events', icon: CalendarDays },
    { to: '/student/scan', label: 'Scan', icon: ScanLine, primary: true },
    { to: '/student/record', label: 'My Record', icon: ListChecks },
    { to: '/student/certificates', label: 'Certificates', icon: Award },
  ],
  admin: [
    { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/admin/events', label: 'Events', icon: CalendarDays },
    { to: '/admin/students', label: 'Student Records', icon: Users },
    { to: '/admin/reports', label: 'Reports', icon: FileSpreadsheet },
  ],
}

export default function Layout() {
  const { user, logout } = useAuth()
  const { theme, toggle } = useTheme()
  const navigate = useNavigate()
  const items = NAV[user.role]

  const onLogout = async () => {
    await logout()
    navigate('/login')
  }

  const ThemeIcon = theme === 'dark' ? Sun : Moon

  return (
    <div className="min-h-screen lg:pl-64">
      {/* Desktop sidebar */}
      <aside className="no-print fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-slate-200 bg-white px-4 py-6 lg:flex dark:border-slate-800 dark:bg-slate-900">
        <Logo className="px-2" />
        <nav className="mt-8 flex flex-1 flex-col gap-1">
          {items.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                  isActive
                    ? 'bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300'
                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
                }`
              }
            >
              <Icon className="size-5" /> {label}
            </NavLink>
          ))}
        </nav>
        {USE_MOCK && (
          <div className="mb-3 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
            Demo mode: data is stored in this browser.
          </div>
        )}
        <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60">
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-brand-600 text-sm font-bold text-white">
            {user.name.split(' ').map((p) => p[0]).slice(0, 2).join('')}
          </span>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold">{user.name}</div>
            <div className="truncate text-xs text-slate-500">{user.role === 'admin' ? 'Admin' : `URN ${user.urn}`}</div>
          </div>
          <button onClick={toggle} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700" aria-label="Toggle theme">
            <ThemeIcon className="size-4" />
          </button>
          <button onClick={onLogout} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700" aria-label="Log out">
            <LogOut className="size-4" />
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="no-print sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur lg:hidden dark:border-slate-800 dark:bg-slate-900/90">
        <Logo />
        <div className="flex items-center gap-1">
          <button onClick={toggle} className="rounded-lg p-2 text-slate-500" aria-label="Toggle theme">
            <ThemeIcon className="size-5" />
          </button>
          <button onClick={onLogout} className="rounded-lg p-2 text-slate-500" aria-label="Log out">
            <LogOut className="size-5" />
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pt-6 pb-28 sm:px-6 lg:px-10 lg:pt-10 lg:pb-12">
        <Outlet />
      </main>

      {/* Mobile bottom nav */}
      <nav className="no-print fixed inset-x-0 bottom-0 z-30 grid border-t border-slate-200 bg-white/95 px-2 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] backdrop-blur lg:hidden dark:border-slate-800 dark:bg-slate-900/95"
        style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}>
        {items.map(({ to, label, icon: Icon, end, primary }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 rounded-xl py-1 text-[11px] font-semibold ${
                isActive ? 'text-brand-600 dark:text-brand-400' : 'text-slate-500'
              }`
            }
          >
            {primary ? (
              <span className="-mt-6 grid size-12 place-items-center rounded-2xl bg-brand-600 text-white shadow-lg shadow-brand-600/30">
                <Icon className="size-6" />
              </span>
            ) : (
              <Icon className="size-5" />
            )}
            <span className="truncate">{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
