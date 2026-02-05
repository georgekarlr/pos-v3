import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { ReportService } from '../services/reportService'
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
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'PHP' }).format(num)
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

  const kpis = useMemo(() => {
    const totalOrders = salesOverTime.reduce((s, r) => s + (r.order_count || 0), 0)
    const totalRevenue = salesOverTime.reduce((s, r) => s + (Number(r.total_revenue) || 0), 0)
    const avgOrderValue = totalOrders ? totalRevenue / totalOrders : 0
    return { totalOrders, totalRevenue, avgOrderValue }
  }, [salesOverTime])

  const selectedQuickRange = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10)
    const start = new Date(startDate)
    const end = new Date(endDate)
    const diffDays = Math.round((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)) + 1
    if (endDate === today) {
      if (diffDays === 1) return 1
      if (diffDays === 7) return 7
      if (diffDays === 30) return 30
    }
    return null
  }, [startDate, endDate])

  const revenueSeries = useMemo(() => salesOverTime.map(r => Number(r.total_revenue) || 0), [salesOverTime])
  const sparkPoints = useMemo(() => {
    const n = revenueSeries.length
    if (n === 0) return ''
    const min = Math.min(...revenueSeries)
    const max = Math.max(...revenueSeries)
    const range = max - min || 1
    return revenueSeries.map((v, i) => {
      const x = (i * 100) / (n - 1)
      const y = 100 - ((v - min) / range) * 100
      return `${x},${y}`
    }).join(' ')
  }, [revenueSeries])

  const maxStaffRevenue = useMemo(() => Math.max(0, ...salesByStaff.map(r => Number(r.total_revenue) || 0)), [salesByStaff])
  const maxUnitsSold = useMemo(() => Math.max(0, ...bestSellers.map(r => r.total_units_sold || 0)), [bestSellers])

  const loadAll = useCallback(async () => {
    if (!isAdmin || !persona?.id) return
    setLoading(true)
    setError(null)

    const requesting_account_id = persona.id

    try {
      const [overTime, byStaff, topProducts, low] = await Promise.all([
        ReportService.getSalesOverTime({
          requesting_account_id,
          start_date: dateParams.startISO,
          end_date: dateParams.endISO
        }),
        ReportService.getSalesByStaff({
          requesting_account_id,
          start_date: dateParams.startISO,
          end_date: dateParams.endISO
        }),
        ReportService.getBestSellingProducts({
          requesting_account_id,
          start_date: dateParams.startISO,
          end_date: dateParams.endISO,
          limit: 10
        }),
        ReportService.getLowStockProducts({
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
            <button
              onClick={() => onQuickRange(1)}
              disabled={loading}
              aria-pressed={selectedQuickRange === 1}
              className={`px-3 py-2 text-sm rounded-lg border transition-colors ${selectedQuickRange === 1 ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'} ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              Today
            </button>
            <button
              onClick={() => onQuickRange(7)}
              disabled={loading}
              aria-pressed={selectedQuickRange === 7}
              className={`px-3 py-2 text-sm rounded-lg border transition-colors ${selectedQuickRange === 7 ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'} ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              7d
            </button>
            <button
              onClick={() => onQuickRange(30)}
              disabled={loading}
              aria-pressed={selectedQuickRange === 30}
              className={`px-3 py-2 text-sm rounded-lg border transition-colors ${selectedQuickRange === 30 ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'} ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              30d
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white border rounded-lg p-4">
            <div className="text-xs text-gray-600">Total Revenue</div>
            <div className="mt-1 text-2xl font-semibold tabular-nums">{formatCurrency(kpis.totalRevenue)}</div>
            <div className="mt-2 text-xs text-gray-500">Sum for the selected range</div>
          </div>
          <div className="bg-white border rounded-lg p-4">
            <div className="text-xs text-gray-600">Total Orders</div>
            <div className="mt-1 text-2xl font-semibold tabular-nums">{kpis.totalOrders.toLocaleString()}</div>
            <div className="mt-2 text-xs text-gray-500">Across selected date range</div>
          </div>
          <div className="bg-white border rounded-lg p-4">
            <div className="text-xs text-gray-600">Avg. Order Value</div>
            <div className="mt-1 text-2xl font-semibold tabular-nums">{formatCurrency(kpis.avgOrderValue)}</div>
            {salesOverTime.length > 1 && (
              <svg viewBox="0 0 100 100" className="mt-2 h-10 w-full text-blue-600">
                <polyline fill="none" stroke="currentColor" strokeWidth="2" points={sparkPoints} />
              </svg>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-600">Start date</label>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} disabled={loading} className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none disabled:bg-gray-50 disabled:text-gray-500" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-600">End date</label>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} disabled={loading} className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none disabled:bg-gray-50 disabled:text-gray-500" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-600">Low stock threshold</label>
            <input type="number" min={0} value={lowStockThreshold} onChange={e => setLowStockThreshold(parseInt(e.target.value || '0', 10))} disabled={loading} className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none disabled:bg-gray-50 disabled:text-gray-500" />
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
                  <th className="py-2 pr-4 text-right">Orders</th>
                  <th className="py-2 pr-4 text-right">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {salesOverTime.map((r) => (
                  <tr key={r.report_date} className="border-t odd:bg-white even:bg-gray-50 hover:bg-gray-50/80">
                    <td className="py-2 pr-4">{r.report_date}</td>
                    <td className="py-2 pr-4 text-right tabular-nums">{r.order_count}</td>
                    <td className="py-2 pr-4 text-right tabular-nums">{formatCurrency(r.total_revenue)}</td>
                  </tr>
                ))}
                {salesOverTime.length === 0 && (
                  <tr><td colSpan={3} className="py-4 text-gray-500">No data for selected range.</td></tr>
                )}
              </tbody>
              {salesOverTime.length > 0 && (
                <tfoot className="border-t">
                  <tr>
                    <td className="py-2 pr-4 font-medium text-gray-700">Total</td>
                    <td className="py-2 pr-4 text-right tabular-nums">{kpis.totalOrders.toLocaleString()}</td>
                    <td className="py-2 pr-4 text-right tabular-nums">{formatCurrency(kpis.totalRevenue)}</td>
                  </tr>
                </tfoot>
              )}
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
                  <th className="py-2 pr-4 text-right">Orders</th>
                  <th className="py-2 pr-4 text-right">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {salesByStaff.map((r) => (
                  <tr key={r.account_id} className="border-t odd:bg-white even:bg-gray-50 hover:bg-gray-50/80">
                    <td className="py-2 pr-4">{r.account_name || `#${r.account_id}`}</td>
                    <td className="py-2 pr-4 text-right tabular-nums">{r.order_count}</td>
                    <td className="py-2 pr-4 text-right tabular-nums">
                      <div className="flex flex-col items-end gap-1">
                        <div>{formatCurrency(r.total_revenue)}</div>
                        {maxStaffRevenue > 0 && (
                          <div className="w-40 h-1.5 bg-gray-200 rounded overflow-hidden">
                            <div className="h-full bg-blue-500" style={{ width: `${Math.round(((Number(r.total_revenue) || 0) / maxStaffRevenue) * 100)}%` }} />
                          </div>
                        )}
                      </div>
                    </td>
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
                  <th className="py-2 pr-4">Unit</th>
                  <th className="py-2 pr-4 text-right">Units Sold</th>
                  <th className="py-2 pr-4 text-right">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {bestSellers.map((r) => (
                  <tr key={r.product_id} className="border-t odd:bg-white even:bg-gray-50 hover:bg-gray-50/80">
                    <td className="py-2 pr-4">{r.product_name}</td>
                    <td className="py-2 pr-4 text-gray-500">{r.unit_type}</td>
                    <td className="py-2 pr-4 text-right tabular-nums">
                      <div className="flex items-center gap-2 justify-end">
                        <div className="w-32 h-1.5 bg-gray-200 rounded overflow-hidden">
                          <div className="h-full bg-emerald-500" style={{ width: `${maxUnitsSold > 0 ? Math.round((r.total_units_sold / maxUnitsSold) * 100) : 0}%` }} />
                        </div>
                        <span>{r.total_units_sold}</span>
                      </div>
                    </td>
                    <td className="py-2 pr-4 text-right tabular-nums">{formatCurrency(r.total_revenue)}</td>
                  </tr>
                ))}
                {bestSellers.length === 0 && (
                  <tr><td colSpan={4} className="py-4 text-gray-500">No data for selected range.</td></tr>
                )}
              </tbody>
              {bestSellers.length > 0 && (
                <tfoot className="border-t">
                  <tr>
                    <td colSpan={2} className="py-2 pr-4 font-medium text-gray-700">Total</td>
                    <td className="py-2 pr-4 text-right tabular-nums">{bestSellers.reduce((s, r) => s + (r.total_units_sold || 0), 0).toLocaleString()}</td>
                    <td className="py-2 pr-4 text-right tabular-nums">{formatCurrency(bestSellers.reduce((s, r) => s + (Number(r.total_revenue) || 0), 0))}</td>
                  </tr>
                </tfoot>
              )}
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
                  <th className="py-2 pr-4">Unit</th>
                  <th className="py-2 pr-4">Stock</th>
                </tr>
              </thead>
              <tbody>
                {lowStock.map((r) => (
                  <tr key={r.product_id} className="border-t">
                    <td className="py-2 pr-4">{r.product_name}</td>
                    <td className="py-2 pr-4">{r.sku || '-'}</td>
                    <td className="py-2 pr-4 text-gray-500">{r.unit_type}</td>
                    <td className="py-2 pr-4 font-medium text-orange-600">{r.current_stock}</td>
                  </tr>
                ))}
                {lowStock.length === 0 && (
                  <tr><td colSpan={4} className="py-4 text-gray-500">No low stock items.</td></tr>
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
