import React from 'react';
import { Search, Loader2, User, CheckCircle2 } from 'lucide-react';
import { CustomerSearchResult } from '../../../types/debt';

interface CustomerStepProps {
  customerQuery: string;
  setCustomerQuery: (query: string) => void;
  customerSearching: boolean;
  customerResults: CustomerSearchResult[];
  selectedCustomer: CustomerSearchResult | null;
  setSelectedCustomer: (customer: CustomerSearchResult) => void;
}

const CustomerStep: React.FC<CustomerStepProps> = ({
  customerQuery,
  setCustomerQuery,
  customerSearching,
  customerResults,
  selectedCustomer,
  setSelectedCustomer,
}) => {
  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">Search for the customer who will receive this installment contract.</p>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
        {customerSearching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 text-indigo-400 animate-spin" size={16} />}
        <input
          type="text"
          placeholder="Search by name or phone…"
          className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          value={customerQuery}
          onChange={(e) => setCustomerQuery(e.target.value)}
        />
      </div>
      <div className="max-h-72 overflow-y-auto rounded-xl border border-gray-100 divide-y bg-white">
        {customerResults.map(c => {
          const isSelected = selectedCustomer?.customer_id === c.customer_id;
          return (
            <button
              key={c.customer_id}
              type="button"
              onClick={() => setSelectedCustomer(c)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors
                ${isSelected ? 'bg-indigo-50 border-l-4 border-indigo-500' : 'hover:bg-gray-50 border-l-4 border-transparent'}`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
                ${isSelected ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-500'}`}>
                <User size={16} />
              </div>
              <div>
                <p className={`text-sm font-semibold ${isSelected ? 'text-indigo-700' : 'text-gray-900'}`}>{c.full_name}</p>
                <p className="text-xs text-gray-500">{c.phone_number}</p>
              </div>
              {isSelected && <CheckCircle2 size={16} className="ml-auto text-indigo-500" />}
            </button>
          );
        })}
        {customerQuery.length >= 2 && !customerSearching && customerResults.length === 0 && (
          <div className="py-8 text-center text-sm text-gray-400">No customers found</div>
        )}
        {customerQuery.length < 2 && (
          <div className="py-8 text-center text-sm text-gray-400">Type at least 2 characters to search</div>
        )}
      </div>
      {selectedCustomer && (
        <div className="flex items-center gap-3 bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3">
          <CheckCircle2 size={16} className="text-indigo-600 flex-shrink-0" />
          <p className="text-sm font-semibold text-indigo-800">Selected: {selectedCustomer.full_name}</p>
        </div>
      )}
    </div>
  );
};

export default CustomerStep;
