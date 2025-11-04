import React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface PaginationControlsProps {
  page: number
  pageSize: number
  pageCountKnown?: boolean
  hasNext: boolean
  onPrev: () => void
  onNext: () => void
}

const PaginationControls: React.FC<PaginationControlsProps> = ({ page, pageSize, hasNext, onPrev, onNext }) => {
  return (
    <div className="flex items-center justify-between mt-3">
      <div className="text-sm text-gray-600">Page {page} · {pageSize} per page</div>
      <div className="flex items-center gap-2">
        <button
          onClick={onPrev}
          disabled={page <= 1}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Previous</span>
        </button>
        <button
          onClick={onNext}
          disabled={!hasNext}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

export default PaginationControls
