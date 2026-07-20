import React from 'react';
import { User } from 'lucide-react';
import { CustomerSearchResult } from '../../../types/debt';
import { Product } from '../../../types/product';
import type { CalculatedLine } from '../../../utils/cartCalculator';

interface CartItem {
  product: Product;
  quantity: number;
}

interface ConfirmStepProps {
  selectedCustomer: CustomerSearchResult;
  cart: CartItem[];
  cartSubtotal: number;
  cartTotal: number;
  totalPromoDiscount: number;
  dpNum: number;
  downpaymentMethod: string;
  financed: number;
  totalInterestAmount: number;
  interestRateNum: number;
  totalOwed: number;
  monthsNum: number;
  monthlyDue: number;
  calculatedLines: CalculatedLine[];
}

const ConfirmStep: React.FC<ConfirmStepProps> = ({
  selectedCustomer,
  cart,
  cartSubtotal,
  cartTotal,
  totalPromoDiscount,
  dpNum,
  downpaymentMethod,
  financed,
  totalInterestAmount,
  interestRateNum,
  totalOwed,
  monthsNum,
  monthlyDue,
  calculatedLines,
}) => {
  return (
    <div className="space-y-5">
      <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 flex items-center gap-3">
        <div className="w-10 h-10 bg-indigo-200 rounded-full flex items-center justify-center text-indigo-700">
          <User size={20} />
        </div>
        <div>
          <p className="font-bold text-gray-900">{selectedCustomer.full_name}</p>
          <p className="text-sm text-gray-500">{selectedCustomer.phone_number}</p>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-100">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Items</p>
        </div>
        {cart.map(item => {
          const calcLine = calculatedLines.find(l => l.product.id === item.product.id);
          const promoDiscount = calcLine?.promoDiscount ?? 0;
          const hasDiscount = promoDiscount > 0;
          const lineTotalVal = calcLine
            ? (calcLine.lineGross + calcLine.lineTax)
            : (item.product.display_price * item.quantity);

          return (
            <div key={item.product.id} className="flex justify-between px-4 py-2.5 border-b border-gray-50 text-sm items-center">
              <div>
                <span className="text-gray-700">{item.product.name} × {item.quantity}</span>
                {hasDiscount && (
                  <p className="text-[10px] text-violet-600 font-semibold mt-0.5">
                    Promo Applied (Saved ₱{promoDiscount.toFixed(2)})
                  </p>
                )}
              </div>
              <span className="font-mono font-semibold text-gray-900">₱{lineTotalVal.toFixed(2)}</span>
            </div>
          );
        })}
      </div>

      <div className="bg-gray-900 text-white rounded-2xl p-5 space-y-3">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-4">Contract Summary</p>
        {[
          ['Gross Subtotal Value', `₱${cartSubtotal.toFixed(2)}`],
          ...(totalPromoDiscount > 0 ? [['Promo Savings', `-₱${totalPromoDiscount.toFixed(2)}`]] : []),
          ['Net Order Value', `₱${cartTotal.toFixed(2)}`],
          ['Downpayment', `₱${dpNum.toFixed(2)} via ${downpaymentMethod}`],
          ['Financed Amount', `₱${financed.toFixed(2)}`],
          ['Interest', `₱${totalInterestAmount.toFixed(2)} (${interestRateNum}%)`],
          ['Total Owed', `₱${totalOwed.toFixed(2)}`],
          ['Duration', `${monthsNum} months`],
        ].map(([label, value]) => {
          const isHighlight = label.includes('Value') || label.includes('Owed') || label.includes('Savings');
          return (
            <div key={label} className={`flex justify-between text-sm ${isHighlight ? 'font-semibold' : ''}`}>
              <span className={isHighlight ? 'text-gray-25/80 text-gray-300' : 'text-gray-400'}>{label}</span>
              <span className={`font-mono ${label.includes('Owed') ? 'text-indigo-400' : label.includes('Savings') ? 'text-violet-400' : 'text-white'}`}>{value}</span>
            </div>
          );
        })}
        <div className="h-px bg-gray-700 my-2" />
        <div className="flex justify-between">
          <span className="text-gray-200 font-semibold">Monthly Due</span>
          <span className="text-2xl font-bold font-mono text-indigo-45/80 text-indigo-400">₱{monthlyDue.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
};

export default ConfirmStep;
