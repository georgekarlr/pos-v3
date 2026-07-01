import React from 'react'
import { Printer } from 'lucide-react'

interface ReportCardProps {
  title: string
  subtitle?: string
  badge?: string
  badgeVariant?: 'blue' | 'amber' | 'emerald'
  children: React.ReactNode
  /** Optionally override the element that gets printed (defaults to the card itself) */
  printTargetId?: string
}

/**
 * Shared presentational wrapper used by all compliance report panels.
 * Renders a styled card with a consistent header and a "Print" action.
 */
const ReportCard: React.FC<ReportCardProps> = ({
  title,
  subtitle,
  badge,
  badgeVariant = 'blue',
  children,
  printTargetId,
}) => {
  const badgeColors: Record<string, string> = {
    blue: 'bg-blue-100 text-blue-700',
    amber: 'bg-amber-100 text-amber-700',
    emerald: 'bg-emerald-100 text-emerald-700',
  }

  const handlePrint = () => {
    if (printTargetId) {
      const container = document.getElementById(printTargetId)
      if (container) {
        try {
          const printWindow = window.open('', 'PRINT', 'height=800,width=420')
          if (!printWindow) return

          const doc = printWindow.document
          doc.open()
          doc.write(`<!doctype html><html><head><meta charset="utf-8"><title>${title}</title></head><body></body></html>`)
          doc.close()

          // Clone current styles (Tailwind is injected via <style> in dev and <link> in prod)
          const head = doc.head
          const styleNodes = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
          styleNodes.forEach((n) => head.appendChild(n.cloneNode(true)))

          // Add print-specific CSS to match POS printer width (80mm is thermal print paper standard)
          const extraStyle = doc.createElement('style')
          extraStyle.type = 'text/css'
          extraStyle.textContent = `
            :root { --receipt-width: 80mm; }
            @media print {
              @page { size: var(--receipt-width) auto; margin: 0; }
              html, body { margin: 0; padding: 0; background: #ffffff; }
              #${printTargetId} {
                width: var(--receipt-width) !important;
                max-width: var(--receipt-width) !important;
                padding: 4mm !important;
                box-sizing: border-box !important;
                margin: 0 !important;
                display: block !important;
              }
            }
            /* On screen inside the print window, center the receipt */
            body { display: flex; justify-content: center; background: #f3f4f6; padding: 20px; }
            #${printTargetId} {
              background: #ffffff;
              padding: 20px;
              box-shadow: 0 1px 3px rgba(0,0,0,0.1);
              width: var(--receipt-width);
              max-width: var(--receipt-width);
              box-sizing: border-box;
              display: block !important;
            }
          `
          head.appendChild(extraStyle)

          // Clone the target DOM element
          const sourceNode = container.cloneNode(true) as HTMLElement
          doc.body.appendChild(sourceNode)

          // Ensure styles are applied before printing (wait for stylesheets to load)
          const waitForLinks = Array.from(head.querySelectorAll('link[rel="stylesheet"]'))
            .map((lnk) => new Promise<void>((resolve) => {
              if ((lnk as HTMLLinkElement).sheet) return resolve()
              lnk.addEventListener('load', () => resolve())
              lnk.addEventListener('error', () => resolve())
            }))

          Promise.all(waitForLinks).then(() => {
            printWindow.focus()
            // Short delay to allow layout to settle
            setTimeout(() => {
              printWindow.print()
              printWindow.close()
            }, 200)
          })
        } catch (e) {
          console.error('Print error', e)
          alert('Failed to open print dialog')
        }
        return
      }
    }
    window.print()
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
      {/* Card header */}
      <div className="flex items-start justify-between px-5 py-4 border-b border-gray-100">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-gray-900">{title}</h3>
            {badge && (
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${badgeColors[badgeVariant]}`}>
                {badge}
              </span>
            )}
          </div>
          {subtitle && <p className="mt-0.5 text-xs text-gray-500">{subtitle}</p>}
        </div>
        <button
          onClick={handlePrint}
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-800 border border-gray-200 hover:border-gray-300 rounded-lg px-3 py-1.5 transition-colors"
        >
          <Printer className="h-3.5 w-3.5" />
          Print
        </button>
      </div>

      {/* Content */}
      <div className="px-5 py-4">{children}</div>
    </div>
  )
}

export default ReportCard
