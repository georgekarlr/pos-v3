import React from 'react'

export const OfflineSection: React.FC = () => {
  return (
    <div className="space-y-4 text-sm text-gray-700">
      <h3 className="text-base font-semibold text-gray-800">1. Offline State Execution</h3>
      <p>
        The application listens to network connection state changes. When offline:
      </p>
      <ul className="list-disc list-inside space-y-1 ml-2">
        <li>A global "Working Offline" status banner is displayed at the top of all pages (except the POS register, which has its own sync banner).</li>
        <li>The catalog displays locally cached products stored in the browser's IndexedDB.</li>
        <li>Checkout operations save sale JSON payloads to a local sync queue in IndexedDB instead of failing.</li>
      </ul>

      <h3 className="text-base font-semibold text-gray-800 mt-4">2. Sales Sync Queue</h3>
      <p>
        Click **View Offline Sales** in the alert banner to open the Offline Sales queue. Review all transactions waiting to upload.
      </p>

      <h3 className="text-base font-semibold text-gray-800 mt-4">3. Background Upload Sync</h3>
      <p>
        Once internet connectivity is restored:
      </p>
      <ul className="list-disc list-inside space-y-1 ml-2">
        <li>The system displays a blue "Syncing N offline sales..." spinner alert.</li>
        <li>A background scheduler processes queued orders, sending each one to the server using the `pos2_create_sale` database function.</li>
        <li>Once uploaded successfully, items are cleared from the local IndexedDB table.</li>
      </ul>
    </div>
  )
}
