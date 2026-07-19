import React, { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { DollarSign, ShoppingCart, CreditCard, AlertCircle, Calendar } from 'lucide-react'
import LoadingSpinner from '../components/LoadingSpinner'
import { dashboardService } from '../services/dashboardService'
import { DashboardData } from '../types/dashboard'

const formatCurrency = (value: string | number) => {
  const num = typeof value === 'string' ? Number(value) : value
  if (isNaN(num)) return '-'
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'PHP' }).format(num)
}

const formatDateTime = (iso: string) => {
  const d = new Date(iso)
  if (isNaN(d.getTime())) return '-'
  return `${d.toLocaleDateString()} ${d.toLocaleTimeString()}`
}

/** Returns the local date in YYYY-MM-DD format (no UTC shift). */
const localDateString = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

const Dashboard: React.FC = () => {
  const { user, persona, loading: authLoading } = useAuth()

  const todayStr = localDateString(new Date())
  const [selectedDate, setSelectedDate] = useState<string>(todayStr)
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const topLimit = 5
  const recentLimit = 5

  useEffect(() => {
    let mounted = true
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const d = await dashboardService.getDashboardData(topLimit, recentLimit, selectedDate)
        if (mounted) setData(d)
      } catch (e: any) {
        if (mounted) setError(e?.message || 'Failed to load dashboard data')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    if (user) load()
    return () => { mounted = false }
  }, [user, selectedDate])

  const kpi = useMemo(() => data?.kpi || {
    net_sales_today: 0,
    order_count_today: 0,
    total_collections_today: 0,
    total_outstanding_debt: 0,
  }, [data])

  const isToday = selectedDate === todayStr

  if (authLoading) {
    return <LoadingSpinner />
  }

  const kpiCards = [
    {
      label: isToday ? "Today's Net Sales" : 'Net Sales',
      value: formatCurrency(kpi.net_sales_today),
      icon: <DollarSign className="h-6 w-6 text-blue-600" />,
      bg: 'bg-blue-100',
    },
    {
      label: isToday ? "Today's Orders" : 'Orders',
      value: kpi.order_count_today,
      icon: <ShoppingCart className="h-6 w-6 text-green-600" />,
      bg: 'bg-green-100',
    },
    {
      label: isToday ? "Today's Collections" : 'Collections',
      value: formatCurrency(kpi.total_collections_today),
      icon: <CreditCard className="h-6 w-6 text-purple-600" />,
      bg: 'bg-purple-100',
    },
    {
      label: 'Outstanding Debt',
      value: formatCurrency(kpi.total_outstanding_debt),
      icon: <AlertCircle className="h-6 w-6 text-red-600" />,
      bg: 'bg-red-100',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Welcome + Date Picker */}
      <div className="bg-white overflow-hidden shadow-sm rounded-lg">
        <div className="px-6 py-8 sm:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Welcome back, {user?.email?.split('@')[0]}
                {persona && (
                  <span className="text-lg font-normal text-gray-600 ml-2">
                    ({persona.type === 'admin' ? 'Administrator' : 'Staff Member'})
                  </span>
                )}
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                {persona?.type === 'admin'
                  ? "Here's your administrative dashboard overview."
                  : "Here's your staff dashboard overview."}
              </p>
            </div>

            {/* Date Selector */}
            <div className="flex items-center gap-2 shrink-0">
              <Calendar className="h-4 w-4 text-gray-400" />
              <input
                id="dashboard-date-picker"
                type="date"
                value={selectedDate}
                max={todayStr}
                onChange={(e) => setSelectedDate(e.target.value || todayStr)}
                className="text-sm border border-gray-300 rounded-md px-3 py-1.5 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {!isToday && (
                <button
                  onClick={() => setSelectedDate(todayStr)}
                  className="text-xs text-blue-600 hover:underline whitespace-nowrap"
                >
                  Back to Today
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 px-4 py-3 rounded border border-red-200">
          {error}
        </div>
      )}

      {/* KPI Cards */}
      {loading ? (
        <LoadingSpinner />
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {kpiCards.map(({ label, value, icon, bg }) => (
            <div key={label} className="bg-white overflow-hidden shadow-sm rounded-lg">
              <div className="p-6 flex items-center">
                <div className="flex-shrink-0">
                  <div className={`h-12 w-12 ${bg} rounded-lg flex items-center justify-center`}>
                    {icon}
                  </div>
                </div>
                <div className="ml-4 flex-1 min-w-0">
                  <dt className="text-sm font-medium text-gray-500 truncate">{label}</dt>
                  <dd className="text-2xl font-semibold text-gray-900 truncate">{value}</dd>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Content Areas */}
      {!loading && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Top Products */}
          <div className="bg-white shadow-sm rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">
                {isToday ? 'Top Products Today' : `Top Products — ${selectedDate}`}
              </h3>
              <span className="text-sm text-gray-500">Top {topLimit}</span>
            </div>
            <div className="p-6">
              {data?.top_products?.length ? (
                <ul className="divide-y divide-gray-100">
                  {data.top_products.map((p) => (
                    <li key={p.product_id} className="py-3 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{p.product_name}</p>
                        <p className="text-xs text-gray-500">ID: {p.product_id}</p>
                      </div>
                      <div className="text-sm text-gray-700 font-semibold">{p.units_sold} sold</div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500">No products sold on this date.</p>
              )}
            </div>
          </div>

          {/* Recent Orders */}
          <div className="bg-white shadow-sm rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">
                {isToday ? 'Recent Orders' : `Orders — ${selectedDate}`}
              </h3>
              <span className="text-sm text-gray-500">Latest {recentLimit}</span>
            </div>
            <div className="p-6">
              {data?.recent_orders?.length ? (
                <ul className="divide-y divide-gray-100">
                  {data.recent_orders.map((o) => (
                    <li key={o.order_id} className="py-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {o.invoice_number ? o.invoice_number : `Order #${o.order_id}`}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatDateTime(o.created_at)} • {o.customer_name || 'Guest'}
                          </p>
                        </div>
                        <div className="text-sm font-semibold text-gray-900">{formatCurrency(o.total_amount)}</div>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500">No orders on this date.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Dashboard