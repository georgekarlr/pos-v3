// services/promotionService.ts
import { supabase } from '../lib/supabase';
import { OfflineDB } from '../db/offlineDB';
import type {
  Promotion,
  PromotionOperationResult,
  GetPromotionsParams,
  CreatePromotionParams,
  UpdatePromotionParams,
  PromoProductPrice
} from '../types/promotion';
import type { ServiceResponse } from '../types/product';

export class PromotionService {
  /**
   * Fetches promotions for the current user with pagination, search, and status filter.
   */
  static async getPromotions(
    params: GetPromotionsParams = {}
  ): Promise<ServiceResponse<Promotion[]>> {
    const {
      limit = 50,
      offset = 0,
      searchTerm,
      filterStatus = 'all',
    } = params;

    // Offline: serve from IndexedDB cache
    if (!navigator.onLine) {
      try {
        let cached = await OfflineDB.getPromotions();
        if (cached && cached.length > 0) {
          if (searchTerm) {
            const term = searchTerm.toLowerCase();
            cached = cached.filter(p => p.name.toLowerCase().includes(term));
          }
          if (filterStatus && filterStatus !== 'all') {
            cached = cached.filter(p => p.current_status === filterStatus);
          }
          cached = cached.slice(offset, offset + limit);
          return { data: cached, error: null };
        }
      } catch (cacheErr) {
        console.error('Error reading offline promotions cache:', cacheErr);
      }
      return { data: [], error: 'Offline — no cached promotions found.' };
    }

    try {
      const { data, error } = await supabase.rpc('pos2_get_promotions', {
        p_limit: limit,
        p_offset: offset,
        p_search_term: searchTerm || null,
        p_filter_status: filterStatus,
      });

      if (error) {
        // Fallback to cache on network error
        try {
          const cached = await OfflineDB.getPromotions();
          if (cached && cached.length > 0) {
            return { data: cached, error: null };
          }
        } catch (cacheErr) {
          console.error('Error reading offline promotions cache on fallback:', cacheErr);
        }
        return { data: null, error: error.message };
      }

      // Cache the fresh promotions for offline use
      if (data && data.length > 0 && filterStatus === 'all' && !searchTerm) {
        OfflineDB.savePromotions(data as Promotion[]).catch(err =>
          console.error('Error caching promotions to IndexedDB:', err)
        );
      }

      return { data: (data as Promotion[]) ?? [], error: null };
    } catch (err: any) {
      // Fallback to cache on unexpected error
      try {
        const cached = await OfflineDB.getPromotions();
        if (cached && cached.length > 0) {
          return { data: cached, error: null };
        }
      } catch (cacheErr) {
        console.error('Error reading offline promotions cache on fallback:', cacheErr);
      }
      return {
        data: null,
        error: err.message || 'An unexpected error occurred while fetching promotions.',
      };
    }
  }

  /**
   * Creates a new promotion. Requires Admin permissions.
   */
  static async createPromotion(
    params: CreatePromotionParams
  ): Promise<ServiceResponse<PromotionOperationResult>> {
    try {
      const { data, error } = await supabase.rpc('pos2_create_promotion', {
        p_requesting_account_id: params.p_requesting_account_id,
        p_name: params.p_name,
        p_discount_type: params.p_discount_type,
        p_discount_value: params.p_discount_value,
        p_start_date: params.p_start_date,
        p_end_date: params.p_end_date,
        p_applies_to_all_products: params.p_applies_to_all_products ?? false,
        p_eligible_product_ids: params.p_eligible_product_ids ?? [],
        p_coupon_code: params.p_coupon_code ?? null,
      });

      if (error) {
        return { data: null, error: error.message };
      }

      if (!data || data.length === 0) {
        return { data: null, error: 'Failed to create promotion.' };
      }

      return { data: data[0] as PromotionOperationResult, error: null };
    } catch (err: any) {
      return {
        data: null,
        error: err.message || 'An unexpected error occurred while creating the promotion.',
      };
    }
  }

