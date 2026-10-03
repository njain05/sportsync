import { Link, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { api } from '../../api/client'
import { useAsync } from '../../lib/useAsync'
import { ErrorNote, PageHeader, Spinner } from '../../components/ui'
import ParticipationSummary from '../../components/ParticipationSummary'

export default function StudentDetail() {
  const { id } = useParams()
  const { data, loading, error } = useAsync(() => api.getStudentSummary(id), [id])
  return (
    <div>
      <Link to="/admin/students" className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white">
        <ArrowLeft className="size-4" /> Student records
      </Link>
      {loading ? (
        <Spinner />
      ) : error ? (
        <ErrorNote error={error} />
      ) : (
        <>
          <PageHeader
            title={data.student.name}
            subtitle={`URN ${data.student.urn} · CRN ${data.student.crn} · ${data.student.branch} · Batch ${data.student.batch}`}
          />
          <ParticipationSummary summary={data} />
        </>
      )}
    </div>
  )
}
