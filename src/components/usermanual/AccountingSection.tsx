import React from 'react'

export const AccountingSection: React.FC = () => {
  return (
    <div className="space-y-4 text-sm text-gray-700">
      <p>
        <strong>Sub-Menu:</strong> Accounting | <strong>Access:</strong> BIR Tax Ledger, Monthly Tax Prep, A/R Aging Report, P&L Statement (Admin only)
      </p>

      <h3 className="text-base font-semibold text-gray-800 mt-2">1. BIR Tax Ledger (Itemized Invoices)</h3>
      <p>
        <strong>Route:</strong> <code className="bg-gray-100 px-1 rounded">/accounting/bir-tax-ledger</code>
      </p>
      <p>
        Itemized sales transaction tax ledger tracking line-by-line tax components for every invoice issued:
      </p>
      <ul className="list-disc list-inside space-y-1 ml-2">
        <li><strong>Itemized Transaction Fields:</strong> Tracks Invoice #, Date & Time, POS Terminal Name, Customer Name, Order Status (Completed / Voided), Gross Amount, VATable Sales Base, Output VAT (12%), VAT-Exempt Sales, Zero-Rated Sales, Senior Citizen / PWD Discounts, Promo Discounts, Refunds, and Net Taxable Realized Sales.</li>
        <li><strong>Terminal & Search Filters:</strong> Filter tax ledger transactions by specific POS terminals or search by invoice number and customer name.</li>
        <li><strong>Summary KPI Cards:</strong> Instant grand totals for Gross Transactions, VATable Base, 12% Output VAT, Exempt/Zero-Rated sales, and Net Taxable Realized Sales.</li>
        <li><strong>CSV & Print Preview:</strong> Export complete itemized tax ledger data to CSV or format for direct printing.</li>
      </ul>

      <h3 className="text-base font-semibold text-gray-800 mt-4">2. BIR Monthly Tax Preparation (Returns Declaration)</h3>
      <p>
        <strong>Route:</strong> <code className="bg-gray-100 px-1 rounded">/accounting/monthly-tax-prep</code>
      </p>
      <p>
        Consolidated BIR Form 2550Q (Quarterly Value-Added Tax Return) and Form 2551Q (Percentage Tax Return) declaration generator:
      </p>
      <ul className="list-disc list-inside space-y-1 ml-2">
        <li><strong>Registered Business Details:</strong> Automatically loads registered Business Name, Taxpayer Identification Number (TIN), Address, and Taxpayer Category (VAT-REGISTERED vs NON-VAT).</li>
        <li><strong>Sales Realization & Statutory Deductions:</strong> Computes Gross Invoiced Sales, Less Voids, Less Promotions, Less SC/PWD Statutory Discounts, Less Statutory VAT Exemptions, Less Returns/Refunds, and Net Taxable Sales.</li>
        <li><strong>BIR Tax Liability Schedule:</strong> Calculates Form 2550Q Line 15A VATable Sales Base, Line 15B 12% Output VAT Collected, Output VAT component on refunds, Net Output VAT Payable owed to BIR, Line 23 Excess VAT Credit Carried Over (for net refund periods), Line 18 Exempt Sales Base, and Line 17 Zero-Rated Sales Base.</li>
        <li><strong>Installment Credit & Financing Schedule:</strong> Summarizes new installment contracts created in period, total invoiced principal, financed amount on credit, and unearned interest recognized.</li>
        <li><strong>Composable Architecture:</strong> Modular schedule components (Header Card, KPI Summary Grid, Sales Realization Table, Tax Liability Schedule, Installment Financing Grid) capable of independent rendering or unified declaration views.</li>
      </ul>

      <h3 className="text-base font-semibold text-gray-800 mt-4">3. Accounts Receivable (A/R) Aging Report</h3>
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

      <h3 className="text-base font-semibold text-gray-800 mt-4">4. Profit & Loss (P&L) Statement</h3>
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
