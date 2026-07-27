import React from 'react'

export const ComplianceSection: React.FC = () => {
  return (
    <div className="space-y-4 text-sm text-gray-700">
      <p>
        <strong>Sub-Menu:</strong> Reports &amp; Compliance | <strong>Access:</strong> X-Reading (Admin, Staff), Z-Reading, E-Journal &amp; System Audit Trail (Admin only)
      </p>

      <h3 className="text-base font-semibold text-gray-800 mt-2">1. X-Reading</h3>
      <p>
        <strong>Route:</strong> <code className="bg-gray-100 px-1 rounded">/reports-compliance/x-reading</code>
      </p>
      <p>
        Generates a temporary snapshot report of the selected terminal's daily activity:
      </p>
      <ul className="list-disc list-inside space-y-1 ml-2">
        <li>Displays gross sales, net sales, deductions breakdown (promotions, SC/PWD discounts, VAT-exempt discounts, refunds/returns, and voids), and payment collections breakdown (Cash, Card, GCash, etc.).</li>
        <li><strong>Unified BIR Tax Breakdown:</strong> Itemizes VATable sales base, Gross VAT Amount (12%), Less: Refund VAT, Net VAT Payable, VAT-Exempt sales, and Zero-Rated sales.</li>
        <li><strong>Non-persistent:</strong> No values are committed to database state on creation. Can be printed multiple times throughout shifts.</li>
        <li><strong>Receipt Preview &amp; Printout:</strong> Displays a clean BIR receipt preview matching thermal print outputs with exact business name, address, TIN, MIN, and software provider compliance details.</li>
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
        <li>Increments the sequential Z-Counter and resets the daily transaction subtotal counts back to zero.</li>
        <li><strong>Unified BIR Tax Engine:</strong> Calculates Gross VAT (12%), Refund VAT component, Net VAT Payable, SC/PWD discount deductions, and non-resettable accumulated grand totals (Old GT, Net Sales, New GT).</li>
        <li><strong>Database Lock:</strong> A permanent, non-reversible transaction. Updates cumulative grand totals in the database. Logs the event with PTU (Permit to Use) numbers.</li>
        <li><strong>Receipt Preview &amp; Catch-Up:</strong> On-screen preview renders the complete thermal layout directly. Unclosed past days trigger automated catch-up Z-Readings upon admin authorization.</li>
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

      <h3 className="text-base font-semibold text-gray-800 mt-4">4. System Audit Trail</h3>
      <p>
        <strong>Route:</strong> <code className="bg-gray-100 px-1 rounded">/reports-compliance/system-audit-trail</code>
      </p>
      <p>
        A database-level security log that captures every raw INSERT, UPDATE, and DELETE executed against core tables. Unlike the E-Journal (which records business events like Sales or Logins), the System Audit Trail exposes the actual data mutations at the row level:
      </p>
      <ul className="list-disc list-inside space-y-1.5 ml-2">
        <li><strong>Columns:</strong> Timestamp, Table Name, Action (INSERT / UPDATE / DELETE), Row ID, and the DB Operator (database user that ran the query).</li>
        <li><strong>Before/After Diff:</strong> Click any row that has recorded data to expand an inline field-level diff. Changed fields are highlighted in amber, removed values in red, and added values in green.</li>
        <li><strong>Filters:</strong> Narrow results by Module / Table Name (Staff Profile, Product Catalog, Business Header, Register Configuration, Promotion Rules, Inventory Stock, Invoices &amp; Voids, Debt Ledger, Installment Plan, System Access), Action type, and a start/end date range.</li>
        <li><strong>Text Search:</strong> Client-side search over the current page's Table, Action, Row ID, and Operator columns.</li>
        <li><strong>Admin Only:</strong> Access is restricted by the <code className="bg-gray-100 px-1 rounded">pos_is_admin()</code> server-side security check. Any non-admin call raises a permission error.</li>
      </ul>

      <h3 className="text-base font-semibold text-gray-800 mt-4">5. BIR Books of Accounts</h3>
      <p>
        <strong>Route:</strong> <code className="bg-gray-100 px-1 rounded">/reports-compliance/bir-books</code>
      </p>
      <p>
        Official compliance registers formatted according to BIR Revenue Memorandum Order (RMO) No. 10-2005:
      </p>
      <ul className="list-disc list-inside space-y-1.5 ml-2">
        <li><strong>BIR Cumulative Sales Book:</strong> Displays all 15 fiscal fields returned by <code className="bg-gray-100 px-1 rounded">pos2_report_bir_sales_book</code>: Reading Date, Terminal Name, MIN Number, Starting Invoice, Ending Invoice, Gross Sales, VATable Base, Gross VAT Collected, Refund VAT, Net Output VAT Payable, VAT-Exempt Sales, Zero-Rated Sales, Total Discounts, Previous Grand Total, and Ending Grand Total.</li>
        <li><strong>SC/PWD Discount Book:</strong> Tracks Senior Citizen and PWD transaction date, invoice number, beneficiary name, ID card number, gross sales, VAT-exempt sales base, 20% discount amount, and net sales paid.</li>
        <li><strong>Voids &amp; Refunds Audit Log:</strong> Logs transaction reversal dates, adjustment types (VOID/REFUND), invoice numbers, original totals, reversed amounts, reasons, and authorizing manager accounts.</li>
        <li><strong>Export &amp; Print:</strong> Supports one-click CSV export with store headers and custom print overlays for official physical audit submissions.</li>
      </ul>
    </div>
  )
}
