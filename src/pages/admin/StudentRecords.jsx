import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowDownUp, Search } from 'lucide-react'
import { api } from '../../api/client'
import { useAsync } from '../../lib/useAsync'
import { Card, EmptyState, ErrorNote, Input, PageHeader, Select, Spinner, Table, td, th } from '../../components/ui'

const SORTS = {
  total: (a, b) => b.total - a.total,
  intra: (a, b) => b.intra - a.intra,
  inter: (a, b) => b.inter - a.inter,
  name: (a, b) => a.student.name.localeCompare(b.student.name),
}

export default function StudentRecords() {
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const [branch, setBranch] = useState('')
  const [batch, setBatch] = useState('')
  const [sort, setSort] = useState('total')
  const { data, loading, error } = useAsync(() => api.listStudentSummaries(), [])

  const branches = useMemo(() => [...new Set((data || []).map((s) => s.student.branch))].sort(), [data])
  const batches = useMemo(() => [...new Set((data || []).map((s) => s.student.batch))].sort(), [data])

  const rows = (data || [])
    .filter(
      (s) =>
        (!branch || s.student.branch === branch) &&
        (!batch || s.student.batch === batch) &&
        (!q || `${s.student.name} ${s.student.urn} ${s.student.crn}`.toLowerCase().includes(q.toLowerCase())),
    )
    .sort(SORTS[sort])

  return (
    <div>
      <PageHeader title="Student Records" subtitle="Consolidated participation per student — for fitness/journal marks." />
      <div className="mb-4 grid gap-3 sm:grid-cols-[1fr_auto_auto]">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
          <Input className="pl-9" placeholder="Search name, URN or CRN" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <Select value={branch} onChange={(e) => setBranch(e.target.value)}>
          <option value="">All branches</option>
          {branches.map((b) => (
            <option key={b}>{b}</option>
          ))}
        </Select>
        <Select value={batch} onChange={(e) => setBatch(e.target.value)}>
          <option value="">All batches</option>
          {batches.map((b) => (
            <option key={b}>{b}</option>
          ))}
        </Select>
      </div>
      <Card>
        {loading ? (
          <Spinner />
        ) : error ? (
          <ErrorNote error={error} className="m-4" />
        ) : rows.length === 0 ? (
          <EmptyState title="No students match" />
        ) : (
          <Table>
            <thead className="border-b border-slate-100 dark:border-slate-800">
              <tr>
                <SortTh sort={sort} setSort={setSort} k="name">Student</SortTh>
                <th className={th}>Branch / Batch</th>
                <SortTh sort={sort} setSort={setSort} k="intra" className="text-right">Intra</SortTh>
                <SortTh sort={sort} setSort={setSort} k="inter" className="text-right">Inter</SortTh>
                <SortTh sort={sort} setSort={setSort} k="total" className="text-right">Total</SortTh>
                <th className={`${th} text-right`}>Podiums</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {rows.map((s) => (
                <tr
                  key={s.student.id}
                  onClick={() => navigate(`/admin/students/${s.student.id}`)}
                  className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40"
                >
                  <td className={td}>
                    <div className="font-semibold">{s.student.name}</div>
                    <div className="text-xs text-slate-500">
                      URN {s.student.urn} · CRN {s.student.crn}
                    </div>
                  </td>
                  <td className={`${td} text-slate-600 dark:text-slate-300`}>
                    {s.student.branch} · {s.student.batch}
                  </td>
                  <td className={`${td} text-right tabular-nums`}>{s.intra}</td>
                  <td className={`${td} text-right tabular-nums`}>{s.inter}</td>
                  <td className={`${td} text-right text-base font-bold tabular-nums`}>{s.total}</td>
                  <td className={`${td} text-right tabular-nums text-amber-600`}>{s.podiums || '—'}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
    </div>
  )
}

function SortTh({ k, sort, setSort, children, className = '' }) {
  return (
    <th className={`${th} ${className}`}>
      <button onClick={() => setSort(k)} className={`inline-flex items-center gap-1 ${sort === k ? 'text-brand-600' : ''}`}>
        {children} <ArrowDownUp className="size-3" />
      </button>
    </th>
  )
}
