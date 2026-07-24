// pages/Promotions.tsx
import React, { useState, useEffect } from 'react';
import { Plus, RefreshCw, AlertCircle, Search, Filter, Tag } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { usePromotions } from '../hooks/usePromotions';
import PromotionList from '../components/promotions/PromotionList';
import PromotionForm, { PromotionFormData } from '../components/promotions/PromotionForm';
import LoadingSpinner from '../components/LoadingSpinner';
import type { Promotion, PromoStatus } from '../types/promotion';

type StatusFilter = 'all' | PromoStatus;

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All Promotions' },
  { value: 'active', label: 'Active' },
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'expired', label: 'Expired' },
  { value: 'deactivated', label: 'Deactivated' },
];

const Promotions: React.FC = () => {
  const { persona } = useAuth();
  const isAdmin = persona?.type === 'admin';

  const { promotions, loading, error, fetchPromotions, createPromotion, updatePromotion, clearError } =
    usePromotions();

  // UI state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [showForm, setShowForm] = useState(false);
  const [selectedPromotion, setSelectedPromotion] = useState<Promotion | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Initial load
  useEffect(() => {
    fetchPromotions({ filterStatus: statusFilter, searchTerm: searchQuery || undefined });
  }, []);

  // Reload when filters change
  useEffect(() => {
    fetchPromotions({
      filterStatus: statusFilter,
      searchTerm: searchQuery.trim() || undefined,
    });
  }, [statusFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPromotions({
      filterStatus: statusFilter,
      searchTerm: searchQuery.trim() || undefined,
    });
  };

  const handleRefresh = () => {
    fetchPromotions({
      filterStatus: statusFilter,
      searchTerm: searchQuery.trim() || undefined,
    });
  };

  const handleAddPromotion = () => {
    setSelectedPromotion(null);
    setShowForm(true);
  };

  const handleEditPromotion = (promo: Promotion) => {
    setSelectedPromotion(promo);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setSelectedPromotion(null);
  };

  const handleSubmit = async (formData: PromotionFormData) => {
    if (!persona?.id) throw new Error('Account ID not found.');

    let result: { success: boolean; message: string };

    if (selectedPromotion) {
      result = await updatePromotion({
        p_requesting_account_id: persona.id,
        p_promo_id: selectedPromotion.id,
        p_name: formData.name,
        p_discount_type: formData.discount_type,
        p_discount_value: formData.discount_value,
        p_start_date: formData.start_date,
        p_end_date: formData.end_date,
        p_is_active: formData.is_active,
        p_applies_to_all_products: formData.applies_to_all_products,
        p_eligible_product_ids: formData.eligible_product_ids,
        p_coupon_code: formData.coupon_code?.trim() || null,
      });
    } else {
      result = await createPromotion({
        p_requesting_account_id: persona.id,
        p_name: formData.name,
        p_discount_type: formData.discount_type,
        p_discount_value: formData.discount_value,
        p_start_date: formData.start_date,
        p_end_date: formData.end_date,
        p_applies_to_all_products: formData.applies_to_all_products,
        p_eligible_product_ids: formData.eligible_product_ids,
        p_coupon_code: formData.coupon_code?.trim() || null,
      });
    }

    if (!result.success) {
      throw new Error(result.message);
    }

    handleCloseForm();
    setSuccessMessage(result.message);
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  const hasActiveFilters = searchQuery || statusFilter !== 'all';

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    fetchPromotions({});
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">

        {/* Page Header */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-violet-600 rounded-xl flex items-center justify-center shadow-sm">
                <Tag className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                  Promotions & Discounts
                </h1>
                <p className="text-sm text-gray-500 mt-0.5">
                  {isAdmin
                    ? 'Manage discount campaigns and promotional periods'
                    : 'View active promotions and discount schedules'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                id="promotions-refresh-btn"
                onClick={handleRefresh}
                disabled={loading}
                className="inline-flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors font-medium"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
              </button>

              {isAdmin && (
                <button
                  id="promotions-add-btn"
                  onClick={handleAddPromotion}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-violet-600 text-white text-sm rounded-lg hover:bg-violet-700 transition-colors font-medium shadow-sm"
                >
                  <Plus className="h-4 w-4" />
                  New Promotion
                </button>
              )}
            </div>
          </div>

          {/* Success Banner */}
          {successMessage && (
            <div className="mt-4 p-3.5 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2.5">
              <div className="flex-shrink-0 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center">
                <svg className="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <p className="text-sm text-emerald-800 font-medium">{successMessage}</p>
            </div>
          )}

          {/* Error Banner */}
          {error && (
            <div className="mt-4 p-3.5 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2.5">
              <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-red-800 font-medium">Error loading promotions</p>
                <p className="text-sm text-red-600 mt-0.5">{error}</p>
                <button
                  onClick={() => { clearError(); handleRefresh(); }}
                  className="mt-1.5 text-sm text-red-700 hover:text-red-800 font-medium underline"
                >
                  Try again
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6 shadow-sm">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <form onSubmit={handleSearch} className="flex-1 flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                <input
                  id="promotions-search"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name or coupon code…"
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                />
              </div>
              <button
                type="submit"
                className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 transition-colors font-medium"
              >
                Search
              </button>
            </form>

            {/* Status filter */}
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-400 flex-shrink-0" />
              <select
                id="promotions-status-filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {hasActiveFilters && (
            <div className="mt-3 flex justify-end">
              <button
                onClick={clearFilters}
                className="text-xs text-violet-600 hover:text-violet-800 font-medium transition-colors"
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <LoadingSpinner size="large" />
          </div>
        ) : (
          <PromotionList
            promotions={promotions}
            onEdit={handleEditPromotion}
            isAdmin={isAdmin}
          />
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <PromotionForm
          promotion={selectedPromotion}
          onSubmit={handleSubmit}
          onCancel={handleCloseForm}
          isAdmin={isAdmin}
        />
      )}
    </div>
  );
};

export default Promotions;
