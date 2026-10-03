import { Link } from 'react-router-dom'
import { Award, Download, Medal } from 'lucide-react'
import { api } from '../../api/client'
import { useAsync } from '../../lib/useAsync'
import { fmtDate } from '../../lib/format'
import { downloadCertificatePdf } from '../../lib/certificate'
import { positionLabel } from '../../lib/eventStatus'
import { Button, Card, CategoryBadge, EmptyState, ErrorNote, PageHeader, Spinner } from '../../components/ui'

export default function Certificates() {
  const { data, loading, error } = useAsync(() => api.myCertificates(), [])
  return (
    <div>
      <PageHeader title="Certificates" subtitle="Issued automatically when an event you attended is completed." />
      {loading ? (
        <Spinner />
      ) : error ? (
        <ErrorNote error={error} />
      ) : data.length === 0 ? (
        <Card>
          <EmptyState icon={Award} title="No certificates yet">
            Certificates appear here once an event you attended is marked completed.
          </EmptyState>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {data.map((c) => (
            <Card key={c.id} className="flex flex-col p-5">
              <div className="flex items-start justify-between gap-3">
                <span
                  className={`grid size-11 place-items-center rounded-xl ${
                    c.position ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' : 'bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300'
                  }`}
                >
                  {c.position ? <Medal className="size-5" /> : <Award className="size-5" />}
                </span>
                <CategoryBadge category={c.event.category} />
              </div>
              <div className="mt-4 text-xs font-semibold tracking-wide text-slate-500 uppercase">
                {c.position ? `Merit · ${positionLabel(c.position)}` : 'Participation'}
              </div>
              <h3 className="mt-1 font-bold">{c.event.name}</h3>
              <div className="mt-1 text-sm text-slate-500">{fmtDate(c.event.date)}</div>
              <div className="mt-auto flex gap-2 pt-5">
                <Link to={`/student/certificates/${c.id}`} className="flex-1">
                  <Button variant="secondary" className="w-full">
                    View
                  </Button>
                </Link>
                <Button onClick={() => downloadCertificatePdf(c)} aria-label="Download PDF">
                  <Download className="size-4" /> PDF
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
