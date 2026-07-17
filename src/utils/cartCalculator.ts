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
  promoDiscount: number;  // VAT-inclusive discount (shelf price saving)
  lineGross: number;     // VAT-exclusive net after promo discount (sent to DB)
  lineTax: number;
  /**
   * Post-promo VAT-exclusive total for SC/PWD-eligible VATable items;
   * 0 for all other lines. Used for the VAT-Exempt bucket on receipts.
   * BIR order: promo applied → VAT stripped → 20% SC/PWD applied.
   */
  vatExemptLineTotal: number;
}

export interface CartTotals {
  calculatedLines: CalculatedLine[];
  subtotal: number;          // sum of display_price * qty (shelf prices, VAT-inclusive, before discounts)
  tax: number;               // sum of lineTax (on post-discount VAT-exclusive amounts)
  scPwdDiscountAmount: number;
  vatExemptDiscountAmount: number; // 12% VAT removed for SC/PWD
  totalPromoDiscount: number; // VAT-inclusive total discount (shelf saving)
  total: number;             // Net due
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

  // Gross shelf subtotal: sum of display_price * qty (VAT-inclusive, before any discounts)
  let shelfSubtotal = 0;
  let serverTax = 0;
  let serverCalculatedScDiscount = 0;
  let serverVatExemptionDiscount = 0;
  // VAT-inclusive total promo discount (actual saving from shelf price)
  let serverTotalPromoDiscount = 0;

  const calculatedLines: CalculatedLine[] = cartLines.map((line) => {
    const { product, qty } = line;
    const basePrice = product.base_price;
    const taxRate = product.tax_rate / 100; // e.g. 0.12
    const isVatable = billingType === 'VAT' && product.tax_type === 'VATable';

    // Shelf (display) price is VAT-inclusive for VATable items
    const displayPricePerUnit = product.display_price; // VAT-inclusive shelf price
    const shelfLineTotal = displayPricePerUnit * qty;   // VAT-inclusive shelf total
    shelfSubtotal += shelfLineTotal;

    const grossRaw = basePrice * qty; // VAT-exclusive shelf total

    // Find best promotion — requires a matching coupon code
    const bestPromo = findBestPromotion(product, promotions, appliedCouponCodes, transactionTime);
    let promoDiscountBase = 0; // VAT-exclusive discount
    let promoId: number | null = null;

    if (bestPromo) {
      promoId = bestPromo.id;
      if (bestPromo.discount_type === 'percentage') {
        promoDiscountBase = grossRaw * (bestPromo.discount_value / 100);
      } else if (bestPromo.discount_type === 'fixed_amount') {
        promoDiscountBase = bestPromo.discount_value * qty;
        if (promoDiscountBase > grossRaw) {
          promoDiscountBase = grossRaw;
        }
      }
    }

    // VAT-inclusive discount = VAT-exclusive discount * (1 + taxRate) for VATable items
    const promoDiscount = isVatable
      ? promoDiscountBase * (1 + taxRate)
      : promoDiscountBase;

    serverTotalPromoDiscount += promoDiscount;

    // lineGross = VAT-exclusive amount after promo (sent to DB)
    const lineGross = grossRaw - promoDiscountBase;

    // Calculate tax and SC/PWD Discount
    let lineTax = 0;
    // vatExemptLineTotal: post-promo VAT-exclusive total for VAT-Exempt bucket.
    // BIR order: promo applied first → VAT stripped → 20% SC/PWD on VAT-exclusive price.
    // lineGross is already VAT-exclusive (base_price × qty − promoDiscountBase).
    let vatExemptLineTotal = 0;
    // BIR rule: the 20% SC/PWD discount (with VAT removal) applies ONLY to VATable
    // eligible items. Zero-Rated and VAT-Exempt items that happen to be SC/PWD eligible
    // are NOT reclassified and do NOT receive the 20% discount — there is no VAT to
    // remove on them and the SC/PWD benefit is the VAT relief itself.
    if (isScPwdDiscount && product.is_sc_pwd_eligible && isVatable) {
      vatExemptLineTotal = lineGross; // VAT-exclusive post-promo → VAT-Exempt bucket
      serverCalculatedScDiscount += lineGross * 0.20;
      serverVatExemptionDiscount += lineGross * taxRate;
    } else {
      if (isVatable) {
        lineTax = lineGross * taxRate;
      }
    }

    serverTax += lineTax;

    return {
      product,
      qty,
      promoId,
      promoDiscount,    // VAT-inclusive saving (for display)
      lineGross,        // VAT-exclusive net after promo (for DB/tax calc)
      lineTax,
      vatExemptLineTotal, // post-promo VAT-exclusive total for VAT-Exempt bucket
    };
  });

  // Total = sum of (lineGross + lineTax) per line, then subtract SC/PWD discount and any loyalty redemption
  const vatInclusiveNet = calculatedLines.reduce((sum, l) => sum + l.lineGross + l.lineTax, 0);
  const finalTotal = Math.max(0, vatInclusiveNet - serverCalculatedScDiscount - loyaltyPointsRedeemed);

  return {
    calculatedLines,
    subtotal: shelfSubtotal,           // Gross shelf total (VAT-inclusive, before discounts)
    tax: serverTax,
    scPwdDiscountAmount: serverCalculatedScDiscount,
    vatExemptDiscountAmount: serverVatExemptionDiscount,
    totalPromoDiscount: serverTotalPromoDiscount, // VAT-inclusive total saving
    total: finalTotal,
  };
}
