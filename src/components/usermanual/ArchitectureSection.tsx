import React from 'react'

export const ArchitectureSection: React.FC = () => {
  return (
    <div className="space-y-4 text-sm text-gray-700">
      <h3 className="text-base font-semibold text-gray-800">1. Security Guard Wrappers</h3>
      <p>
        The system uses a nested routing wrapper layout in React Router:
      </p>
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 font-mono text-xs text-gray-700">
        ProtectedRoute (validates Supabase auth token) <br />
        &nbsp;&nbsp;↳ PersonaProtectedRoute (validates admin/staff PIN session) <br />
        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↳ Layout (renders sidebar and header context)
      </div>

      <h3 className="text-base font-semibold text-gray-800 mt-4">2. Client Cache Mapping</h3>
      <p>
        Local browser caches store offline values to maintain system performance:
      </p>
      <ul className="list-disc list-inside space-y-1.5 ml-2">
        <li><strong>localStorage variables:</strong> Stores `selected_pos_terminal_id`, `cached_business_settings` (TIN/MIN/PTU for offline receipts), and receipt printer connection parameters.</li>
        <li><strong>IndexedDB tables:</strong> Caches complete catalog products list, local customer tables, and offline sales transaction queue.</li>
      </ul>

      <h3 className="text-base font-semibold text-gray-800 mt-4">3. Troubleshooting Flow</h3>
      <ul className="list-disc list-inside space-y-1 ml-2">
        <li><strong>Receipt printer fails:</strong> For WebUSB, ensure you are using a Chromium-based browser (Chrome, Edge, Opera) and the printer is paired via Settings.</li>
        <li><strong>POS Checkout button disabled:</strong> A terminal MUST be selected in Settings. The system requires an active PTU profile to serialize invoice IDs correctly.</li>
        <li><strong>Sales Sync failures:</strong> If the connection cuts out mid-sync, the queue remains safely stored in IndexedDB. Reloading or reconnecting resumes syncing safely.</li>
      </ul>
    </div>
  )
}
