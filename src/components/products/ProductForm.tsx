import React, { useState, useEffect } from 'react'
import { Product, ProductUnitType, PRODUCT_UNIT_LABELS, ProductInventoryType } from '../../types/product'
import { X } from 'lucide-react'

interface ProductFormProps {
  product: Product | null
  onSubmit: (data: ProductFormData) => Promise<void>
  onCancel: () => void
  isAdmin: boolean
}

export interface ProductFormData {
  name: string
  description: string
  base_price: number
  tax_rate: number
  sku: string
  barcode: string
  image_url: string
  selling_method: 'unit' | 'measured'
  inventory_type: ProductInventoryType
  unit_type: ProductUnitType | null
}

const ProductForm: React.FC<ProductFormProps> = ({ product, onSubmit, onCancel, isAdmin }) => {
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    description: '',
    base_price: 0,
    tax_rate: 0,
    sku: '',
    barcode: '',
    image_url: '',
    selling_method: 'unit',
    inventory_type: 'non_perishable',
    unit_type: null
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        description: product.description || '',
        base_price: product.base_price,
        tax_rate: product.tax_rate,
        sku: product.sku || '',
        barcode: product.barcode || '',
        image_url: product.image_url || '',
        selling_method: product.selling_method || 'unit',
        inventory_type: product.inventory_type || 'non_perishable',
        unit_type: product.unit_type || null
      })
    }
  }, [product])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'base_price' || name === 'tax_rate' ? (value === '' ? 0 : parseFloat(value)) : value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      await onSubmit(formData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  const calculateDisplayPrice = () => {
    const taxAmount = formData.base_price * (formData.tax_rate / 100)
    return formData.base_price + taxAmount
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" onClick={onCancel}>
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" />

        <div
          className="relative inline-block w-full max-w-2xl my-8 overflow-hidden text-left align-middle transition-all transform bg-white rounded-lg shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <h3 className="text-xl font-semibold text-gray-900">
              {product ? (isAdmin ? 'Edit Product' : 'View Product') : 'Add New Product'}
            </h3>
            <button
              onClick={onCancel}
              className="p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="px-6 py-4">
            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Product Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  disabled={!isAdmin}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                  placeholder="Enter product name"
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  disabled={!isAdmin}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                  placeholder="Enter product description"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="base_price" className="block text-sm font-medium text-gray-700 mb-1">
                    Base Price <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">{'\u20b1'}</span>
                    <input
                      type="number"
                      id="base_price"
                      name="base_price"
                      value={formData.base_price}
                      onChange={handleChange}
                      required
                      disabled={!isAdmin}
                      step="0.01"
                      min="0"
                      className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="tax_rate" className="block text-sm font-medium text-gray-700 mb-1">
                    Tax Rate <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      id="tax_rate"
                      name="tax_rate"
                      value={formData.tax_rate}
                      onChange={handleChange}
                      required
                      disabled={!isAdmin}
                      step="0.01"
                      min="0"
                      max="100"
                      className="w-full pr-8 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                      placeholder="0.00"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">%</span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">Display Price (with tax)</span>
                  <span className="text-lg font-semibold text-blue-600">
                    {'\u20b1'} {calculateDisplayPrice().toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="sku" className="block text-sm font-medium text-gray-700 mb-1">
                    SKU
                  </label>
                  <input
                    type="text"
                    id="sku"
                    name="sku"
                    value={formData.sku}
                    onChange={handleChange}
                    disabled={!isAdmin}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                    placeholder="Enter SKU"
                  />
                </div>

                <div>
                  <label htmlFor="barcode" className="block text-sm font-medium text-gray-700 mb-1">
                    Barcode
                  </label>
                  <input
                    type="text"
                    id="barcode"
                    name="barcode"
                    value={formData.barcode}
                    onChange={handleChange}
                    disabled={!isAdmin}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                    placeholder="Enter barcode"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="selling_method" className="block text-sm font-medium text-gray-700 mb-1">
                    Selling Method <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="selling_method"
                    name="selling_method"
                    value={formData.selling_method}
                    onChange={handleChange}
                    disabled={!isAdmin}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                  >
                    <option value="unit">By Unit (Countable)</option>
                    <option value="measured">By Weight/Volume/Length (Measured)</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="unit_type" className="block text-sm font-medium text-gray-700 mb-1">
                    Unit Type {formData.selling_method === 'measured' && <span className="text-red-500">*</span>}
                  </label>
                  <select
                    id="unit_type"
                    name="unit_type"
                    value={formData.unit_type || ''}
                    onChange={handleChange}
                    required={formData.selling_method === 'measured'}
                    disabled={!isAdmin}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                  >
                    <option value="">Select unit type</option>
                    {(Object.entries(PRODUCT_UNIT_LABELS) as [ProductUnitType, string][]).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="inventory_type" className="block text-sm font-medium text-gray-700 mb-1">
                    Inventory Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="inventory_type"
                    name="inventory_type"
                    value={formData.inventory_type}
                    onChange={handleChange}
                    disabled={!isAdmin}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                  >
                    <option value="non_perishable">Non-Perishable</option>
                    <option value="perishable">Perishable</option>
                  </select>
                </div>

                {product && (
                  <div>
                    <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1">
                      Current Quantity
                    </label>
                    <input
                      type="number"
                      id="quantity"
                      name="quantity"
                      value={product.total_stock}
                      readOnly
                      disabled
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                    />
                    <p className="mt-1 text-xs text-gray-500">Use Inventory tab to adjust stock.</p>
                  </div>
                )}
              </div>

              {/*<div>
                <label htmlFor="image_url" className="block text-sm font-medium text-gray-700 mb-1">
                  Image URL
                </label>
                <input
                  type="url"
                  id="image_url"
                  name="image_url"
                  value={formData.image_url}
                  onChange={handleChange}
                  disabled={!isAdmin}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                  placeholder="https://example.com/image.jpg"
                />
              </div>*/}
            </div>

            <div className="flex flex-col-reverse sm:flex-row gap-3 mt-6 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={onCancel}
                className="w-full sm:w-auto px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                {isAdmin ? 'Cancel' : 'Close'}
              </button>
              {isAdmin && (
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  {isSubmitting ? 'Saving...' : product ? 'Update Product' : 'Create Product'}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default ProductForm
