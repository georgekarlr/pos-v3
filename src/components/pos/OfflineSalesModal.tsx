import React, { useEffect, useState } from 'react';
import { X, Receipt, ShoppingBag, CreditCard, Clock } from 'lucide-react';
import { OfflineDB, OfflineSale } from '../../db/offlineDB';
import { ReceiptData } from './Receipt';
import ReceiptModal from './ReceiptModal';

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
    const subtotal = sale.total - (sale.tax || 0);
    const receipt: ReceiptData = {
      offlineId: sale.id,
      dateISO: sale.createdAt,
      lines: sale.cart.map((item: any) => ({
        name: item.name,
        qty: item.qty,
        unitType: item.unit_type,
        unitPrice: item.price,
        lineTotal: item.price * item.qty,
      })),
      subtotal: subtotal,
      tax: sale.tax || 0,
      total: sale.total,
      payments: sale.payments.map((p: any) => ({
        method: p.method,
        amount: p.amount,
        reference: p.transaction_ref
      })),
      totalPaid: sale.total_tendered,
      change: Math.max(0, sale.total_tendered - sale.total),
      notes: sale.notes,
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
