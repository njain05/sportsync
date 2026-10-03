import { api } from '../../api/client'
import { useAuth } from '../../context/AuthContext'
import { useAsync } from '../../lib/useAsync'
import { ErrorNote, PageHeader, Spinner } from '../../components/ui'
import ParticipationSummary from '../../components/ParticipationSummary'

export default function MyParticipation() {
  const { user } = useAuth()
  const { data, loading, error } = useAsync(() => api.getStudentSummary(user.id), [user.id])
  return (
    <div>
      <PageHeader title="My Record" subtitle="Your consolidated participation across intra- and inter-college events." />
      {loading ? <Spinner /> : error ? <ErrorNote error={error} /> : <ParticipationSummary summary={data} />}
    </div>
  )
}
