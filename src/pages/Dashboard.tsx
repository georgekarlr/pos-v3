import React, { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { TrendingUp, DollarSign, ShoppingCart } from 'lucide-react'
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

const Dashboard: React.FC = () => {
  const { user, persona, loading: authLoading } = useAuth()

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
        const d = await dashboardService.getDashboardData(topLimit, recentLimit)
        if (mounted) setData(d)
      } catch (e: any) {
        if (mounted) setError(e?.message || 'Failed to load dashboard data')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    if (user) load()
    return () => { mounted = false }
  }, [user])

  const kpi = useMemo(() => data?.kpi || { today_revenue: 0, today_orders: 0, today_avg_sale: 0 }, [data])

  if (authLoading || loading) {
    return <LoadingSpinner />
  }

  return (
    <div className="space-y-6">
      {/* Welcome Message */}
      <div className="bg-white overflow-hidden shadow-sm rounded-lg">
        <div className="px-6 py-8 sm:px-8">
          <div className="flex items-center">
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
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 px-4 py-3 rounded border border-red-200">
          {error}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <div className="bg-white overflow-hidden shadow-sm rounded-lg">
          <div className="p-6 flex items-center">
            <div className="flex-shrink-0">
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div className="ml-4 flex-1">
              <dt className="text-sm font-medium text-gray-500">Today's Revenue</dt>
              <dd className="text-2xl font-semibold text-gray-900">{formatCurrency(kpi.today_revenue)}</dd>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow-sm rounded-lg">
          <div className="p-6 flex items-center">
            <div className="flex-shrink-0">
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                <ShoppingCart className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <div className="ml-4 flex-1">
              <dt className="text-sm font-medium text-gray-500">Today's Orders</dt>
              <dd className="text-2xl font-semibold text-gray-900">{kpi.today_orders}</dd>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow-sm rounded-lg">
          <div className="p-6 flex items-center">
            <div className="flex-shrink-0">
              <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <div className="ml-4 flex-1">
              <dt className="text-sm font-medium text-gray-500">Average Sale</dt>
              <dd className="text-2xl font-semibold text-gray-900">{formatCurrency(kpi.today_avg_sale)}</dd>
            </div>
          </div>
        </div>
      </div>

      {/* Content Areas */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Top Products */}
        <div className="bg-white shadow-sm rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">Top Products Today</h3>
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
              <p className="text-sm text-gray-500">No products sold yet today.</p>
            )}
          </div>
        </div>

        {/* Recent Orders */}
        <div className="bg-white shadow-sm rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">Recent Orders</h3>
            <span className="text-sm text-gray-500">Latest {recentLimit}</span>
          </div>
          <div className="p-6">
            {data?.recent_orders?.length ? (
              <ul className="divide-y divide-gray-100">
                {data.recent_orders.map((o) => (
                  <li key={o.order_id} className="py-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">Order #{o.order_id}</p>
                        <p className="text-xs text-gray-500">{formatDateTime(o.created_at)} • {o.customer_name || 'Guest'}</p>
                      </div>
                      <div className="text-sm font-semibold text-gray-900">{formatCurrency(o.total_amount)}</div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500">No recent orders.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard