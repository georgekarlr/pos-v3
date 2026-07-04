import { useState, useCallback } from 'react';
import { InstallmentService } from '../services/installmentService';
import {
  CustomerInstallments,
  InstallmentContract,
  CreateInstallmentSaleParams,
  PayInstallmentScheduleParams,
} from '../types/installment';

interface UseInstallmentsReturn {
  installments: CustomerInstallments | null;
  selectedContract: InstallmentContract | null;
  loading: boolean;
  error: string | null;
  setSelectedContract: (contract: InstallmentContract | null) => void;
  loadCustomerInstallments: (customerId: number) => Promise<void>;
  createSale: (params: CreateInstallmentSaleParams) => Promise<{ success: boolean; message: string }>;
  paySchedule: (params: PayInstallmentScheduleParams) => Promise<{ success: boolean; message: string }>;
  clearError: () => void;
  reset: () => void;
}

export function useInstallments(): UseInstallmentsReturn {
  const [installments, setInstallments] = useState<CustomerInstallments | null>(null);
  const [selectedContract, setSelectedContract] = useState<InstallmentContract | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  const reset = useCallback(() => {
    setInstallments(null);
    setSelectedContract(null);
    setError(null);
  }, []);

  const loadCustomerInstallments = useCallback(async (customerId: number) => {
    setLoading(true);
    setError(null);
    setSelectedContract(null);

    const { data, error: serviceError } = await InstallmentService.getCustomerInstallments(customerId);

    if (serviceError) {
      setError(serviceError);
    } else {
      setInstallments(data);
    }

    setLoading(false);
  }, []);

  const createSale = useCallback(async (params: CreateInstallmentSaleParams) => {
    setLoading(true);
    setError(null);

    const { data, error: serviceError } = await InstallmentService.createInstallmentSale(params);

    setLoading(false);

    if (serviceError) {
      setError(serviceError);
      return { success: false, message: serviceError };
    }

    return { success: true, message: data?.message || 'Installment sale created.' };
  }, []);

  const paySchedule = useCallback(async (params: PayInstallmentScheduleParams) => {
    setLoading(true);
    setError(null);

    const { data, error: serviceError } = await InstallmentService.payInstallmentSchedule(params);

    setLoading(false);

    if (serviceError) {
      setError(serviceError);
      return { success: false, message: serviceError };
    }

    // Refresh the contract list after payment so schedules update live
    if (installments?.customer?.id) {
      await loadCustomerInstallments(installments.customer.id);
    }

    return { success: true, message: data?.message || 'Payment processed.' };
  }, [installments, loadCustomerInstallments]);

  return {
    installments,
    selectedContract,
    loading,
    error,
    setSelectedContract,
    loadCustomerInstallments,
    createSale,
    paySchedule,
    clearError,
    reset,
  };
}
