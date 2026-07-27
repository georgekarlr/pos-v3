import React from 'react'
import { ProductTaxType } from '../../types/product'
import ProductCostMarginBadge from './ProductCostMarginBadge'

interface ProductPriceInputsProps {
  basePrice: number
  costPrice: number
  taxType: ProductTaxType
  taxRate: number
  disabled: boolean
  onChange: (field: string, value: number | string) => void
}

export const ProductPriceInputs: React.FC<ProductPriceInputsProps> = ({
  basePrice,
  costPrice,
  taxType,
  taxRate,
  disabled,
  onChange
}) => {
  const taxAmount = basePrice * (taxRate / 100)
  const displayPrice = basePrice + taxAmount

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Base Price */}
        <div>
          <label htmlFor="base_price" className="block text-sm font-medium text-gray-700 mb-1">
            Base Price (Excl. Tax) <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₱</span>
            <input
              type="number"
              id="base_price"
              name="base_price"
              value={basePrice}
              onChange={(e) => onChange('base_price', e.target.value === '' ? 0 : parseFloat(e.target.value))}
              required
              disabled={disabled}
              step="0.01"
              min="0"
              className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500 text-sm font-medium"
              placeholder="0.00"
            />
          </div>
        </div>

        {/* Cost Price */}
        <div>
          <label htmlFor="cost_price" className="block text-sm font-medium text-gray-700 mb-1">
            Cost Price (COGS)
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₱</span>
            <input
              type="number"
              id="cost_price"
              name="cost_price"
              value={costPrice}
              onChange={(e) => onChange('cost_price', e.target.value === '' ? 0 : parseFloat(e.target.value))}
              disabled={disabled}
              step="0.01"
              min="0"
              className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500 text-sm font-medium"
              placeholder="0.00"
            />
          </div>
        </div>

        {/* BIR Tax Type */}
        <div>
          <label htmlFor="tax_type" className="block text-sm font-medium text-gray-700 mb-1">
            BIR Tax Type <span className="text-red-500">*</span>
          </label>
          <select
            id="tax_type"
            name="tax_type"
            value={taxType}
            onChange={(e) => onChange('tax_type', e.target.value)}
            disabled={disabled}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500 text-sm"
          >
            <option value="VATable">VATable (12%)</option>
            <option value="VAT-Exempt">VAT-Exempt (0%)</option>
            <option value="Zero-Rated">Zero-Rated (0%)</option>
          </select>
        </div>

        {/* Tax Rate */}
        <div>
          <label htmlFor="tax_rate" className="block text-sm font-medium text-gray-700 mb-1">
            Tax Rate <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type="number"
              id="tax_rate"
              name="tax_rate"
              value={taxRate}
              onChange={(e) => onChange('tax_rate', e.target.value === '' ? 0 : parseFloat(e.target.value))}
              required
              disabled={disabled || taxType !== 'VATable'}
              step="0.01"
              min="0"
              max="100"
              className="w-full pr-8 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500 text-sm"
              placeholder="0.00"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">%</span>
          </div>
        </div>
      </div>

      {/* Pricing Summary & Profit Margin Preview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-blue-50/70 border border-blue-200/80 rounded-lg">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Display Price (with Tax)</span>
          <span className="text-base font-bold text-blue-700">
            ₱{displayPrice.toFixed(2)}
          </span>
        </div>
        <div className="flex items-center justify-between sm:justify-end gap-2">
          <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider sm:mr-1">Profit Margin:</span>
          <ProductCostMarginBadge basePrice={basePrice} costPrice={costPrice} />
        </div>
      </div>
    </div>
  )
}

export default ProductPriceInputs
