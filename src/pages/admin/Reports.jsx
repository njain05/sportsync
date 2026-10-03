import { useMemo, useState } from 'react'
import { Download, FileSpreadsheet } from 'lucide-react'
import { api } from '../../api/client'
import { useAsync } from '../../lib/useAsync'
import { downloadParticipationExcel, reportRows } from '../../lib/excel'
import { Button, Card, ErrorNote, Field, Input, PageHeader, Select, Spinner, Table, td, th } from '../../components/ui'

export default function Reports() {
  const [filters, setFilters] = useState({ from: '', to: '', category: '', branch: '', batch: '' })
  const set = (k) => (e) => setFilters((f) => ({ ...f, [k]: e.target.value }))
  const key = JSON.stringify(filters)
  const { data, loading, error } = useAsync(() => api.getParticipationReport(filters), [key])
  const all = useAsync(() => api.listStudentSummaries(), [])

  const branches = useMemo(() => [...new Set((all.data || []).map((s) => s.student.branch))].sort(), [all.data])
  const batches = useMemo(() => [...new Set((all.data || []).map((s) => s.student.batch))].sort(), [all.data])
  const rows = useMemo(() => (data ? reportRows(data) : null), [data])

  return (
    <div>
      <PageHeader
        title="Reports"
        subtitle="Export the participation report as an Excel workbook."
        actions={
          <Button onClick={() => downloadParticipationExcel(data)} disabled={!data}>
            <Download className="size-4" /> Download Excel
          </Button>
        }
      />

      <Card className="mb-6 p-5">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <Field label="From">
            <Input type="date" value={filters.from} onChange={set('from')} />
          </Field>
          <Field label="To">
            <Input type="date" value={filters.to} onChange={set('to')} />
          </Field>
          <Field label="Category">
            <Select value={filters.category} onChange={set('category')}>
              <option value="">All</option>
              <option value="intra">Intra-College</option>
              <option value="inter">Inter-College</option>
            </Select>
          </Field>
          <Field label="Branch">
            <Select value={filters.branch} onChange={set('branch')}>
              <option value="">All</option>
              {branches.map((b) => (
                <option key={b}>{b}</option>
              ))}
            </Select>
          </Field>
          <Field label="Batch">
            <Select value={filters.batch} onChange={set('batch')}>
              <option value="">All</option>
              {batches.map((b) => (
                <option key={b}>{b}</option>
              ))}
            </Select>
          </Field>
        </div>
      </Card>

      {loading && !rows ? (
        <Spinner />
      ) : error ? (
        <ErrorNote error={error} />
      ) : (
        <>
          <div className="mb-4 grid gap-4 sm:grid-cols-3">
            {[
              ['Participation Summary', rows.summary.length, 'students'],
              ['Events', rows.events.length, 'events'],
              ['Registrations', rows.registrations.length, 'rows'],
            ].map(([name, n, unit]) => (
              <Card key={name} className="flex items-center gap-3 p-4">
                <span className="grid size-10 place-items-center rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                  <FileSpreadsheet className="size-5" />
                </span>
                <div>
                  <div className="text-sm font-semibold">{name}</div>
                  <div className="text-xs text-slate-500">
                    Sheet · {n} {unit}
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <Card>
            <div className="px-5 pt-5 font-bold">Preview: Participation Summary</div>
            <Table>
              <thead className="border-b border-slate-100 dark:border-slate-800">
                <tr>
                  {['Name', 'URN', 'Branch', 'Batch', 'Intra', 'Inter', 'Total'].map((h) => (
                    <th key={h} className={`${th} ${['Intra', 'Inter', 'Total'].includes(h) ? 'text-right' : ''}`}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {rows.summary.map((r) => (
                  <tr key={r.URN}>
                    <td className={`${td} font-medium`}>{r.Name}</td>
                    <td className={`${td} text-slate-500`}>{r.URN}</td>
                    <td className={td}>{r.Branch}</td>
                    <td className={td}>{r.Batch}</td>
                    <td className={`${td} text-right tabular-nums`}>{r['Intra-College Events']}</td>
                    <td className={`${td} text-right tabular-nums`}>{r['Inter-College Events']}</td>
                    <td className={`${td} text-right font-bold tabular-nums`}>{r['Total Events']}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card>
        </>
      )}
    </div>
  )
}
