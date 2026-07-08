import React from 'react'

export const DashboardSection: React.FC = () => {
  return (
    <div className="space-y-4 text-sm text-gray-700">
      <p>
        The <strong>Dashboard</strong> serves as a high-level operational overview for current store performance.
      </p>

      <h3 className="text-base font-semibold text-gray-800 mt-2">KPI Scorecards</h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          ['Today\'s Revenue', 'Total monetary sales recorded starting at 12:00 AM of the current day. Displays in Philippine Peso (PHP).'],
          ['Today\'s Orders', 'Total count of invoices/receipts generated today. Both online transactions and synced offline sales are counted.'],
          ['Average Sale', 'Today\'s total revenue divided by today\'s total orders. Gives a benchmark on customer purchasing baskets.']
        ].map(([title, desc]) => (
          <div key={title} className="border border-gray-200 rounded-lg p-3 bg-gray-50/50">
            <h4 className="font-semibold text-gray-800">{title}</h4>
            <p className="text-xs text-gray-500 mt-1">{desc}</p>
          </div>
        ))}
      </div>

      <h3 className="text-base font-semibold text-gray-800 mt-4">Dashboard Analytics</h3>
      <ul className="list-disc list-inside space-y-2 ml-2">
        <li>
          <strong>Top Products Today:</strong> Shows the top 5 product rows ranked by total item count sold. Provides quick stock awareness on trending products.
        </li>
        <li>
          <strong>Recent Orders:</strong> A chronological list of the 5 most recent sales orders. Displays the Order ID, Timestamp, Customer name (Guest if unregistered), and total receipt amount.
        </li>
      </ul>
    </div>
  )
}
