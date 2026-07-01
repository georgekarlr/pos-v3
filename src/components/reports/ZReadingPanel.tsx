import React, { useCallback, useEffect, useState } from 'react'
import { AlertTriangle, FileCheck, RefreshCw } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { ReportService } from '../../services/reportService'
import { SettingsService } from '../../services/settingsService'
import { Terminal } from '../../types/settings'
import { ZReadingResult } from '../../types/report'
import ReportCard from './ReportCard'
import LoadingSpinner from '../LoadingSpinner'

const fmt = (n: number) =>
  new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(n)

const todayISO = () => new Date().toISOString().slice(0, 10)

// ─── Composable sub-sections ──────────────────────────────────────────────────

const ReceiptRow: React.FC<{ label: string; value: string; bold?: boolean; indent?: boolean; highlight?: boolean }> = ({
  label, value, bold, indent, highlight,
}) => (
  <div className={`flex justify-between text-sm py-0.5 ${bold ? 'font-semibold' : ''} ${indent ? 'pl-4 text-gray-600' : ''} ${highlight ? 'text-blue-700' : ''}`}>
    <span>{label}</span>
    <span className="tabular-nums">{value}</span>
  </div>
)

const Divider = () => <div className="border-t border-dashed border-gray-300 my-2" />

interface ZReadingDisplayProps {
  report: ZReadingResult
}

/** Pure presentational component – renders a Z-Reading as a BIR-style receipt */
export const ZReadingDisplay: React.FC<ZReadingDisplayProps> = ({ report }) => (
  <div id="z-reading-printout" className="font-mono text-xs space-y-1 max-w-sm mx-auto">
    <div className="text-center space-y-0.5 mb-3">
      <div className="text-base font-bold uppercase tracking-wide">{report.ReportType}</div>
      <div className="font-semibold">{report.Business.Name}</div>
      <div className="text-gray-500">TIN: {report.Business.TIN}</div>
      <div className="text-gray-500">Terminal: {report.Terminal.Name}</div>
      <div className="text-gray-500">MIN: {report.Terminal.MIN}</div>
      <div className="text-gray-500">PTU: {report.Terminal.PTU}</div>
      <div className="text-gray-500">Date: {report.ReadingDate}</div>
      <div className="text-gray-500">Generated: {new Date(report.GeneratedAt).toLocaleString()}</div>
    </div>
    <Divider />
    <ReceiptRow label="Starting Invoice" value={report.Invoices.Start ?? 'N/A'} />
    <ReceiptRow label="Ending Invoice" value={report.Invoices.End ?? 'N/A'} />
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
    <Divider />
    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mt-1">Grand Total Register</div>
    <ReceiptRow label="Previous Cumulative GT" value={fmt(report.GrandTotals.OldCumulative)} indent />
    <ReceiptRow label="Today's Net Sales" value={fmt(report.GrandTotals.TodaysSales)} indent />
    <ReceiptRow label="New Cumulative GT" value={fmt(report.GrandTotals.NewCumulative)} bold highlight />
    <Divider />
    <div className="text-center text-gray-400 text-xs pt-1">*** END OF Z-READING ***</div>
  </div>
)

// ─── Main Panel ───────────────────────────────────────────────────────────────

/**
 * ZReadingPanel — composable panel for generating permanent end-of-day Z-Readings.
 * Admin-only. Shows a permanent-action warning before confirming.
 */
const ZReadingPanel: React.FC = () => {
  const { persona } = useAuth()

  const [terminals, setTerminals] = useState<Terminal[]>([])
  const [terminalId, setTerminalId] = useState<number | ''>('')
  const [date, setDate] = useState(todayISO())
  const [loading, setLoading] = useState(false)
  const [terminalLoading, setTerminalLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [report, setReport] = useState<ZReadingResult | null>(null)
  const [confirming, setConfirming] = useState(false)

  useEffect(() => {
    SettingsService.getTerminals().then(({ data }) => {
      if (data && data.length > 0) {
        setTerminals(data)
        setTerminalId(data[0].terminal_id)
      }
      setTerminalLoading(false)
    })
  }, [])

  const handleConfirm = useCallback(async () => {
    if (!terminalId || !date || !persona?.id) return
    setLoading(true)
    setError(null)
    setSuccessMsg(null)
    setReport(null)
    setConfirming(false)
    try {
      const row = await ReportService.generateZReading({
        requesting_account_id: persona.id,
        terminal_id: Number(terminalId),
        target_date: date,
      })
      if (!row.success) {
        setError(row.message)
      } else {
        setSuccessMsg(row.message)
        setReport(row.data)
      }
    } catch (e: any) {
      setError(e?.message || 'Failed to generate Z-Reading')
    } finally {
      setLoading(false)
    }
  }, [terminalId, date, persona?.id])

  return (
    <div className="space-y-5">
      {/* Controls */}
      <ReportCard
        title="Z-Reading Generator"
        subtitle="End-of-day report — permanently saved to the database. Cannot be undone."
        badge="Permanent"
        badgeVariant="amber"
      >
        {/* Permanent-action warning banner */}
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 mb-4">
          <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
          <p className="text-sm text-amber-800">
            <strong>This action is permanent.</strong> Z-Readings are saved once per terminal per day and cannot be
            deleted or re-generated for the same date.
          </p>
        </div>

        <div className="flex flex-wrap gap-4 items-end">
          {/* Terminal picker */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-600">Terminal</label>
            {terminalLoading ? (
              <div className="h-9 w-44 bg-gray-100 animate-pulse rounded-lg" />
            ) : (
              <select
                id="z-reading-terminal"
                value={terminalId}
                onChange={e => { setTerminalId(Number(e.target.value)); setConfirming(false) }}
                disabled={loading}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none disabled:bg-gray-50 min-w-[11rem]"
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
              id="z-reading-date"
              type="date"
              value={date}
              max={todayISO()}
              onChange={e => { setDate(e.target.value); setConfirming(false) }}
              disabled={loading}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none disabled:bg-gray-50"
            />
          </div>

          {/* Two-step: first click shows confirm, second click executes */}
          {!confirming ? (
            <button
              id="z-reading-initiate"
              onClick={() => setConfirming(true)}
              disabled={loading || !terminalId || terminalLoading}
              className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white text-sm font-medium rounded-lg hover:bg-amber-600 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FileCheck className="h-4 w-4" />
              Generate Z-Reading
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                id="z-reading-confirm"
                onClick={handleConfirm}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 active:scale-95 transition-all disabled:opacity-50"
              >
                {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <AlertTriangle className="h-4 w-4" />}
                {loading ? 'Processing…' : 'Confirm — This is permanent'}
              </button>
              <button
                onClick={() => setConfirming(false)}
                disabled={loading}
                className="px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          )}
        </div>

        {error && (
          <div className="mt-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </div>
        )}
        {successMsg && !error && (
          <div className="mt-3 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
            {successMsg}
          </div>
        )}
      </ReportCard>

      {/* Report output */}
      {loading && (
        <div className="py-10 flex justify-center"><LoadingSpinner /></div>
      )}

      {report && !loading && (
        <ReportCard
          title="Z-Reading Result"
          subtitle={`Terminal: ${report.Terminal.Name} · ${report.ReadingDate}`}
          badge="Saved"
          badgeVariant="emerald"
          printTargetId="z-reading-printout"
        >
          <ZReadingDisplay report={report} />
        </ReportCard>
      )}
    </div>
  )
}

export default ZReadingPanel
