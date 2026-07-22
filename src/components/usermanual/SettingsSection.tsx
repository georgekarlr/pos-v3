import React from 'react'

export const SettingsSection: React.FC = () => {
  return (
    <div className="space-y-4 text-sm text-gray-700">
      <h3 className="text-base font-semibold text-gray-800">1. System Settings Pages</h3>
      <p>
        <strong>Route:</strong> <code className="bg-gray-100 px-1 rounded">/settings</code> | <strong>Access:</strong> Admin, Staff (limited)
      </p>
      
      <div className="space-y-3 mt-2">
        <div className="border border-gray-200 rounded-lg p-3 bg-gray-50/50">
          <h4 className="font-semibold text-gray-800">📷 Scanner Selection Tab</h4>
          <p className="text-xs text-gray-600 mt-1">
            Choose between **Hardware Scanner** (keyboard emulation) and **Camera Scanner** (using browser camera scanning overlay).
          </p>
        </div>

        <div className="border border-gray-200 rounded-lg p-3 bg-gray-50/50">
          <h4 className="font-semibold text-gray-800">🏢 Business Profile (Admin Only)</h4>
          <p className="text-xs text-gray-600 mt-1">
            Configure Business Name, physical Address, Tax Identification Number (TIN), Machine Identification Number (MIN), and PTU (Permit to Use) authority for printed receipts. Toggle the VAT Registered setting.
          </p>
        </div>

        <div className="border border-gray-200 rounded-lg p-3 bg-gray-50/50">
          <h4 className="font-semibold text-gray-800">📟 Register Terminals (Admin Only)</h4>
          <p className="text-xs text-gray-600 mt-1">
            Configure register terminals. Admins can create and edit terminals with distinct PTUs. Select a terminal to assign the current browser device to that register instance (saved in client-side storage).
          </p>
        </div>

        <div className="border border-gray-200 rounded-lg p-3 bg-gray-50/50">
          <h4 className="font-semibold text-gray-800">🖨️ Receipt Printer Tab</h4>
          <p className="text-xs text-gray-600 mt-1">
            Configure receipt printing for your platform:
            - **WebUSB (Direct USB):** Connects directly to local USB receipt printers from Chromium-based browsers (Chrome, Edge, Opera) without any bridge software. Pair it via the native browser selector.
            - **Android Bluetooth (BLE):** Scan and pair BLE receipt printers directly from Android Chrome or desktop Chrome/Edge without extra drivers. Clicking "Scan &amp; Pair Bluetooth Printer" opens the browser's Bluetooth scanner dialog to select, pair, and connect your printer.
            Toggle **Auto-Print on Checkout** to automatically send receipts to the configured printer after every completed sale.
          </p>
        </div>

        <div className="border border-gray-200 rounded-lg p-3 bg-gray-50/50">
          <h4 className="font-semibold text-gray-800">💳 Subscription &amp; Billing Status</h4>
          <p className="text-xs text-gray-600 mt-1">
            Displays active account tier, billing type (VAT-registered or Non-VAT), subscription status (Active, Trial, Expired), and the expiry or renewal timestamp. The latest subscription details and expiration date are automatically retrieved from the online database and cached locally on user login. Features an external link to Ceintelly to extend billing or change plans.
          </p>
        </div>
      </div>

      <h3 className="text-base font-semibold text-gray-800 mt-4">2. Subscription Expiry Enforcement</h3>
      <p>
        The system enforces strict payment validation:
      </p>
      <ul className="list-disc list-inside space-y-1 ml-2 text-xs">
        <li><strong>Blocking Redirect:</strong> If subscription status is marked as **Expired**, an overlay blocks all core actions (POS register, sales listings, reports).</li>
        <li><strong>Limited Settings View:</strong> Admins can still access `/settings` to inspect account settings, business registration fields, and click **Extend Subscription** to renew via the external payment portal.</li>
        <li><strong>Service-level Restriction:</strong> Core database services deny execution of new operations if the tenant subscription is expired.</li>
      </ul>

      <h3 className="text-base font-semibold text-gray-800 mt-4">3. Staff Accounts Registry</h3>
      <p>
        <strong>Route:</strong> <code className="bg-gray-100 px-1 rounded">/persona-management</code> | <strong>Access:</strong> Admin only
      </p>
      <ul className="list-disc list-inside space-y-1.5 ml-2">
        <li><strong>Directory:</strong> Lists all registered staff users, passwords, display names, and roles.</li>
        <li><strong>Add Staff Account:</strong> Create a new cashier login name, password, and real name (printed on invoices).</li>
        <li><strong>Edit Credentials:</strong> Update account usernames, real names, or reset passwords.</li>
        <li><strong>Delete Staff:</strong> Permanently removes a staff login credential. Access is revoked instantly.</li>
      </ul>
    </div>
  )
}
