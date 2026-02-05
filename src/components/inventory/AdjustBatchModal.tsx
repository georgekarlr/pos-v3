import React, { useState, useRef, useEffect } from 'react'
import { X, CheckCircle2, AlertTriangle, Hash, ClipboardList } from 'lucide-react'
import { Product } from '../../types/product'

interface AdjustBatchModalProps {
    product: Product
    batchId: number
    currentQuantity: number
    onClose: () => void
    onConfirm: (newQuantity: number, reason: string) => Promise<void>
}

const AdjustBatchModal: React.FC<AdjustBatchModalProps> = ({ product, batchId, currentQuantity, onClose, onConfirm }) => {
    const batch = product.stock_batches?.find(b => b.batch_id === batchId)
    const [newQuantity, setNewQuantity] = useState<number | ''>(currentQuantity)
    const [reason, setReason] = useState<string>('Stock Correction')
    const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
    const [error, setError] = useState<string | null>(null)
    const [isClosing, setIsClosing] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null)

    const handleClose = () => {
        setIsClosing(true)
        setTimeout(() => onClose(), 200)
    }

    useEffect(() => {
        inputRef.current?.focus()
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') handleClose()
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (status === 'submitting' || status === 'success') return

        if (newQuantity === '' || newQuantity < 0) {
            setError('Please enter a valid non-negative quantity.')
            setStatus('error')
            return
        }

        setError(null)
        setStatus('submitting')

        try {
            await onConfirm(newQuantity, reason)
            setStatus('success')
            setTimeout(handleClose, 1500)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to adjust batch')
            setStatus('error')
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={handleClose}>
            <div className={`fixed inset-0 bg-black/50 transition-opacity duration-200 ${isClosing ? 'opacity-0' : 'opacity-100'}`} />
            <div
                onClick={(e) => e.stopPropagation()}
                className={`w-full max-w-md bg-white rounded-xl shadow-2xl transition-all duration-200 ${isClosing ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}
            >
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-800">Adjust Batch Quantity</h3>
                        <p className="text-xs text-gray-500">Batch ID: #{batchId}</p>
                    </div>
                    <button onClick={handleClose} className="p-1.5 rounded-full hover:bg-gray-100 text-gray-500">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {status === 'error' && error && (
                    <div className="flex items-center gap-3 p-4 mx-6 mt-4 rounded-lg bg-red-50 text-red-800 border border-red-200">
                        <AlertTriangle className="h-5 w-5 flex-shrink-0" />
                        <span className="text-sm">{error}</span>
                    </div>
                )}
                {status === 'success' && (
                    <div className="flex items-center gap-3 p-4 mx-6 mt-4 rounded-lg bg-green-50 text-green-800 border border-green-200">
                        <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
                        <span className="text-sm font-medium">Batch updated successfully!</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg">
                        <div className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">Product</div>
                        <div className="text-base font-bold text-gray-900 mb-3">{product.name}</div>
                        
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-600">Current Batch Stock:</span>
                                <span className="font-mono font-bold text-gray-900">{currentQuantity}</span>
                            </div>
                            {batch?.expiration_date && (
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600">Expiration Date:</span>
                                    <span className="text-sm font-bold text-gray-900 bg-white px-2 py-1 rounded border border-blue-100 shadow-sm">
                                        {new Date(batch.expiration_date).toLocaleDateString()}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div>
                        <label htmlFor="newQuantity" className="flex items-center text-sm font-medium text-gray-700 mb-1.5">
                            <Hash className="h-4 w-4 mr-2 text-gray-400" />
                            New Absolute Quantity
                        </label>
                        <input
                            id="newQuantity"
                            ref={inputRef}
                            type="number"
                            step="any"
                            value={newQuantity}
                            onChange={(e) => setNewQuantity(e.target.value === '' ? '' : parseFloat(e.target.value))}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter new total quantity for this batch"
                            disabled={status === 'submitting' || status === 'success'}
                            required
                        />
                    </div>

                    <div>
                        <label htmlFor="reason" className="flex items-center text-sm font-medium text-gray-700 mb-1.5">
                            <ClipboardList className="h-4 w-4 mr-2 text-gray-400" />
                            Reason for Adjustment
                        </label>
                        <input
                            id="reason"
                            type="text"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="e.g., Stock count correction, Damaged"
                            disabled={status === 'submitting' || status === 'success'}
                            required
                        />
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                            disabled={status === 'submitting' || status === 'success'}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={status === 'submitting' || status === 'success' || (newQuantity === currentQuantity && reason === 'Stock Correction')}
                            className="px-6 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {status === 'submitting' ? 'Updating...' : 'Update Batch'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default AdjustBatchModal
