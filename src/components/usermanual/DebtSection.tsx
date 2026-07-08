import React from 'react'

export const DebtSection: React.FC = () => {
  return (
    <div className="space-y-4 text-sm text-gray-700">
      <h3 className="text-base font-semibold text-gray-800">1. Customers Directory</h3>
      <p>
        <strong>Route:</strong> <code className="bg-gray-100 px-1 rounded">/management/customers</code> | <strong>Access:</strong> Admin, Staff
      </p>
      <p>
        Manage customer registration profiles: Name, Phone, Email, and physical Address. Includes actions to **Edit Details** and **Delete profile**.
      </p>

      <h3 className="text-base font-semibold text-gray-800 mt-4">2. Debt Wizard</h3>
      <p>
        <strong>Route:</strong> <code className="bg-gray-100 px-1 rounded">/debt-management/wizard</code>
      </p>
      <p>
        A 4-step wizard to file an official credit transaction:
      </p>
      <ol className="list-decimal list-inside space-y-1 ml-2">
        <li><strong>Customer:</strong> Search and select from the registry, or immediately click "+ Add New Customer" to register a profile.</li>
        <li><strong>Items:</strong> Add catalog items to the debt order. This records product units being released on credit.</li>
        <li><strong>Loan:</strong> Set an optional Cash Loan Amount (e.g. lending money), add descriptive notes, and select the transaction date.</li>
        <li><strong>Summary:</strong> Displays total items, cash loan value, and customer detail. Click <strong>Submit</strong> to create the debt record.</li>
      </ol>

      <h3 className="text-base font-semibold text-gray-800 mt-4">3. Customer Debt Accounts</h3>
      <p>
        <strong>Route:</strong> <code className="bg-gray-100 px-1 rounded">/debt-management/debts</code>
      </p>
      <ul className="list-disc list-inside space-y-1 ml-2">
        <li>Displays customer rows with running balances. Color code: <span className="text-red-600 font-semibold">Red (positive balance)</span> means the customer owes money. <span className="text-green-600 font-semibold">Green (negative balance)</span> means they have a deposit credit.</li>
        <li>Click <strong>👁️ View Details</strong> to expand details showing account credit limit, status, unsettled credit purchases, and settled history log.</li>
        <li>Click <strong>Manage Account</strong> to execute:</li>
      </ul>

      <div className="overflow-x-auto rounded-lg border border-gray-200 mt-2">
        <table className="min-w-full text-xs">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left font-semibold text-gray-700">Account Action</th>
              <th className="px-3 py-2 text-left font-semibold text-gray-700">Effect</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {[
              ['PAYMENT', 'Reduces customer balance. Records amount and method (Cash, Card, GCash, Bank).'],
              ['DEPOSIT', 'Customer advances cash. Decreases balance into negative/credit territory.'],
              ['WITHDRAW_DEPOSIT', 'Customer withdraws their advance credit.'],
              ['SETTLE', 'Admin/Staff clicks this to wipe customer balance to zero and mark all unsettled invoices as paid.']
            ].map(([act, desc]) => (
              <tr key={act} className="hover:bg-gray-50">
                <td className="px-3 py-2 font-semibold text-gray-800 whitespace-nowrap">{act}</td>
                <td className="px-3 py-2 text-gray-600">{desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
