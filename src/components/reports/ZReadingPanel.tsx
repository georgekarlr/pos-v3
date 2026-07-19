import React, { useCallback, useEffect, useState } from 'react'
import { AlertTriangle, FileCheck, RefreshCw } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { usePrinter } from '../../contexts/PrinterContext'
import { ReportService } from '../../services/reportService'
import { SettingsService } from '../../services/settingsService'
import { Terminal, BusinessSettings } from '../../types/settings'
import { ZReadingResult } from '../../types/report'
import ReportCard from './ReportCard'
import LoadingSpinner from '../LoadingSpinner'
import { FormatDateTime } from '../../utils/formatDateTime'

const todayISO = FormatDateTime.formatLocalTimestampForDatabase(new Date()).slice(0, 10)

const generateZReadingText = (
  report: ZReadingResult,
  businessSettings: BusinessSettings | null,
  persona: any
) => {
  const line = '='.repeat(40);
  const center = (text: string) => {
    if (text.length >= 40) return text.slice(0, 40);
    const left = Math.floor((40 - text.length) / 2);
    const right = 40 - text.length - left;
    return ' '.repeat(left) + text + ' '.repeat(right);
  };
  const align = (left: string, right: string) => {
    const spaces = Math.max(1, 40 - left.length - right.length);
    return left + ' '.repeat(spaces) + right;
  };
  const fmtVal = (n: number) => {
    const val = new Intl.NumberFormat('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
    return val.padStart(9);
  };
  const fmtAmt = (n: number) => `PHP ${fmtVal(n)}`;

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const formatTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return '';
      return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    } catch {
      return '';
    }
  };

  const bName = businessSettings?.business_name || report.Business?.Name || '[Business Name]';
  const bAddress = businessSettings?.address || '';
  const addrLines = bAddress ? bAddress.split('\n').map(s => s.trim()).filter(Boolean) : [];
  if (addrLines.length === 0) {
    addrLines.push('[Business Address Line 1]');
    addrLines.push('[Business Address Line 2]');
  }
  const bTIN = businessSettings?.tin || report.Business?.TIN || '123-456-789-00000';
  const bMIN = businessSettings?.min || report.Terminal?.MIN || '2401234567890123';

  // PTU details
  const ptuNo = report.Terminal?.PTU || businessSettings?.ptu_issued_by || '[Subscriber\'s PTU Number]';

  // software provider details
  const providerName = businessSettings?.software_provider_name || '[Your SaaS Company Name]';
  const providerAddress = businessSettings?.software_provider_address || '[Your Address]';
  const providerTIN = businessSettings?.software_provider_tin || '[Your TIN]';
  const providerAccredNo = businessSettings?.software_provider_accreditation_no || '045-123456789-000000';
  const providerDateIssued = businessSettings?.software_provider_date_issued ? formatDate(businessSettings.software_provider_date_issued) : 'Jan 01, 2024';

  // Calculate Valid Until: 5 years after software_provider_date_issued
  let providerValidUntil = 'Jan 01, 2029';
  if (businessSettings?.software_provider_date_issued) {
    try {
      const issueDate = new Date(businessSettings.software_provider_date_issued);
      const validDate = new Date(issueDate.setFullYear(issueDate.getFullYear() + 5));
      providerValidUntil = validDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch { }
  }

  const zCounter = (report as any).z_counter || (report as any).id || (report as any).z_reading_id || 142;
  const zCounterStr = String(zCounter).padStart(6, '0');

  let text = '';
  text += `${line}\n`;
  text += `${center('Z-READING')}\n`;
  text += `${line}\n`;
  text += `${center(bName)}\n`;
  addrLines.forEach(l => {
    text += `${center(l)}\n`;
  });
  text += `${center(`${businessSettings?.is_vat_registered === false ? 'NON-VAT REG TIN' : 'VAT REG TIN'}: ${bTIN}`)}\n`;
  text += `${center(`MIN: ${bMIN}`)}\n`;
  text += `${line}\n`;
  text += `${align('Terminal:', report.Terminal?.Name || 'Register 01')}\n`;
  text += `${align('Cashier/Admin:', report.Terminal?.AdminName || 'Maria Santos')}\n`;
  text += `${align('Date:', formatDate(report.ReadingDate || report.GeneratedAt))}\n`;
  text += `${align('Time Printed:', formatTime(report.GeneratedAt))}\n`;
  text += `${align('Z-Counter:', zCounterStr)}\n`;
  text += `${line}\n`;
  text += `TRANSACTION RANGE\n`;
  text += `${align('Beginning Inv No:', report.Invoices?.Start || 'N/A')}\n`;
  text += `${align('Ending Inv No:', report.Invoices?.End || 'N/A')}\n`;
  text += `${line}\n`;
  text += `SALES BREAKDOWN\n\n`;
  text += `${align('Gross Sales:', fmtAmt(report.GrossSales))}\n`;
  text += `  (Total of all items rung up)\n\n`;
  text += `Less Deductions:\n`;
  text += `${align('  Promotions:', fmtAmt(report.Deductions?.Promotions || 0))}\n`;
  text += `${align('  VAT-Exempt Discount:', fmtAmt(report.Deductions?.VAT_Exempt_Discount || 0))}\n`;
  text += `${align('  SC/PWD Discounts:', fmtAmt(report.Deductions?.SC_PWD_Discount || 0))}\n`;
  text += `${align('  Refunds/Returns:', fmtAmt(report.Deductions?.Refunds || 0))}\n`;
  text += `${align('  Voids:', fmtAmt(report.Deductions?.Voids || 0))}\n`;
  text += `                            ---------------\n`;
  const totalDeductions = (report.Deductions?.Promotions || 0) + (report.Deductions?.VAT_Exempt_Discount || 0) + (report.Deductions?.SC_PWD_Discount || 0) + (report.Deductions?.Refunds || 0) + (report.Deductions?.Voids || 0);
  text += `${align('Total Deductions:', fmtAmt(totalDeductions))}\n\n`;
  text += `${align('NET SALES:', fmtAmt(report.NetSales))}\n`;
  text += `${line}\n`;
  if (businessSettings?.is_vat_registered !== false) {
    text += `VAT DETAILS (Based on Net Sales)\n\n`;
    text += `${align('VATable Sales:', fmtAmt(report.VAT?.VATable || 0))}\n`;
    text += `${align('VAT Amount (12%):', fmtAmt(report.VAT?.VATAmount || 0))}\n`;
    text += `${align('VAT-Exempt Sales:', fmtAmt(report.VAT?.Exempt || 0))}\n`;
    text += `${align('Zero-Rated Sales:', fmtAmt(report.VAT?.ZeroRated || 0))}\n`;
    text += `${line}\n`;
  }

  if (report.Collections) {
    text += `CASH DRAWER COLLECTIONS\n\n`;
    const breakdown = report.Collections.Breakdown || [];
    breakdown.forEach((item: any) => {
      text += `${align(`  ${item.method}:`, fmtAmt(item.amount))}\n`;
    });
    text += `                            ---------------\n`;
    text += `${align('Total Collected:', fmtAmt(report.Collections.TotalCollected || 0))}\n`;
    text += `${line}\n`;
  }

  text += `ACCUMULATED GRAND TOTALS\n`;
  text += `(Non-Resettable)\n\n`;
  text += `${align('Old Grand Total:', fmtAmt(report.GrandTotals?.OldCumulative || 0))}\n`;
  text += `${align('Net Sales (Today):', fmtAmt(report.GrandTotals?.TodaysSales || 0))}\n`;
  text += `                            ---------------\n`;
  text += `${align('NEW GRAND TOTAL:', fmtAmt(report.GrandTotals?.NewCumulative || 0))}\n`;
  text += `${line}\n`;
  text += `SOFTWARE PROVIDER DETAILS\n`;
  text += `${align('Provider:', providerName)}\n`;
  text += `${align('Address:', providerAddress)}\n`;
  text += `${align('TIN:', providerTIN)}\n`;
  text += `${align('Accred. No:', providerAccredNo)}\n`;
  text += `${align('Date Issued:', providerDateIssued)}\n`;
  text += `${align('Valid Until:', providerValidUntil)}\n`;
  text += `${align('PTU No:', ptuNo)}\n`;
  text += `${line}\n`;
  text += `${center('THIS RECEIPT SHALL BE VALID')}\n`;
  text += `${center('FOR 5 YEARS FROM THE DATE OF')}\n`;
  text += `${center('THE PERMIT TO USE.')}\n`;
  text += `${line}`;

  return text;
};

