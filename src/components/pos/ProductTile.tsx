import React from 'react'
import { Product, PRODUCT_UNIT_LABELS } from '../../types/product'
import { PosAction } from '../../types/pos'
// Import icons for a cleaner, more visual UI
import { PlusCircle, MinusCircle, Package, Trash2 } from 'lucide-react'

interface ProductTileProps {
    product: Product
    orderQty: number
    action: PosAction
    onClick: () => void
}

// Map actions to icons for a more visual hint
const actionIcons: Record<PosAction, React.ReactElement> = {
    add: <PlusCircle className="h-5 w-5 text-green-500" />,
    deduct: <MinusCircle className="h-5 w-5 text-orange-500" />,
    bundle: <Package className="h-5 w-5 text-purple-500" />,
    clear: <Trash2 className="h-5 w-5 text-red-500" />,
}

// For showing stock level urgency
const LOW_STOCK_THRESHOLD = 10;

const ProductTile: React.FC<ProductTileProps> = ({ product, orderQty, action, onClick }) => {
    const isSelected = orderQty > 0
    const isDisabled = product.quantity === 0 && action === 'add'

    // Determine stock status for visual feedback
    const getStockStatus = () => {
        if (product.quantity === 0) {
            return { text: 'Out of Stock', color: 'text-red-600', dot: 'bg-red-500' }
        }
        if (product.quantity <= LOW_STOCK_THRESHOLD) {
            return { text: 'Low Stock', color: 'text-orange-600', dot: 'bg-orange-400' }
        }
        return { text: 'In Stock', color: 'text-green-600', dot: 'bg-green-500' }
    }

    const stockStatus = getStockStatus();

    return (
        <button
            type="button"
            onClick={onClick}
            disabled={isDisabled}
            className={`
        relative flex flex-col rounded-lg border bg-white p-4 text-left shadow-sm
        transition-all duration-200 ease-in-out
        ${isSelected ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200'}
        ${isDisabled
                ? 'cursor-not-allowed bg-gray-50 opacity-60'
                : 'hover:border-blue-400 hover:shadow-md hover:-translate-y-1'
            }
      `}
            aria-label={`${product.name}. Current action: ${action}`}
        >
            {/* --- Quantity Badge --- */}
            {isSelected && (
                <div className="absolute -top-2 -right-2 flex h-auto min-h-[1.5rem] min-w-[1.5rem] items-center justify-center rounded-full bg-blue-500 text-white shadow-lg text-sm font-bold px-1">
                    {product.selling_method === 'measured' ? orderQty.toFixed(2).replace(/\.?0+$/, '') : orderQty}
                </div>
            )}

            {/* --- Main Content --- */}
            <div className="flex-1">
                {/* Product Name and Barcode */}
                <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-gray-800 line-clamp-2">{product.name}</h3>
                    {product.barcode && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
              {product.barcode}
            </span>
                    )}
                </div>

                {/* Price and Stock Details */}
                <div className="mt-4 flex flex-col items-center gap-2">
                    {/* Price Section */}
                    <div className="text-center">
                        <p className="text-sm text-gray-500">Price</p>
                        <p className="text-xl font-bold text-gray-900">{'\u20B1' + product.display_price.toFixed(2)}</p>
                    </div>

                    {/* Stock Section */}
                    <div className="text-center">
                        <p className="text-sm text-gray-500">Available</p>
                        <div className={`flex items-center justify-center gap-1 font-semibold ${stockStatus.color}`}>
                            <span className={`h-2 w-2 rounded-full ${stockStatus.dot}`}></span>
                            <span>
                                {product.quantity}{' '}
                                <span className="text-xs font-normal">
                                    {product.unit_type
                                        ? PRODUCT_UNIT_LABELS[product.unit_type] || product.unit_type
                                        : product.selling_method === 'unit'
                                        ? 'units'
                                        : ''}
                                </span>
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- Footer with Action Hint --- */}
            <div className="mt-4 flex items-center justify-end border-t pt-3">
                {actionIcons[action]}
            </div>
        </button>
    )
}

export default ProductTile