import React, { useCallback, useEffect, useState } from 'react'
import { ScanLine, RefreshCw } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { usePrinter } from '../../contexts/PrinterContext'
import { ReportService } from '../../services/reportService'
import { Terminal, BusinessSettings } from '../../types/settings'
import { XReadingResult } from '../../types/report'
import ReportCard from './ReportCard'
import LoadingSpinner from '../LoadingSpinner'
import { FormatDateTime } from '../../utils/formatDateTime'
import { ReceiptHeader, ReceiptFooter, ReceiptData } from '../pos/Receipt'

const todayISO = FormatDateTime.formatLocalTimestampForDatabase(new Date()).slice(0, 10)

const generateXReadingText = (
  report: XReadingResult,
  businessSettings: BusinessSettings | null,
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

  const bName = businessSettings?.business_name || (report as any).Business?.Name || '[Business Name]';
  const bAddress = businessSettings?.address || '';
  const addrLines = bAddress ? bAddress.split('\n').map(s => s.trim()).filter(Boolean) : [];
  if (addrLines.length === 0) {
    addrLines.push('[Business Address Line 1]');
    addrLines.push('[Business Address Line 2]');
  }
  const bTIN = businessSettings?.tin || (report as any).Business?.TIN || '123-456-789-00000';
  const bMIN = businessSettings?.min || report.Terminal?.MIN || '2401234567890123';

  // PTU details
  const ptuNo = (report.Terminal as any)?.PTU || businessSettings?.ptu_issued_by || '[Subscriber\'s PTU Number]';

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
    } catch {
      // ignore
    }
  }

  let text = '';
  text += `${line}\n`;
  text += `${center('X-READING')}\n`;
  text += `${center('(MID-DAY SNAPSHOT)')}\n`;
  text += `${line}\n`;
  text += `${center(bName)}\n`;
  addrLines.forEach(l => {
    text += `${center(l)}\n`;
  });
  text += `${center(`${businessSettings?.is_vat_registered === false ? 'NON-VAT REG TIN' : 'VAT REG TIN'}: ${bTIN}`)}\n`;
  text += `${center(`MIN: ${bMIN}`)}\n`;
  text += `${line}\n`;
  text += `${align('Terminal:', report.Terminal?.Name || 'Register 01')}\n`;
  text += `${align('Cashier:', report.Terminal?.CashierName || 'Juan Dela Cruz')}\n`;
  text += `${align('Date:', FormatDateTime.formatLocalTimestampForDatabase(report.GeneratedAt).slice(0, 10))}\n`;
  text += `${align('Time Printed:', formatTime(report.GeneratedAt))}\n`;
  text += `${line}\n`;
  text += `TRANSACTION RANGE (So far today)\n`;
  text += `${align('Beginning Inv No:', report.TransactionRange?.Start || 'N/A')}\n`;
  text += `${align('Current Inv No:', report.TransactionRange?.End || 'N/A')}\n`;
  text += `${line}\n`;
  text += `SALES BREAKDOWN (So far today)\n\n`;
  text += `${align('Gross Sales:', fmtAmt(report.GrossSales))}\n\n`;
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
    text += `VAT DETAILS (So far today)\n\n`;
    text += `${align('VATable Sales:', fmtAmt(report.VAT?.VATable || 0))}\n`;
    text += `${align('VAT Amount (12%):', fmtAmt(report.VAT?.VATAmount || 0))}\n`;
    text += `${align('VAT-Exempt Sales:', fmtAmt(report.VAT?.Exempt || 0))}\n`;
    const zeroRatedVal = (report.VAT as any)?.ZeroRated || (report.VAT as any)?.zero_rated || 0;
    text += `${align('Zero-Rated Sales:', fmtAmt(zeroRatedVal))}\n`;
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

  text += `${center('*** THIS IS NOT AN OFFICIAL RECEIPT ***')}\n`;
  text += `${center('*** FOR INTERNAL USE ONLY ***')}\n`;
  text += `${line}\n`;
  text += `SOFTWARE PROVIDER DETAILS\n`;
  text += `${align('Provider:', providerName)}\n`;
  text += `${align('Address:', providerAddress)}\n`;
  text += `${align('TIN:', providerTIN)}\n`;
  text += `${align('Accred. No:', providerAccredNo)}\n`;
  text += `${align('Date Issued:', providerDateIssued)}\n`;
  text += `${align('Valid Until:', providerValidUntil)}\n`;
  text += `${align('PTU No:', ptuNo)}\n`;

  return text;
};

