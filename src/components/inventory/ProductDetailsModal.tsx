import React, { useState, useEffect } from 'react'
import { X, Package, Calendar, Clock, AlertCircle, Info, Tag, Barcode, Database, Banknote, History } from 'lucide-react'
import { Product } from '../../types/product'

interface ProductDetailsModalProps {
    product: Product
    onClose: () => void
}

const ProductDetailsModal: React.FC<ProductDetailsModalProps> = ({ product, onClose }) => {
    const [isClosing, setIsClosing] = useState(false)

    const handleClose = () => {
        setIsClosing(true)
        setTimeout(() => onClose(), 200)
    }

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') handleClose()
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [])

    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat('en-US', { style: 'currency', currency: 'PHP' }).format(amount)

    const formatDate = (dateStr: string) => 
        new Date(dateStr).toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        })

    const getDaysToExpire = (dateStr: string) => {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const expDate = new Date(dateStr)
        expDate.setHours(0, 0, 0, 0)
        const diffTime = expDate.getTime() - today.getTime()
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        return diffDays
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6" onClick={handleClose}>
            <div className={`fixed inset-0 bg-black/60 transition-opacity duration-200 ${isClosing ? 'opacity-0' : 'opacity-100'}`} />
            <div
                onClick={(e) => e.stopPropagation()}
                className={`w-full max-w-3xl bg-white rounded-2xl shadow-2xl transition-all duration-200 overflow-hidden flex flex-col max-h-[90vh] ${isClosing ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                            <Info className="h-6 w-6" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-gray-900">Product Details</h3>
                            <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">ID: #{product.id}</p>
                        </div>
                    </div>
                    <button onClick={handleClose} className="p-2 rounded-full hover:bg-gray-200 text-gray-500 transition-colors">
                        <X className="h-6 w-6" />
                    </button>
                </div>

                <div className="flex-grow overflow-y-auto p-6 custom-scrollbar">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Basic Info Section */}
                        <div className="space-y-6">
                            <div>
                                <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <Tag className="h-4 w-4" />
                                    General Information
                                </h4>
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-xs text-gray-500 block mb-1">Product Name</label>
                                        <p className="text-lg font-bold text-gray-900">{product.name}</p>
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-500 block mb-1">Description</label>
                                        <p className="text-sm text-gray-700 leading-relaxed">{product.description || 'No description provided.'}</p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs text-gray-500 block mb-1">SKU</label>
                                            <div className="flex items-center gap-1.5 text-sm font-mono text-gray-900 bg-gray-100 px-2 py-1 rounded">
                                                <Database className="h-3.5 w-3.5 text-gray-400" />
                                                {product.sku || 'N/A'}
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-xs text-gray-500 block mb-1">Barcode</label>
                                            <div className="flex items-center gap-1.5 text-sm font-mono text-gray-900 bg-gray-100 px-2 py-1 rounded">
                                                <Barcode className="h-3.5 w-3.5 text-gray-400" />
                                                {product.barcode || 'N/A'}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <Banknote className="h-4 w-4" />
                                    Pricing & Tax
                                </h4>
                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <label className="text-xs text-gray-500 block mb-1">Base Price</label>
                                        <p className="text-sm font-bold text-gray-900">{formatCurrency(product.base_price)}</p>
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-500 block mb-1">Tax Rate</label>
                                        <p className="text-sm font-bold text-gray-900">{product.tax_rate}%</p>
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-500 block mb-1">Selling Price</label>
                                        <p className="text-base font-extrabold text-blue-600">{formatCurrency(product.display_price)}</p>
                                    </div>
                                </div>
                            </div>
                            
                            <div>
                                <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <Info className="h-4 w-4" />
                                    Inventory Settings
                                </h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs text-gray-500 block mb-1">Inventory Type</label>
                                        <span className={`inline-flex px-2 py-1 rounded-md text-[10px] font-bold uppercase ${
                                            product.inventory_type === 'perishable' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'
                                        }`}>
                                            {product.inventory_type.replace('_', '-')}
                                        </span>
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-500 block mb-1">Unit Type</label>
                                        <p className="text-sm font-medium text-gray-900 capitalize">{product.unit_type || product.selling_method}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Inventory Section */}
                        <div className="space-y-6">
                            <div>
                                <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <Package className="h-4 w-4" />
                                    Current Stock
                                </h4>
                                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                                    <div className="flex items-end justify-between">
                                        <div>
                                            <span className="text-3xl font-extrabold text-gray-900">{product.total_stock}</span>
                                            <span className="ml-1.5 text-gray-500 text-sm font-medium">{product.unit_type || 'units'}</span>
                                        </div>
                                        <div className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                                            product.total_stock > 10 ? 'bg-green-100 text-green-700' : 
                                            product.total_stock > 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                                        }`}>
                                            {product.total_stock > 10 ? 'HEALTHY' : product.total_stock > 0 ? 'LOW STOCK' : 'OUT OF STOCK'}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Batches Breakdown */}
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                        <History className="h-4 w-4" />
                                        Batch Breakdown
                                    </h4>
                                    <span className="text-[10px] font-bold bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                                        {product.stock_batches?.length || 0} TOTAL
                                    </span>
                                </div>

                                <div className="space-y-3">
                                    {!product.stock_batches || product.stock_batches.length === 0 ? (
                                        <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                            <Package className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                                            <p className="text-sm text-gray-500">No active batches found.</p>
                                        </div>
                                    ) : (
                                        product.stock_batches.map((batch) => {
                                            const daysLeft = batch.expiration_date ? getDaysToExpire(batch.expiration_date) : null
                                            const isExpired = daysLeft !== null && daysLeft < 0
                                            
                                            return (
                                                <div key={batch.batch_id} className={`p-3 rounded-xl border transition-all ${
                                                    isExpired ? 'bg-red-50 border-red-100' : 'bg-white border-gray-200 hover:border-blue-300'
                                                }`}>
                                                    <div className="flex items-center justify-between gap-4">
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <span className="text-sm font-bold text-gray-900">{batch.quantity} {product.unit_type || 'units'}</span>
                                                                <span className="text-[10px] font-mono text-gray-400 bg-gray-50 px-1 rounded border">#{batch.batch_id}</span>
                                                            </div>
                                                            <div className="flex items-center gap-3">
                                                                <div className="flex items-center gap-1 text-[11px] text-gray-500">
                                                                    <Calendar className="h-3 w-3" />
                                                                    Exp: {batch.expiration_date ? formatDate(batch.expiration_date) : 'N/A'}
                                                                </div>
                                                                <div className="flex items-center gap-1 text-[11px] text-gray-500">
                                                                    <Clock className="h-3 w-3" />
                                                                    Rec: {formatDate(batch.received_at)}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {batch.expiration_date && (
                                                            <div className="text-right">
                                                                {isExpired ? (
                                                                    <div className="flex flex-col items-end">
                                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-[10px] font-bold uppercase mb-1">
                                                                            <AlertCircle className="h-3 w-3" />
                                                                            Expired
                                                                        </span>
                                                                        <span className="text-[10px] font-medium text-red-600">
                                                                            {Math.abs(daysLeft)} days overdue
                                                                        </span>
                                                                    </div>
                                                                ) : (
                                                                    <div className="flex flex-col items-end">
                                                                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase mb-1 ${
                                                                            daysLeft <= 7 ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'
                                                                        }`}>
                                                                            {daysLeft <= 0 ? 'Today' : `In ${daysLeft} days`}
                                                                        </span>
                                                                        <span className="text-[10px] font-medium text-gray-500">
                                                                            {daysLeft <= 7 ? 'Expiring soon' : 'Safe stock'}
                                                                        </span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )
                                        })
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end">
                    <button
                        onClick={handleClose}
                        className="px-6 py-2 bg-white border border-gray-300 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-100 transition-colors shadow-sm"
                    >
                        Close Details
                    </button>
                </div>
            </div>
        </div>
    )
}

export default ProductDetailsModal
