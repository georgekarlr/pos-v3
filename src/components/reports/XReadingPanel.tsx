import React, { useCallback, useEffect, useState } from 'react'
import { ScanLine, RefreshCw } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { ReportService } from '../../services/reportService'
import { SettingsService } from '../../services/settingsService'
import { Terminal } from '../../types/settings'
import { XReadingResult } from '../../types/report'
import ReportCard from './ReportCard'
import LoadingSpinner from '../LoadingSpinner'

const fmt = (n: number) =>
  new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(n)

const todayISO = () => new Date().toISOString().slice(0, 10)

// ─── Composable sub-sections ──────────────────────────────────────────────────

const ReceiptRow: React.FC<{ label: string; value: string; bold?: boolean; indent?: boolean }> = ({
  label, value, bold, indent,
}) => (
  <div className={`flex justify-between text-sm py-0.5 ${bold ? 'font-semibold' : ''} ${indent ? 'pl-4 text-gray-600' : ''}`}>
    <span>{label}</span>
    <span className="tabular-nums">{value}</span>
  </div>
)

const Divider = () => <div className="border-t border-dashed border-gray-300 my-2" />

interface XReadingDisplayProps {
  report: XReadingResult
}

/** Pure presentational component – renders an X-Reading as a BIR-style receipt */
export const XReadingDisplay: React.FC<XReadingDisplayProps> = ({ report }) => (
  <div id="x-reading-printout" className="font-mono text-xs space-y-1 max-w-sm mx-auto">
    <div className="text-center space-y-0.5 mb-3">
      <div className="text-base font-bold uppercase tracking-wide">{report.ReportType}</div>
      <div className="text-gray-500">Terminal: {report.Terminal.Name}</div>
      <div className="text-gray-500">MIN: {report.Terminal.MIN}</div>
      <div className="text-gray-500">Generated: {new Date(report.GeneratedAt).toLocaleString()}</div>
    </div>
    <Divider />
    <ReceiptRow label="Starting Invoice" value={report.TransactionRange.Start ?? 'N/A'} />
    <ReceiptRow label="Ending Invoice" value={report.TransactionRange.End ?? 'N/A'} />
    <Divider />
    <ReceiptRow label="Gross Sales" value={fmt(report.GrossSales)} bold />
    <Divider />
    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mt-1">Deductions</div>
    <ReceiptRow label="SC / PWD Discount" value={`(${fmt(report.Deductions.SC_PWD)})`} indent />
    <ReceiptRow label="Regular Discount" value={`(${fmt(report.Deductions.Regular)})`} indent />
    <ReceiptRow label="Refunds" value={`(${fmt(report.Deductions.Refunds)})`} indent />
    <Divider />
    <ReceiptRow label="NET SALES" value={fmt(report.NetSales)} bold />
    <Divider />
    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mt-1">VAT Breakdown</div>
    <ReceiptRow label="VATable Sales" value={fmt(report.VAT.VATable)} indent />
    <ReceiptRow label="VAT Amount (12%)" value={fmt(report.VAT.VATAmount)} indent />
    <ReceiptRow label="VAT-Exempt Sales" value={fmt(report.VAT.Exempt)} indent />
    <ReceiptRow label="Zero-Rated Sales" value={fmt(report.VAT.ZeroRated)} indent />
    <Divider />
    <div className="text-center text-gray-400 text-xs pt-1">*** END OF X-READING ***</div>
  </div>
)

// ─── Main Panel ───────────────────────────────────────────────────────────────

/**
 * XReadingPanel — composable panel for generating mid-day X-Reading snapshots.
 * Can be embedded inside any page shell or used standalone.
 */
const XReadingPanel: React.FC = () => {
  const { persona } = useAuth()

  const [terminals, setTerminals] = useState<Terminal[]>([])
  const [terminalId, setTerminalId] = useState<number | ''>('')
  const [date, setDate] = useState(todayISO())
  const [loading, setLoading] = useState(false)
  const [terminalLoading, setTerminalLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [report, setReport] = useState<XReadingResult | null>(null)

  // Fetch terminal list on mount
  useEffect(() => {
    SettingsService.getTerminals().then(({ data }) => {
      if (data && data.length > 0) {
        setTerminals(data)
        setTerminalId(data[0].terminal_id)
      }
      setTerminalLoading(false)
    })
  }, [])

  const handleGenerate = useCallback(async () => {
    if (!terminalId || !date) return
    setLoading(true)
    setError(null)
    setReport(null)
    try {
      const result = await ReportService.generateXReading({
        terminal_id: Number(terminalId),
        target_date: date,
      })
      setReport(result)
    } catch (e: any) {
      setError(e?.message || 'Failed to generate X-Reading')
    } finally {
      setLoading(false)
    }
  }, [terminalId, date])

  return (
    <div className="space-y-5">
      {/* Controls */}
      <ReportCard
        title="X-Reading Generator"
        subtitle="Mid-day snapshot — read-only, nothing is saved to the database."
        badge="Snapshot"
        badgeVariant="blue"
      >
        <div className="flex flex-wrap gap-4 items-end">
          {/* Terminal picker */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-600">Terminal</label>
            {terminalLoading ? (
              <div className="h-9 w-44 bg-gray-100 animate-pulse rounded-lg" />
            ) : (
              <select
                id="x-reading-terminal"
                value={terminalId}
                onChange={e => setTerminalId(Number(e.target.value))}
                disabled={loading}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none disabled:bg-gray-50 min-w-[11rem]"
              >
                {terminals.map(t => (
                  <option key={t.terminal_id} value={t.terminal_id}>{t.terminal_name}</option>
                ))}
                {terminals.length === 0 && <option value="">No terminals</option>}
              </select>
            )}
          </div>

          {/* Date picker */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-600">Date</label>
            <input
              id="x-reading-date"
              type="date"
              value={date}
              max={todayISO()}
              onChange={e => setDate(e.target.value)}
              disabled={loading}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none disabled:bg-gray-50"
            />
          </div>

          {/* Generate button */}
          <button
            id="x-reading-generate"
            onClick={handleGenerate}
            disabled={loading || !terminalId || terminalLoading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <ScanLine className="h-4 w-4" />
            )}
            {loading ? 'Generating…' : 'Generate X-Reading'}
          </button>
        </div>

        {error && (
          <div className="mt-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </div>
        )}
      </ReportCard>

      {/* Report output */}
      {loading && (
        <div className="py-10 flex justify-center"><LoadingSpinner /></div>
      )}

      {report && !loading && (
        <ReportCard
          title="X-Reading Result"
          subtitle={`Terminal: ${report.Terminal.Name} · ${date}`}
          badge="Preview"
          badgeVariant="emerald"
          printTargetId="x-reading-printout"
        >
          <XReadingDisplay report={report} />
        </ReportCard>
      )}
    </div>
  )
}

export default XReadingPanel
