import React, { useState, useEffect, useCallback } from 'react';
import { Search, Loader2, User } from 'lucide-react';
import { DebtService } from '../../services/debtService';
import { CustomerSearchResult } from '../../types/debt';

interface CustomerSearchPanelProps {
  onSelectCustomer: (customer: CustomerSearchResult) => void;
  selectedCustomerId?: number | null;
}

const CustomerSearchPanel: React.FC<CustomerSearchPanelProps> = ({
  onSelectCustomer,
  selectedCustomerId,
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<CustomerSearchResult[]>([]);
  const [searching, setSearching] = useState(false);

  const search = useCallback(async (term: string) => {
    if (term.length < 2) {
      setResults([]);
      return;
    }
    setSearching(true);
    const { data } = await DebtService.searchCustomers(term);
    setResults(data || []);
    setSearching(false);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => search(query), 300);
    return () => clearTimeout(timer);
  }, [query, search]);

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
        {searching && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 text-indigo-400 animate-spin" size={16} />
        )}
        <input
          type="text"
          placeholder="Search customer by name or phone…"
          className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <div className="max-h-64 overflow-y-auto rounded-lg border border-gray-100 divide-y divide-gray-50 bg-white">
        {results.map((c) => {
          const isActive = selectedCustomerId === c.customer_id;
          return (
            <button
              key={c.customer_id}
              onClick={() => onSelectCustomer(c)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors
                ${isActive
                  ? 'bg-indigo-50 border-l-4 border-indigo-500'
                  : 'hover:bg-gray-50 border-l-4 border-transparent'
                }`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
                ${isActive ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-500'}`}>
                <User size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold truncate ${isActive ? 'text-indigo-700' : 'text-gray-900'}`}>
                  {c.full_name}
                </p>
                <p className="text-xs text-gray-500 truncate">{c.phone_number}</p>
              </div>
            </button>
          );
        })}

        {query.length >= 2 && !searching && results.length === 0 && (
          <div className="py-8 text-center text-sm text-gray-400">
            No customers found for &ldquo;{query}&rdquo;
          </div>
        )}

        {query.length < 2 && (
          <div className="py-8 text-center text-sm text-gray-400">
            Type at least 2 characters to search
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerSearchPanel;
