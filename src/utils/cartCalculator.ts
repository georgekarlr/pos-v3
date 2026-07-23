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
  promoDiscount: number;  // VAT-inclusive discount (shelf price saving, for display)
  lineGross: number;      // VAT-exclusive net after promo, sent to DB
  lineTax: number;
  /**
   * Post-discount VAT-exclusive total for SC/PWD-eligible VATable items;
   * 0 for all other lines. Used for the VAT-Exempt bucket on receipts.
   */
  vatExemptLineTotal: number;
  /**
   * The VAT-inclusive total to DISPLAY on the cart/receipt per line.
   *
   * - SC/PWD wins   → original shelf price (discount printed as a separate receipt line)
   * - Promo wins    → promo-adjusted VAT-inclusive total
   * - SC exempt retained, promo wins → promo-adjusted base (no VAT, item is VAT-Exempt)
   * - Normal item   → lineGross + lineTax
   */
  displayLineTotal: number;
}

export interface CartTotals {
  calculatedLines: CalculatedLine[];
  subtotal: number;              // sum of displayLineTotal — shown on receipt before discount lines
  tax: number;                   // sum of lineTax (on post-discount VAT-exclusive amounts)
  scPwdDiscountAmount: number;
  vatExemptDiscountAmount: number; // 12% VAT removed for SC/PWD-eligible items
  totalPromoDiscount: number;    // VAT-inclusive total discount (shelf saving)
  total: number;                 // Net due
}

/**
 * Finds the best matching promotion for a product given applied coupon codes.
 *
 * Coupon code gate:
 * - Empty `appliedCouponCodes` → no promotions apply
 * - Promotions whose coupon_code is in the applied list (case-insensitive) are evaluated
 * - The one yielding the highest per-unit base saving wins
 */
