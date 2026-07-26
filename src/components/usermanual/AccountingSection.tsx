import React from 'react'

export const AccountingSection: React.FC = () => {
  return (
    <div className="space-y-4 text-sm text-gray-700">
      <p>
        <strong>Sub-Menu:</strong> Accounting | <strong>Access:</strong> BIR Tax Ledger, A/R Aging Report, P&L Statement (Admin only)
      </p>

      <h3 className="text-base font-semibold text-gray-800 mt-2">1. BIR Tax Ledger</h3>
      <p>
        <strong>Route:</strong> <code className="bg-gray-100 px-1 rounded">/accounting/bir-tax-ledger</code>
      </p>
      <p>
        Automated BIR Form 2550Q (Quarterly Value-Added Tax Return) and Form 2551Q (Quarterly Percentage Tax Return) calculation ledger:
      </p>
      <ul className="list-disc list-inside space-y-1 ml-2">
        <li><strong>Automatic Tax Status Detection:</strong> Checks store tax registration status (VAT-REGISTERED vs NON-VAT).</li>
        <li><strong>VAT-Registered (BIR Form 2550Q):</strong> Computes Gross Sales, Sales Returns/Refunds deductions, Line 15A VATable Sales Base, Line 15B 12% Output VAT Due, Line 17 Zero-Rated Sales, Line 18 Exempt Sales, and Senior Citizen / PWD discount offsets.</li>
        <li><strong>Non-VAT Taxpayer (BIR Form 2551Q):</strong> Computes Gross Receipts taxable base, applies the 3.00% Percentage Tax rate, and calculates total Line 14 Percentage Tax Due.</li>
        <li><strong>Date Range Filter:</strong> Interactive custom date ranges and presets (Today, This Month, This Quarter, YTD).</li>
        <li><strong>CSV & Print:</strong> One-click export to CSV with store header padding or direct print preview for tax filing documentation.</li>
      </ul>

      <h3 className="text-base font-semibold text-gray-800 mt-4">2. Accounts Receivable (A/R) Aging Report</h3>
      <p>
        <strong>Route:</strong> <code className="bg-gray-100 px-1 rounded">/accounting/ar-aging</code>
      </p>
      <p>
        Consolidated aging report tracking customer store credit tabs and installment contract debt balances:
      </p>
      <ul className="list-disc list-inside space-y-1 ml-2">
        <li><strong>Aging Risk Buckets:</strong> Automatically calculates age of unpaid tabs/schedules in 0–30 Days (Current), 31–60 Days Late, 61–90 Days Late, and Over 90 Days (High Risk Bad Debt).</li>
        <li><strong>Customer Search & Summary:</strong> Search customers by name or phone number with real-time running total balance calculations.</li>
        <li><strong>CSV Export:</strong> Full CSV report download including per-customer risk breakdown and footer total balance row.</li>
      </ul>

      <h3 className="text-base font-semibold text-gray-800 mt-4">3. Profit & Loss (P&L) Statement</h3>
      <p>
        <strong>Route:</strong> <code className="bg-gray-100 px-1 rounded">/accounting/pnl-statement</code>
      </p>
      <p>
        Complete financial Income Statement detailing store profitability over any customizable period:
      </p>
      <ul className="list-disc list-inside space-y-1 ml-2">
        <li><strong>Revenue Realization:</strong> Breaks down Gross Shelf Sales, Less Promo Discounts, Senior/PWD Discounts, and VAT Exemptions to determine Net Realized Revenue.</li>
        <li><strong>Cost of Goods Sold (COGS):</strong> Aggregates unit supplier costs of all completed sales items to compute Gross Profit and Gross Profit Margin %.</li>
        <li><strong>Operating Expenses:</strong> Subtracts petty cash outflows and operational expense disbursements recorded in the system.</li>
        <li><strong>Net Operating Profit & Margin:</strong> Highlights final net operating income and net profit margin percentage with visual indicators for positive vs negative profit performance.</li>
      </ul>
    </div>
  )
}
