import React, { useState, useRef, useEffect } from 'react'
import { X, ArrowRight, CheckCircle2, AlertTriangle, Hash } from 'lucide-react'
import { Product } from '../../types/product'

interface AdjustQuantityDialogProps {
    product: Product
    onClose: () => void
    onConfirm: (adjustment_value: number, notes: string) => Promise<void>
}

const AdjustQuantityDialog: React.FC<AdjustQuantityDialogProps> = ({ product, onClose, onConfirm }) => {
    // State for form inputs
    const [value, setValue] = useState<number | ''>('')
    const [notes, setNotes] = useState<string>('')

    // State for component status (more robust than multiple booleans)
    type Status = 'idle' | 'submitting' | 'success' | 'error'
    const [status, setStatus] = useState<Status>('idle')
    const [error, setError] = useState<string | null>(null)

    // Ref for auto-focusing the input
    const inputRef = useRef<HTMLInputElement>(null)

    // State for managing animations
    const [isClosing, setIsClosing] = useState(false)

    // --- NEW: Calculate the new quantity in real-time ---
    const adjustmentValue = typeof value === 'number' ? value : 0
    const newQuantity = product.quantity + adjustmentValue

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
            await onConfirm(adjustmentValue, notes)
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
                            <span className="font-mono text-gray-800">{product.quantity}</span>
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

                    <div>
                        <label htmlFor="adjustment" className="flex items-center text-sm font-medium text-gray-700 mb-1.5">
                            <Hash className="h-4 w-4 mr-2 text-gray-400" />
                            Adjustment Value
                        </label>
                        <input
                            id="adjustment"
                            ref={inputRef}
                            type="number"
                            value={value}
                            onChange={(e) => setValue(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                            placeholder="e.g., 10 to add, -5 to remove"
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            disabled={status === 'submitting' || status === 'success'}
                        />
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

                    <div className="flex items-center justify-end gap-3 pt-2">
                        <button type="button" onClick={handleClose} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50" disabled={status === 'submitting' || status === 'success'}>
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={status === 'submitting' || status === 'success'}
                            className="px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center"
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