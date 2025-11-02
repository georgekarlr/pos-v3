import { supabase } from '../lib/supabase'
import { Product, CreateProductInput, UpdateProductInput, ProductResponse } from '../types/product'

export const productService = {
  async getAllProducts(): Promise<Product[]> {
    const { data, error } = await supabase.rpc('pos_get_all_products')

    if (error) {
      console.error('Error fetching products:', error)
      throw new Error(error.message)
    }

    return data || []
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