  /**
   * Updates an existing promotion. Requires Admin permissions.
   */
  static async updatePromotion(
    params: UpdatePromotionParams
  ): Promise<ServiceResponse<PromotionOperationResult>> {
    try {
      const { data, error } = await supabase.rpc('pos2_update_promotion', {
        p_requesting_account_id: params.p_requesting_account_id,
        p_promo_id: params.p_promo_id,
        p_name: params.p_name,
        p_discount_type: params.p_discount_type,
        p_discount_value: params.p_discount_value,
        p_start_date: params.p_start_date,
        p_end_date: params.p_end_date,
        p_is_active: params.p_is_active,
        p_applies_to_all_products: params.p_applies_to_all_products ?? false,
        p_eligible_product_ids: params.p_eligible_product_ids ?? [],
        p_coupon_code: params.p_coupon_code ?? null,
      });

      if (error) {
        return { data: null, error: error.message };
      }

      if (!data || data.length === 0) {
        return { data: null, error: 'Failed to update promotion.' };
      }

      return { data: data[0] as PromotionOperationResult, error: null };
    } catch (err: any) {
      return {
        data: null,
        error: err.message || 'An unexpected error occurred while updating the promotion.',
      };
    }
  }
  /**
  * Fetches eligible products associated with a specific promotion 
  * and returns pre-calculated discount metrics.
  */
  static async getPromoProductPrices(
    promoId: number
  ): Promise<ServiceResponse<PromoProductPrice[]>> {
    if (!navigator.onLine) {
      try {
        const promotions = await OfflineDB.getPromotions();
        const promo = promotions.find(p => p.id === promoId);
        if (!promo) {
          return { data: [], error: 'Promotion not found offline.' };
        }

        const allProducts = await OfflineDB.getProducts();
        const eligibleProducts = promo.applies_to_all_products
          ? allProducts
          : allProducts.filter(p => promo.eligible_product_ids?.includes(p.id));

        const prices: PromoProductPrice[] = eligibleProducts.map(product => {
          const original = product.display_price; // VAT-inclusive shelf price
          let discount = 0;
          if (promo.discount_type === 'percentage') {
            discount = original * (promo.discount_value / 100);
          } else if (promo.discount_type === 'fixed_amount') {
            discount = promo.discount_value; // for display, one unit
            if (discount > original) discount = original;
          }
          return {
            product_id: product.id,
            product_name: product.name,
            sku: product.sku,
            image_url: product.image_url,
            unit_type: product.unit_type,
            original_display_price: original,
            discount_amount_applied: discount,
            discounted_display_price: Math.max(0, original - discount)
          };
        });

        return { data: prices, error: null };
      } catch (err: any) {
        console.error('Error generating offline promo product prices:', err);
      }
    }

    try {
      const { data, error } = await supabase.rpc('pos2_get_promo_product_prices', {
        p_promo_id: promoId,
      });

      if (error) {
        // Fallback offline calculation if online call failed
        try {
          const promotions = await OfflineDB.getPromotions();
          const promo = promotions.find(p => p.id === promoId);
          if (promo) {
            const allProducts = await OfflineDB.getProducts();
            const eligibleProducts = promo.applies_to_all_products
              ? allProducts
              : allProducts.filter(p => promo.eligible_product_ids?.includes(p.id));

            const prices: PromoProductPrice[] = eligibleProducts.map(product => {
              const original = product.display_price;
              let discount = 0;
              if (promo.discount_type === 'percentage') {
                discount = original * (promo.discount_value / 100);
              } else if (promo.discount_type === 'fixed_amount') {
                discount = promo.discount_value;
                if (discount > original) discount = original;
              }
              return {
                product_id: product.id,
                product_name: product.name,
                sku: product.sku,
                image_url: product.image_url,
                unit_type: product.unit_type,
                original_display_price: original,
                discount_amount_applied: discount,
                discounted_display_price: Math.max(0, original - discount)
              };
            });
            return { data: prices, error: null };
          }
        } catch (e) {
          console.error(e);
        }

        return { data: null, error: error.message };
      }

      return { data: (data as PromoProductPrice[]) ?? [], error: null };
    } catch (err: any) {
      return {
        data: null,
        error: err.message || 'An unexpected error occurred while retrieving promotional prices.',
      };
    }
  }
}
