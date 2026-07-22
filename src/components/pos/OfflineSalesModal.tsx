import React, { useEffect, useState } from 'react';
import { X, Receipt, ShoppingBag, CreditCard, Clock } from 'lucide-react';
import { OfflineDB, OfflineSale } from '../../db/offlineDB';
import { ReceiptData, ReceiptLine } from './Receipt';
import ReceiptModal from './ReceiptModal';
import { getCachedBusinessSettings } from '../../utils/settingsCache';

interface OfflineSalesModalProps {
  open: boolean;
  onClose: () => void;
}

const OfflineSalesModal: React.FC<OfflineSalesModalProps> = ({ open, onClose }) => {
  const [sales, setSales] = useState<OfflineSale[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<ReceiptData | null>(null);
  const [receiptOpen, setReceiptOpen] = useState(false);

  useEffect(() => {
    if (open) {
      loadSales();
    }
  }, [open]);

  const loadSales = async () => {
    setLoading(true);
    try {
      const data = await OfflineDB.getAllSales();
      // Sort by createdAt desc
      setSales(data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } catch (error) {
      console.error('Failed to load offline sales', error);
    } finally {
      setLoading(false);
    }
  };

  const viewReceipt = (sale: OfflineSale) => {
    // Subtotal: sum of display_price * quantity (gross shelf totals)
    const calculatedSubtotal = sale.cart.reduce((sum: number, item: any) => {
      const price = item.display_price ?? item.price ?? 0;
      const qty = item.quantity ?? item.qty ?? 0;
      return sum + (price * qty);
    }, 0);

    let businessName = 'Point of Sale';
    let businessAddress1: string | undefined;
    let tin: string | undefined;
    let isVatRegistered: boolean | undefined;
    let min: string | undefined;
    let ptuNumber: string | undefined;
    let ptuIssuedBy: string | undefined;
    let softwareProviderName: string | undefined;
    let softwareProviderAddress: string | undefined;
    let softwareProviderTin: string | undefined;
    let softwareProviderAccreditationNo: string | undefined;

    try {
      const settings = getCachedBusinessSettings();
      if (settings) {
        businessName = settings.business_name || 'Point of Sale';
        businessAddress1 = settings.address || undefined;
        tin = settings.tin || undefined;
        isVatRegistered = settings.is_vat_registered !== undefined ? Boolean(settings.is_vat_registered) : undefined;
        min = settings.min || undefined;
        ptuNumber = settings.ptu_number || undefined;
        ptuIssuedBy = settings.ptu_issued_by || undefined;
        softwareProviderName = settings.software_provider_name || undefined;
        softwareProviderAddress = settings.software_provider_address || undefined;
        softwareProviderTin = settings.software_provider_tin || undefined;
        softwareProviderAccreditationNo = settings.software_provider_accreditation_no || undefined;
      }
    } catch (e) {
      console.error('Error reading cached business settings in offline viewReceipt:', e);
    }

    const lines: ReceiptLine[] = sale.cart.map((item: any) => {
      const qty = item.quantity ?? item.qty ?? 0;
      const displayPrice = item.display_price ?? item.price ?? 0;
      const lineTax = item.line_tax ?? 0;
      const lineGross = item.line_gross ?? (displayPrice * qty);

      return {
        name: item.name || `Product #${item.product_id}`,
        qty: qty,
        unitType: item.unit_type,
        unitPrice: displayPrice,
        baseUnitPrice: item.base_price,
        lineTotal: item.line_gross != null && item.line_tax != null
          ? (item.line_gross + item.line_tax)
          : (displayPrice * qty),
        taxType: item.tax_type,
        isScPwdEligible: item.is_sc_pwd_eligible,
        vatExemptLineTotal: item.vat_exempt_line_total,
      };
    });

    const receipt: ReceiptData = {
      offlineId: sale.id,
      invoiceNumber: sale.offlineInvoiceNumber,
      dateISO: sale.createdAt,
      terminalId: sale.terminalId,
      lines,
      subtotal: calculatedSubtotal,
      tax: sale.tax || 0,
      scPwdDiscount: sale.scPwdDiscount,
      totalPromoDiscount: sale.totalPromoDiscount,
      total: sale.total,
      payments: sale.payments.map((p: any) => ({
        method: p.method,
        amount: p.amount,
        reference: p.transaction_ref
      })),
      totalPaid: sale.total_tendered,
      change: Math.max(0, sale.total_tendered - sale.total),
      notes: sale.notes,
      businessName,
      businessAddress1,
      tin,
      isVatRegistered,
      min,
      ptuNumber,
      ptuIssuedBy,
      softwareProviderName,
      softwareProviderAddress,
      softwareProviderTin,
      softwareProviderAccreditationNo,
    };
    setSelectedReceipt(receipt);
    setReceiptOpen(true);
  };

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-50 rounded-lg">
                <ShoppingBag className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Offline Sales</h2>
                <p className="text-sm text-gray-500">Sales stored locally waiting to be synced</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="h-6 w-6 text-gray-400" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : sales.length === 0 ? (
              <div className="text-center py-12">
                <ShoppingBag className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 font-medium">No offline sales found</p>
                <p className="text-sm text-gray-400">All sales have been synced to the server</p>
              </div>
            ) : (
              <div className="space-y-3">
                {sales.map((sale) => (
                  <div
                    key={sale.id}
                    className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:border-blue-300 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Ref: #{sale.id}</span>
                          <span className="text-xs text-gray-400">•</span>
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <Clock className="h-3 w-3" />
                            {new Date(sale.createdAt).toLocaleString()}
                          </div>
                        </div>
                        <div className="text-lg font-bold text-gray-900">
                          ₱{sale.total.toFixed(2)}
                        </div>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {sale.payments.map((p, idx) => (
                            <div key={idx} className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs font-medium">
                              <CreditCard className="h-3 w-3" />
                              {p.method}
                            </div>
                          ))}
                          <span className="text-xs text-gray-500 flex items-center">
                            {sale.cart.length} {sale.cart.length === 1 ? 'item' : 'items'}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => viewReceipt(sale)}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm"
                      >
                        <Receipt className="h-4 w-4 text-blue-600" />
                        View Receipt
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="px-6 py-4 border-t border-gray-100 bg-white flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      <ReceiptModal
        open={receiptOpen}
        data={selectedReceipt}
        onClose={() => setReceiptOpen(false)}
      />
    </>
  );
};

export default OfflineSalesModal;
