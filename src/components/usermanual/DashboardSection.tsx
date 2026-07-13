import React from 'react'

export const DashboardSection: React.FC = () => {
  return (
    <div className="space-y-4 text-sm text-gray-700">
      <p>
        The <strong>Dashboard</strong> serves as a high-level operational overview for store performance on a selected date.
        By default it shows today's figures; use the date picker in the top-right corner to view any past date.
      </p>

      <h3 className="text-base font-semibold text-gray-800 mt-2">KPI Scorecards</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[
          [
            "Net Sales",
            "Total completed order revenue for the selected date minus any refunds processed on that date. Displayed in Philippine Peso (PHP)."
          ],
          [
            "Orders",
            "Total count of completed invoices/receipts for the selected date. Both online transactions and synced offline sales are counted."
          ],
          [
            "Collections",
            "Sum of all payment ledger entries (cash, card, GCash, etc.) for the selected date, excluding Petty Cash disbursements."
          ],
          [
            "Outstanding Debt",
            "Live snapshot of all unpaid obligations across the entire business: running tab balances from Debt Accounts plus unpaid installment schedule amounts. This figure is not date-filtered — it always reflects the current total."
          ],
        ].map(([title, desc]) => (
          <div key={title} className="border border-gray-200 rounded-lg p-3 bg-gray-50/50">
            <h4 className="font-semibold text-gray-800">{title}</h4>
            <p className="text-xs text-gray-500 mt-1">{desc}</p>
          </div>
        ))}
      </div>

      <h3 className="text-base font-semibold text-gray-800 mt-4">Date Picker</h3>
      <p>
        Use the calendar input in the welcome banner to browse historical performance. The page refetches all four KPIs,
        the top-products list, and the recent-orders list for the chosen date. Click <em>Back to Today</em> to return
        to the live view.
      </p>

      <h3 className="text-base font-semibold text-gray-800 mt-4">Dashboard Analytics</h3>
      <ul className="list-disc list-inside space-y-2 ml-2">
        <li>
          <strong>Top Products:</strong> Shows the top 5 products ranked by total units sold on the selected date.
          Provides quick awareness of trending or fast-moving inventory items.
        </li>
        <li>
          <strong>Recent Orders:</strong> A chronological list of the 5 most recent completed orders for the selected
          date. Displays the Invoice Number (falls back to Order ID), timestamp, customer name (Guest if unregistered),
          and total receipt amount.
        </li>
      </ul>
    </div>
  )
}
