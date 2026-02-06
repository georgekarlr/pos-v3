import React, { useState, useRef, useEffect } from 'react'
import { X, ArrowRight, CheckCircle2, AlertTriangle, Hash, Plus, Minus } from 'lucide-react'
import { Product } from '../../types/product'

interface AdjustQuantityDialogProps {
    product: Product
    onClose: () => void
    onConfirm: (adjustment_value: number, notes: string, expiration_date?: string | null) => Promise<void>
}

const AdjustQuantityDialog: React.FC<AdjustQuantityDialogProps> = ({ product, onClose, onConfirm }) => {
    // State for form inputs
    const [value, setValue] = useState<number | ''>('')
    const [mode, setMode] = useState<'add' | 'deduct'>('add')
    const [notes, setNotes] = useState<string>('')
    const [expirationDate, setExpirationDate] = useState<string>('')

    // State for component status (more robust than multiple booleans)
    type Status = 'idle' | 'submitting' | 'success' | 'error'
    const [status, setStatus] = useState<Status>('idle')
    const [error, setError] = useState<string | null>(null)

    // Ref for auto-focusing the input
    const inputRef = useRef<HTMLInputElement>(null)

    // State for managing animations
    const [isClosing, setIsClosing] = useState(false)

    // --- NEW: Calculate the new quantity in real-time ---
    const adjustmentValue = typeof value === 'number'
        ? (mode === 'add' ? value : -Math.abs(value))
        : 0
    const newQuantity = product.total_stock + adjustmentValue
    const isPerishableDeduction = product.inventory_type === 'perishable' && adjustmentValue < 0

    // --- NEW: Handle closing with animation ---
    const handleClose = () => {
        setIsClosing(true)
        setTimeout(() => onClose(), 200) // Match duration of animation
    }

    // --- NEW: Auto-focus input on mount and add Escape key listener ---
    useEffect(() => {
        inputRef.current?.focus()

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                handleClose()
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (status === 'submitting' || status === 'success') return

        setError(null)
        setStatus('submitting')

        try {
            if (adjustmentValue === 0) {
                throw new Error('Enter a non-zero number to adjust the quantity.')
            }
            await onConfirm(adjustmentValue, notes, expirationDate || null)
            setStatus('success')
            setTimeout(handleClose, 1500) // Show success for 1.5s then close
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to adjust quantity')
            setStatus('error')
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={handleClose}>
            <div
                className={`fixed inset-0 bg-black/50 transition-opacity duration-200 ${isClosing ? 'opacity-0' : 'opacity-100'}`}
            />
            <div
                onClick={(e) => e.stopPropagation()}
                className={`w-full max-w-md bg-white rounded-xl shadow-2xl transition-all duration-200 ${isClosing ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}
            >
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-800">Adjust Stock Quantity</h3>
                    <button onClick={handleClose} className="p-1.5 rounded-full hover:bg-gray-100 text-gray-500">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* --- UI IMPROVEMENT: Status section for success/error --- */}
                {isPerishableDeduction && (
                    <div className="flex items-start gap-3 p-4 mx-6 mt-4 rounded-lg bg-amber-50 text-amber-800 border border-amber-200">
                        <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                        <div className="text-sm">
                            <p className="font-bold mb-1">Deduction Restricted</p>
                            <p>For perishable products, please adjust specific batches directly to maintain accurate expiration records.</p>
                        </div>
                    </div>
                )}
                {status === 'error' && error && (
                    <div className="flex items-center gap-3 p-4 mx-6 mt-4 rounded-lg bg-red-50 text-red-800 border border-red-200">
                        <AlertTriangle className="h-5 w-5 flex-shrink-0" />
                        <span className="text-sm">{error}</span>
                    </div>
                )}
                {status === 'success' && (
                    <div className="flex items-center gap-3 p-4 mx-6 mt-4 rounded-lg bg-green-50 text-green-800 border border-green-200">
                        <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
                        <span className="text-sm font-medium">Quantity updated successfully!</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* --- UI IMPROVEMENT: Visually grouped product info --- */}
                    <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                        <div className="text-sm text-gray-500">Product</div>
                        <div className="text-lg font-bold text-gray-900">{product.name}</div>
                        <div className="mt-2 flex items-center justify-between text-sm">
                            <span className="text-gray-600">Current Stock:</span>
                            <span className="font-mono text-gray-800">{product.total_stock}</span>
                        </div>
                        {/* --- NEW: Real-time calculation display --- */}
                        <div className="mt-1 flex items-center justify-between text-sm font-medium">
                            <span className="text-gray-600">New Stock:</span>
                            <div className="flex items-center gap-2">
                <span className={`font-mono transition-colors ${
                    adjustmentValue > 0 ? 'text-green-600' : adjustmentValue < 0 ? 'text-red-600' : 'text-gray-800'
                }`}>{newQuantity}</span>
                                <ArrowRight className="h-4 w-4 text-gray-400" />
                            </div>
                        </div>
                    </div>

                    {/* Mode Toggle (Segmented Button) - Only for non-perishable */}
                    {product.inventory_type !== 'perishable' && (
                        <div className="flex p-1 bg-gray-100 rounded-xl">
                            <button
                                type="button"
                                onClick={() => setMode('add')}
                                className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold rounded-lg transition-all ${
                                    mode === 'add'
                                        ? 'bg-white text-blue-600 shadow-sm'
                                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
                                }`}
                            >
                                <Plus className="h-4 w-4" />
                                Add Stock
                            </button>
                            <button
                                type="button"
                                onClick={() => setMode('deduct')}
                                className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold rounded-lg transition-all ${
                                    mode === 'deduct'
                                        ? 'bg-white text-red-600 shadow-sm'
                                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
                                }`}
                            >
                                <Minus className="h-4 w-4" />
                                Deduct Stock
                            </button>
                        </div>
                    )}

                    <div>
                        <label htmlFor="adjustment" className="flex items-center text-sm font-medium text-gray-700 mb-1.5">
                            <Hash className="h-4 w-4 mr-2 text-gray-400" />
                            Adjustment Value
                        </label>
                        <input
                            id="adjustment"
                            ref={inputRef}
                            type="number"
                            step="any"
                            value={value}
                            onChange={(e) => {
                                const val = e.target.value === '' ? '' : parseFloat(e.target.value)
                                setValue(val)
                            }}
                            placeholder={mode === 'add' ? "Quantity to add" : "Quantity to deduct"}
                            className={`w-full border rounded-lg px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 ${
                                mode === 'add' ? 'focus:ring-blue-500' : 'focus:ring-red-500'
                            } ${
                                isPerishableDeduction ? 'border-amber-300 bg-amber-50' : 'border-gray-300'
                            }`}
                            disabled={status === 'submitting' || status === 'success'}
                        />
                        {isPerishableDeduction && (
                            <p className="mt-1.5 text-xs text-amber-700 font-medium italic">
                                Manual deduction is only available for non-perishable items.
                            </p>
                        )}
                    </div>

                    <div>
                        <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1.5">Notes (optional)</label>
                        <textarea
                            id="notes"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={3}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Reason for adjustment (e.g., Received shipment, Damaged items)"
                            disabled={status === 'submitting' || status === 'success'}
                        />
                    </div>

                    {adjustmentValue > 0 && product.inventory_type === 'perishable' && (
                        <div>
                            <label htmlFor="expirationDate" className="block text-sm font-medium text-gray-700 mb-1.5">
                                Expiration Date <span className="text-red-500">*</span>
                            </label>
                            <input
                                id="expirationDate"
                                type="date"
                                value={expirationDate}
                                onChange={(e) => setExpirationDate(e.target.value)}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                disabled={status === 'submitting' || status === 'success'}
                                required={adjustmentValue > 0}
                            />
                            <p className="mt-1 text-xs text-gray-500">Required for perishable products when adding stock.</p>
                        </div>
                    )}

                    <div className="flex items-center justify-end gap-3 pt-2">
                        <button type="button" onClick={handleClose} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50" disabled={status === 'submitting' || status === 'success'}>
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={status === 'submitting' || status === 'success' || isPerishableDeduction}
                            className={`px-4 py-2 rounded-lg text-white font-semibold disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center transition-colors ${
                                mode === 'add' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-red-600 hover:bg-red-700'
                            }`}
                        >
                            {status === 'submitting' && 'Saving...'}
                            {status === 'success' && <CheckCircle2 className="h-5 w-5" />}
                            {status !== 'submitting' && status !== 'success' && 'Confirm Adjustment'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default AdjustQuantityDialog