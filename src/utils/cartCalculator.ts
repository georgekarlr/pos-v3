import { Product } from '../types/product';
import { Promotion } from '../types/promotion';

export interface CartItemInput {
  product: Product;
  qty: number;
}

export interface CalculatedLine {
  product: Product;
  qty: number;
  promoId: number | null;
  promoDiscount: number;
  lineGross: number; // gross after promo discount
  lineTax: number;
}

export interface CartTotals {
  calculatedLines: CalculatedLine[];
  subtotal: number; // sum of lineGross (gross after promo, before tax)
  tax: number; // sum of lineTax
  scPwdDiscountAmount: number;
  totalPromoDiscount: number;
  total: number; // Net due
}

/**
 * Finds the best matching promotion for a product given applied coupon codes.
 *
 * Coupon code gate rules:
 * - If `appliedCouponCodes` is empty → no promotions apply (no auto-apply)
 * - If `appliedCouponCodes` has items → only promotions whose coupon_code is in
 *   appliedCouponCodes (case-insensitive) are considered
 * - Within matching promotions, the one with the highest discount value wins
 */
export function findBestPromotion(
  product: Product,
  promotions: Promotion[],
  appliedCouponCodes: string[],
  transactionTime: Date = new Date()
): Promotion | null {
  // Gate: no coupon entered → no discount
  if (!appliedCouponCodes || appliedCouponCodes.length === 0) return null;

  const upperCodes = appliedCouponCodes.map((code) => code.trim().toUpperCase());
  let bestPromo: Promotion | null = null;
  let maxDiscount = 0;

  const tTime = transactionTime.getTime();

  for (const promo of promotions) {
    // 1. Coupon code must match one of the applied coupons
    if (!promo.coupon_code) continue;
    if (!upperCodes.includes(promo.coupon_code.trim().toUpperCase())) continue;

    // 2. Check if active and valid time range
    if (!promo.is_active) continue;

    const start = new Date(promo.start_date).getTime();
    const end = new Date(promo.end_date).getTime();
    if (tTime < start || tTime > end) continue;

    // 3. Check product eligibility
    const isEligible = promo.applies_to_all_products ||
      (promo.eligible_product_ids && promo.eligible_product_ids.includes(product.id));
    if (!isEligible) continue;

    // 4. Compute discount value for 1 unit to compare
    let discountValue = 0;
    if (promo.discount_type === 'percentage') {
      discountValue = product.base_price * (promo.discount_value / 100);
    } else if (promo.discount_type === 'fixed_amount') {
      discountValue = Math.min(promo.discount_value, product.base_price);
    }

    if (discountValue > maxDiscount) {
      maxDiscount = discountValue;
      bestPromo = promo;
    }
  }

  return bestPromo;
}

/**
 * Validates a coupon code against loaded promotions and returns a status.
 * Used by the POS to give instant feedback on entered codes.
 */
export type CouponStatus = 'idle' | 'valid' | 'invalid' | 'expired' | 'upcoming' | 'already_applied';

export function validateCouponCode(
  code: string,
  promotions: Promotion[],
  alreadyAppliedCodes: string[] = [],
  transactionTime: Date = new Date()
): CouponStatus {
  if (!code.trim()) return 'idle';

  const couponUpper = code.trim().toUpperCase();

  if (alreadyAppliedCodes.map(c => c.toUpperCase()).includes(couponUpper)) {
    return 'already_applied';
  }

  const tTime = transactionTime.getTime();

  const match = promotions.find(
    (p) => p.coupon_code && p.coupon_code.trim().toUpperCase() === couponUpper
  );

  if (!match) return 'invalid';

  if (!match.is_active) return 'invalid';

  const start = new Date(match.start_date).getTime();
  const end = new Date(match.end_date).getTime();

  if (tTime < start) return 'upcoming';
  if (tTime > end) return 'expired';

  return 'valid';
}

/**
 * Composably calculates cart totals matching the database schema and POS behavior.
 */
export function calculateCartTotals(params: {
  cartLines: CartItemInput[];
  promotions: Promotion[];
  isScPwdDiscount: boolean;
  billingType: 'VAT' | 'NON-VAT';
  appliedCouponCodes?: string[];
  loyaltyPointsRedeemed?: number;
  transactionTime?: Date;
}): CartTotals {
  const {
    cartLines,
    promotions,
    isScPwdDiscount,
    billingType,
    appliedCouponCodes = [],
    loyaltyPointsRedeemed = 0,
    transactionTime = new Date(),
  } = params;

  let serverGrossSubtotal = 0;
  let serverTax = 0;
  let serverCalculatedScDiscount = 0;
  let serverTotalPromoDiscount = 0;

  const calculatedLines: CalculatedLine[] = cartLines.map((line) => {
    const { product, qty } = line;
    const basePrice = product.base_price;
    const grossRaw = basePrice * qty;

    // Find best promotion — requires a matching coupon code
    const bestPromo = findBestPromotion(product, promotions, appliedCouponCodes, transactionTime);
    let promoDiscount = 0;
    let promoId: number | null = null;

    if (bestPromo) {
      promoId = bestPromo.id;
      if (bestPromo.discount_type === 'percentage') {
        promoDiscount = grossRaw * (bestPromo.discount_value / 100);
      } else if (bestPromo.discount_type === 'fixed_amount') {
        promoDiscount = bestPromo.discount_value * qty;
        if (promoDiscount > grossRaw) {
          promoDiscount = grossRaw;
        }
      }
    }

    const lineGross = grossRaw - promoDiscount;
    serverTotalPromoDiscount += promoDiscount;
    serverGrossSubtotal += lineGross;

    // Calculate tax and SC/PWD Discount
    let lineTax = 0;
    if (isScPwdDiscount && product.is_sc_pwd_eligible) {
      // Stripped of VAT and get 20% discount on the gross
      serverCalculatedScDiscount += lineGross * 0.20;
    } else {
      if (billingType === 'VAT' && product.tax_type === 'VATable') {
        lineTax = lineGross * (product.tax_rate / 100);
      }
    }

    serverTax += lineTax;

    return {
      product,
      qty,
      promoId,
      promoDiscount,
      lineGross,
      lineTax,
    };
  });

  const netAmountDue = (serverGrossSubtotal + serverTax) - serverCalculatedScDiscount - loyaltyPointsRedeemed;
  const finalTotal = Math.max(0, netAmountDue);

  return {
    calculatedLines,
    subtotal: serverGrossSubtotal,
    tax: serverTax,
    scPwdDiscountAmount: serverCalculatedScDiscount,
    totalPromoDiscount: serverTotalPromoDiscount,
    total: finalTotal,
  };
}
