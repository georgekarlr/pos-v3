import React from 'react'
import { CreditCard, Calendar, CheckCircle2, AlertCircle, ShieldAlert, ArrowRight } from 'lucide-react'
import { BusinessSettings } from '../../types/settings'

interface Props {
  settings: BusinessSettings
}

export const SubscriptionStatusCard: React.FC<Props> = ({ settings }) => {
  const billingType = settings.billing_type || 'NON-VAT'
  const status = settings.subscription_status || 'inactive'
  const expiryDate = settings.expiry_date

  const getStatusBadge = () => {
    switch (status.toLowerCase()) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Active
          </span>
        )
      case 'trial':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
            <Calendar className="w-3.5 h-3.5" />
            Trial
          </span>
        )
      case 'expired':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200">
            <ShieldAlert className="w-3.5 h-3.5" />
            Expired
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-800 border border-gray-200">
            <AlertCircle className="w-3.5 h-3.5" />
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
        )
    }
  }

  const formatExpiry = (dateStr?: string) => {
    if (!dateStr) return '—'
    try {
      const date = new Date(dateStr)
      if (isNaN(date.getTime())) return dateStr
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    } catch {
      return dateStr
    }
  }

  return (
    <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center gap-2">
        <h2 className="text-lg font-semibold text-gray-800">Subscription & Billing Status</h2>
        <span className="ml-auto inline-flex items-center gap-1 text-xs text-gray-400 font-medium">
          <CreditCard className="h-3 w-3" />
          Account Tier
        </span>
      </div>
      <div className="p-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="flex flex-col gap-1.5 p-4 rounded-xl border border-gray-100 bg-gray-50/50">
            <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">Subscription Status</span>
            <div className="mt-0.5">{getStatusBadge()}</div>
          </div>

          <div className="flex flex-col gap-1.5 p-4 rounded-xl border border-gray-100 bg-gray-50/50">
            <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">Billing Type</span>
            <span className="text-sm font-semibold text-gray-800 mt-0.5">
              {billingType === 'VAT' ? 'VAT Registered (12%)' : 'Non-VAT'}
            </span>
          </div>

          <div className="flex flex-col gap-1.5 p-4 rounded-xl border border-gray-100 bg-gray-50/50">
            <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">Expiry / Renewal Date</span>
            <span className="text-sm font-semibold text-gray-800 mt-0.5">
              {formatExpiry(expiryDate)}
            </span>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-100">
          {status.toLowerCase() === 'expired' ? (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-100 flex flex-col sm:flex-row items-center justify-between gap-4 animate-pulse-once">
              <div className="flex items-center gap-3 text-rose-800 text-sm">
                <ShieldAlert className="w-5 h-5 flex-shrink-0 text-rose-500" />
                <div>
                  <span className="font-semibold block text-gray-900">Your subscription has expired</span>
                  <span className="text-rose-600 text-xs font-normal">Renew now to reactivate register & back-office functionality.</span>
                </div>
              </div>
              <a
                href="https://ceintelly.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-sm rounded-lg shadow-sm hover:shadow transition-colors"
              >
                Extend Subscription
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-blue-50/30 border border-blue-100/50 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3 text-gray-600 text-sm">
                <CreditCard className="w-5 h-5 flex-shrink-0 text-blue-500" />
                <div>
                  <span className="font-semibold block text-gray-900">Manage or Extend Subscription</span>
                  <span className="text-gray-500 text-xs font-normal">Update billing, change plans, or extend subscription at Ceintelly.</span>
                </div>
              </div>
              <a
                href="https://ceintelly.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-lg shadow-sm hover:shadow transition-colors"
              >
                Extend Subscription
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
