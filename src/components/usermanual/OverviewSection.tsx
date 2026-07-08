import React from 'react'

export const OverviewSection: React.FC = () => {
  return (
    <div className="space-y-4">
      <p className="text-gray-700 leading-relaxed">
        <strong>CPOS Pro</strong> is an offline-first Point of Sale (POS) system designed for retail and service businesses.
        It runs as a Progressive Web App (PWA) with client-side database caching via IndexedDB, enabling uninterrupted operations
        even when internet connection is lost. Real-time background sync kicks in automatically when connectivity is restored.
      </p>

      <h3 className="text-base font-semibold text-gray-800 mt-4">System Key Capabilities</h3>
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2.5 text-left font-semibold text-gray-700">Feature Group</th>
              <th className="px-4 py-2.5 text-left font-semibold text-gray-700">Detailed Description</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {[
              ['Point of Sale (POS)', 'High-speed order entry, camera/hardware barcode scanning, split payments, cash tendering, and direct thermal printing.'],
              ['Inventory & Batches', 'Batch-level stock tracking, expiration tracking for perishables, write-offs, stock adjustments, and history log.'],
              ['Customer & Debt Management', 'Built-in accounts registry, credit limit enforcement, debt Wizard for credit sales, and multi-action debt settlements.'],
              ['Installment Contracts', 'Custom layaway agreements, downpayment recording, flat interest rates, monthly schedules, and late/default statuses.'],
              ['BIR Reports & Compliance', 'Government compliant printouts, PTU numbers, invoice serialization, X-Reading, Z-Reading, and audit Electronic Journal (E-Journal).'],
              ['Role-Based Access Control', 'Multi-persona system (Admin vs Staff) with PIN code/password gates protecting sensitive pages.'],
              ['Offline Database Cache', 'Automatic detection of offline state, IndexedDB local queue storage, and background sync to Supabase (PostgreSQL).']
            ].map(([f, d]) => (
              <tr key={f} className="hover:bg-gray-50">
                <td className="px-4 py-2.5 font-medium text-gray-800 whitespace-nowrap">{f}</td>
                <td className="px-4 py-2.5 text-gray-600">{d}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h3 className="text-base font-semibold text-gray-800 mt-4">Technology Architecture</h3>
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2.5 text-left font-semibold text-gray-700">Stack Layer</th>
              <th className="px-4 py-2.5 text-left font-semibold text-gray-700">Technologies Utilized</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {[
              ['Frontend Framework', 'React 18, TypeScript, Vite'],
              ['Styling Engine', 'Tailwind CSS, Lucide React Icons'],
              ['Cloud Backend', 'Supabase (Auth, Postgres SQL, Database Functions/RPCs)'],
              ['Offline Database', 'IndexedDB (via custom OfflineDB controller)'],
              ['Hardware API Integrations', 'Web USB API, Web Serial API, Web Bluetooth API (BLE)'],
              ['Deployment Target', 'Vercel Edge Platform']
            ].map(([l, t]) => (
              <tr key={l} className="hover:bg-gray-50">
                <td className="px-4 py-2.5 font-medium text-gray-800 whitespace-nowrap">{l}</td>
                <td className="px-4 py-2.5 text-gray-600">{t}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
