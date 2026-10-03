import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import { Spinner } from './components/ui'
import Login from './pages/Login'
import StudentDashboard from './pages/student/Dashboard'
import StudentEvents from './pages/student/Events'
import MyParticipation from './pages/student/MyParticipation'
import Certificates from './pages/student/Certificates'
import CertificatePage from './pages/CertificatePage'
import AdminDashboard from './pages/admin/Dashboard'
import AdminEvents from './pages/admin/Events'
import EventLive from './pages/admin/EventLive'
import Participants from './pages/admin/Participants'
import StudentRecords from './pages/admin/StudentRecords'
import StudentDetail from './pages/admin/StudentDetail'
import Reports from './pages/admin/Reports'

// The camera scanner library is large; load it only when the scan page opens.
const ScanRegister = lazy(() => import('./pages/student/ScanRegister'))

function Home() {
  const { user, loading } = useAuth()
  if (loading) return <Spinner />
  if (!user) return <Navigate to="/login" replace />
  return <Navigate to={user.role === 'admin' ? '/admin' : '/student'} replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />

      <Route element={<ProtectedRoute role="student" />}>
        <Route element={<Layout />}>
          <Route path="/student" element={<StudentDashboard />} />
          <Route path="/student/events" element={<StudentEvents />} />
          <Route
            path="/student/scan"
            element={
              <Suspense fallback={<Spinner />}>
                <ScanRegister />
              </Suspense>
            }
          />
          <Route path="/student/record" element={<MyParticipation />} />
          <Route path="/student/certificates" element={<Certificates />} />
          <Route path="/student/certificates/:id" element={<CertificatePage />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute role="admin" />}>
        {/* Full-screen QR display for the venue projector */}
        <Route path="/admin/events/:id/live" element={<EventLive />} />
        <Route element={<Layout />}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/events" element={<AdminEvents />} />
          <Route path="/admin/events/:id" element={<Participants />} />
          <Route path="/admin/students" element={<StudentRecords />} />
          <Route path="/admin/students/:id" element={<StudentDetail />} />
          <Route path="/admin/certificates/:id" element={<CertificatePage />} />
          <Route path="/admin/reports" element={<Reports />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
