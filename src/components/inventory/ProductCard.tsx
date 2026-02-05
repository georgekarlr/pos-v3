import React from 'react';
import { Product } from '../../types/product';
import { Package, History, Plus, Minus, Eye } from 'lucide-react';
import StockStatusBadge from './StockStatusBadge'; // Make sure the path is correct

interface ProductCardProps {
    product: Product;
    isAdmin: boolean;
    onAdjust: (product: Product) => void;
    onViewHistory: (product: Product) => void;
    onViewDetails?: (product: Product) => void;
    onWriteOffBatch?: (product: Product, batchId: number) => void;
    onAdjustBatch?: (product: Product, batchId: number, currentQuantity: number) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, isAdmin, onAdjust, onViewHistory, onViewDetails, onWriteOffBatch, onAdjustBatch }) => {
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
                    <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                        <div className="flex items-center justify-between mb-3">
                            <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                                <Package className="h-3.5 w-3.5 text-blue-500" />
                                Active Batches
                            </h4>
                            <span className="text-[10px] font-medium bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                                {product.stock_batches.length} {product.stock_batches.length === 1 ? 'batch' : 'batches'}
                            </span>
                        </div>
                        <div className="space-y-2 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
                            {product.stock_batches.map((batch) => {
                                const isExpired = batch.expiration_date && new Date(batch.expiration_date) < new Date();
                                return (
                                    <div key={batch.batch_id} className="bg-white p-2.5 rounded-lg border border-gray-200 shadow-sm transition-all hover:border-blue-200">
                                        <div className="flex items-center justify-between gap-2">
                                            <div className="flex flex-col gap-0.5">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-bold text-gray-900">{batch.quantity}</span>
                                                    <span className="text-[10px] text-gray-400 font-mono">#{batch.batch_id}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5 mt-1">
                                                    <span className="text-xs text-gray-500 font-medium">Expires:</span>
                                                    <span className={`text-sm font-bold ${isExpired ? 'text-red-600' : 'text-gray-900'}`}>
                                                        {batch.expiration_date ? new Date(batch.expiration_date).toLocaleDateString() : 'No Date'}
                                                    </span>
                                                </div>
                                            </div>
                                            
                                            {isAdmin && (
                                                <div className="flex items-center gap-1">
                                                    {onAdjustBatch && (
                                                        <button
                                                            onClick={() => onAdjustBatch(product, batch.batch_id, batch.quantity)}
                                                            className="p-1.5 rounded-md bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors border border-blue-100"
                                                            title="Adjust quantity"
                                                        >
                                                            <Plus className="h-3.5 w-3.5" />
                                                        </button>
                                                    )}
                                                    {onWriteOffBatch && (
                                                        <button
                                                            onClick={() => onWriteOffBatch(product, batch.batch_id)}
                                                            className="p-1.5 rounded-md bg-red-50 text-red-600 hover:bg-red-100 transition-colors border border-red-100"
                                                            title="Write-off batch"
                                                        >
                                                            <Minus className="h-3.5 w-3.5" />
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
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
                <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                        {onViewDetails && (
                            <button
                                onClick={() => onViewDetails(product)}
                                title="View product details"
                                className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-100"
                            >
                                <Eye className="h-5 w-5" />
                            </button>
                        )}
                        <button
                            onClick={() => onViewHistory(product)}
                            title="View stock history"
                            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-semibold border border-gray-300 rounded-lg text-gray-800 bg-white hover:bg-gray-100 transition-colors"
                        >
                            <History className="h-4 w-4" />
                            <span className="hidden sm:inline">History</span>
                        </button>
                    </div>

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