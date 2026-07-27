import React from 'react'
import { ProductFilters, initialProductFilters } from '../../hooks/useProducts'

interface ProductFilterBarProps {
  filters: ProductFilters
  onChange: (updated: ProductFilters) => void
  onReset: () => void
}

export const ProductFilterBar: React.FC<ProductFilterBarProps> = ({ filters, onChange, onReset }) => {
  const isFiltered =
    filters.searchQuery !== '' ||
    filters.activeFilter !== 'all' ||
    filters.forSaleFilter !== 'all' ||
    filters.inventoryTypeFilter !== 'all'

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6 shadow-sm">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">
            Search Products
          </label>
          <input
            type="text"
            value={filters.searchQuery}
            onChange={(e) => onChange({ ...filters, searchQuery: e.target.value })}
            placeholder="Search name, SKU, barcode..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">
            Active Status
          </label>
          <select
            value={filters.activeFilter}
            onChange={(e) =>
              onChange({ ...filters, activeFilter: e.target.value as ProductFilters['activeFilter'] })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="all">All (Active & Archived)</option>
            <option value="active">Active Only</option>
            <option value="inactive">Archived Only</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">
            Sale Status
          </label>
          <select
            value={filters.forSaleFilter}
            onChange={(e) =>
              onChange({ ...filters, forSaleFilter: e.target.value as ProductFilters['forSaleFilter'] })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="all">All Sale Statuses</option>
            <option value="for_sale">For Sale Only</option>
            <option value="not_for_sale">Not For Sale Only</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">
            Inventory Type
          </label>
          <select
            value={filters.inventoryTypeFilter}
            onChange={(e) =>
              onChange({
                ...filters,
                inventoryTypeFilter: e.target.value as ProductFilters['inventoryTypeFilter']
              })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="all">All Inventory Types</option>
            <option value="non_perishable">Non-Perishable</option>
            <option value="perishable">Perishable</option>
          </select>
        </div>
      </div>

      {isFiltered && (
        <div className="mt-3 flex justify-end">
          <button
            onClick={onReset}
            className="text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors"
          >
            Clear Filters
          </button>
        </div>
      )}
    </div>
  )
}

export default ProductFilterBar
