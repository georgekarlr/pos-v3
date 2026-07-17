import { ReceiptData, ReceiptLine, ReceiptPayment } from '../components/pos/Receipt'
import { SaleDetailsResponse } from '../types/sales'
import { getCachedBusinessSettings } from './settingsCache'

export function mapSaleDetailsToReceipt(details: SaleDetailsResponse): ReceiptData {
    const order = details.order
    const items = details.items || []
    const payments = details.payments || []

    const lines: ReceiptLine[] = items.map((it) => {
        const unit = Number(it.price_at_purchase || 0)
        const baseUnit = it.base_price_at_purchase != null ? Number(it.base_price_at_purchase) : undefined
        const total = (it.line_total ?? (it.quantity && it.price_at_purchase ? it.quantity * it.price_at_purchase : 0)) || 0
        const refundedQty = Number(it.refunded_quantity || 0)
        const refundedAmount = refundedQty > 0 ? refundedQty * unit : undefined
        // For SC/PWD-eligible VATable items the DB stores base_price_at_purchase as the
        // post-promo VAT-exclusive unit price (e.g. 162.00 for Chicken after 10% promo).
        // We surface this as vatExemptLineTotal so the VAT breakdown uses the BIR-correct amount.
        const vatExemptLineTotal = baseUnit != null ? baseUnit * it.quantity : undefined
        return {
            name: it.product_name,
            qty: it.quantity,
            unitType: it.unit_type,
            unitPrice: unit,
            baseUnitPrice: baseUnit,  // VAT-exclusive; used when SC/PWD discount is active
            lineTotal: Number(total),
            taxType: it.tax_type_at_purchase ?? null,  // 'VATable' | 'VAT-Exempt' | 'Zero-Rated'
            isScPwdEligible: it.is_sc_pwd_eligible ?? false, // product's stored SC/PWD eligibility flag
            vatExemptLineTotal,
            refundedQty,
            refundedAmount
        }
    })

    const totalTendered = order.total_tendered
    const subtotalFromItems = lines.reduce((sum, l) => sum + l.lineTotal, 0)
    const subtotal = Number(order.subtotal_amount ?? subtotalFromItems)
    const tax = Number(order.tax_amount ?? Math.max(0, Number(order.total_amount) - subtotal))
    const total = Number(order.total_amount)

    const receiptPayments: ReceiptPayment[] = payments.map((p) => ({
        method: p.method,
        amount: Number(p.amount),
        reference: p.transaction_ref ?? undefined
    }))

    // const totalPaid = receiptPayments.reduce((s, p) => s + p.amount, 0)
    const totalPaid = Number(order.total_tendered ?? order.total_amount ?? 0)
    const change = Math.max(0, totalPaid - total)

    let businessName: string | undefined = undefined;
    let businessAddress1: string | undefined = undefined;
    let tin: string | undefined = undefined;
    let isVatRegistered: boolean | undefined = undefined;
    let min: string | undefined = undefined;
    let ptuIssuedBy: string | undefined = undefined;
    let softwareProviderName: string | undefined = undefined;
    let softwareProviderAddress: string | undefined = undefined;
    let softwareProviderTin: string | undefined = undefined;
    let softwareProviderAccreditationNo: string | undefined = undefined;

    try {
        const settings = getCachedBusinessSettings();
        if (settings) {
            businessName = settings.business_name || undefined;
            businessAddress1 = settings.address || undefined;
            tin = settings.tin || undefined;
            isVatRegistered = settings.is_vat_registered !== undefined ? Boolean(settings.is_vat_registered) : undefined;
            min = settings.min || undefined;
            ptuIssuedBy = settings.ptu_issued_by || undefined;
            softwareProviderName = settings.software_provider_name || undefined;
            softwareProviderAddress = settings.software_provider_address || undefined;
            softwareProviderTin = settings.software_provider_tin || undefined;
            softwareProviderAccreditationNo = settings.software_provider_accreditation_no || undefined;
        }
    } catch (e) {
        console.error('Error reading cached business settings in mapping:', e);
    }

    return {
        orderId: order.id,
        invoiceNumber: order.invoice_number ?? undefined,
        terminalId: order.terminal_id ?? undefined,
        scPwdDiscount: order.sc_pwd_discount_amount ? Number(order.sc_pwd_discount_amount) : undefined,
        vatExemptDiscount: order.vat_exempt_discount_amount ? Number(order.vat_exempt_discount_amount) : undefined,
        totalPromoDiscount: order.promo_discount_total != null ? Number(order.promo_discount_total) : (order.promo_discount_amount ? Number(order.promo_discount_amount) : undefined),
        businessName,
        businessAddress1,
        tin,
        isVatRegistered,
        min,
        cashier: order.account_person_name || undefined,
        dateISO: order.created_at,
        lines,
        subtotal,
        tax,
        total,
        payments: receiptPayments,
        totalPaid,
        change,
        notes: order.notes ?? undefined,
        totalTendered: totalTendered,
        ptuIssuedBy,
        softwareProviderName,
        softwareProviderAddress,
        softwareProviderTin,
        softwareProviderAccreditationNo,
    }
}