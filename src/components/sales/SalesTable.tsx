import React from 'react'
import { SalesHistoryRow } from '../../types/sales'
import { Eye, Loader2, RotateCcw, History } from 'lucide-react'

interface SalesTableProps {
  rows: SalesHistoryRow[]
  loading: boolean
  onView: (orderId: number) => void
  onRefund?: (orderId: number) => void
  onViewRefunds?: (orderId: number) => void
}

function formatCurrency(n: number) {
  if (typeof n !== 'number' || isNaN(n)) return '$0.00'
  return `\u20b1${n.toFixed(2)}`
}

const SalesTable: React.FC<SalesTableProps> = ({ rows, loading, onView, onRefund, onViewRefunds }) => {
  return (
    <div className="overflow-x-auto bg-white border border-gray-200 rounded-lg">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order #</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
            {/*<th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>*/}
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cashier</th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Refund Amount</th>
            <th className="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-100">
          {loading ? (
            <tr>
              <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                <div className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Loading...</span>
                </div>
              </td>
            </tr>
          ) : rows.length === 0 ? (
            <tr>
              <td colSpan={7} className="px-4 py-8 text-center text-gray-500">No sales found.</td>
            </tr>
          ) : (
            rows.map((r) => {
              const d = new Date(r.created_at)
              const dateStr = `${d.toLocaleDateString()} ${d.toLocaleTimeString()}`
              return (
                <tr key={r.order_id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-900">#{r.order_id}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{dateStr}</td>
                  {/*<td className="px-4 py-3 text-sm text-gray-700">{r.customer_name}</td>*/}
                  <td className="px-4 py-3 text-sm text-gray-700">{r.account_name}</td>
                  <td className="px-4 py-3 text-sm text-gray-900 text-right">{formatCurrency(Number(r.total_amount))}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                      {formatCurrency(r.refund_amount ?? 0)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex items-center gap-2">
                      <button
                        onClick={() => onView(r.order_id)}
                        title="View receipt"
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm"
                      >
                        <Eye className="h-4 w-4" />
                        <span className="sr-only sm:not-sr-only sm:inline">View</span>
                      </button>
                      {onRefund && (
                        <button
                          onClick={() => onRefund(r.order_id)}
                          title="Refund"
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md border border-emerald-300 text-emerald-700 hover:bg-emerald-50 text-sm"
                        >
                          <RotateCcw className="h-4 w-4" />
                          <span className="sr-only sm:not-sr-only sm:inline">Refund</span>
                        </button>
                      )}
                      {onViewRefunds && (
                        <button
                          onClick={() => onViewRefunds(r.order_id)}
                          title="View refunds for this order"
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md border border-blue-300 text-blue-700 hover:bg-blue-50 text-sm"
                        >
                          <History className="h-4 w-4" />
                          <span className="sr-only sm:not-sr-only sm:inline">Refunds</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })
          )}
        </tbody>
      </table>
    </div>
  )
}

export default SalesTable
