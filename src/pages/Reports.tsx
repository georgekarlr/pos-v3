import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { reportService } from '../services/reportService'
import LoadingSpinner from '../components/LoadingSpinner'
import {
  BestSellingProductRow,
  LowStockProductRow,
  SalesByStaffRow,
  SalesOverTimeRow
} from '../types/report'

const toISOStartOfDay = (dateStr: string) => {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toISOString()
}

const toISOEndOfDay = (dateStr: string) => {
  const d = new Date(dateStr + 'T23:59:59.999')
  return d.toISOString()
}

const formatCurrency = (value: string | number) => {
  const num = typeof value === 'string' ? Number(value) : value
  if (isNaN(num)) return '-'
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(num)
}

const Reports: React.FC = () => {
  const { persona } = useAuth()

  // Admin gating
  const isAdmin = persona?.type === 'admin'

  // Filters
  const todayISO = new Date().toISOString().slice(0, 10)
  const thirtyDaysAgoISO = new Date(Date.now() - 29 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)

  const [startDate, setStartDate] = useState(thirtyDaysAgoISO)
  const [endDate, setEndDate] = useState(todayISO)
  const [lowStockThreshold, setLowStockThreshold] = useState<number>(5)

  // Data
  const [salesOverTime, setSalesOverTime] = useState<SalesOverTimeRow[]>([])
  const [salesByStaff, setSalesByStaff] = useState<SalesByStaffRow[]>([])
  const [bestSellers, setBestSellers] = useState<BestSellingProductRow[]>([])
  const [lowStock, setLowStock] = useState<LowStockProductRow[]>([])

  // State
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const dateParams = useMemo(() => ({
    startISO: toISOStartOfDay(startDate),
    endISO: toISOEndOfDay(endDate)
  }), [startDate, endDate])

  const loadAll = useCallback(async () => {
    if (!isAdmin || !persona?.id) return
    setLoading(true)
    setError(null)

    const requesting_account_id = persona.id

    try {
      const [overTime, byStaff, topProducts, low] = await Promise.all([
        reportService.getSalesOverTime({
          requesting_account_id,
          start_date: dateParams.startISO,
          end_date: dateParams.endISO
        }),
        reportService.getSalesByStaff({
          requesting_account_id,
          start_date: dateParams.startISO,
          end_date: dateParams.endISO
        }),
        reportService.getBestSellingProducts({
          requesting_account_id,
          start_date: dateParams.startISO,
          end_date: dateParams.endISO,
          limit: 10
        }),
        reportService.getLowStockProducts({
          requesting_account_id,
          threshold: lowStockThreshold
        })
      ])

      setSalesOverTime(overTime)
      setSalesByStaff(byStaff)
      setBestSellers(topProducts)
      setLowStock(low)
    } catch (e: any) {
      setError(e?.message || 'Failed to load reports')
    } finally {
      setLoading(false)
    }
  }, [isAdmin, persona?.id, dateParams, lowStockThreshold])

  useEffect(() => {
    loadAll()
  }, [loadAll])

  if (!isAdmin) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-900">Analytics Reports</h1>
        <p className="mt-2 text-sm text-gray-600">You are not authorized to view this page. Admin only.</p>
      </div>
    )
  }

  const onQuickRange = (days: number) => {
    const end = new Date()
    const start = new Date(Date.now() - (days - 1) * 24 * 60 * 60 * 1000)
    setStartDate(start.toISOString().slice(0, 10))
    setEndDate(end.toISOString().slice(0, 10))
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-end gap-4">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">Analytics Reports</h1>
            <p className="text-sm text-gray-600">Insights into sales, products, inventory, and payments.</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => onQuickRange(1)} className="px-3 py-2 text-sm bg-white border rounded-lg">Today</button>
            <button onClick={() => onQuickRange(7)} className="px-3 py-2 text-sm bg-white border rounded-lg">7d</button>
            <button onClick={() => onQuickRange(30)} className="px-3 py-2 text-sm bg-white border rounded-lg">30d</button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-600">Start date</label>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="border rounded-lg px-3 py-2" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-600">End date</label>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="border rounded-lg px-3 py-2" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-600">Low stock threshold</label>
            <input type="number" min={0} value={lowStockThreshold} onChange={e => setLowStockThreshold(parseInt(e.target.value || '0', 10))} className="border rounded-lg px-3 py-2" />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadAll}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
            disabled={loading}
          >
            {loading ? 'Refreshing…' : 'Refresh'}
          </button>
          {error && <span className="text-sm text-red-600">{error}</span>}
        </div>

        {loading && (
          <div className="py-12">
            <LoadingSpinner />
          </div>
        )}

        {/* Sales Over Time */}
        <section className="bg-white border rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-3">Sales Over Time</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-600">
                  <th className="py-2 pr-4">Date</th>
                  <th className="py-2 pr-4">Orders</th>
                  <th className="py-2 pr-4">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {salesOverTime.map((r) => (
                  <tr key={r.report_date} className="border-t">
                    <td className="py-2 pr-4">{r.report_date}</td>
                    <td className="py-2 pr-4">{r.order_count}</td>
                    <td className="py-2 pr-4">{formatCurrency(r.total_revenue)}</td>
                  </tr>
                ))}
                {salesOverTime.length === 0 && (
                  <tr><td colSpan={3} className="py-4 text-gray-500">No data for selected range.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Sales by Staff */}
        <section className="bg-white border rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-3">Sales by Staff</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-600">
                  <th className="py-2 pr-4">Staff</th>
                  <th className="py-2 pr-4">Orders</th>
                  <th className="py-2 pr-4">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {salesByStaff.map((r) => (
                  <tr key={r.account_id} className="border-t">
                    <td className="py-2 pr-4">{r.account_name || `#${r.account_id}`}</td>
                    <td className="py-2 pr-4">{r.order_count}</td>
                    <td className="py-2 pr-4">{formatCurrency(r.total_revenue)}</td>
                  </tr>
                ))}
                {salesByStaff.length === 0 && (
                  <tr><td colSpan={3} className="py-4 text-gray-500">No data for selected range.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Best Sellers */}
        <section className="bg-white border rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-3">Best-selling Products</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-600">
                  <th className="py-2 pr-4">Product</th>
                  <th className="py-2 pr-4">Units Sold</th>
                  <th className="py-2 pr-4">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {bestSellers.map((r) => (
                  <tr key={r.product_id} className="border-t">
                    <td className="py-2 pr-4">{r.product_name}</td>
                    <td className="py-2 pr-4">{r.total_units_sold}</td>
                    <td className="py-2 pr-4">{formatCurrency(r.total_revenue)}</td>
                  </tr>
                ))}
                {bestSellers.length === 0 && (
                  <tr><td colSpan={3} className="py-4 text-gray-500">No data for selected range.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Low Stock */}
        <section className="bg-white border rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-3">Low Stock Products</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-600">
                  <th className="py-2 pr-4">Product</th>
                  <th className="py-2 pr-4">SKU</th>
                  <th className="py-2 pr-4">Qty</th>
                </tr>
              </thead>
              <tbody>
                {lowStock.map((r) => (
                  <tr key={r.product_id} className="border-t">
                    <td className="py-2 pr-4">{r.product_name}</td>
                    <td className="py-2 pr-4">{r.sku || '-'}</td>
                    <td className="py-2 pr-4">{r.current_quantity}</td>
                  </tr>
                ))}
                {lowStock.length === 0 && (
                  <tr><td colSpan={3} className="py-4 text-gray-500">No low stock items.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  )
}

export default Reports
