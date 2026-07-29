import React from 'react'
import { Product, PRODUCT_UNIT_LABELS } from '../../types/product'
import { Edit, Eye, Package } from 'lucide-react'
import ProductCostMarginBadge from './ProductCostMarginBadge'

interface ProductTableRowProps {
  product: Product
  onEdit: (product: Product) => void
  isAdmin: boolean
  formatCurrency: (amount: number) => string
}

export const ProductTableRow: React.FC<ProductTableRowProps> = ({
  product,
  onEdit,
  isAdmin,
  formatCurrency
}) => {
  return (
    <tr className="hover:bg-gray-50 transition-colors">
      <td className="px-6 py-4">
        <div className="flex items-center">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              className="h-10 w-10 rounded-lg object-cover mr-3"
            />
          ) : (
            <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center mr-3">
              <Package className="h-5 w-5 text-gray-400" />
            </div>
          )}
          <div>
            <div className="text-sm font-medium text-gray-900">{product.name}</div>
            {product.description && (
              <div className="text-sm text-gray-500 line-clamp-1">{product.description}</div>
            )}
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-900">{product.sku || '-'}</div>
        <div className="text-sm text-gray-500">{product.barcode || '-'}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        <div>{formatCurrency(product.base_price)}</div>
        <div className="text-xs text-gray-500">Cost: {formatCurrency(product.cost_price || 0)}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm">
        <ProductCostMarginBadge basePrice={product.base_price} costPrice={product.cost_price || 0} />
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {product.tax_rate}%
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm">
        <span
          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
            product.tax_type === 'VATable'
              ? 'bg-blue-100 text-blue-800 border border-blue-200'
              : product.tax_type === 'VAT-Exempt'
              ? 'bg-amber-100 text-amber-800 border border-amber-200'
              : 'bg-purple-100 text-purple-800 border border-purple-200'
          }`}
        >
          {product.tax_type || 'VATable'}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm">
        <span
          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
            product.is_sc_pwd_eligible
              ? 'bg-purple-100 text-purple-800 border border-purple-200'
              : 'bg-gray-100 text-gray-800 border border-gray-200'
          }`}
        >
          {product.is_sc_pwd_eligible ? 'Eligible' : 'Ineligible'}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
        {formatCurrency(product.display_price)}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        <div className="font-medium">
          {product.total_stock}{' '}
          {product.unit_type
            ? PRODUCT_UNIT_LABELS[product.unit_type] || product.unit_type
            : product.selling_method === 'unit'
            ? 'units'
            : ''}
        </div>
        <div className="text-xs text-gray-500">
          {product.selling_method === 'unit' ? 'Sold by unit' : 'Sold by weight/volume'}
        </div>
        {product.inventory_type && (
          <div
            className={`text-[10px] mt-1 font-bold uppercase ${
              product.inventory_type === 'perishable' ? 'text-orange-600' : 'text-blue-600'
            }`}
          >
            {product.inventory_type.replace('_', '-')}
          </div>
        )}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span
          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
            product.is_for_sale ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800'
          }`}
        >
          {product.is_for_sale ? 'For Sale' : 'Not for Sale'}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span
          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
            product.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
          }`}
        >
          {product.is_active ? 'Active' : 'Inactive'}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        {isAdmin ? (
          <button
            onClick={() => onEdit(product)}
            className="text-blue-600 hover:text-blue-900 inline-flex items-center gap-1 transition-colors"
          >
            <Edit className="h-4 w-4" />
            Edit
          </button>
        ) : (
          <button
            onClick={() => onEdit(product)}
            className="text-gray-600 hover:text-gray-900 inline-flex items-center gap-1 transition-colors"
          >
            <Eye className="h-4 w-4" />
            View
          </button>
        )}
      </td>
    </tr>
  )
}

export default ProductTableRow
