import React from 'react';
import { Product } from '../../types/product';
import { Package, History, Plus, Minus } from 'lucide-react';
import StockStatusBadge from './StockStatusBadge'; // Make sure the path is correct

interface ProductCardProps {
    product: Product;
    isAdmin: boolean;
    onAdjust: (product: Product) => void;
    onViewHistory: (product: Product) => void;
    onWriteOffBatch?: (product: Product, batchId: number) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, isAdmin, onAdjust, onViewHistory, onWriteOffBatch }) => {
    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat('en-US', { style: 'currency', currency: 'PHP' }).format(amount);

    // Determine text color for quantity for extra emphasis
    const quantityColor = product.total_stock === 0 ? 'text-red-600' :
        product.total_stock <= 10 ? 'text-yellow-600' :
            'text-gray-900';

    return (
        // Softer shadow, more padding, and smoother transition
        <div className="bg-white rounded-xl shadow-md border border-gray-200 hover:shadow-lg transition-all duration-300 flex flex-col">
            {/* Product Info Section */}
            <div className="p-5 flex-grow">
                <div className="flex items-start gap-4">
                    {/* Image / Placeholder */}
                    {product.image_url ? (
                        <img src={product.image_url} alt={product.name} className="h-16 w-16 rounded-lg object-cover flex-shrink-0" />
                    ) : (
                        <div className="h-16 w-16 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                            <Package className="h-8 w-8 text-gray-400" />
                        </div>
                    )}

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                            <h3 className="text-lg font-bold text-gray-900 truncate" title={product.name}>
                                {product.name}
                            </h3>
                            <StockStatusBadge quantity={product.total_stock} />
                        </div>
                        <div className="mt-1 text-xs text-gray-500 flex items-center justify-between">
                            <span>SKU: {product.sku || 'N/A'}</span>
                            {product.inventory_type && (
                                <span className={`font-bold uppercase text-[10px] ${
                                    product.inventory_type === 'perishable' ? 'text-orange-600' : 'text-blue-600'
                                }`}>
                                    {product.inventory_type.replace('_', '-')}
                                </span>
                            )}
                        </div>
                        <div className="mt-1 text-xs text-gray-500">
                            <span>Barcode: {product.barcode || 'N/A'}</span>
                        </div>
                    </div>
                </div>

                {/* Stock Batches Section - Only for Perishable items with batches */}
                {product.inventory_type === 'perishable' && product.stock_batches && product.stock_batches.length > 0 && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-100">
                        <h4 className="text-xs font-semibold text-gray-600 mb-2 flex items-center gap-1">
                            <Package className="h-3 w-3" />
                            Active Batches
                        </h4>
                        <div className="space-y-1 max-h-24 overflow-y-auto">
                            {product.stock_batches.map((batch) => (
                                <div key={batch.batch_id} className="flex items-center justify-between text-[10px] py-1 border-b border-gray-200 last:border-0">
                                    <div className="flex flex-col">
                                        <span className="font-medium text-gray-700">Qty: {batch.quantity}</span>
                                        <span className="text-gray-500">
                                            Exp: {batch.expiration_date ? new Date(batch.expiration_date).toLocaleDateString() : 'No Date'}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className={`px-1.5 py-0.5 rounded ${
                                            batch.expiration_date && new Date(batch.expiration_date) < new Date() 
                                                ? 'bg-red-100 text-red-700' 
                                                : 'bg-blue-50 text-blue-700'
                                        }`}>
                                            ID: {batch.batch_id}
                                        </span>
                                        {isAdmin && onWriteOffBatch && (
                                            <button
                                                onClick={() => onWriteOffBatch(product, batch.batch_id)}
                                                className="px-2 py-0.5 rounded bg-red-50 text-red-700 border border-red-200 hover:bg-red-100"
                                                title="Write-off this batch"
                                            >
                                                Write-off
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Stats Section */}
                <div className="mt-4 flex justify-around text-center border-t border-gray-100 pt-4">
                    <div>
                        <div className="text-sm text-gray-500">Price</div>
                        <div className="text-xl font-semibold text-gray-800">{formatCurrency(product.display_price)}</div>
                    </div>
                    <div className="border-l border-gray-200"></div>
                    <div>
                        <div className="text-sm text-gray-500">Quantity</div>
                        <div className={`text-xl font-bold ${quantityColor}`}>{product.total_stock}</div>
                    </div>
                </div>
            </div>

            {/* Actions Section */}
            <div className="p-4 bg-gray-50/75 rounded-b-xl border-t border-gray-200">
                <div className="flex items-center justify-end gap-3">
                    <button
                        onClick={() => onViewHistory(product)}
                        title="View stock history"
                        className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-semibold border border-gray-300 rounded-lg text-gray-800 bg-white hover:bg-gray-100 transition-colors"
                    >
                        <History className="h-4 w-4" />
                        History
                    </button>

                    {isAdmin && (
                        <button
                            onClick={() => onAdjust(product)}
                            title="Adjust stock quantity"
                            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-sm"
                        >
                            <Plus className="h-4 w-4" />
                            <Minus className="h-4 w-4 -ml-2" />
                            Adjust
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProductCard;