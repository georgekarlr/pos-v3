import React from 'react'

export const InstallmentSection: React.FC = () => {
  return (
    <div className="space-y-4 text-sm text-gray-700">
      <p>
        <strong>Route:</strong> <code className="bg-gray-100 px-1 rounded">/installments</code> | <strong>Access:</strong> Admin, Staff
      </p>
      <p>
        Installments support purchasing inventory items via custom layaway contracts with monthly payments.
      </p>

      <h3 className="text-base font-semibold text-gray-800 mt-2">1. Contracts Directory Layout</h3>
      <p>
        The page is split into two sections:
      </p>
      <ul className="list-disc list-inside space-y-1 ml-2">
        <li><strong>Left Panel (Contracts List):</strong> Lists all active and past layaway contracts.
          <ul className="list-circle list-inside space-y-1 ml-4 text-xs">
            <li><strong>Search Bar:</strong> Search by customer name or invoice number.</li>
            <li><strong>Status Filters:</strong> Filter contracts by status tabs: All, Active, Completed, or Defaulted.</li>
            <li><strong>Progress Bar:</strong> Shows total amount paid and percentage paid relative to the contract's total financed + interest value.</li>
          </ul>
        </li>
        <li><strong>Right Panel (Contract Detail):</strong> Displays schedules, payment history, and actions for the selected contract. If no contract is selected, it shows the "+ New Installment Sale" button.</li>
      </ul>

      <h3 className="text-base font-semibold text-gray-800 mt-4">2. Creating an Installment Sale</h3>
      <p>
        Click **+ New Installment Sale** in the right panel empty state to launch the 4-step configuration wizard:
      </p>
      <ol className="list-decimal list-inside space-y-1 ml-2 text-xs">
        <li><strong>Customer:</strong> Search and select from the registered customer list.</li>
        <li><strong>Products:</strong> Add catalog items and specify quantities.</li>
        <li><strong>Terms:</strong> Configure the downpayment amount, payment method (Cash, GCash, Card, etc.), contract duration (months), and flat interest rate (%).</li>
        <li><strong>Confirm:</strong> Review the calculated monthly due and total interest (computed in real-time) before creating the contract.</li>
      </ol>

      <h3 className="text-base font-semibold text-gray-800 mt-4">3. Contract Schedule Logs</h3>
      <p>
        Selecting a contract from the list reveals its breakdown:
      </p>
      <ul className="list-disc list-inside space-y-1 ml-2">
        <li>Displays Month, Due Date, Amount Due, Amount Paid, and Payment Status.</li>
        <li>Schedules are badged as: **Pending** (due soon), **Partial** (partially paid), **Paid** (fully closed), **Late** (past due date), or **Defaulted** (written off).</li>
      </ul>

      <h3 className="text-base font-semibold text-gray-800 mt-4">4. Contract Operations</h3>
      <div className="overflow-x-auto rounded-lg border border-gray-200 mt-1">
        <table className="min-w-full text-xs">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left font-semibold text-gray-700">Contract Action</th>
              <th className="px-3 py-2 text-left font-semibold text-gray-700">Method details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {[
              ['Record Payment', 'Receives a payment amount from the customer. The engine automatically cascades the money starting from the oldest outstanding monthly schedule.'],
              ['Write Off Contract', 'Mark a defaulted agreement as uncollectable. Wipes active schedules and changes status to Defaulted. Requires recording a write-off justification.'],
              ['Recover Debt', 'Enables receiving payments on a defaulted/written-off contract. Decreases loss values in database ledger reporting.']
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
