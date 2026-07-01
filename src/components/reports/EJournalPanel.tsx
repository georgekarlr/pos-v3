import React, { useCallback, useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, RefreshCw, Search } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { ReportService } from '../../services/reportService'
import { SettingsService } from '../../services/settingsService'
import { Terminal } from '../../types/settings'
import { EJournalRow } from '../../types/report'
import ReportCard from './ReportCard'
import LoadingSpinner from '../LoadingSpinner'

const PAGE_SIZE = 25

const todayISO = () => new Date().toISOString().slice(0, 10)

// ─── Event-type badge ─────────────────────────────────────────────────────────

const EVENT_COLORS: Record<string, string> = {
  Z_READING:     'bg-blue-100 text-blue-700',
  X_READING:     'bg-sky-100 text-sky-700',
  SALE:          'bg-emerald-100 text-emerald-700',
  REFUND:        'bg-red-100 text-red-700',
  LOGIN:         'bg-gray-100 text-gray-600',
  LOGOUT:        'bg-gray-100 text-gray-600',
  VOID:          'bg-orange-100 text-orange-700',
  DISCOUNT:      'bg-purple-100 text-purple-700',
  SETTINGS_CHANGE: 'bg-yellow-100 text-yellow-700',
}

const EventBadge: React.FC<{ type: string }> = ({ type }) => (
  <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${EVENT_COLORS[type] ?? 'bg-gray-100 text-gray-600'}`}>
    {type.replace(/_/g, ' ')}
  </span>
)

// ─── Main Panel ───────────────────────────────────────────────────────────────

/**
 * EJournalPanel — composable paginated log viewer for the Electronic Journal.
 * Admin-only. Supports filtering by terminal, date range, and free-text search.
 */
const EJournalPanel: React.FC = () => {
  const { persona } = useAuth()

  const [terminals, setTerminals] = useState<Terminal[]>([])
  const [terminalFilter, setTerminalFilter] = useState<number | ''>('')
  const thirtyDaysAgo = new Date(Date.now() - 29 * 86400_000).toISOString().slice(0, 10)
  const [startDate, setStartDate] = useState(thirtyDaysAgo)
  const [endDate, setEndDate] = useState(todayISO())
  const [search, setSearch] = useState('')

  const [rows, setRows] = useState<EJournalRow[]>([])
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(false)
  const [terminalLoading, setTerminalLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    SettingsService.getTerminals().then(({ data }) => {
      if (data) setTerminals(data)
      setTerminalLoading(false)
    })
  }, [])

  const load = useCallback(async (pageNum: number) => {
    if (!persona?.id) return
    setLoading(true)
    setError(null)
    try {
      const data = await ReportService.getEJournal({
        requesting_account_id: persona.id,
        limit: PAGE_SIZE + 1, // fetch one extra to detect next page
        offset: pageNum * PAGE_SIZE,
        terminal_id: terminalFilter || null,
        start_date: startDate ? `${startDate}T00:00:00` : null,
        end_date: endDate ? `${endDate}T23:59:59` : null,
      })
      setHasMore(data.length > PAGE_SIZE)
      setRows(data.slice(0, PAGE_SIZE))
      setPage(pageNum)
    } catch (e: any) {
      setError(e?.message || 'Failed to load E-Journal')
    } finally {
      setLoading(false)
    }
  }, [persona?.id, terminalFilter, startDate, endDate])

  // Load first page whenever filters change
  useEffect(() => { load(0) }, [load])

  // Client-side description search (the RPC doesn't support it; the filter is cheap on small pages)
  const filtered = search.trim()
    ? rows.filter(r =>
        r.event_description.toLowerCase().includes(search.toLowerCase()) ||
        r.event_type.toLowerCase().includes(search.toLowerCase()) ||
        r.terminal_name.toLowerCase().includes(search.toLowerCase()) ||
        r.account_name.toLowerCase().includes(search.toLowerCase())
      )
    : rows

  return (
    <div className="space-y-5">
      <ReportCard
        title="Electronic Journal"
        subtitle="Full audit trail of all POS events. Admin access only."
        badge="Audit Log"
        badgeVariant="blue"
      >
        {/* Filter row */}
        <div className="flex flex-wrap gap-3 mb-4">
          {/* Terminal */}
          {terminalLoading ? (
            <div className="h-9 w-40 bg-gray-100 animate-pulse rounded-lg" />
          ) : (
            <select
              id="ejournal-terminal"
              value={terminalFilter}
              onChange={e => setTerminalFilter(e.target.value ? Number(e.target.value) : '')}
              disabled={loading}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-50 min-w-[10rem]"
            >
              <option value="">All Terminals</option>
              {terminals.map(t => (
                <option key={t.terminal_id} value={t.terminal_id}>{t.terminal_name}</option>
              ))}
            </select>
          )}

          {/* Start date */}
          <div className="flex flex-col gap-0.5">
            <label className="text-xs text-gray-500">From</label>
            <input
              id="ejournal-start"
              type="date"
              value={startDate}
              max={endDate}
              onChange={e => setStartDate(e.target.value)}
              disabled={loading}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-50"
            />
          </div>

          {/* End date */}
          <div className="flex flex-col gap-0.5">
            <label className="text-xs text-gray-500">To</label>
            <input
              id="ejournal-end"
              type="date"
              value={endDate}
              min={startDate}
              max={todayISO()}
              onChange={e => setEndDate(e.target.value)}
              disabled={loading}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-50"
            />
          </div>

          {/* Search */}
          <div className="flex items-end relative">
            <Search className="absolute left-3 bottom-2.5 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
            <input
              id="ejournal-search"
              type="text"
              placeholder="Search…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="border border-gray-300 rounded-lg pl-8 pr-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none min-w-[10rem]"
            />
          </div>

          {/* Refresh */}
          <div className="flex items-end">
            <button
              id="ejournal-refresh"
              onClick={() => load(page)}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        {/* Table */}
        {loading ? (
          <div className="py-10 flex justify-center"><LoadingSpinner /></div>
        ) : (
          <>
            <div className="overflow-x-auto -mx-5">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-500 uppercase tracking-wide border-b border-gray-100">
                    <th className="px-5 py-3 font-medium">Timestamp</th>
                    <th className="px-5 py-3 font-medium">Terminal</th>
                    <th className="px-5 py-3 font-medium">Account</th>
                    <th className="px-5 py-3 font-medium">Event</th>
                    <th className="px-5 py-3 font-medium">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(row => (
                    <tr
                      key={row.log_id}
                      className="border-t border-gray-50 hover:bg-gray-50/70 transition-colors"
                    >
                      <td className="px-5 py-2.5 whitespace-nowrap text-gray-500 font-mono text-xs">
                        {new Date(row.created_at).toLocaleString()}
                      </td>
                      <td className="px-5 py-2.5 whitespace-nowrap text-gray-700">{row.terminal_name}</td>
                      <td className="px-5 py-2.5 whitespace-nowrap text-gray-700">{row.account_name}</td>
                      <td className="px-5 py-2.5 whitespace-nowrap">
                        <EventBadge type={row.event_type} />
                      </td>
                      <td className="px-5 py-2.5 text-gray-600 max-w-xs truncate">{row.event_description}</td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-5 py-8 text-center text-gray-400 text-sm">
                        No journal entries found for the selected filters.
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
                  id="ejournal-prev"
                  onClick={() => load(page - 1)}
                  disabled={page === 0 || loading}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="h-3.5 w-3.5" /> Prev
                </button>
                <button
                  id="ejournal-next"
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

export default EJournalPanel
