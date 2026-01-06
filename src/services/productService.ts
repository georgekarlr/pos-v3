// services/productsService.ts
import { supabase } from '../lib/supabase';
import type {
  Product,
  CreatePosProductParams,
  UpdatePosProductParams,
  PosProductOperationResult,
  ServiceResponse
} from '../types/product.ts';

export class ProductService {

  /**
   * Fetches all POS products available to the current user.
   */
  static async getAllProducts(): Promise<ServiceResponse<Product[]>> {
    try {
      const { data, error } = await supabase.rpc('pos_get_all_products');

      if (error) {
        return { data: null, error: error.message };
      }

      return { data: data as Product[], error: null };

    } catch (err: any) {
      return {
        data: null,
        error: err.message || 'An unexpected error occurred while fetching products.'
      };
    }
  }

  /**
   * Creates a new POS product.
   * Requires Admin permissions.
   */
  static async createProduct(params: CreatePosProductParams): Promise<ServiceResponse<PosProductOperationResult>> {
    try {
      const { data, error } = await supabase.rpc('pos_create_product', {
        p_account_id: params.p_account_id,
        p_name: params.p_name,
        p_description: params.p_description,
        p_base_price: params.p_base_price,
        p_tax_rate: params.p_tax_rate,
        p_sku: params.p_sku,
        p_barcode: params.p_barcode,
        p_image_url: params.p_image_url,
        p_quantity: params.p_quantity,
        p_selling_method: params.p_selling_method,
        p_unit_type: params.p_unit_type
      });

      if (error) {
        return { data: null, error: error.message };
      }

      if (!data || data.length === 0) {
        return { data: null, error: 'Failed to create product.' };
      }

      return { data: data[0] as PosProductOperationResult, error: null };

    } catch (err: any) {
      return {
        data: null,
        error: err.message || 'An unexpected error occurred while creating the product.'
      };
    }
  }

  /**
   * Updates an existing POS product.
   * Requires Admin permissions.
   */
  static async updateProduct(params: UpdatePosProductParams): Promise<ServiceResponse<PosProductOperationResult>> {
    try {
      const { data, error } = await supabase.rpc('pos_update_product', {
        p_product_id: params.p_product_id,
        p_account_id: params.p_account_id,
        p_name: params.p_name,
        p_description: params.p_description,
        p_base_price: params.p_base_price,
        p_tax_rate: params.p_tax_rate,
        p_sku: params.p_sku,
        p_barcode: params.p_barcode,
        p_image_url: params.p_image_url,
        p_quantity: params.p_quantity,
        p_selling_method: params.p_selling_method,
        p_unit_type: params.p_unit_type
      });

      if (error) {
        return { data: null, error: error.message };
      }

      if (!data || data.length === 0) {
        return { data: null, error: 'Failed to update product.' };
      }

      return { data: data[0] as PosProductOperationResult, error: null };

    } catch (err: any) {
      return {
        data: null,
        error: err.message || 'An unexpected error occurred while updating the product.'
      };
    }
  }
}


