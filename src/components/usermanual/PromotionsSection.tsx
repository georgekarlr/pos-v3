import React from 'react'

export const PromotionsSection: React.FC = () => {
  return (
    <div className="space-y-4 text-sm text-gray-700">
      <p>
        <strong>Route:</strong> <code className="bg-gray-100 px-1 rounded">/management/promotions</code> | <strong>Access:</strong> Admin (Full CRUD), Staff (Read-only promotions view)
      </p>

      <h3 className="text-base font-semibold text-gray-800 mt-2">1. Promotions Overview</h3>
      <p>
        The <strong>Promotions & Discounts</strong> page allows management of promotional campaigns and discount periods. The system automatically detects and applies active promotions to eligible cart items in real-time.
      </p>

      <h3 className="text-base font-semibold text-gray-800 mt-4">2. Promotion Configuration Fields</h3>
      <p>
        Creating or editing a promotion opens a sidebar modal with the following parameters:
      </p>

      <div className="overflow-x-auto rounded-lg border border-gray-200 mt-2">
        <table className="min-w-full text-xs">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left font-semibold text-gray-700">Config Parameter</th>
              <th className="px-3 py-2 text-left font-semibold text-gray-700">Function</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {[
              ['Promotion Name', 'Descriptive name of the campaign (e.g., Summer Sale 20% Off).'],
              ['Discount Type', 'Percentage (%) or Fixed Amount (₱). Defines how the discount is computed.'],
              ['Value', 'The numeric value of the discount. Percentage is capped at 100%.'],
              ['Start Date & End Date', 'The duration of the promotion. Automatically transitions between statuses based on the current time.'],
              ['Applies To', 'Define scope: All Products (entire store catalog) or Specific Products (using an interactive product multi-selector).'],
              ['Active Status', 'A toggle to activate or deactivate the promotion. Inactive promotions will not be applied under any condition.']
            ].map(([param, desc]) => (
              <tr key={param} className="hover:bg-gray-50">
                <td className="px-3 py-2 font-semibold text-gray-800 whitespace-nowrap">{param}</td>
                <td className="px-3 py-2 text-gray-600">{desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h3 className="text-base font-semibold text-gray-800 mt-4">3. Promotion Statuses</h3>
      <p>
        Promotions are categorized into one of four statuses:
      </p>
      <ul className="list-disc list-inside space-y-1 ml-2">
        <li><strong>Active:</strong> Currently running promotions. Discount is applied during checkouts.</li>
        <li><strong>Upcoming:</strong> Scheduled promotions with start dates in the future.</li>
        <li><strong>Expired:</strong> Past promotions whose end dates have passed.</li>
        <li><strong>Deactivated:</strong> Disabled promotions (where the active toggle is turned off).</li>
      </ul>

      <h3 className="text-base font-semibold text-gray-800 mt-4">4. POS Integration & Offline Mode</h3>
      <ul className="list-disc list-inside space-y-1 ml-2">
        <li><strong>Best Discount Selection:</strong> If a product qualifies for multiple active promotions, the system automatically calculates and applies the best discount per product.</li>
        <li><strong>Offline Support:</strong> Active promotions are stored in IndexedDB. Validity is verified locally client-side when offline, and promotional discount is saved to the local sync queue.</li>
        <li><strong>Receipt & Invoices:</strong> Promo discounts are itemized, showing a "Save ₱X" badge in the cart and mapping the Promo ID in the database.</li>
      </ul>
    </div>
  )
}
