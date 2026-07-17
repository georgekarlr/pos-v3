import React, { useState, useEffect } from 'react';
import { X, Tag, AlertCircle, Search, Loader2 } from 'lucide-react';
import type { Promotion, PromoDiscountType } from '../../types/promotion';
import { ProductService } from '../../services/productService';
import type { Product } from '../../types/product';

// Converts a local datetime string used by <input type="datetime-local">
// into an ISO string for the API (UTC).
const toIso = (local: string) =>
  local ? new Date(local).toISOString() : '';

// Converts an ISO string from the API to the value expected by
// <input type="datetime-local"> (YYYY-MM-DDTHH:mm).
const toLocalInput = (iso: string) => {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export interface PromotionFormData {
  name: string;
  discount_type: PromoDiscountType;
  discount_value: number;
  start_date: string; // ISO
  end_date: string;   // ISO
  is_active: boolean;
  applies_to_all_products: boolean;
  eligible_product_ids: number[];
  coupon_code: string; // empty string = no coupon
}

interface PromotionFormProps {
  promotion: Promotion | null;
  onSubmit: (data: PromotionFormData) => Promise<void>;
  onCancel: () => void;
  isAdmin: boolean;
}

const DEFAULT_FORM: Omit<PromotionFormData, 'start_date' | 'end_date'> & {
  start_date: string;
  end_date: string;
} = {
  name: '',
  discount_type: 'percentage',
  discount_value: 10,
  start_date: '',
  end_date: '',
  is_active: true,
  applies_to_all_products: true,
  eligible_product_ids: [],
  coupon_code: '',
};

const PromotionForm: React.FC<PromotionFormProps> = ({
  promotion,
  onSubmit,
  onCancel,
  isAdmin,
}) => {
  const isEditing = promotion !== null;

  const [form, setForm] = useState({ ...DEFAULT_FORM });
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Selector-specific state
  const [products, setProducts] = useState<Product[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [loadingProducts, setLoadingProducts] = useState(false);

  // Populate form when editing
  useEffect(() => {
    if (promotion) {
      setForm({
        name: promotion.name,
        discount_type: promotion.discount_type,
        discount_value: promotion.discount_value,
        start_date: toLocalInput(promotion.start_date),
        end_date: toLocalInput(promotion.end_date),
        is_active: promotion.is_active,
        applies_to_all_products: promotion.applies_to_all_products,
        eligible_product_ids: promotion.eligible_product_ids ?? [],
        coupon_code: promotion.coupon_code ?? '',
      });
    } else {
      setForm({ ...DEFAULT_FORM });
    }
    setFormError(null);
  }, [promotion]);

  // Load all available active products for selection
  useEffect(() => {
    const loadProducts = async () => {
      setLoadingProducts(true);
      // Fetch up to 1000 active, available products for the catalog
      const { data } = await ProductService.getAllProducts(1000, 0, undefined, undefined, true);
      if (data) {
        setProducts(data);
      }
      setLoadingProducts(false);
    };
    loadProducts();
  }, []);

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const validate = (): string | null => {
    if (!form.name.trim()) return 'Promotion name is required.';
    if (form.discount_value <= 0) return 'Discount value must be greater than zero.';
    if (form.discount_type === 'percentage' && form.discount_value > 100)
      return 'Percentage discount cannot exceed 100%.';
    if (!form.start_date) return 'Start date is required.';
    if (!form.end_date) return 'End date is required.';
    if (new Date(form.start_date) >= new Date(form.end_date))
      return 'End date must be after the start date.';
    if (!form.applies_to_all_products && form.eligible_product_ids.length === 0) {
      return 'Please select at least one eligible product.';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const validationError = validate();
    if (validationError) {
      setFormError(validationError);
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        ...form,
        start_date: toIso(form.start_date),
        end_date: toIso(form.end_date),
      });
    } catch (err: any) {
      setFormError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter products based on search term
  const filteredProducts = products.filter((p) => {
    const term = productSearch.toLowerCase();
    return (
      p.name.toLowerCase().includes(term) ||
      (p.sku && p.sku.toLowerCase().includes(term)) ||
      (p.barcode && p.barcode.toLowerCase().includes(term))
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-violet-100 rounded-xl flex items-center justify-center">
              <Tag className="h-5 w-5 text-violet-600" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">
                {isEditing ? 'Edit Promotion' : 'New Promotion'}
              </h2>
              <p className="text-xs text-gray-500">
                {isEditing ? 'Update promotion details' : 'Set up a discount campaign'}
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close form"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4 overflow-y-auto max-h-[70vh]">
          {/* Error banner */}
          {formError && (
            <div className="flex items-start gap-2.5 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              {formError}
            </div>
          )}

          {/* Name */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">
              Promotion Name <span className="text-red-500">*</span>
            </label>
            <input
              id="promo-name"
              type="text"
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              placeholder="e.g. Summer Sale 20% Off"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
              required
            />
          </div>

          {/* Coupon Code */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">
              Coupon Code <span className="text-gray-400 font-normal normal-case">(optional)</span>
            </label>
            <input
              id="promo-coupon-code"
              type="text"
              value={form.coupon_code}
              onChange={(e) => set('coupon_code', e.target.value.toUpperCase())}
              placeholder="e.g. SUMMER20"
              maxLength={50}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
            />
            <p className="mt-1 text-[11px] text-gray-400">
              If set, cashiers must enter this code in the cart to activate the discount.
            </p>
          </div>

          {/* Discount Type & Value */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">
                Discount Type <span className="text-red-500">*</span>
              </label>
              <select
                id="promo-discount-type"
                value={form.discount_type}
                onChange={(e) => set('discount_type', e.target.value as PromoDiscountType)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              >
                <option value="percentage">Percentage (%)</option>
                <option value="fixed_amount">Fixed Amount (₱)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">
                Value <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-400 pointer-events-none">
                  {form.discount_type === 'percentage' ? '%' : '₱'}
                </span>
                <input
                  id="promo-discount-value"
                  type="number"
                  min={0.01}
                  max={form.discount_type === 'percentage' ? 100 : undefined}
                  step={0.01}
                  value={form.discount_value}
                  onChange={(e) => set('discount_value', parseFloat(e.target.value) || 0)}
                  className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                  required
                />
              </div>
            </div>
          </div>

          {/* Start & End Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">
                Start Date <span className="text-red-500">*</span>
              </label>
              <input
                id="promo-start-date"
                type="datetime-local"
                value={form.start_date}
                onChange={(e) => set('start_date', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">
                End Date <span className="text-red-500">*</span>
              </label>
              <input
                id="promo-end-date"
                type="datetime-local"
                value={form.end_date}
                onChange={(e) => set('end_date', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                required
              />
            </div>
          </div>

          {/* Scope Selection */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
              Applies To
            </label>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  id="promo-all-products"
                  type="radio"
                  name="applies_to"
                  checked={form.applies_to_all_products}
                  onChange={() => {
                    set('applies_to_all_products', true);
                    set('eligible_product_ids', []);
                  }}
                  className="accent-violet-600"
                />
                <span className="text-sm text-gray-700">All Products</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  id="promo-specific-products"
                  type="radio"
                  name="applies_to"
                  checked={!form.applies_to_all_products}
                  onChange={() => set('applies_to_all_products', false)}
                  className="accent-violet-600"
                />
                <span className="text-sm text-gray-700">Specific Products</span>
              </label>
            </div>

            {/* Interactive Searchable Product Multi-Selector */}
            {!form.applies_to_all_products && (
              <div className="mt-3 border border-gray-200 rounded-xl p-3.5 space-y-3 bg-gray-50/50">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Filter products by name or SKU..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 border border-gray-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>

                <div className="max-h-44 overflow-y-auto border border-gray-200 rounded-lg bg-white divide-y divide-gray-100 shadow-inner">
                  {loadingProducts ? (
                    <div className="p-6 text-center text-xs text-gray-500 flex items-center justify-center gap-1.5">
                      <Loader2 className="h-4 w-4 animate-spin text-violet-600" />
                      Loading product list...
                    </div>
                  ) : filteredProducts.length === 0 ? (
                    <div className="p-6 text-center text-xs text-gray-400">
                      No matching products found.
                    </div>
                  ) : (
                    filteredProducts.map((p) => {
                      const isChecked = form.eligible_product_ids.includes(p.id);
                      return (
                        <label
                          key={p.id}
                          className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 cursor-pointer text-xs"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              const updated = isChecked
                                ? form.eligible_product_ids.filter((id) => id !== p.id)
                                : [...form.eligible_product_ids, p.id];
                              set('eligible_product_ids', updated);
                            }}
                            className="rounded border-gray-300 text-violet-600 focus:ring-violet-500 h-4 w-4 accent-violet-600"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-700 truncate">{p.name}</p>
                            <p className="text-[10px] text-gray-400 mt-0.5">
                              {p.sku ? `SKU: ${p.sku}` : 'No SKU'} • ₱{p.display_price.toFixed(2)}
                            </p>
                          </div>
                        </label>
                      );
                    })
                  )}
                </div>

                <div className="flex justify-between items-center text-[10px] text-gray-500 px-1 font-medium">
                  <span>{form.eligible_product_ids.length} product(s) selected</span>
                  {form.eligible_product_ids.length > 0 && (
                    <button
                      type="button"
                      onClick={() => set('eligible_product_ids', [])}
                      className="text-violet-600 hover:text-violet-800"
                    >
                      Clear all selections
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Active toggle — only when editing */}
          {isEditing && (
            <div className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-800">Promotion Active</p>
                <p className="text-xs text-gray-500">Toggle to activate or deactivate this promotion</p>
              </div>
              <button
                id="promo-active-toggle"
                type="button"
                role="switch"
                aria-checked={form.is_active}
                onClick={() => set('is_active', !form.is_active)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-1 ${form.is_active ? 'bg-violet-600' : 'bg-gray-300'
                  }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${form.is_active ? 'translate-x-6' : 'translate-x-1'
                    }`}
                />
              </button>
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            id="promo-submit-btn"
            type="submit"
            disabled={isSubmitting || !isAdmin}
            onClick={handleSubmit}
            className="px-4 py-2 text-sm font-medium text-white bg-violet-600 rounded-lg hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
          >
            {isSubmitting
              ? isEditing
                ? 'Saving…'
                : 'Creating…'
              : isEditing
                ? 'Save Changes'
                : 'Create Promotion'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PromotionForm;