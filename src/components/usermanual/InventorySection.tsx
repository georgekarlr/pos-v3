import React from 'react'

export const InventorySection: React.FC = () => {
  return (
    <div className="space-y-4 text-sm text-gray-700">
      <p>
        <strong>Route:</strong> <code className="bg-gray-100 px-1 rounded">/management/inventory</code> | <strong>Access:</strong> Admin, Staff
      </p>

      <h3 className="text-base font-semibold text-gray-800 mt-2">1. Stock Status Indicators</h3>
      <p>
        Each product shows a visual badge representing availability status:
      </p>
      <ul className="list-disc list-inside space-y-1 ml-2">
        <li><span className="text-green-700 font-semibold bg-green-50 px-1.5 py-0.5 rounded">Healthy</span>: Inventory is comfortably above the low stock threshold.</li>
        <li><span className="text-amber-700 font-semibold bg-amber-50 px-1.5 py-0.5 rounded">Low Stock</span>: Stock has dipped below the configured alarm limit.</li>
        <li><span className="text-red-700 font-semibold bg-red-50 px-1.5 py-0.5 rounded">Out of Stock</span>: Zero units available. Clicks on the POS grid will block transaction addition.</li>
      </ul>

      <h3 className="text-base font-semibold text-gray-800 mt-4">2. Batch Tracking &amp; Expirations</h3>
      <p>
        For perishable items, the system requires batch tracking:
      </p>
      <ul className="list-disc list-inside space-y-1 ml-2">
        <li>Each batch has a unique identification key, quantity, and expiration timestamp.</li>
        <li>Sales automatically deduct stock from the earliest expiring batch (FIFO logic).</li>
        <li>The total product stock calculation automatically excludes expired batches (where the expiration date has passed).</li>
      </ul>

      <h3 className="text-base font-semibold text-gray-800 mt-4">3. Stock Adjustments</h3>
      <div className="overflow-x-auto rounded-lg border border-gray-200 mt-1">
        <table className="min-w-full text-xs">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left font-semibold text-gray-700">Adjustment Tool</th>
              <th className="px-3 py-2 text-left font-semibold text-gray-700">Operational Purpose</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {[
              ['Adjust Quantity', 'Instantly update the stock count of an existing batch to match physical inventories.'],
              ['Adjust Batch', 'Add a new inventory batch with a custom expiration date, or edit the date of an existing batch.'],
              ['Write Off Batch', 'Deduct stock for spoilage, theft, damage, or expiration. Requires recording an official reason. Updates the ledger history automatically.']
            ].map(([tool, desc]) => (
              <tr key={tool} className="hover:bg-gray-50">
                <td className="px-3 py-2 font-semibold text-gray-800 whitespace-nowrap">{tool}</td>
                <td className="px-3 py-2 text-gray-600">{desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