export function findBestPromotion(
  product: Product,
  promotions: Promotion[],
  appliedCouponCodes: string[],
  transactionTime: Date = new Date()
): Promotion | null {
  if (!appliedCouponCodes || appliedCouponCodes.length === 0) return null;

  const upperCodes = appliedCouponCodes.map((c) => c.trim().toUpperCase());
  let bestPromo: Promotion | null = null;
  let maxDiscount = 0;
  const tTime = transactionTime.getTime();

  for (const promo of promotions) {
    if (!promo.coupon_code) continue;
    if (!upperCodes.includes(promo.coupon_code.trim().toUpperCase())) continue;
    if (!promo.is_active) continue;

    const start = new Date(promo.start_date).getTime();
    const end = new Date(promo.end_date).getTime();
    if (tTime < start || tTime > end) continue;

    const isEligible =
      promo.applies_to_all_products ||
      (promo.eligible_product_ids && promo.eligible_product_ids.includes(product.id));
    if (!isEligible) continue;

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

export type CouponStatus = 'idle' | 'valid' | 'invalid' | 'expired' | 'upcoming' | 'already_applied';

export function validateCouponCode(
  code: string,
  promotions: Promotion[],
  alreadyAppliedCodes: string[] = [],
  transactionTime: Date = new Date()
): CouponStatus {
  if (!code.trim()) return 'idle';

  const couponUpper = code.trim().toUpperCase();
  if (alreadyAppliedCodes.map((c) => c.toUpperCase()).includes(couponUpper)) {
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
 * Calculates cart totals mirroring the server-side `pos2_create_sale` function and the
 * Master Matrix of All Transaction Scenarios:
 *
 *   Scenario 1 — Standard VAT sale             : shelf prices used, VAT embedded
 *   Scenario 2 — Non-VAT business              : base prices only, tax = 0
 *   Scenario 3 — SC/PWD only                   : 12% VAT stripped + 20% SC on base
 *   Scenario 4 — Promo only (no SC/PWD)        : promo-adjusted VAT-inclusive prices
 *   Scenario 5 — SC/PWD + Promo                : per-item Option A vs B best-price pick; no double discount
 *   Scenario 6 — Promo wins but SC ID present  : promo discount kept, VAT Exemption STILL retained (BIR rule)
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

  let serverTax = 0;
  let serverCalculatedScDiscount = 0;
  let serverVatExemptionDiscount = 0;
  let serverTotalPromoDiscount = 0;

  const calculatedLines: CalculatedLine[] = cartLines.map((line) => {
    const { product, qty } = line;
    const basePrice = product.base_price;
    const taxRate = product.tax_rate / 100;
    const isVatable = billingType === 'VAT' && product.tax_type === 'VATable';

    const displayPricePerUnit = product.display_price; // VAT-inclusive shelf price
    const grossRaw = basePrice * qty;                  // VAT-exclusive, no discounts yet

    // ── Step 1: Resolve best promo candidate (Option A) ───────────────────────
    const bestPromo = findBestPromotion(product, promotions, appliedCouponCodes, transactionTime);
    let promoDiscountBase = 0; // VAT-exclusive base discount for the line
    let promoId: number | null = null;

    if (bestPromo) {
      promoId = bestPromo.id;
      if (bestPromo.discount_type === 'percentage') {
        promoDiscountBase = grossRaw * (bestPromo.discount_value / 100);
      } else if (bestPromo.discount_type === 'fixed_amount') {
        promoDiscountBase = Math.min(bestPromo.discount_value * qty, grossRaw);
      }
    }

    // ── Step 2: SC/PWD Branch — applies ONLY to VATable + SC-eligible items ──
    // (BIR RA 9994 — Zero-Rated / VAT-Exempt items get no additional SC benefit)
    if (isScPwdDiscount && product.is_sc_pwd_eligible && isVatable) {
      // BIR RULE: VAT Exemption is UNCONDITIONAL when SC ID is presented.
      // Record the VAT component being removed regardless of which discount wins.
      serverVatExemptionDiscount += grossRaw * taxRate;

      // Option A: best per-unit BASE price achievable with the promo (VAT-Exempt, no 12% added)
      const optionAPerUnitBase =
        promoDiscountBase > 0 ? basePrice - promoDiscountBase / qty : basePrice;

      // Option B: 20% SC/PWD on VAT-exclusive base price
      const optionBPerUnitBase = basePrice * 0.80;

      if (optionBPerUnitBase <= optionAPerUnitBase) {
        // ── SC/PWD WINS (Scenarios 3 & 5) ─────────────────────────────────────
        // Drop any promo. Apply 20% SC on full original base. lineTax = 0.
        const scDiscount = grossRaw * 0.20;
        serverCalculatedScDiscount += scDiscount;
        const netAfterSc = grossRaw - scDiscount; // grossRaw * 0.80

        // lineGross = grossRaw (accounting — SC is deducted at order level, not line level)
        // displayLineTotal = original shelf price (SC discount printed as a separate receipt line)
        serverTotalPromoDiscount += 0; // no promo applied
        serverTax += 0;

        return {
          product,
          qty,
          promoId: null,
          promoDiscount: 0,
          lineGross: grossRaw,
          lineTax: 0,
          vatExemptLineTotal: netAfterSc,
          displayLineTotal: displayPricePerUnit * qty,
        };

      } else {
        // ── PROMO WINS, VAT EXEMPTION RETAINED (Scenario 6) ─────────────────
        // Promo applied; SC 20% NOT applied (promo is better).
        // BIR RULE: 12% VAT is still ₱0 — exemption is unconditional.
        const lineGrossAfterPromo = grossRaw - promoDiscountBase;
        const promoDiscount = promoDiscountBase; // no VAT multiplier (item is exempt)

        serverTotalPromoDiscount += promoDiscount;
        serverTax += 0; // lineTax = 0

        return {
          product,
          qty,
          promoId,
          promoDiscount,
          lineGross: lineGrossAfterPromo,
          lineTax: 0,
          vatExemptLineTotal: lineGrossAfterPromo,
          displayLineTotal: lineGrossAfterPromo, // promo-adjusted base, no VAT
        };
      }
    }

    // ── Step 3: Normal Sale (Scenarios 1, 2, 4) ───────────────────────────────
    // For VATable items: VAT-inclusive discount = VAT-exclusive discount × (1 + taxRate)
    const promoDiscount = isVatable
      ? promoDiscountBase * (1 + taxRate)
      : promoDiscountBase;

    serverTotalPromoDiscount += promoDiscount;

    const lineGross = grossRaw - promoDiscountBase;
    const lineTax = isVatable ? lineGross * taxRate : 0;
    serverTax += lineTax;

    const displayLineTotal = lineGross + lineTax;

    return {
      product,
      qty,
      promoId,
      promoDiscount,
      lineGross,
      lineTax,
      vatExemptLineTotal: 0,
      displayLineTotal,
    };
  });

  // ── Step 4: Aggregate ─────────────────────────────────────────────────────
  // subtotal = sum of displayLineTotals (receipt line above discount section)
  const subtotal = calculatedLines.reduce((sum, l) => sum + l.displayLineTotal, 0);

  // vatInclusiveNet = accounting net before SC/loyalty deductions
  const vatInclusiveNet = calculatedLines.reduce((sum, l) => sum + l.lineGross + l.lineTax, 0);
  const finalTotal = Math.max(0, vatInclusiveNet - serverCalculatedScDiscount - loyaltyPointsRedeemed);

  return {
    calculatedLines,
    subtotal,
    tax: serverTax,
    scPwdDiscountAmount: serverCalculatedScDiscount,
    vatExemptDiscountAmount: serverVatExemptionDiscount,
    totalPromoDiscount: serverTotalPromoDiscount,
    total: finalTotal,
  };
}
