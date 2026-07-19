// hooks/usePromotions.ts
import { useState, useCallback } from 'react';
import { PromotionService } from '../services/promotionService';
import type {
  Promotion,
  GetPromotionsParams,
  CreatePromotionParams,
  UpdatePromotionParams,
} from '../types/promotion';

export const usePromotions = () => {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- Fetch Promotions ---
  const fetchPromotions = useCallback(async (params: GetPromotionsParams = {}) => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: svcError } = await PromotionService.getPromotions(params);

      if (svcError) {
        setError(svcError);
        return;
      }

      setPromotions(data ?? []);
    } catch (err: any) {
      setError(err.message || 'Failed to load promotions.');
    } finally {
      setLoading(false);
    }
  }, []);

  // --- Create Promotion ---
  const createPromotion = async (params: CreatePromotionParams) => {
    setError(null);

    const { data, error: svcError } = await PromotionService.createPromotion(params);

    if (svcError) {
      setError(svcError);
      return { success: false, message: svcError };
    }

    if (data?.success) {
      await fetchPromotions();
      return { success: true, message: data.message };
    }

    const fallback = data?.message || 'Failed to create promotion.';
    setError(fallback);
    return { success: false, message: fallback };
  };

  // --- Update Promotion ---
  const updatePromotion = async (params: UpdatePromotionParams) => {
    setError(null);

    const { data, error: svcError } = await PromotionService.updatePromotion(params);

    if (svcError) {
      setError(svcError);
      return { success: false, message: svcError };
    }

    if (data?.success) {
      await fetchPromotions();
      return { success: true, message: data.message };
    }

    const fallback = data?.message || 'Failed to update promotion.';
    setError(fallback);
    return { success: false, message: fallback };
  };

  const clearError = () => setError(null);

  return {
    promotions,
    loading,
    error,
    fetchPromotions,
    createPromotion,
    updatePromotion,
    clearError,
  };
};

export type UsePromotionsReturn = ReturnType<typeof usePromotions>;
