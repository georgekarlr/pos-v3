import React, { useState, useEffect } from 'react'
// NEW: Importing icons for a better UI
import { XMarkIcon, PlusIcon, MinusIcon } from '@heroicons/react/24/solid'

interface BundleModalProps {
    open: boolean
    initialQuantity?: number
    // NEW: More props for reusability
    title?: string
    description?: string
    confirmText?: string
    onConfirm: (quantity: number) => void
    onClose: () => void
}

const BundleModal: React.FC<BundleModalProps> = ({
                                                     open,
                                                     initialQuantity = 1,
                                                     title = "Bundle Quantity", // Default title
                                                     description = "Enter how many to add to the order.", // Default description
                                                     confirmText = "Add", // Default confirm button text
                                                     onConfirm,
                                                     onClose,
                                                 }) => {
    const [qty, setQty] = useState<number>(initialQuantity)
    // NEW: State to control the visibility for animations
    const [show, setShow] = useState(false)

    // This effect handles the open/close animations
    useEffect(() => {
        if (open) {
            setQty(initialQuantity)
            // Use a tiny timeout to allow the component to mount before starting the transition
            setTimeout(() => setShow(true), 10)
        } else {
            setShow(false)
        }
    }, [open, initialQuantity])

    // NEW: This effect handles closing the modal with the Escape key
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose()
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [onClose])


    // We render null only after the closing animation is potentially complete
    if (!open) return null

    const handleIncrement = () => setQty((prevQty) => prevQty + 1)
    const handleDecrement = () => setQty((prevQty) => Math.max(1, prevQty - 1))

    return (
        // The `role` and `aria-modal` attributes are for accessibility
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
        >
            {/* Backdrop with transition */}
            <div
                className={`absolute inset-0 bg-gray-900/60 transition-opacity duration-300 ${
                    show ? 'opacity-100' : 'opacity-0'
                }`}
                onClick={onClose}
            />

            {/* Modal with transition */}
            <div
                className={`relative bg-white rounded-lg shadow-xl w-full max-w-sm transition-all duration-300 ${
                    show ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
                }`}
            >
                {/* NEW: Dedicated close button in the corner */}
                <button
                    onClick={onClose}
                    className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
                    aria-label="Close"
                >
                    <XMarkIcon className="h-6 w-6" />
                </button>

                <div className="p-6">
                    <h3 id="modal-title" className="text-lg font-semibold text-gray-900">
                        {title}
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">{description}</p>

                    {/* NEW: Improved quantity selector */}
                    <div className="mt-5 flex items-center justify-center gap-4">
                        <button
                            onClick={handleDecrement}
                            className="p-2 rounded-full text-gray-500 bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
                            disabled={qty <= 1}
                            aria-label="Decrease quantity"
                        >
                            <MinusIcon className="h-5 w-5" />
                        </button>
                        <input
                            type="text" // Using text to have more control over styling
                            value={qty}
                            onChange={(e) => {
                                const value = parseInt(e.target.value, 10)
                                setQty(isNaN(value) || value < 1 ? 1 : value)
                            }}
                            className="w-20 rounded-md border-gray-300 text-center text-lg font-medium shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            aria-live="polite" // Announces changes to screen readers
                        />
                        <button
                            onClick={handleIncrement}
                            className="p-2 rounded-full text-gray-500 bg-gray-100 hover:bg-gray-200"
                            aria-label="Increase quantity"
                        >
                            <PlusIcon className="h-5 w-5" />
                        </button>
                    </div>

                    <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end sm:gap-3">
                        <button
                            onClick={onClose}
                            className="mt-3 sm:mt-0 w-full sm:w-auto px-4 py-2 rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={() => { onConfirm(qty); onClose() }}
                            className="w-full sm:w-auto px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            {confirmText}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default BundleModal