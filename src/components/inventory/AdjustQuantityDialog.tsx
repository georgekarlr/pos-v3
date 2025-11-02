import React, { useState } from 'react'
import { X } from 'lucide-react'
import { Product } from '../../types/product'

interface AdjustQuantityDialogProps {
  product: Product
  onClose: () => void
  onConfirm: (adjustment_value: number, notes: string) => Promise<void>
}

const AdjustQuantityDialog: React.FC<AdjustQuantityDialogProps> = ({ product, onClose, onConfirm }) => {
  const [value, setValue] = useState<number>(0)
  const [notes, setNotes] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)
    try {
      if (!Number.isFinite(value) || value === 0) {
        throw new Error('Enter a non-zero number to adjust the quantity (positive to add, negative to subtract).')
      }
      await onConfirm(value, notes)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to adjust quantity')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50" onClick={onClose}>
      <div className="fixed inset-0 bg-black/40" />
      <div className="absolute inset-0 flex items-center justify-center p-4" onClick={(e) => e.stopPropagation()}>
        <div className="w-full max-w-md bg-white rounded-xl shadow-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Adjust Quantity</h3>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500">
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
            <div>
              <div className="text-sm text-gray-600">Product</div>
              <div className="font-medium text-gray-900">{product.name}</div>
              <div className="text-sm text-gray-500">Current quantity: {product.quantity}</div>
            </div>

            {error && (
              <div className="p-3 rounded-lg border border-red-200 bg-red-50 text-sm text-red-700">{error}</div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Adjustment value</label>
              <input
                type="number"
                value={value}
                onChange={(e) => setValue(parseInt(e.target.value || '0', 10))}
                placeholder="e.g., 10 to add, -5 to remove"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Reason for adjustment (e.g., Received shipment, Damaged items)"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 bg-white hover:bg-gray-50">
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {isSubmitting ? 'Saving...' : 'Confirm Adjustment'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default AdjustQuantityDialog
