import React from 'react'
import { Product, PRODUCT_UNIT_LABELS } from '../../types/product'
import { Edit, Eye, Package } from 'lucide-react'
import ProductCostMarginBadge from './ProductCostMarginBadge'

interface ProductCardProps {
  product: Product
  onEdit: (product: Product) => void
  isAdmin: boolean
  formatCurrency: (amount: number) => string
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onEdit,
  isAdmin,
  formatCurrency
}) => {
  return (
    <div className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center flex-1">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              className="h-12 w-12 rounded-lg object-cover mr-3"
            />
          ) : (
            <div className="h-12 w-12 rounded-lg bg-gray-100 flex items-center justify-center mr-3">
              <Package className="h-6 w-6 text-gray-400" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium text-gray-900 truncate">{product.name}</h3>
            <p className="text-sm text-gray-500 line-clamp-2">{product.description || 'No description'}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 ml-2">
          <span
            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full flex-shrink-0 ${
              product.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
            }`}
          >
            {product.is_active ? 'Active' : 'Inactive'}
          </span>
          <span
            className={`inline-flex px-2 py-1 text-[10px] font-bold uppercase rounded-full flex-shrink-0 ${
              product.is_for_sale
                ? 'bg-blue-100 text-blue-800'
                : 'bg-orange-100 text-orange-800 border border-orange-200'
            }`}
          >
            {product.is_for_sale ? 'For Sale' : 'Not for Sale'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm mb-3">
        <div>
          <p className="text-gray-500">SKU</p>
          <p className="font-medium text-gray-900">{product.sku || '-'}</p>
        </div>
        <div>
          <p className="text-gray-500">Barcode</p>
          <p className="font-medium text-gray-900">{product.barcode || '-'}</p>
        </div>
        <div>
          <p className="text-gray-500">Base Price</p>
          <p className="font-medium text-gray-900">{formatCurrency(product.base_price)}</p>
        </div>
        <div>
          <p className="text-gray-500">Cost Price</p>
          <p className="font-medium text-gray-900">{formatCurrency(product.cost_price || 0)}</p>
        </div>
        <div className="col-span-2">
          <p className="text-gray-500">Profit Margin</p>
          <div className="mt-0.5">
            <ProductCostMarginBadge basePrice={product.base_price} costPrice={product.cost_price || 0} />
          </div>
        </div>
        <div>
          <p className="text-gray-500">Tax Rate / Type</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="font-medium text-gray-950">{product.tax_rate}%</span>
            <span
              className={`inline-flex px-1.5 py-0.5 text-[10px] font-bold rounded-full ${
                product.tax_type === 'VATable'
                  ? 'bg-blue-100 text-blue-800 border border-blue-200'
                  : product.tax_type === 'VAT-Exempt'
                  ? 'bg-amber-100 text-amber-800 border border-amber-200'
                  : 'bg-purple-100 text-purple-800 border border-purple-200'
              }`}
            >
              {product.tax_type || 'VATable'}
            </span>
          </div>
        </div>
        <div>
          <p className="text-gray-500">SC/PWD Eligibility</p>
          <span
            className={`inline-flex px-2 py-0.5 text-[10px] font-bold uppercase rounded-full mt-0.5 ${
              product.is_sc_pwd_eligible
                ? 'bg-purple-100 text-purple-800 border border-purple-200'
                : 'bg-gray-100 text-gray-800 border border-gray-200'
            }`}
          >
            {product.is_sc_pwd_eligible ? 'Eligible' : 'Not Eligible'}
          </span>
        </div>
        <div className="col-span-2">
          <p className="text-gray-500">Inventory</p>
          <p className="font-medium text-gray-900">
            {product.total_stock}{' '}
            {product.unit_type
              ? PRODUCT_UNIT_LABELS[product.unit_type] || product.unit_type
              : product.selling_method === 'unit'
              ? 'units'
              : ''}
            <span className="text-xs text-gray-500 ml-2">
              ({product.selling_method === 'unit' ? 'Unit' : 'Measured'})
            </span>
          </p>
          {product.inventory_type && (
            <p
              className={`text-[10px] font-bold uppercase mt-0.5 ${
                product.inventory_type === 'perishable' ? 'text-orange-600' : 'text-blue-600'
              }`}
            >
              {product.inventory_type.replace('_', '-')}
            </p>
          )}
        </div>
        <div className="col-span-2">
          <p className="text-gray-500">Display Price</p>
          <p className="font-semibold text-lg text-gray-900">{formatCurrency(product.display_price)}</p>
        </div>
      </div>

      <button
        onClick={() => onEdit(product)}
        className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors inline-flex items-center justify-center gap-2"
      >
        {isAdmin ? (
          <>
            <Edit className="h-4 w-4" />
            Edit Product
          </>
        ) : (
          <>
            <Eye className="h-4 w-4" />
            View Details
          </>
        )}
      </button>
    </div>
  )
}

export default ProductCard
