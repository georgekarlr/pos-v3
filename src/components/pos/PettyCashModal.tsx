import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { X, ArrowUpRight, ArrowDownLeft, CheckCircle2, AlertCircle } from 'lucide-react'
import { PosService } from '../../services/posService'

interface PettyCashModalProps {
  open: boolean
  onClose: () => void
  terminalId: number
  accountId: number
  onSuccess?: (message: string) => void
}

const CASH_IN_SUGGESTIONS = [
  'Starting Drawer Float',
  'Mid-day Float Refill',
  'Cash Float Top-up',
  'Customer Change Refill'
]

const CASH_OUT_SUGGESTIONS = [
  'Paid Water Delivery',
  'Office Supplies',
  'Snacks / Staff Meals',
  'Courier / Shipping Fee',
  'Vendor Cash Payment',
  'Refund Cash Drop'
]

const PettyCashModal: React.FC<PettyCashModalProps> = ({
  open,
  onClose,
  terminalId,
  accountId,
  onSuccess
}) => {
  const [show, setShow] = useState(false)
  const [actionType, setActionType] = useState<'CASH_IN' | 'CASH_OUT'>('CASH_IN')
  const [amount, setAmount] = useState('')
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')

  useEffect(() => {
    if (open) {
      setTimeout(() => setShow(true), 10)
      // Reset form on open
      setActionType('CASH_IN')
      setAmount('')
      setReason('')
      setLoading(false)
      setError(null)
      setSuccess(false)
      setSuccessMsg('')
    } else {
      setShow(false)
    }
  }, [open])

  if (!open) return null

  const isOnline = navigator.onLine

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isOnline) {
      setError('Internet connection is required to record petty cash.')
      return
    }

    const numAmount = parseFloat(amount)
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid amount greater than zero.')
      return
    }

    if (!reason.trim()) {
      setError('Please provide a reason or description.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await PosService.managePettyCash({
        p_requesting_account_id: accountId,
        p_terminal_id: terminalId,
        p_action_type: actionType,
        p_amount: numAmount,
        p_reason: reason.trim()
      })

      if (response.error || !response.data) {
        setError(response.error || 'Failed to complete petty cash operation.')
      } else {
        setSuccess(true)
        setSuccessMsg(response.data.message)
        if (onSuccess) {
          onSuccess(response.data.message)
        }
        // Auto-close after 2 seconds
        setTimeout(() => {
          onClose()
        }, 2000)
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.')
    } finally {
      setLoading(false)
    }
  }

  const handleSuggestionClick = (text: string) => {
    setReason(text)
  }

  const suggestions = actionType === 'CASH_IN' ? CASH_IN_SUGGESTIONS : CASH_OUT_SUGGESTIONS

  const modal = (
    <div className="fixed inset-0 z-[1000] flex items-end sm:items-center justify-center p-0 sm:p-4" role="dialog" aria-modal="true">
      <div
        className={`absolute inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity duration-300 ${show ? 'opacity-100' : 'opacity-0'}`}
        onClick={loading || success ? undefined : onClose}
      />

      <div className={`relative bg-white w-full sm:w-auto sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-2xl transition-all duration-300 overflow-hidden ${show ? 'opacity-100 translate-y-0 sm:scale-100' : 'opacity-0 translate-y-8 sm:scale-95'}`}>

        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Petty Cash &amp; Drawer Float</h3>
            <p className="text-xs text-gray-500 mt-0.5">Terminal #{terminalId}</p>
          </div>
          {!loading && !success && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-6">
          {success ? (
            <div className="py-8 flex flex-col items-center justify-center text-center">
              <CheckCircle2 className="h-16 w-16 text-emerald-500 mb-4 animate-bounce" />
              <h4 className="text-xl font-bold text-gray-900">Operation Successful</h4>
              <p className="text-sm text-gray-600 mt-2 max-w-xs">{successMsg}</p>
              <p className="text-xs text-gray-400 mt-6 animate-pulse">Closing window...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {!isOnline && (
                <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-lg p-3 flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <span>
                    <strong>Offline:</strong> Petty cash management requires an active internet connection to authenticate and record logs safely.
                  </span>
                </div>
              )}

              {error && (
                <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg p-3 flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-rose-600 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Action Tabs */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Transaction Type
                </label>
                <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 rounded-xl">
                  <button
                    type="button"
                    onClick={() => {
                      setActionType('CASH_IN')
                      setError(null)
                    }}
                    className={`flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-semibold transition-all ${actionType === 'CASH_IN'
                        ? 'bg-white text-emerald-700 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                      }`}
                  >
                    <ArrowDownLeft className={`h-4 w-4 ${actionType === 'CASH_IN' ? 'text-emerald-500' : 'text-gray-400'}`} />
                    Cash In (Float)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActionType('CASH_OUT')
                      setError(null)
                    }}
                    className={`flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-semibold transition-all ${actionType === 'CASH_OUT'
                        ? 'bg-white text-rose-700 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                      }`}
                  >
                    <ArrowUpRight className={`h-4 w-4 ${actionType === 'CASH_OUT' ? 'text-rose-500' : 'text-gray-400'}`} />
                    Cash Out (Expense)
                  </button>
                </div>
              </div>

              {/* Dynamic Alert Banner based on selection */}
              <div className={`p-3 rounded-lg border text-xs flex items-center justify-between ${actionType === 'CASH_IN'
                  ? 'bg-emerald-50/50 border-emerald-100 text-emerald-800'
                  : 'bg-rose-50/50 border-rose-100 text-rose-800'
                }`}>
                <span>
                  {actionType === 'CASH_IN'
                    ? 'Adds starting float or additional capital to the drawer.'
                    : 'Records cash pulled from the drawer for store expenses.'}
                </span>
                <span className="font-bold font-mono">
                  {actionType === 'CASH_IN' ? '+' : '-'}
                </span>
              </div>

              {/* Amount */}
              <div>
                <label htmlFor="petty-cash-amount" className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                  Amount (PHP)
                </label>
                <div className="relative rounded-lg shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-400 text-sm font-semibold">₱</span>
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    id="petty-cash-amount"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    disabled={loading}
                    required
                    className={`block w-full pl-7 pr-3 py-2.5 sm:text-sm border rounded-lg focus:outline-none focus:ring-2 ${actionType === 'CASH_IN'
                        ? 'border-gray-300 focus:ring-emerald-500 focus:border-emerald-500'
                        : 'border-gray-300 focus:ring-rose-500 focus:border-rose-500'
                      }`}
                  />
                </div>
              </div>

              {/* Reason */}
              <div>
                <label htmlFor="petty-cash-reason" className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                  Reason / Description
                </label>
                <textarea
                  id="petty-cash-reason"
                  rows={2}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder={actionType === 'CASH_IN' ? 'e.g., Starting Drawer Float' : 'e.g., Paid water delivery guy'}
                  disabled={loading}
                  required
                  className={`block w-full px-3 py-2 sm:text-sm border rounded-lg focus:outline-none focus:ring-2 border-gray-300 ${actionType === 'CASH_IN'
                      ? 'focus:ring-emerald-500 focus:border-emerald-500'
                      : 'focus:ring-rose-500 focus:border-rose-500'
                    }`}
                />
              </div>

              {/* Suggestions */}
              <div>
                <span className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Suggestions
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {suggestions.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => handleSuggestionClick(item)}
                      disabled={loading}
                      className={`text-xs px-2.5 py-1 rounded-full border transition-all ${reason === item
                          ? actionType === 'CASH_IN'
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-800 font-medium'
                            : 'bg-rose-50 border-rose-300 text-rose-800 font-medium'
                          : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                        }`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center gap-3 pt-3">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  className="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !isOnline}
                  className={`flex-1 py-2.5 text-sm font-semibold text-white rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50 ${actionType === 'CASH_IN'
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : 'bg-rose-600 hover:bg-rose-700'
                    }`}
                >
                  {loading ? (
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : actionType === 'CASH_IN' ? (
                    'Record Cash In'
                  ) : (
                    'Record Cash Out'
                  )}
                </button>
              </div>
            </form>
          )}
        </div>

      </div>
    </div>
  )

  return createPortal(modal, document.body)
}

export default PettyCashModal
