import { supabase } from '../lib/supabase'
import { Product, CreateProductInput, UpdateProductInput, ProductResponse } from '../types/product'
import { offlineDB } from '../db/offlineDB'

export const productService = {
  async getAllProducts(): Promise<Product[]> {
    // If online, try to fetch from server and update cache
    if (navigator.onLine) {
      try {
        const { data, error } = await supabase.rpc('pos_get_all_products')
        if (error) throw error

        if (data) {
          // Update offline cache
          await offlineDB.saveProducts(data)
          return data
        }
      } catch (err) {
        console.error('Error fetching products from server, falling back to cache:', err)
      }
    }

    // Fallback to offline cache
    const cachedProducts = await offlineDB.getProducts()
    return cachedProducts || []
  },

  async createProduct(input: CreateProductInput): Promise<ProductResponse> {
    const { data, error } = await supabase.rpc('pos_create_product', {
      p_account_id: input.account_id,
      p_name: input.name,
      p_description: input.description,
      p_base_price: input.base_price,
      p_tax_rate: input.tax_rate,
      p_sku: input.sku,
      p_barcode: input.barcode,
      p_image_url: input.image_url
    })

    if (error) {
      console.error('Error creating product:', error)
      throw new Error(error.message)
    }

    const result = data[0] as ProductResponse
    return result
  },

  async updateProduct(input: UpdateProductInput): Promise<ProductResponse> {
    const { data, error } = await supabase.rpc('pos_update_product', {
      p_product_id: input.product_id,
      p_account_id: input.account_id,
      p_name: input.name,
      p_description: input.description,
      p_base_price: input.base_price,
      p_tax_rate: input.tax_rate,
      p_sku: input.sku,
      p_barcode: input.barcode,
      p_image_url: input.image_url
    })

    if (error) {
      console.error('Error updating product:', error)
      throw new Error(error.message)
    }

    const result = data[0] as ProductResponse
    return result
  }
}
