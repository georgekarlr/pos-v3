import { useState, useCallback } from 'react';
import { InstallmentService } from '../services/installmentService';
import {
  CustomerInstallments,
  InstallmentContract,
  CreateInstallmentSaleParams,
  CreateInstallmentSaleResult,
  PayInstallmentScheduleParams,
  PayInstallmentScheduleResult,
  WriteOffInstallmentContractParams,
  WriteOffInstallmentContractResult,
  RecoverInstallmentDebtParams,
  RecoverInstallmentDebtResult,
} from '../types/installment';
import { ServiceResponse } from '../types/pos';

interface UseInstallmentsReturn {
  installments: CustomerInstallments | null;
  selectedContract: InstallmentContract | null;
  loading: boolean;
  error: string | null;
  setSelectedContract: (contract: InstallmentContract | null) => void;
  loadCustomerInstallments: (customerId: number) => Promise<void>;
  createSale: (params: CreateInstallmentSaleParams) => Promise<ServiceResponse<CreateInstallmentSaleResult>>;
  paySchedule: (params: PayInstallmentScheduleParams) => Promise<ServiceResponse<PayInstallmentScheduleResult>>;
  writeOff: (params: WriteOffInstallmentContractParams) => Promise<ServiceResponse<WriteOffInstallmentContractResult>>;
  recoverDebt: (params: RecoverInstallmentDebtParams) => Promise<ServiceResponse<RecoverInstallmentDebtResult>>;
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

    const result = await InstallmentService.createInstallmentSale(params);

    setLoading(false);

    if (result.error) {
      setError(result.error);
    }

    return result;
  }, []);

  const paySchedule = useCallback(async (params: PayInstallmentScheduleParams) => {
    setLoading(true);
    setError(null);

    const result = await InstallmentService.payInstallmentSchedule(params);

    setLoading(false);

    if (result.error) {
      setError(result.error);
    } else {
      // Refresh the contract list after payment so schedules update live
      if (installments?.customer?.id) {
        await loadCustomerInstallments(installments.customer.id);
      }
    }

    return result;
  }, [installments, loadCustomerInstallments]);

  const writeOff = useCallback(async (params: WriteOffInstallmentContractParams) => {
    setLoading(true);
    setError(null);

    const result = await InstallmentService.writeOffContract(params);

    setLoading(false);

    if (result.error) {
      setError(result.error);
    } else {
      if (installments?.customer?.id) {
        await loadCustomerInstallments(installments.customer.id);
      }
    }

    return result;
  }, [installments, loadCustomerInstallments]);

  const recoverDebt = useCallback(async (params: RecoverInstallmentDebtParams) => {
    setLoading(true);
    setError(null);

    const result = await InstallmentService.recoverDebt(params);

    setLoading(false);

    if (result.error) {
      setError(result.error);
    } else {
      if (installments?.customer?.id) {
        await loadCustomerInstallments(installments.customer.id);
      }
    }

    return result;
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
    writeOff,
    recoverDebt,
    clearError,
    reset,
  };
}
