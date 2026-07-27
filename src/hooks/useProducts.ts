import { useState, useEffect, useCallback, useMemo } from 'react'
import { Product } from '../types/product'
import { ProductService } from '../services/productService'
import { ProductFormData } from '../components/products/ProductForm'

export interface ProductFilters {
  searchQuery: string
  activeFilter: 'all' | 'active' | 'inactive'
  forSaleFilter: 'all' | 'for_sale' | 'not_for_sale'
  inventoryTypeFilter: 'all' | 'perishable' | 'non_perishable'
}

export const initialProductFilters: ProductFilters = {
  searchQuery: '',
  activeFilter: 'all',
  forSaleFilter: 'all',
  inventoryTypeFilter: 'all',
}

export function useProducts(accountId?: number) {
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [filters, setFilters] = useState<ProductFilters>(initialProductFilters)

  const loadProducts = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await ProductService.getAllProducts(1000, 0, undefined, undefined, null)
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
  }, [])

  useEffect(() => {
    loadProducts()
  }, [loadProducts])

  const saveProduct = useCallback(
    async (formData: ProductFormData, selectedProduct: Product | null) => {
      if (!accountId) {
        throw new Error('Account ID not found')
      }

      if (selectedProduct) {
        const result = await ProductService.updateProduct({
          p_product_id: selectedProduct.id,
          p_account_id: accountId,
          p_name: formData.name,
          p_description: formData.description,
          p_base_price: formData.base_price,
          p_cost_price: formData.cost_price,
          p_tax_rate: formData.tax_rate,
          p_sku: formData.sku,
          p_barcode: formData.barcode,
          p_image_url: formData.image_url,
          p_selling_method: formData.selling_method,
          p_inventory_type: formData.inventory_type,
          p_unit_type: formData.unit_type,
          p_is_for_sale: formData.is_for_sale,
          p_tax_type: formData.tax_type,
          p_is_active: formData.is_active,
          p_is_sc_pwd_eligible: formData.is_sc_pwd_eligible
        })

        if (result.error) throw new Error(result.error)
        if (result.data && !result.data.success) throw new Error(result.data.message)

        setSuccessMessage('Product updated successfully!')
      } else {
        const result = await ProductService.createProduct({
          p_account_id: accountId,
          p_name: formData.name,
          p_description: formData.description,
          p_base_price: formData.base_price,
          p_cost_price: formData.cost_price,
          p_tax_rate: formData.tax_rate,
          p_sku: formData.sku,
          p_barcode: formData.barcode,
          p_image_url: formData.image_url,
          p_selling_method: formData.selling_method,
          p_inventory_type: formData.inventory_type,
          p_unit_type: formData.unit_type,
          p_is_for_sale: formData.is_for_sale,
          p_tax_type: formData.tax_type,
          p_is_sc_pwd_eligible: formData.is_sc_pwd_eligible
        })

        if (result.error) throw new Error(result.error)
        if (result.data && !result.data.success) throw new Error(result.data.message)

        setSuccessMessage('Product created successfully!')
      }

      await loadProducts()
      setTimeout(() => setSuccessMessage(null), 3000)
    },
    [accountId, loadProducts]
  )

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const q = filters.searchQuery.trim().toLowerCase()
      const matchesSearch =
        q === '' ||
        p.name.toLowerCase().includes(q) ||
        (p.sku ? p.sku.toLowerCase().includes(q) : false) ||
        (p.barcode ? p.barcode.toLowerCase().includes(q) : false)

      const matchesForSale =
        filters.forSaleFilter === 'all' ||
        (filters.forSaleFilter === 'for_sale' ? p.is_for_sale : !p.is_for_sale)

      const matchesActive =
        filters.activeFilter === 'all' ||
        (filters.activeFilter === 'active' ? p.is_active : !p.is_active)

      const matchesType =
        filters.inventoryTypeFilter === 'all' || p.inventory_type === filters.inventoryTypeFilter

      return matchesSearch && matchesForSale && matchesActive && matchesType
    })
  }, [products, filters])

  const resetFilters = useCallback(() => setFilters(initialProductFilters), [])

  return {
    products,
    filteredProducts,
    isLoading,
    error,
    successMessage,
    filters,
    setFilters,
    resetFilters,
    loadProducts,
    saveProduct
  }
}
