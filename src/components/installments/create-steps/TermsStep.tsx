import React from 'react';
import { Banknote, Percent } from 'lucide-react';

interface TermsStepProps {
  downpayment: string;
  setDownpayment: (val: string) => void;
  monthsToPay: string;
  setMonthsToPay: (val: string) => void;
  interestRate: string;
  setInterestRate: (val: string) => void;
  downpaymentMethod: string;
  setDownpaymentMethod: (val: string) => void;
  occurredAt: string;
  setOccurredAt: (val: string) => void;
  paymentMethods: string[];
  cartSubtotal: number;
  cartTotal: number;
  totalPromoDiscount: number;
  dpNum: number;
  financed: number;
  totalInterestAmount: number;
  interestRateNum: number;
  totalOwed: number;
  monthlyDue: number;
  monthsNum: number;
}

const TermsStep: React.FC<TermsStepProps> = ({
  downpayment,
  setDownpayment,
  monthsToPay,
  setMonthsToPay,
  interestRate,
  setInterestRate,
  downpaymentMethod,
  setDownpaymentMethod,
  occurredAt,
  setOccurredAt,
  paymentMethods,
  cartSubtotal,
  cartTotal,
  totalPromoDiscount,
  dpNum,
  financed,
  totalInterestAmount,
  interestRateNum,
  totalOwed,
  monthlyDue,
  monthsNum,
}) => {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Downpayment</label>
          <div className="relative">
            <Banknote size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm font-mono focus:ring-2 focus:ring-indigo-500"
              value={downpayment}
              onChange={(e) => setDownpayment(e.target.value)}
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Months to Pay</label>
          <input
            type="number"
            min="1"
            max="60"
            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm font-mono focus:ring-2 focus:ring-indigo-500"
            value={monthsToPay}
            onChange={(e) => setMonthsToPay(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Interest Rate (%)</label>
          <div className="relative">
            <Percent size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="number"
              step="0.1"
              min="0"
              placeholder="0.0"
              className="w-full pl-8 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm font-mono focus:ring-2 focus:ring-indigo-500"
              value={interestRate}
              onChange={(e) => setInterestRate(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Downpayment Method</label>
        <div className="flex flex-wrap gap-2">
          {paymentMethods.map((m) => (
            <button key={m} type="button" onClick={() => setDownpaymentMethod(m)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all
                ${downpaymentMethod === m ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-700 border-gray-300 hover:border-indigo-300'}`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Transaction Date</label>
        <input
          type="datetime-local"
          className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500"
          value={occurredAt}
          onChange={(e) => setOccurredAt(e.target.value)}
        />
      </div>

      {/* Live preview */}
      {cartSubtotal > 0 && dpNum < cartTotal && (
        <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 space-y-2">
          <p className="text-xs font-bold text-indigo-600 uppercase tracking-wide mb-3">Contract Preview</p>
          {[
            ['Gross Subtotal Value', `₱${cartSubtotal.toFixed(2)}`],
            ...(totalPromoDiscount > 0 ? [['Promo Savings', `-₱${totalPromoDiscount.toFixed(2)}`]] : []),
            ['Net Order Value', `₱${cartTotal.toFixed(2)}`],
            ['Downpayment Paid', `₱${dpNum.toFixed(2)}`],
            ['Financed Principal', `₱${financed.toFixed(2)}`],
            ['Interest Amount', `₱${totalInterestAmount.toFixed(2)} (${interestRateNum}%)`],
            ['Total Amount Owed', `₱${totalOwed.toFixed(2)}`],
            ['Monthly Due Installment', `₱${monthlyDue.toFixed(2)} × ${monthsNum} months`],
          ].map(([label, value]) => {
            const isHighlight = label.includes('Owed') || label.includes('Installment') || label.includes('Order');
            return (
              <div key={label} className={`flex justify-between text-sm ${isHighlight ? 'font-bold' : ''}`}>
                <span className={isHighlight ? 'text-gray-900' : 'text-gray-600'}>{label}</span>
                <span className={`font-mono ${isHighlight ? 'text-indigo-700' : 'text-gray-900'}`}>{value}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TermsStep;
