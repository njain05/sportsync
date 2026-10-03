import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Download } from 'lucide-react'
import { api } from '../api/client'
import { useAsync } from '../lib/useAsync'
import { downloadCertificatePdf } from '../lib/certificate'
import { Button, ErrorNote, Spinner } from '../components/ui'
import CertificateView from '../components/CertificateView'

export default function CertificatePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data, loading, error } = useAsync(() => api.getCertificate(id), [id])

  return (
    <div>
      <div className="no-print mb-6 flex flex-wrap items-center justify-between gap-3">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeft className="size-4" /> Back
        </Button>
        {data && (
          <Button onClick={() => downloadCertificatePdf(data)}>
            <Download className="size-4" /> Download PDF
          </Button>
        )}
      </div>
      {loading ? <Spinner /> : error ? <ErrorNote error={error} /> : <CertificateView cert={data} />}
    </div>
  )
}
