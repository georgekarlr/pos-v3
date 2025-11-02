export interface Product {
  id: number
  user_id: string
  name: string
  description: string | null
  base_price: number
  tax_rate: number
  display_price: number
  sku: string | null
  barcode: string | null
  image_url: string | null
  quantity: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface CreateProductInput {
  account_id: number
  name: string
  description: string
  base_price: number
  tax_rate: number
  sku: string
  barcode: string
  image_url: string
}

export interface UpdateProductInput {
  product_id: number
  account_id: number
  name: string
  description: string
  base_price: number
  tax_rate: number
  sku: string
  barcode: string
  image_url: string
}

export interface ProductResponse {
  success: boolean
  message: string
  data: Product | null
}
