// services/productsService.ts
import { supabase } from '../lib/supabase';
import { OfflineDB } from '../db/offlineDB';
import type {
  Product,
  CreatePosProductParams,
  UpdatePosProductParams,
  PosProductOperationResult,
  ServiceResponse
} from '../types/product.ts';

export class ProductService {

  /**
   * Fetches POS products available to the current user with pagination and search.
   * When offline, returns cached products from IndexedDB.
   * When online and successful, saves products to IndexedDB for offline use.
   */
  static async getAllProducts(
    limit: number = 50,
    offset: number = 0,
    searchTerm?: string,
    filterForSale?: boolean,
    filterActive?: boolean | null
  ): Promise<ServiceResponse<Product[]>> {
    // Offline: serve from IndexedDB cache
    if (!navigator.onLine) {
      try {
        let cached = await OfflineDB.getProducts();
        if (cached && cached.length > 0) {
          // Apply local filters since we are offline
          if (searchTerm) {
            const term = searchTerm.toLowerCase();
            cached = cached.filter(p =>
              p.name.toLowerCase().includes(term) ||
              (p.sku && p.sku.toLowerCase().includes(term)) ||
              (p.barcode && p.barcode.toLowerCase().includes(term))
            );
          }
          if (filterForSale !== undefined && filterForSale !== null) {
            cached = cached.filter(p => p.is_for_sale === filterForSale);
          }
          if (filterActive !== undefined && filterActive !== null) {
            cached = cached.filter(p => p.is_active === filterActive);
          } else if (filterActive === undefined) {
            // Default to true as in SQL
            cached = cached.filter(p => p.is_active === true);
          }
          // Sort by name like SQL does
          cached.sort((a, b) => a.name.localeCompare(b.name));
          // Apply pagination
          cached = cached.slice(offset, offset + limit);

          return { data: cached, error: null };
        }
      } catch (cacheErr) {
        console.error('Error reading offline product cache:', cacheErr);
      }
      return { data: [], error: 'Offline — no cached products found.' };
    }

    try {
      const { data, error } = await supabase.rpc('pos2_get_product_details', {
        p_limit: limit,
        p_offset: offset,
        p_search_term: searchTerm || null,
        p_filter_for_sale: filterForSale ?? null,
        p_filter_active: filterActive === undefined ? true : filterActive
      });

      if (error) {
        // Fallback to cache on network/server error
        try {
          const cached = await OfflineDB.getProducts();
          if (cached && cached.length > 0) {
            return { data: cached, error: null };
          }
        } catch (cacheErr) {
          console.error('Error reading offline product cache on fallback:', cacheErr);
        }
        return { data: null, error: error.message };
      }

      // Cache the fresh products for offline use
      if (data && data.length > 0) {
        OfflineDB.saveProducts(data as Product[]).catch(err =>
          console.error('Error caching products to IndexedDB:', err)
        );
      }

      return { data: data as Product[], error: null };

    } catch (err: any) {
      // Fallback to cache on unexpected error
      try {
        const cached = await OfflineDB.getProducts();
        if (cached && cached.length > 0) {
          return { data: cached, error: null };
        }
      } catch (cacheErr) {
        console.error('Error reading offline product cache on fallback:', cacheErr);
      }
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
    console.log("params: ", params)
    try {
      const { data, error } = await supabase.rpc('pos2_create_product', {
        p_account_id: params.p_account_id,
        p_name: params.p_name,
        p_description: params.p_description,
        p_base_price: params.p_base_price,
        p_tax_rate: params.p_tax_rate,
        p_sku: params.p_sku,
        p_barcode: params.p_barcode,
        p_image_url: params.p_image_url,
        p_selling_method: params.p_selling_method,
        p_inventory_type: params.p_inventory_type,
        p_unit_type: params.p_unit_type,
        p_is_for_sale: params.p_is_for_sale,
        p_tax_type: params.p_tax_type,
        p_is_sc_pwd_eligible: params.p_is_sc_pwd_eligible
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
      const { data, error } = await supabase.rpc('pos2_update_product', {
        p_product_id: params.p_product_id,
        p_account_id: params.p_account_id,
        p_name: params.p_name,
        p_description: params.p_description,
        p_base_price: params.p_base_price,
        p_tax_rate: params.p_tax_rate,
        p_sku: params.p_sku,
        p_barcode: params.p_barcode,
        p_image_url: params.p_image_url,
        p_selling_method: params.p_selling_method,
        p_inventory_type: params.p_inventory_type,
        p_unit_type: params.p_unit_type,
        p_is_for_sale: params.p_is_for_sale,
        p_tax_type: params.p_tax_type,
        p_is_active: params.p_is_active,
        p_is_sc_pwd_eligible: params.p_is_sc_pwd_eligible
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


