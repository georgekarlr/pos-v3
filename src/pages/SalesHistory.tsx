import React, { useEffect, useMemo, useState } from 'react'
import { History, AlertCircle } from 'lucide-react'
import SalesFilters, { SalesFiltersValue } from '../components/sales/SalesFilters'
import SalesTable from '../components/sales/SalesTable'
import PaginationControls from '../components/sales/PaginationControls'
import ReceiptModal from '../components/pos/ReceiptModal'
import { ReceiptData } from '../components/pos/Receipt'
import { salesService } from '../services/salesService'
import { mapSaleDetailsToReceipt } from '../utils/receiptMapping'
import { SalesHistoryRow } from '../types/sales'
import RefundModal from '../components/sales/RefundModal'
import RefundListModal from '../components/sales/RefundListModal'
import { useAuth } from '../contexts/AuthContext'

const PAGE_SIZE = 20

function toStartOfDayISO(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toISOString()
}

function toEndOfDayISO(dateStr: string): string {
  const d = new Date(dateStr + 'T23:59:59.999')
  return d.toISOString()
}

const SalesHistory: React.FC = () => {
  const { persona } = useAuth()
  const [filters, setFilters] = useState<SalesFiltersValue>({ search: '', startDate: null, endDate: null })
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [rows, setRows] = useState<SalesHistoryRow[]>([])
  const [hasNext, setHasNext] = useState(false)

  const [receiptOpen, setReceiptOpen] = useState(false)
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null)

  const [refundOpen, setRefundOpen] = useState(false)
  const [refundOrderId, setRefundOrderId] = useState<number | null>(null)
  const [refundListOpen, setRefundListOpen] = useState(false)
  const [refundListOrderId, setRefundListOrderId] = useState<number | null>(null)

  const offset = useMemo(() => (page - 1) * PAGE_SIZE, [page])

  const fetchRows = async () => {
    setLoading(true)
    setError(null)
    try {
      const params = {
        limit: PAGE_SIZE,
        offset,
        searchTerm: filters.search || null,
        startDate: filters.startDate ? toStartOfDayISO(filters.startDate) : null,
        endDate: filters.endDate ? toEndOfDayISO(filters.endDate) : null
      }
      const { rows } = await salesService.getSalesHistory(params)
      setRows(rows)
      setHasNext(rows.length === PAGE_SIZE)
    } catch (e: any) {
      console.error(e)
      setError(e?.message || 'Failed to load sales history')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRows()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page])

  const applyFilters = () => {
    setPage(1)
    fetchRows()
  }

  const clearFilters = () => {
    setPage(1)
    fetchRows()
  }

  const openReceipt = async (orderId: number) => {
    try {
      setLoading(true)
      const details = await salesService.getSaleDetailsById(orderId)
      const mapped = mapSaleDetailsToReceipt(details)
      setReceiptData(mapped)
      setReceiptOpen(true)
    } catch (e: any) {
      console.error(e)
      setError(e?.message || 'Failed to load sale details')
    } finally {
      setLoading(false)
    }
  }

  const openRefund = (orderId: number) => {
    setRefundOrderId(orderId)
    setRefundOpen(true)
  }

  const openRefundsForOrder = (orderId: number) => {
    setRefundListOrderId(orderId)
    setRefundListOpen(true)
  }

  const openAllRefunds = () => {
    setRefundListOrderId(null)
    setRefundListOpen(true)
  }

  const requestingAccountId = persona?.id ?? null

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="mb-4 sm:mb-6">
          <div className="flex items-center justify-between gap-3">
            <div className="h-10 w-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <History className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Sales History</h1>
              <p className="mt-1 text-sm text-gray-500">View and search past transactions. Click an order to view the receipt.</p>
            </div>
            <div>
              <button onClick={openAllRefunds} className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-blue-300 text-blue-700 hover:bg-blue-50 text-sm">View All Refunds</button>
            </div>
          </div>

          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-red-800 font-medium">Error</p>
                <p className="text-sm text-red-600 mt-1">{error}</p>
              </div>
            </div>
          )}
        </div>

        <SalesFilters
          value={filters}
          onChange={setFilters}
          onApply={applyFilters}
          onClear={clearFilters}
        />

        <div className="mt-4">
          <SalesTable rows={rows} loading={loading} onView={openReceipt} onRefund={openRefund} onViewRefunds={openRefundsForOrder} />
          <PaginationControls
            page={page}
            pageSize={PAGE_SIZE}
            hasNext={hasNext}
            onPrev={() => setPage((p) => Math.max(1, p - 1))}
            onNext={() => setPage((p) => (hasNext ? p + 1 : p))}
          />
        </div>
      </div>

      <ReceiptModal open={receiptOpen} data={receiptData} onClose={() => setReceiptOpen(false)} />
      <RefundModal
        open={refundOpen}
        orderId={refundOrderId}
        requestingAccountId={requestingAccountId}
        onClose={() => setRefundOpen(false)}
        onSuccess={() => {
          // refresh rows after refund
          fetchRows()
        }}
      />
      <RefundListModal
        open={refundListOpen}
        onClose={() => setRefundListOpen(false)}
        requestingAccountId={requestingAccountId}
        orderId={refundListOrderId}
      />
    </div>
  )
}

export default SalesHistory
