import React, { useState } from 'react';
import {
  Edit2,
  Tag,
  Percent,
  DollarSign,
  Calendar,
  ChevronDown,
  ChevronUp,
  Loader2,
  AlertCircle,
  Ticket
} from 'lucide-react';
import type { Promotion, PromoProductPrice } from '../../types/promotion';
import { PromotionService } from '../../services/promotionService';
import PromotionStatusBadge from './PromotionStatusBadge';

interface PromotionListProps {
  promotions: Promotion[];
  onEdit: (promotion: Promotion) => void;
  isAdmin: boolean;
}

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

const PromotionList: React.FC<PromotionListProps> = ({
  promotions,
  onEdit,
  isAdmin,
}) => {
  // Expansion and lazy-loading states for pricing lists
  const [expandedPromoId, setExpandedPromoId] = useState<number | null>(null);
  const [pricesMap, setPricesMap] = useState<Record<number, PromoProductPrice[]>>({});
  const [loadingPrices, setLoadingPrices] = useState<Record<number, boolean>>({});
  const [pricesError, setPricesError] = useState<Record<number, string | null>>({});

  const handleToggleExpand = async (promoId: number) => {
    if (expandedPromoId === promoId) {
      setExpandedPromoId(null);
      return;
    }

    setExpandedPromoId(promoId);

    // Only load calculated prices from the DB function if they haven't been fetched yet
    if (!pricesMap[promoId]) {
      setLoadingPrices((prev) => ({ ...prev, [promoId]: true }));
      setPricesError((prev) => ({ ...prev, [promoId]: null }));

      const { data, error } = await PromotionService.getPromoProductPrices(promoId);

      if (error) {
        setPricesError((prev) => ({ ...prev, [promoId]: error }));
      } else if (data) {
        setPricesMap((prev) => ({ ...prev, [promoId]: data }));
      }

      setLoadingPrices((prev) => ({ ...prev, [promoId]: false }));
    }
  };

  if (promotions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 bg-violet-50 rounded-2xl flex items-center justify-center mb-4 shadow-sm">
          <Tag className="h-8 w-8 text-violet-400" />
        </div>
        <h3 className="text-base font-semibold text-gray-800 mb-1">
          No promotions found
        </h3>
        <p className="text-sm text-gray-500 max-w-xs">
          {isAdmin
            ? 'Create your first discount campaign to start attracting customers.'
            : 'No promotions match your current filters.'}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {promotions.map((promo) => {
        const isPercentage = promo.discount_type === 'percentage';
        const isExpanded = expandedPromoId === promo.id;

        return (
          <div
            key={promo.id}
            className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col overflow-hidden"
          >
            {/* Card header strip — colour-coded by status */}
            <div
              className={`h-1.5 w-full ${promo.current_status === 'active'
                  ? 'bg-emerald-500'
                  : promo.current_status === 'upcoming'
                    ? 'bg-blue-500'
                    : promo.current_status === 'expired'
                      ? 'bg-gray-300'
                      : 'bg-red-400'
                }`}
            />

            <div className="p-5 flex flex-col gap-3 flex-1">
              {/* Title row */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2.5">
                  <div
                    className={`flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center ${isPercentage
                        ? 'bg-violet-100'
                        : 'bg-amber-100'
                      }`}
                  >
                    {isPercentage ? (
                      <Percent className="h-4 w-4 text-violet-600" />
                    ) : (
                      <DollarSign className="h-4 w-4 text-amber-600" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 leading-snug line-clamp-2">
                      {promo.name}
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {isPercentage ? 'Percentage Discount' : 'Fixed Amount Off'}
                    </p>
                  </div>
                </div>
                <PromotionStatusBadge status={promo.current_status} />
              </div>

              {/* Discount Value */}
              <div className="flex items-center gap-1.5">
                <span className="text-2xl font-bold text-gray-900">
                  {isPercentage
                    ? `${promo.discount_value}%`
                    : `₱${Number(promo.discount_value).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`}
                </span>
                <span className="text-xs text-gray-400 font-medium">
                  {isPercentage ? 'off' : 'discount'}
                </span>
              </div>

              {/* Date range */}
              <div className="flex items-start gap-2 text-xs text-gray-500">
                <Calendar className="h-3.5 w-3.5 flex-shrink-0 mt-0.5 text-gray-400" />
                <span>
                  {formatDate(promo.start_date)}
                  {' '}—{' '}
                  {formatDate(promo.end_date)}
                </span>
              </div>

              {/* Scope Info Badge */}
              <div className="text-xs text-gray-500">
                {promo.applies_to_all_products ? (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-50 border border-gray-200 rounded-md">
                    <span className="font-medium text-gray-700">Applies to:</span>
                    &nbsp;All Products
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-50 border border-gray-200 rounded-md">
                    <span className="font-medium text-gray-700">Products:</span>
                    &nbsp;
                    {promo.eligible_product_ids?.length > 0
                      ? `${promo.eligible_product_ids.length} selected`
                      : 'None selected'}
                  </span>
                )}
              </div>

              {/* Coupon Code Badge */}
              {promo.coupon_code ? (
                <div className="flex items-center gap-1.5">
                  <Ticket className="h-3.5 w-3.5 text-violet-500 flex-shrink-0" />
                  <span className="font-mono text-xs font-bold tracking-widest text-violet-700 bg-violet-50 border border-violet-200 border-dashed px-2 py-0.5 rounded">
                    {promo.coupon_code}
                  </span>
                  <span className="text-[10px] text-gray-400 font-medium">required at checkout</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded font-medium">
                    No coupon code — discount will NOT apply at POS
                  </span>
                </div>
              )}
            </div>

            {/* Price Ledger Panel (Accordion) */}
            {isExpanded && (
              <div className="px-5 pb-4 pt-3 border-t border-gray-100 bg-gray-50/50">
                <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2.5">
                  Calculated Promotional Price List
                </h4>

                {loadingPrices[promo.id] ? (
                  <div className="py-6 flex items-center justify-center gap-2 text-xs text-gray-500 font-medium">
                    <Loader2 className="h-4 w-4 animate-spin text-violet-600" />
                    Running promotion mathematics...
                  </div>
                ) : pricesError[promo.id] ? (
                  <div className="py-4 text-xs text-red-500 flex items-center gap-1.5 justify-center">
                    <AlertCircle className="h-4 w-4" />
                    {pricesError[promo.id]}
                  </div>
                ) : !pricesMap[promo.id] || pricesMap[promo.id].length === 0 ? (
                  <div className="py-4 text-xs text-center text-gray-400">
                    No active eligible products associated with this promotion.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto divide-y divide-gray-100 pr-1">
                    {pricesMap[promo.id].map((item) => (
                      <div key={item.product_id} className="pt-2 flex items-start justify-between gap-4 text-xs">
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-800 truncate">{item.product_name}</p>
                          <p className="text-[10px] text-gray-400 mt-0.5">
                            Original: <span className="line-through">₱{Number(item.original_display_price).toFixed(2)}</span>
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="font-bold text-violet-700">₱{Number(item.discounted_display_price).toFixed(2)}</p>
                          <p className="text-[9px] text-emerald-600 font-medium mt-0.5">
                            Save ₱{Number(item.discount_amount_applied).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Footer Buttons */}
            <div className="px-5 pb-4 flex gap-2">
              <button
                onClick={() => handleToggleExpand(promo.id)}
                className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {isExpanded ? (
                  <>
                    <ChevronUp className="h-3.5 w-3.5" />
                    Hide Prices
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-3.5 w-3.5" />
                    View Prices
                  </>
                )}
              </button>

              {isAdmin && (
                <button
                  onClick={() => onEdit(promo)}
                  id={`edit-promotion-${promo.id}`}
                  className="inline-flex items-center justify-center gap-2 px-3.5 py-2 text-xs font-medium text-violet-700 bg-violet-50 border border-violet-100 rounded-lg hover:bg-violet-100 transition-colors"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                  Edit
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default PromotionList;