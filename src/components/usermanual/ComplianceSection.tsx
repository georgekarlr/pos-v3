import React from 'react'

export const ComplianceSection: React.FC = () => {
  return (
    <div className="space-y-4 text-sm text-gray-700">
      <p>
        <strong>Sub-Menu:</strong> Reports &amp; Compliance | <strong>Access:</strong> X-Reading (Admin, Staff), Z-Reading &amp; E-Journal (Admin only)
      </p>

      <h3 className="text-base font-semibold text-gray-800 mt-2">1. X-Reading</h3>
      <p>
        <strong>Route:</strong> <code className="bg-gray-100 px-1 rounded">/reports-compliance/x-reading</code>
      </p>
      <p>
        Generates a temporary snapshot report of the selected terminal's daily activity:
      </p>
      <ul className="list-disc list-inside space-y-1 ml-2">
        <li>Displays gross sales, net sales, voids, refunds, senior citizen discounts, tax values, and payment collections breakdown (Cash, Card, GCash, etc.).</li>
        <li><strong>Non-persistent:</strong> No values are committed to database state on creation. Can be printed multiple times throughout shifts.</li>
        <li><strong>Physical Printout:</strong> Includes the software provider details and PTU compliance footer, matching Z-reading formats.</li>
      </ul>

      <h3 className="text-base font-semibold text-gray-800 mt-4">2. Z-Reading</h3>
      <p>
        <strong>Route:</strong> <code className="bg-gray-100 px-1 rounded">/reports-compliance/z-reading</code>
      </p>
      <p>
        The official daily closing procedure required for tax registry and audit logs:
      </p>
      <ul className="list-disc list-inside space-y-1.5 ml-2">
        <li>Compiles active sales transactions and writes them into a permanent ledger lock.</li>
        <li>Increments the Z-Counter and resets the daily transaction subtotal counts back to zero.</li>
        <li><strong>Database Lock:</strong> A permanent, non-reversible transaction. Updates cumulative grand totals in the database. Logs the event with PTU (Permit to Use) numbers.</li>
      </ul>

      <h3 className="text-base font-semibold text-gray-800 mt-4">3. Electronic Journal (E-Journal)</h3>
      <p>
        <strong>Route:</strong> <code className="bg-gray-100 px-1 rounded">/reports-compliance/e-journal</code>
      </p>
      <p>
        A complete audit log of all system actions:
      </p>
      <ul className="list-disc list-inside space-y-1 ml-2">
        <li>Logs transactions, refunds, logins, settings modifications, voided sales, and stock adjustments.</li>
        <li>Enables searching and filtering of audit log strings by keywords, terminal IDs, or cashier names.</li>
        <li>Fully compliant with tax requirements requiring a tamper-proof digital audit log trail.</li>
      </ul>
    </div>
  )
}
