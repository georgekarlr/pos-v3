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

      <h3 className="text-base font-semibold text-gray-800 mt-2">1. Creating an Installment Sale</h3>
      <p>
        Select a customer first, then click **+ New Installment Sale** to configure:
      </p>
      <ul className="list-disc list-inside space-y-1 ml-2">
        <li><strong>Cart:</strong> Select catalog items and quantities.</li>
        <li><strong>Downpayment:</strong> Cash or Gcash amount received immediately at purchase time.</li>
        <li><strong>Months to Pay:</strong> Contract span (e.g. 3, 6, 12 months).</li>
        <li><strong>Interest Rate (%):</strong> A flat percentage rate applied to the financed balance (Financed = Cart Total – Downpayment).</li>
      </ul>
      <p className="text-xs text-indigo-700 bg-indigo-50 border border-indigo-150 p-2.5 rounded-md">
        The dialog computes and updates the **Monthly Due** amount and **Total Interest Amount** in real-time before saving the contract.
      </p>

      <h3 className="text-base font-semibold text-gray-800 mt-4">2. Contract Schedule Logs</h3>
      <p>
        Selecting a contract reveals a breakdown table of schedules:
      </p>
      <ul className="list-disc list-inside space-y-1 ml-2">
        <li>Shows Month number, Due Date, Amount Due, Amount Paid, and Payment Status.</li>
        <li>Schedule badges: **Pending** (due soon), **Partial** (partially paid), **Paid** (fully closed), **Late** (past due date), or **Defaulted** (written off).</li>
      </ul>

      <h3 className="text-base font-semibold text-gray-800 mt-4">3. Contract Operations</h3>
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
