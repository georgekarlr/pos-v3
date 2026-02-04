import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Product } from '../types/product'
import ProductList from '../components/products/ProductList'
import ProductForm, { ProductFormData } from '../components/products/ProductForm'
import LoadingSpinner from '../components/LoadingSpinner'
import { Plus, AlertCircle, RefreshCw } from 'lucide-react'
import {ProductService} from "../services/productService.ts";

const Products: React.FC = () => {
  const { persona } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const isAdmin = persona?.type === 'admin'

  const loadProducts = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await ProductService.getAllProducts()
      if (response.error) {
        setError(response.error)
      } else {
        setProducts(response.data || [])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load products')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadProducts()
  }, [])

  const handleAddProduct = () => {
    setSelectedProduct(null)
    setShowForm(true)
  }

  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product)
    setShowForm(true)
  }

  const handleCloseForm = () => {
    setShowForm(false)
    setSelectedProduct(null)
  }

  const handleSubmit = async (formData: ProductFormData) => {
    try {
      if (!persona?.id) {
        throw new Error('Account ID not found')
      }

      if (selectedProduct) {
        const result = await ProductService.updateProduct({
          p_product_id: selectedProduct.id,
          p_account_id: persona.id,
          p_name: formData.name,
          p_description: formData.description,
          p_base_price: formData.base_price,
          p_tax_rate: formData.tax_rate,
          p_sku: formData.sku,
          p_barcode: formData.barcode,
          p_image_url: formData.image_url,
          p_selling_method: formData.selling_method,
          p_inventory_type: formData.inventory_type,
          p_unit_type: formData.unit_type
        })

        if (result.error) {
          throw new Error(result.error)
        }

        if (result.data && !result.data.success) {
          throw new Error(result.data.message)
        }

        setSuccessMessage('Product updated successfully!')
      } else {
        const result = await ProductService.createProduct({
          p_account_id: persona.id,
          p_name: formData.name,
          p_description: formData.description,
          p_base_price: formData.base_price,
          p_tax_rate: formData.tax_rate,
          p_sku: formData.sku,
          p_barcode: formData.barcode,
          p_image_url: formData.image_url,
          p_selling_method: formData.selling_method,
          p_inventory_type: formData.inventory_type,
          p_unit_type: formData.unit_type
        })

        if (result.error) {
          throw new Error(result.error)
        }

        if (result.data && !result.data.success) {
          throw new Error(result.data.message)
        }

        setSuccessMessage('Product created successfully!')
      }

      handleCloseForm()
      await loadProducts()

      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err) {
      throw err
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="large" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Products</h1>
              <p className="mt-1 text-sm text-gray-500">
                {isAdmin
                  ? 'Manage your product catalog, pricing, and inventory'
                  : 'View product information and details'}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={loadProducts}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
              >
                <RefreshCw className="h-4 w-4" />
                <span className="hidden sm:inline">Refresh</span>
              </button>

              {isAdmin && (
                <button
                  onClick={handleAddProduct}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm"
                >
                  <Plus className="h-5 w-5" />
                  <span>Add Product</span>
                </button>
              )}
            </div>
          </div>

          {successMessage && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
              <div className="flex-shrink-0">
                <div className="h-5 w-5 bg-green-500 rounded-full flex items-center justify-center">
                  <svg className="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              </div>
              <p className="text-sm text-green-800 font-medium">{successMessage}</p>
            </div>
          )}

          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-red-800 font-medium">Error loading products</p>
                <p className="text-sm text-red-600 mt-1">{error}</p>
                <button
                  onClick={loadProducts}
                  className="mt-2 text-sm text-red-700 hover:text-red-800 font-medium underline"
                >
                  Try again
                </button>
              </div>
            </div>
          )}
        </div>

        <ProductList products={products} onEdit={handleEditProduct} isAdmin={isAdmin} />

        {showForm && (
          <ProductForm
            product={selectedProduct}
            onSubmit={handleSubmit}
            onCancel={handleCloseForm}
            isAdmin={isAdmin}
          />
        )}
      </div>
    </div>
  )
}

export default Products
