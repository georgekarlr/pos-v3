import { useState, useCallback, useRef } from 'react';
import { InstallmentService } from '../services/installmentService';
import {
  InstallmentContractSummary,
  ContractStatus,
} from '../types/installment';

const DEFAULT_PAGE_SIZE = 20;

interface UseAllInstallmentContractsOptions {
  /** Number of rows per page (default: 20) */
  pageSize?: number;
}

interface UseAllInstallmentContractsReturn {
  contracts: InstallmentContractSummary[];
  loading: boolean;
  error: string | null;
  /** Current 0-based page index */
  page: number;
  searchTerm: string;
  statusFilter: ContractStatus | null;
  /** True when there might be a next page (returned rows === pageSize) */
  hasMore: boolean;
  /** Load/reload the first page with current filters */
  load: (accountId: number) => Promise<void>;
  /** Go to the next page */
  nextPage: (accountId: number) => Promise<void>;
  /** Go to the previous page */
  prevPage: (accountId: number) => Promise<void>;
  /** Update search term and reload from page 0 */
  setSearch: (term: string, accountId: number) => Promise<void>;
  /** Update status filter and reload from page 0 */
  setStatusFilter: (status: ContractStatus | null, accountId: number) => Promise<void>;
  clearError: () => void;
  reset: () => void;
}

export function useAllInstallmentContracts(
  options: UseAllInstallmentContractsOptions = {}
): UseAllInstallmentContractsReturn {
  const pageSize = options.pageSize ?? DEFAULT_PAGE_SIZE;

  const [contracts, setContracts] = useState<InstallmentContractSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilterState] = useState<ContractStatus | null>(null);
  const [hasMore, setHasMore] = useState(false);

  // Stable refs so callbacks don't go stale when filters change internally
  const searchRef = useRef(searchTerm);
  const statusRef = useRef(statusFilter);

  const fetch = useCallback(
    async (accountId: number, nextPage: number, search: string, status: ContractStatus | null) => {
      setLoading(true);
      setError(null);

      const { data, error: serviceError } = await InstallmentService.getAllContracts({
        p_requesting_account_id: accountId,
        p_limit: pageSize,
        p_offset: nextPage * pageSize,
        p_search_term: search || null,
        p_status_filter: status,
      });

      setLoading(false);

      if (serviceError) {
        setError(serviceError);
        return;
      }

      const rows = data ?? [];
      setContracts(rows);
      setPage(nextPage);
      setHasMore(rows.length === pageSize);
    },
    [pageSize]
  );

  const load = useCallback(
    async (accountId: number) => {
      await fetch(accountId, 0, searchRef.current, statusRef.current);
    },
    [fetch]
  );

  const nextPage = useCallback(
    async (accountId: number) => {
      await fetch(accountId, page + 1, searchRef.current, statusRef.current);
    },
    [fetch, page]
  );

  const prevPage = useCallback(
    async (accountId: number) => {
      if (page === 0) return;
      await fetch(accountId, page - 1, searchRef.current, statusRef.current);
    },
    [fetch, page]
  );

  const setSearch = useCallback(
    async (term: string, accountId: number) => {
      searchRef.current = term;
      setSearchTerm(term);
      await fetch(accountId, 0, term, statusRef.current);
    },
    [fetch]
  );

  const setStatusFilter = useCallback(
    async (status: ContractStatus | null, accountId: number) => {
      statusRef.current = status;
      setStatusFilterState(status);
      await fetch(accountId, 0, searchRef.current, status);
    },
    [fetch]
  );

  const clearError = useCallback(() => setError(null), []);

  const reset = useCallback(() => {
    setContracts([]);
    setLoading(false);
    setError(null);
    setPage(0);
    setSearchTerm('');
    searchRef.current = '';
    setStatusFilterState(null);
    statusRef.current = null;
    setHasMore(false);
  }, []);

  return {
    contracts,
    loading,
    error,
    page,
    searchTerm,
    statusFilter,
    hasMore,
    load,
    nextPage,
    prevPage,
    setSearch,
    setStatusFilter,
    clearError,
    reset,
  };
}