interface XReadingDisplayProps {
  report: XReadingResult
  businessSettings: BusinessSettings | null
}

/** Builds a minimal ReceiptData shape for the shared header/footer components */
const buildReceiptDataForXReading = (
  report: XReadingResult,
  businessSettings: BusinessSettings | null,
): ReceiptData => ({
  dateISO: report.GeneratedAt,
  businessName: businessSettings?.business_name || (report as any).Business?.Name || '',
  businessAddress1: businessSettings?.address || (report as any).Business?.Address || '',
  tin: businessSettings?.tin || (report as any).Business?.TIN || '',
  isVatRegistered: businessSettings?.is_vat_registered ?? true,
  min: businessSettings?.min || report.Terminal?.MIN || '',
  cashier: report.Terminal?.CashierName || '',
  ptuIssuedBy: businessSettings?.ptu_issued_by || '',
  softwareProviderName: businessSettings?.software_provider_name || '',
  softwareProviderAddress: businessSettings?.software_provider_address || '',
  softwareProviderTin: businessSettings?.software_provider_tin || '',
  softwareProviderAccreditationNo: businessSettings?.software_provider_accreditation_no || '',
  // Required numeric fields (not shown in reading reports)
  lines: [],
  subtotal: 0,
  tax: 0,
  total: 0,
  payments: [],
  totalPaid: 0,
  change: 0,
})

/** Pure presentational component – renders an X-Reading as a BIR-style receipt */
export const XReadingDisplay: React.FC<XReadingDisplayProps> = ({ report, businessSettings }) => {
  const receiptData = buildReceiptDataForXReading(report, businessSettings)
  return (
    <div id="x-reading-printout" className="receipt-paper bg-white text-gray-900 mx-auto border border-gray-200 rounded-lg shadow-inner" style={{ width: 320, fontSize: '9px' }}>
      <ReceiptHeader data={receiptData} />
      <div className="my-2 border-t border-dashed" />
      <div className="font-mono text-xs whitespace-pre px-4 pb-2 leading-relaxed select-all">
        {generateXReadingText(report, businessSettings)}
      </div>
      <div className="my-2 border-t border-dashed" />
      <ReceiptFooter data={receiptData} />
    </div>
  )
}

// ─── Main Panel ───────────────────────────────────────────────────────────────

import { SettingsService } from '../../services/settingsService'

/**
 * XReadingPanel — composable panel for generating mid-day X-Reading snapshots.
 * Can be embedded inside any page shell or used standalone.
 */
const XReadingPanel: React.FC = () => {
  const { persona } = useAuth()
  const { printRaw, config: printerConfig } = usePrinter()

  const [terminals, setTerminals] = useState<Terminal[]>([])
  const [terminalId, setTerminalId] = useState<number | ''>('')
  const [date, setDate] = useState(todayISO)
  const [loading, setLoading] = useState(false)
  const [terminalLoading, setTerminalLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [report, setReport] = useState<XReadingResult | null>(null)
  const [businessSettings, setBusinessSettings] = useState<BusinessSettings | null>(null)

  // Fetch terminal list and settings on mount
  useEffect(() => {
    console.log(todayISO)
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

  const handleGenerate = useCallback(async () => {
    if (!terminalId || !date || !persona?.id) return
    setLoading(true)
    setError(null)
    setReport(null)
    try {
      const result = await ReportService.generateXReading({
        requesting_account_id: Number(persona.id),
        terminal_id: Number(terminalId),
        target_date: date,
      })
      setReport(result)
    } catch (e: any) {
      setError(e?.message || 'Failed to generate X-Reading')
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
      const text = generateXReadingText(report, businessSettings)
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
              max={todayISO}
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
          onDevicePrint={handleDevicePrint}
          deviceBusy={deviceBusy}
        >
          <XReadingDisplay report={report} businessSettings={businessSettings} />
        </ReportCard>
      )}
    </div>
  )
}

export default XReadingPanel
