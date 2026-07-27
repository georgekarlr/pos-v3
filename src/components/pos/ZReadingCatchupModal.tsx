import React, { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Lock,
  ShieldAlert,
  Printer,
  FileText,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Settings,
  KeyRound,
  ChevronRight,
  LayoutDashboard,
  UserCheck
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { usePrinter } from '../../contexts/PrinterContext'
import { ReportService } from '../../services/reportService'
import { PersonaService } from '../../services/personaService'
import { SettingsService } from '../../services/settingsService'
import { ZReadingDisplay } from '../reports/ZReadingPanel'
import { BusinessSettings } from '../../types/settings'
import { ZReadingResult } from '../../types/report'

interface ZReadingCatchupModalProps {
  terminalId: number
  terminalName?: string
  onUnlocked: () => void
}

export const ZReadingCatchupModal: React.FC<ZReadingCatchupModalProps> = ({
  terminalId,
  terminalName,
  onUnlocked,
}) => {
  const { persona } = useAuth()
  const { printRaw, config: printerConfig } = usePrinter()

  const [phase, setPhase] = useState<'locked' | 'validating' | 'processing' | 'done'>('locked')
  const [adminPassword, setAdminPassword] = useState('')
  const [adminAccountId, setAdminAccountId] = useState<number | null>(
    persona?.type === 'admin' ? persona.id || null : null
  )
  const [error, setError] = useState<string | null>(null)
  const [reports, setReports] = useState<ZReadingResult[]>([])
  const [businessSettings, setBusinessSettings] = useState<BusinessSettings | null>(null)
  const [printingIndex, setPrintingIndex] = useState<number | null>(null)
  const [autoPrinted, setAutoPrinted] = useState(false)

  useEffect(() => {
    SettingsService.getBusinessSettings().then(({ data }) => {
      if (data) setBusinessSettings(data)
    })
  }, [])

  // Generate combined raw ESC/POS text representation of all Z-Reading reports
  const getRawTextForReport = (rep: ZReadingResult) => {
    // Generate text via helper in ZReadingPanel or custom renderer
    const line = '='.repeat(40)
    const center = (t: string) => {
      if (!t) return ''
      if (t.length <= 40) {
        const left = Math.floor((40 - t.length) / 2)
        return ' '.repeat(left) + t
      }
      return t.slice(0, 40)
    }
    const align = (l: string, r: string) => {
      const spaces = Math.max(1, 40 - l.length - r.length)
      return l + ' '.repeat(spaces) + r
    }
    const fmtAmt = (n: number) => `PHP ${n.toFixed(2).padStart(10)}`

    let text = `${line}\n${center('Z-READING (CATCH-UP)')}\n${line}\n`
    text += `${align('Terminal:', rep.Terminal?.Name || String(terminalId))}\n`
    text += `${align('Date:', rep.ReadingDate || '')}\n`
    text += `${align('Net Sales:', fmtAmt(rep.NetSales || 0))}\n`
    text += `${align('Gross Sales:', fmtAmt(rep.GrossSales || 0))}\n`
    text += `${align('New Grand Total:', fmtAmt(rep.GrandTotals?.NewCumulative || 0))}\n`
    text += `${line}\n\n`
    return text
  }

  const runBatchCatchup = async (adminId: number) => {
    setPhase('processing')
    setError(null)
    try {
      const res = await ReportService.batchCatchupZReadings({
        requesting_account_id: adminId,
        terminal_id: terminalId,
      })

      if (!res.success) {
        setError(res.message || 'Failed to process batch Z-Reading catch-up.')
        setPhase('locked')
        return
      }

      const generatedData = res.data || []
      setReports(generatedData)
      setPhase('done')

      // Auto print if printer configured
      if (printerConfig && generatedData.length > 0 && !autoPrinted) {
        setAutoPrinted(true)
        handlePrintAll(generatedData)
      }
    } catch (err: any) {
      console.error('Batch catchup error:', err)
      setError(err?.message || 'Network error occurred during batch catch-up.')
      setPhase('locked')
    }
  }

  const handleAdminAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!adminPassword.trim()) {
      setError('Admin password is required')
      return
    }

    setPhase('validating')
    setError(null)

    try {
      const valRes = await PersonaService.validateAdminPersona(adminPassword)
      if (!valRes.success || !valRes.data?.id) {
        setError(valRes.message || 'Invalid admin credentials')
        setPhase('locked')
        return
      }

      setAdminAccountId(valRes.data.id)
      await runBatchCatchup(valRes.data.id)
    } catch (err: any) {
      setError(err?.message || 'Failed to validate admin persona')
      setPhase('locked')
    }
  }

  const handleProcessAsAdmin = async () => {
    if (adminAccountId) {
      await runBatchCatchup(adminAccountId)
    }
  }

  const handlePrintSingle = async (report: ZReadingResult, idx: number) => {
    if (!printerConfig) {
      alert('No receipt printer configured. You can configure one in Settings.')
      return
    }
    setPrintingIndex(idx)
    try {
      const text = getRawTextForReport(report)
      await printRaw(text)
    } catch (err: any) {
      alert('Printer error: ' + (err?.message || err))
    } finally {
      setPrintingIndex(null)
    }
  }

  const handlePrintAll = async (targetReports = reports) => {
    if (!printerConfig) return
    for (let i = 0; i < targetReports.length; i++) {
      await handlePrintSingle(targetReports[i], i)
    }
  }

  const handleBrowserPrint = (targetIdx?: number) => {
    try {
      let elementsToPrint: HTMLElement[] = []
      if (typeof targetIdx === 'number') {
        const el = document.getElementById(`z-tape-paper-${targetIdx}`)
        if (el) elementsToPrint.push(el)
      } else {
        const container = document.getElementById('catchup-z-readings-tapes-container')
        if (container) {
          const papers = container.querySelectorAll('.receipt-paper')
          papers.forEach(p => elementsToPrint.push(p as HTMLElement))
        }
      }

      if (elementsToPrint.length === 0) {
        alert('No receipt content found to print')
        return
      }

      const printWindow = window.open('', 'PRINT', 'height=800,width=440')
      if (!printWindow) return

      const doc = printWindow.document
      doc.open()
      doc.write('<!doctype html><html><head><meta charset="utf-8"><title>Z-Reading Receipts</title></head><body></body></html>')
      doc.close()

      const head = doc.head
      const styleNodes = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
      styleNodes.forEach((n) => head.appendChild(n.cloneNode(true)))

      const extraStyle = doc.createElement('style')
      extraStyle.type = 'text/css'
      extraStyle.textContent = `
        :root { --receipt-width: 80mm; }
        @media print {
          @page { size: var(--receipt-width) auto; margin: 0; }
          html, body { margin: 0; padding: 0; background: #ffffff; }
          .receipt-paper {
            width: var(--receipt-width) !important;
            max-width: var(--receipt-width) !important;
            padding: 4mm !important;
            margin: 0 auto 5mm auto !important;
            box-shadow: none !important;
            border: none !important;
            page-break-after: always;
          }
        }
        body { display: flex; flex-direction: column; align-items: center; background: #f3f4f6; padding: 20px; }
        .receipt-paper {
          background: #ffffff;
          padding: 15px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          width: var(--receipt-width);
          max-width: var(--receipt-width);
          box-sizing: border-box;
          margin-bottom: 20px;
          border-radius: 6px;
        }
      `
      head.appendChild(extraStyle)

      elementsToPrint.forEach(el => {
        const clonedNode = el.cloneNode(true) as HTMLElement
        doc.body.appendChild(clonedNode)
      })

      const waitForLinks = Array.from(head.querySelectorAll('link[rel="stylesheet"]'))
        .map((lnk) => new Promise<void>((resolve) => {
          if ((lnk as HTMLLinkElement).sheet) return resolve()
          lnk.addEventListener('load', () => resolve())
          lnk.addEventListener('error', () => resolve())
        }))

      Promise.all(waitForLinks).then(() => {
        printWindow.focus()
        setTimeout(() => {
          printWindow.print()
          printWindow.close()
        }, 250)
      })
    } catch (e) {
      console.error('Print error:', e)
      alert('Failed to open browser print window')
    }
  }

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-600 to-orange-600 px-6 py-5 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-white/10 rounded-xl backdrop-blur-sm">
              <Lock className="h-6 w-6 text-amber-100" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Terminal Register Locked</h2>
              <p className="text-amber-100 text-xs mt-0.5 font-medium">
                Unclosed Z-Reading(s) detected for {terminalName || `Terminal #${terminalId}`}
              </p>
            </div>
          </div>
          <span className="px-3 py-1 bg-amber-500/30 text-amber-100 border border-amber-300/30 rounded-full text-xs font-semibold uppercase tracking-wider">
            Catch-Up Required
          </span>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-start space-x-3 text-sm">
              <ShieldAlert className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {phase === 'processing' || phase === 'validating' ? (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
              <RefreshCw className="h-10 w-10 text-amber-600 animate-spin" />
              <div>
                <h3 className="text-lg font-semibold text-slate-800">
                  {phase === 'validating' ? 'Validating Admin Credentials…' : 'Generating Catch-Up Z-Readings…'}
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  Please wait while missing end-of-day audit tapes are computed and saved.
                </p>
              </div>
            </div>
          ) : phase === 'locked' ? (
            <div className="space-y-6">
              <div className="bg-amber-50 border border-amber-200/80 rounded-xl p-4 flex items-start space-x-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-sm text-amber-900 leading-relaxed">
                  <strong>Daily Fiscal Policy Warning:</strong> This terminal has previous dates with completed sales that lack an official Z-Reading report.
                  Per tax compliance guidelines, all prior days must be closed before registering new sales.
                </div>
              </div>

              {persona?.type === 'admin' ? (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 text-center space-y-4">
                  <div className="inline-flex items-center justify-center p-3 bg-blue-100 text-blue-700 rounded-full mb-1">
                    <CheckCircle2 className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800">Authenticated as Administrator</h3>
                    <p className="text-xs text-slate-500 mt-1">
                      You are logged in with admin privileges. You can process the catch-up directly without re-entering password.
                    </p>
                  </div>
                  <button
                    onClick={handleProcessAsAdmin}
                    className="w-full py-3.5 px-4 bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white font-semibold rounded-xl shadow-md transition-all flex items-center justify-center space-x-2"
                  >
                    <span>Process Batch Catch-Up Z-Readings</span>
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <form onSubmit={handleAdminAuthSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">
                      Admin Password Required to Catch-Up
                    </label>
                    <div className="relative">
                      <KeyRound className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                      <input
                        type="password"
                        value={adminPassword}
                        onChange={(e) => setAdminPassword(e.target.value)}
                        placeholder="Enter Admin Password"
                        required
                        className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="w-full py-3.5 px-4 bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white font-semibold rounded-xl shadow-md transition-all flex items-center justify-center space-x-2"
                  >
                    <span>Validate Admin &amp; Process Catch-Up</span>
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </form>
              )}
            </div>
          ) : (
            /* Phase: 'done' */
            <div className="space-y-6">
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center justify-between text-emerald-900">
                <div className="flex items-center space-x-3 text-sm font-medium">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                  <span>Successfully processed {reports.length} missing Z-Reading(s).</span>
                </div>
                {!printerConfig && (
                  <Link
                    to="/settings"
                    className="inline-flex items-center space-x-1 text-xs text-amber-700 hover:text-amber-900 font-semibold underline"
                  >
                    <Settings className="h-3.5 w-3.5" />
                    <span>Configure Printer</span>
                  </Link>
                )}
              </div>

              {/* Action Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
                <div className="flex items-center space-x-2">
                  <Printer className="h-4 w-4 text-slate-600" />
                  <span className="font-semibold text-slate-700">Printer Actions:</span>
                </div>
                <div className="flex items-center space-x-2">
                  {printerConfig ? (
                    <button
                      onClick={() => handlePrintAll()}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center space-x-1"
                    >
                      <Printer className="h-3.5 w-3.5" />
                      <span>Print All Tapes</span>
                    </button>
                  ) : (
                    <Link
                      to="/settings"
                      className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-medium transition-colors flex items-center space-x-1"
                    >
                      <Settings className="h-3.5 w-3.5" />
                      <span>Configure Receipt Printer</span>
                    </Link>
                  )}
                  <button
                    onClick={() => handleBrowserPrint()}
                    className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-medium transition-colors flex items-center space-x-1"
                  >
                    <FileText className="h-3.5 w-3.5" />
                    <span>Save / Print PDF (All Tapes)</span>
                  </button>
                </div>
              </div>

              {/* Tapes Stack Display */}
              <div
                id="catchup-z-readings-tapes-container"
                className="max-h-[360px] overflow-y-auto space-y-6 p-4 bg-slate-100 rounded-xl border border-slate-200 shadow-inner"
              >
                {reports.map((rep, idx) => (
                  <div key={idx} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100 text-xs">
                      <span className="font-semibold text-slate-700">
                        Tape #{idx + 1} — Date: {rep.ReadingDate}
                      </span>
                      <div className="flex items-center space-x-2">
                        {printerConfig && (
                          <button
                            onClick={() => handlePrintSingle(rep, idx)}
                            disabled={printingIndex === idx}
                            className="px-2.5 py-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-medium transition-colors flex items-center space-x-1 disabled:opacity-50"
                          >
                            <Printer className="h-3 w-3" />
                            <span>{printingIndex === idx ? 'Printing…' : 'Thermal Print'}</span>
                          </button>
                        )}
                        <button
                          onClick={() => handleBrowserPrint(idx)}
                          className="px-2.5 py-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-medium transition-colors flex items-center space-x-1"
                        >
                          <FileText className="h-3 w-3" />
                          <span>Print PDF</span>
                        </button>
                      </div>
                    </div>
                    <div id={`z-tape-paper-${idx}`}>
                      <ZReadingDisplay report={rep} businessSettings={businessSettings} persona={persona} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Unlock Register Button */}
              <button
                onClick={onUnlocked}
                className="w-full py-4 px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-base font-bold rounded-xl shadow-lg transition-all flex items-center justify-center space-x-2"
              >
                <CheckCircle2 className="h-5 w-5" />
                <span>Unlock Register &amp; Start Selling</span>
              </button>
            </div>
          )}

          {/* Navigation Footer */}
          <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
            <span className="font-semibold text-slate-500 uppercase tracking-wide text-[10px]">Navigate to:</span>
            <div className="flex flex-wrap items-center gap-2">
              <Link
                to="/dashboard"
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors flex items-center space-x-1.5"
              >
                <LayoutDashboard className="h-3.5 w-3.5" />
                <span>Dashboard</span>
              </Link>
              <Link
                to="/settings"
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors flex items-center space-x-1.5"
              >
                <Settings className="h-3.5 w-3.5" />
                <span>Settings</span>
              </Link>
              <Link
                to="/persona-management"
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors flex items-center space-x-1.5"
              >
                <UserCheck className="h-3.5 w-3.5" />
                <span>Persona</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ZReadingCatchupModal
