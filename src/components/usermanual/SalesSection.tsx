import React from 'react'

export const SalesSection: React.FC = () => {
  return (
    <div className="space-y-4 text-sm text-gray-700">
      <p>
        <strong>Route:</strong> <code className="bg-gray-100 px-1 rounded">/management/sales-history</code> | <strong>Access:</strong> Admin, Staff
      </p>

      <h3 className="text-base font-semibold text-gray-800 mt-2">1. Sales History Directory</h3>
      <p>
        A searchable ledger of every completed order. Rows show Order ID, timestamp, cashier name, customer name, transaction totals, and payment status.
      </p>

      <h3 className="text-base font-semibold text-gray-800 mt-4">2. Filter &amp; Search Tools</h3>
      <p>
        Narrow down transactions using the filters block:
      </p>
      <ul className="list-disc list-inside space-y-1 ml-2">
        <li><strong>Search Input:</strong> Match order IDs, customer names, or cashier names.</li>
        <li><strong>Start &amp; End Date Pickers:</strong> Filter transactions within date bounds. Filters automatically set timestamps to start-of-day (00:00:00) and end-of-day (23:59:59).</li>
      </ul>

      <h3 className="text-base font-semibold text-gray-800 mt-4">3. Sales Row Actions</h3>
      <div className="overflow-x-auto rounded-lg border border-gray-200 mt-1">
        <table className="min-w-full text-xs">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left font-semibold text-gray-700">Action Link</th>
              <th className="px-3 py-2 text-left font-semibold text-gray-700">Operation details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {[
              ['👁️ View Receipt', 'Re-open the thermal receipt format for printout or customer reference.'],
              ['Refund Item', 'Perform partial or full itemized refunds. Select exact line items and quantities, then select a reason.'],
              ['View Applied Refunds', 'Lists refund logs associated with this specific order.'],
              ['Void Transaction', 'Fully invalidate a transaction. Reverts inventory stock deductions and balances. Requires confirmation.']
            ].map(([act, desc]) => (
              <tr key={act} className="hover:bg-gray-50">
                <td className="px-3 py-2 font-semibold text-gray-800 whitespace-nowrap">{act}</td>
                <td className="px-3 py-2 text-gray-600">{desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h3 className="text-base font-semibold text-gray-800 mt-4">4. Manual Sales Logs &amp; Refunds Ledger</h3>
      <ul className="list-disc list-inside space-y-1.5 ml-2">
        <li><strong>Record Manual Sale:</strong> Backdate or log a sales record completed outside the terminal interface. Form requires adding items, amounts, and customer context.</li>
        <li><strong>View All Refunds:</strong> Open a centralized refunds audit log auditing all partial/full transaction returns in the system.</li>
      </ul>
    </div>
  )
}
