// types/promotion.ts

import type { ServiceResponse } from './product';

// Re-export ServiceResponse for convenience
export type { ServiceResponse };

// --- Enum Types ---
export type PromoDiscountType = 'percentage' | 'fixed_amount';

export type PromoStatus = 'active' | 'expired' | 'upcoming' | 'deactivated';

// --- Entity Types ---

export interface Promotion {
  id: number;
  name: string;
  discount_type: PromoDiscountType;
  discount_value: number;
  start_date: string; // ISO Timestamp
  end_date: string;   // ISO Timestamp
  is_active: boolean;
  applies_to_all_products: boolean;
  eligible_product_ids: number[];
  coupon_code: string | null; // NEW — null means no coupon code set
  current_status: PromoStatus;
}


export interface PromoProductPrice {
  product_id: number;
  product_name: string;
  sku: string | null;
  image_url: string | null;
  unit_type: string | null;
  original_display_price: number;      // VAT-inclusive shelf price
  discount_amount_applied: number;     // Savings value
  discounted_display_price: number;    // Final price paid by customer
}

// --- Operation Result ---

export interface PromotionOperationResult {
  success: boolean;
  message: string;
  data: Promotion | null;
}

// --- Params ---

export interface GetPromotionsParams {
  limit?: number;
  offset?: number;
  searchTerm?: string;
  filterStatus?: 'all' | PromoStatus;
}

export interface CreatePromotionParams {
  p_requesting_account_id: number;
  p_name: string;
  p_discount_type: PromoDiscountType;
  p_discount_value: number;
  p_start_date: string;
  p_end_date: string;
  p_applies_to_all_products?: boolean;
  p_eligible_product_ids?: number[];
  p_coupon_code?: string | null; // NEW
}

export interface UpdatePromotionParams extends CreatePromotionParams {
  p_promo_id: number;
  p_is_active: boolean;
}
