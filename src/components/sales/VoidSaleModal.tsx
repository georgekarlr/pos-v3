import React, { useState } from 'react'
import { X, Loader2, AlertTriangle } from 'lucide-react'
import { salesService } from '../../services/salesService'

interface VoidSaleModalProps {
  open: boolean
  orderId: number | null
  /** Invoice number for display purposes */
  invoiceNumber?: string | null
  requestingAccountId: number | null
  onClose: () => void
  onSuccess: () => void
}

const VoidSaleModal: React.FC<VoidSaleModalProps> = ({
  open,
  orderId,
  invoiceNumber,
  requestingAccountId,
  onClose,
  onSuccess,
}) => {
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleClose = () => {
    if (submitting) return
    setReason('')
    setError(null)
    onClose()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!orderId || !requestingAccountId) return
    if (!reason.trim()) {
      setError('A void reason is required.')
      return
    }

    setSubmitting(true)
    setError(null)
    try {
      const result = await salesService.voidSale({
        requesting_account_id: requestingAccountId,
        order_id: orderId,
        reason: reason.trim(),
      })

      if (!result.success) {
        setError(result.message || 'Failed to void transaction.')
        return
      }

      onSuccess()
      handleClose()
    } catch (e: any) {
      setError(e?.message || 'An unexpected error occurred.')
    } finally {
      setSubmitting(false)
    }
  }

  if (!open) return null

  const label = invoiceNumber ? `Invoice ${invoiceNumber}` : orderId ? `Order #${orderId}` : ''

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" onClick={handleClose}>
      <div className="flex items-end sm:items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Overlay */}
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-700 opacity-60" />
        </div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">
          &#8203;
        </span>

        {/* Dialog */}
        <div
          className="inline-block align-bottom bg-white rounded-t-lg sm:rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle w-full max-w-md"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-5 py-4 border-b flex items-center justify-between bg-orange-50">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600 flex-shrink-0" />
              <h3 className="text-base font-semibold text-gray-900">
                Void Transaction
              </h3>
            </div>
            <button
              onClick={handleClose}
              disabled={submitting}
              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-40"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Body */}
          <form onSubmit={handleSubmit}>
            <div className="px-5 py-5 space-y-4">
              {/* Warning banner */}
              <div className="flex gap-3 p-3 rounded-lg bg-orange-50 border border-orange-200">
                <AlertTriangle className="h-4 w-4 text-orange-500 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-orange-800">
                  <p className="font-medium">This action cannot be undone.</p>
                  <p className="mt-0.5 text-orange-700">
                    Voiding <span className="font-semibold">{label}</span> will reverse
                    its total from the terminal, mark all payments as voided, and
                    automatically restock all items.
                  </p>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="p-3 rounded-lg border border-red-200 bg-red-50 text-sm text-red-700">
                  {error}
                </div>
              )}

              {/* Reason */}
              <div>
                <label
                  htmlFor="void-reason"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Void Reason <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="void-reason"
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Duplicate transaction, customer cancelled order…"
                  disabled={submitting}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-400 disabled:bg-gray-50"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="px-5 py-4 border-t bg-gray-50 flex flex-col-reverse sm:flex-row gap-3 sm:justify-end">
              <button
                type="button"
                onClick={handleClose}
                disabled={submitting}
                className="w-full sm:w-auto px-4 py-2 rounded-lg border border-gray-300 bg-white text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-40"
              >
                Cancel
              </button>
              <button
                id="void-sale-submit"
                type="submit"
                disabled={submitting || !reason.trim()}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-orange-600 text-white text-sm font-medium hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Voiding…
                  </>
                ) : (
                  'Void Transaction'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default VoidSaleModal