interface ZReadingDisplayProps {
  report: ZReadingResult
  businessSettings: BusinessSettings | null
  persona: any
}

/** Pure presentational component – renders a Z-Reading as a BIR-style receipt */
export const ZReadingDisplay: React.FC<ZReadingDisplayProps> = ({ report, businessSettings, persona }) => (
  <div id="z-reading-printout" className="font-mono text-xs whitespace-pre bg-gray-50 border border-gray-200 p-4 rounded-lg leading-relaxed max-w-sm mx-auto shadow-inner select-all">
    {generateZReadingText(report, businessSettings, persona)}
  </div>
)

// ─── Main Panel ───────────────────────────────────────────────────────────────

/**
 * ZReadingPanel — composable panel for generating permanent end-of-day Z-Readings.
 * Admin-only. Shows a permanent-action warning before confirming.
 */
const ZReadingPanel: React.FC = () => {
  const { persona } = useAuth()
  const { printRaw, config: printerConfig } = usePrinter()

  const [terminals, setTerminals] = useState<Terminal[]>([])
  const [terminalId, setTerminalId] = useState<number | ''>('')
  const [date, setDate] = useState(todayISO)
  const [loading, setLoading] = useState(false)
  const [terminalLoading, setTerminalLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [report, setReport] = useState<ZReadingResult | null>(null)
  const [confirming, setConfirming] = useState(false)
  const [businessSettings, setBusinessSettings] = useState<BusinessSettings | null>(null)

  useEffect(() => {
    SettingsService.getTerminals().then(({ data }) => {
      if (data && data.length > 0) {
        setTerminals(data)
        setTerminalId(data[0].terminal_id)
      }
      setTerminalLoading(false)
    })
    SettingsService.getBusinessSettings().then(({ data }) => {
      if (data) setBusinessSettings(data)
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

  const [deviceBusy, setDeviceBusy] = useState(false)
  const handleDevicePrint = useCallback(async () => {
    if (!report || !businessSettings) return
    if (!printerConfig) {
      const go = confirm('No receipt printer configured. Open the Receipt Printer settings now?')
      if (go) window.location.href = '/settings'
      return
    }
    setDeviceBusy(true)
    try {
      const text = generateZReadingText(report, businessSettings, persona)
      await printRaw(text)
    } catch (e: any) {
      console.error(e)
      alert('Device print failed: ' + (e?.message || e))
    } finally {
      setDeviceBusy(false)
    }
  }, [report, businessSettings, persona, printerConfig, printRaw])

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
              max={todayISO}
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
          onDevicePrint={handleDevicePrint}
          deviceBusy={deviceBusy}
        >
          <ZReadingDisplay report={report} businessSettings={businessSettings} persona={persona} />
        </ReportCard>
      )}
    </div>
  )
}

export default ZReadingPanel
