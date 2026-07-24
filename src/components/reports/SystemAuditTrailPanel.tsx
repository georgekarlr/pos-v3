import React, { useCallback, useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp, RefreshCw, Search, Download } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { ReportService } from '../../services/reportService'
import { SystemAuditTrailRow } from '../../types/report'
import ReportCard from './ReportCard'
import LoadingSpinner from '../LoadingSpinner'
import { FormatDateTime } from '../../utils/formatDateTime'
import { exportToCSV } from '../../utils/csvExporter'

const PAGE_SIZE = 25

const todayISO = FormatDateTime.formatLocalTimestampForDatabase(new Date()).slice(0, 10)
const thirtyDaysAgoISO = FormatDateTime.formatLocalTimestampForDatabase(
  new Date(Date.now() - 29 * 86400_000)
).slice(0, 10)

// ─── Action badge ─────────────────────────────────────────────────────────────

const ACTION_COLORS: Record<string, string> = {
  INSERT: 'bg-emerald-100 text-emerald-700',
  UPDATE: 'bg-amber-100 text-amber-700',
  DELETE: 'bg-red-100 text-red-700',
}

const ActionBadge: React.FC<{ action: string }> = ({ action }) => (
  <span
    className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full ${ACTION_COLORS[action] ?? 'bg-gray-100 text-gray-600'
      }`}
  >
    {action}
  </span>
)

// ─── Diff viewer ──────────────────────────────────────────────────────────────

/**
 * Renders old_values / new_values as a simple key-by-key diff.
 * Highlighted in red/green on changed keys, neutral for unchanged.
 */
const DiffViewer: React.FC<{
  oldValues: Record<string, any> | null
  newValues: Record<string, any> | null
}> = ({ oldValues, newValues }) => {
  const allKeys = Array.from(
    new Set([...Object.keys(oldValues ?? {}), ...Object.keys(newValues ?? {})])
  )

  if (allKeys.length === 0) {
    return <p className="text-xs text-gray-400 italic">No field data recorded.</p>
  }

  return (
    <table className="min-w-full text-xs border-collapse">
      <thead>
        <tr className="text-left text-gray-500 border-b border-gray-100">
          <th className="pr-4 py-1 font-medium w-1/4">Field</th>
          {oldValues !== null && <th className="pr-4 py-1 font-medium w-[37.5%]">Before</th>}
          {newValues !== null && <th className="py-1 font-medium w-[37.5%]">After</th>}
        </tr>
      </thead>
      <tbody>
        {allKeys.map((key) => {
          const oldVal = oldValues?.[key]
          const newVal = newValues?.[key]
          const changed =
            oldValues !== null &&
            newValues !== null &&
            JSON.stringify(oldVal) !== JSON.stringify(newVal)

          return (
            <tr key={key} className={`border-t border-gray-50 ${changed ? 'bg-yellow-50/60' : ''}`}>
              <td className="pr-4 py-1 font-mono text-gray-600 truncate max-w-[8rem]">{key}</td>
              {oldValues !== null && (
                <td className={`pr-4 py-1 font-mono break-all ${changed ? 'text-red-600' : 'text-gray-500'}`}>
                  {oldVal === undefined ? (
                    <span className="text-gray-300 italic">—</span>
                  ) : (
                    JSON.stringify(oldVal)
                  )}
                </td>
              )}
              {newValues !== null && (
                <td className={`py-1 font-mono break-all ${changed ? 'text-emerald-700' : 'text-gray-500'}`}>
                  {newVal === undefined ? (
                    <span className="text-gray-300 italic">—</span>
                  ) : (
                    JSON.stringify(newVal)
                  )}
                </td>
              )}
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

// ─── Expandable row ───────────────────────────────────────────────────────────

const AuditRow: React.FC<{ row: SystemAuditTrailRow }> = ({ row }) => {
  const [expanded, setExpanded] = useState(false)
  const hasDetail = row.old_values !== null || row.new_values !== null

  return (
    <>
      <tr
        className={`border-t border-gray-50 transition-colors ${hasDetail ? 'cursor-pointer hover:bg-gray-50/70' : 'hover:bg-gray-50/30'
          } ${expanded ? 'bg-blue-50/30' : ''}`}
        onClick={() => hasDetail && setExpanded((v) => !v)}
      >
        <td className="px-5 py-2.5 whitespace-nowrap text-gray-500 font-mono text-xs">
          {new Date(row.created_at).toLocaleString()}
        </td>
        <td className="px-5 py-2.5 whitespace-nowrap font-mono text-xs text-gray-700">
          {row.table_name}
        </td>
        <td className="px-5 py-2.5 whitespace-nowrap">
          <ActionBadge action={row.action} />
        </td>
        <td className="px-5 py-2.5 whitespace-nowrap text-gray-600 text-xs">{row.operator_name}</td>
        <td className="px-5 py-2.5 text-center">
          {hasDetail ? (
            expanded ? (
              <ChevronUp className="h-3.5 w-3.5 text-blue-500 inline" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5 text-gray-400 inline" />
            )
          ) : (
            <span className="text-gray-200 text-xs">—</span>
          )}
        </td>
      </tr>
      {expanded && hasDetail && (
        <tr className="bg-gray-50/80 border-t border-dashed border-blue-100">
          <td colSpan={6} className="px-5 py-3">
            <DiffViewer oldValues={row.old_values} newValues={row.new_values} />
          </td>
        </tr>
      )}
    </>
  )
}

// ─── Known module filters for the filter dropdown ────────────────────────────
// These map to the API's p_table_filter friendly keys

const MODULE_FILTERS: { value: string; label: string }[] = [
  { value: 'staff', label: 'Staff Profile' },
  { value: 'products', label: 'Product Catalog' },
  { value: 'settings', label: 'Business Header' },
  { value: 'registers', label: 'Register Configuration' },
  { value: 'promos', label: 'Promotion Rules' },
  { value: 'security', label: 'System Access' },
]

const ACTION_OPTIONS = ['INSERT', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'FAILED_LOGIN']

// ─── Main panel ───────────────────────────────────────────────────────────────

/**
 * SystemAuditTrailPanel — composable paginated log viewer for the database-level audit trail.
 * Admin-only. Supports filtering by table name, action type, and date range.
 * Rows are expandable to display a before/after field diff.
 */
const SystemAuditTrailPanel: React.FC = () => {
  const { persona } = useAuth()

  const [tableFilter, setTableFilter] = useState('')
  const [actionFilter, setActionFilter] = useState('')
  const [startDate, setStartDate] = useState(thirtyDaysAgoISO)
  const [endDate, setEndDate] = useState(todayISO)
  const [search, setSearch] = useState('')

  const [rows, setRows] = useState<SystemAuditTrailRow[]>([])
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(
    async (pageNum: number) => {
      if (!persona?.id) return
      setLoading(true)
      setError(null)
      try {
        const data = await ReportService.getSystemAuditTrail({
          requesting_account_id: persona.id,
          limit: PAGE_SIZE + 1,
          offset: pageNum * PAGE_SIZE,
          table_filter: tableFilter || null,
          action_filter: actionFilter || null,
          start_date: startDate ? `${startDate}T00:00:00` : null,
          end_date: endDate ? `${endDate}T23:59:59` : null,
        })
        setHasMore(data.length > PAGE_SIZE)
        setRows(data.slice(0, PAGE_SIZE))
        setPage(pageNum)
      } catch (e: any) {
        setError(e?.message || 'Failed to load System Audit Trail')
      } finally {
        setLoading(false)
      }
    },
    [persona?.id, tableFilter, actionFilter, startDate, endDate]
  )

  // Reload on filter changes
  useEffect(() => {
    load(0)
  }, [load])

  // Client-side text filter on table_name + operator_name
  const filtered = search.trim()
    ? rows.filter(
      (r) =>
        r.table_name.toLowerCase().includes(search.toLowerCase()) ||
        r.action.toLowerCase().includes(search.toLowerCase()) ||
        r.operator_name.toLowerCase().includes(search.toLowerCase()) ||
        String(r.row_id ?? '').includes(search)
    )
    : rows

  // CSV export of current page
  const handleExportCSV = () => {
    exportToCSV({
      filename: `system-audit-trail-${startDate}-to-${endDate}`,
      title: 'System Audit Trail Log',
      headers: ['Log ID', 'Timestamp', 'Table Name', 'Action', 'Row ID', 'Operator Name', 'Old Values', 'New Values'],
      rows: filtered.map(r => [
        r.log_id,
        r.created_at,
        r.table_name,
        r.action,
        r.row_id ?? '',
        r.operator_name,
        JSON.stringify(r.old_values ?? ''),
        JSON.stringify(r.new_values ?? '')
      ]),
      startDate,
      endDate
    })
  }

  return (
    <div className="space-y-5">
      <ReportCard
        title="System Audit Trail"
        subtitle="Database-level change log. Captures every INSERT, UPDATE, and DELETE across all core tables. Admin access only."
        badge="Security Log"
        badgeVariant="amber"
      >
        {/* ── Filter row ── */}
        <div className="flex flex-wrap gap-3 mb-4">
          {/* Module filter */}
          <select
            id="sat-table-filter"
            value={tableFilter}
            onChange={(e) => setTableFilter(e.target.value)}
            disabled={loading}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 outline-none disabled:bg-gray-50 min-w-[11rem]"
          >
            <option value="">All Modules</option>
            {MODULE_FILTERS.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>

          {/* Action filter */}
          <select
            id="sat-action-filter"
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            disabled={loading}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 outline-none disabled:bg-gray-50"
          >
            <option value="">All Actions</option>
            {ACTION_OPTIONS.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>

          {/* Start date */}
          <div className="flex flex-col gap-0.5">
            <label className="text-xs text-gray-500">From</label>
            <input
              id="sat-start"
              type="date"
              value={startDate}
              max={endDate}
              onChange={(e) => setStartDate(e.target.value)}
              disabled={loading}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 outline-none disabled:bg-gray-50"
            />
          </div>

          {/* End date */}
          <div className="flex flex-col gap-0.5">
            <label className="text-xs text-gray-500">To</label>
            <input
              id="sat-end"
              type="date"
              value={endDate}
              min={startDate}
              max={todayISO}
              onChange={(e) => setEndDate(e.target.value)}
              disabled={loading}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 outline-none disabled:bg-gray-50"
            />
          </div>

          {/* Search */}
          <div className="flex items-end relative">
            <Search className="absolute left-3 bottom-2.5 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
            <input
              id="sat-search"
              type="text"
              placeholder="Search…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border border-gray-300 rounded-lg pl-8 pr-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 outline-none min-w-[10rem]"
            />
          </div>

          {/* Refresh */}
          <div className="flex items-end">
            <button
              id="sat-refresh"
              onClick={() => load(page)}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          {/* Export CSV */}
          <div className="flex items-end">
            <button
              id="sat-export-csv"
              onClick={handleExportCSV}
              disabled={loading || rows.length === 0}
              className="flex items-center gap-1.5 px-3 py-2 text-sm text-amber-700 border border-amber-200 bg-amber-50/50 hover:bg-amber-50 rounded-lg transition-colors disabled:opacity-50"
            >
              <Download className="h-3.5 w-3.5" />
              Export CSV
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        {/* ── Table ── */}
        {loading ? (
          <div className="py-10 flex justify-center">
            <LoadingSpinner />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto -mx-5">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-500 uppercase tracking-wide border-b border-gray-100">
                    <th className="px-5 py-3 font-medium">Timestamp</th>
                    <th className="px-5 py-3 font-medium">Module</th>
                    <th className="px-5 py-3 font-medium">Action</th>
                    <th className="px-5 py-3 font-medium">Operator</th>
                    <th className="px-5 py-3 font-medium text-center">Diff</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((row) => (
                    <AuditRow key={row.log_id} row={row} />
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-5 py-8 text-center text-gray-400 text-sm">
                        No audit entries found for the selected filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
              <span className="text-xs text-gray-500">
                Page {page + 1} · Showing {filtered.length} of {rows.length} entries
              </span>
              <div className="flex items-center gap-2">
                <button
                  id="sat-prev"
                  onClick={() => load(page - 1)}
                  disabled={page === 0 || loading}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="h-3.5 w-3.5" /> Prev
                </button>
                <button
                  id="sat-next"
                  onClick={() => load(page + 1)}
                  disabled={!hasMore || loading}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Next <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </>
        )}
      </ReportCard>
    </div>
  )
}

export default SystemAuditTrailPanel
