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
      const el = document.getElementById(printTargetId)
      if (el) {
        const w = window.open('', '_blank')
        if (!w) return
        w.document.write(`<html><head><title>${title}</title></head><body>${el.innerHTML}</body></html>`)
        w.document.close()
        w.focus()
        w.print()
        w.close()
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
