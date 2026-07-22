import React from 'react'

export const AuthSection: React.FC = () => {
  return (
    <div className="space-y-4 text-sm text-gray-700">
      <h3 className="text-base font-semibold text-gray-800">1. User Authentication (Login & Signup)</h3>
      <p>
        The first layer of security uses Supabase email-based accounts. All users must register and sign in to connect to the store environment.
      </p>
      <ul className="list-disc list-inside space-y-1 ml-2">
        <li><strong>Email & Password Login:</strong> Enter your registered store email and password. Click "Sign In".</li>
        <li><strong>Google Sign-In:</strong> Click the "Sign In with Google" button to authenticate seamlessly using your corporate or personal Google account.</li>
        <li><strong>Signup Page:</strong> If you are a new tenant or account holder, you can register via email and password by clicking "Sign Up", or use "Sign Up with Google" to automatically link your Google profile.</li>
      </ul>

      <h3 className="text-base font-semibold text-gray-800 mt-4">2. Role Selection (Personas)</h3>
      <p>
        Once signed in to the main user account, the system prompts for a <strong>Persona</strong> to dictate operational limits (Role-Based Access Control).
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-2">
        <div className="border border-blue-200 rounded-lg p-3 bg-blue-50/50">
          <h4 className="font-semibold text-blue-900 mb-1">🛡️ Administrator Persona</h4>
          <p className="text-xs text-blue-800">
            For store managers and system developers. Full access to inventory, pricing, terminals, analytics reports, staff setup, and BIR settings. Required verification via the Admin PIN/Password.
          </p>
        </div>
        <div className="border border-green-200 rounded-lg p-3 bg-green-50/50">
          <h4 className="font-semibold text-green-900 mb-1">👥 Staff Member Persona</h4>
          <p className="text-xs text-green-800">
            For cashiers and shift staff. Operational focus on checkout transactions, sales tracking, customers registry, and X-Readings. Requires matching login name and staff credentials configured by Admin.
          </p>
        </div>
      </div>

      <h3 className="text-base font-semibold text-gray-800 mt-4">3. Automatic Workspace Setup & Offline Data Sync</h3>
      <p>
        Upon successful login and persona authentication, the system displays an interactive <strong>"Setting Up Your Workspace"</strong> transition screen. During this phase, the application automatically fetches essential system resources and pre-caches them into IndexedDB and local storage:
      </p>
      <ul className="list-disc list-inside space-y-1 ml-2 text-xs">
        <li><strong>Business Settings & Tax Rules:</strong> Store profile, accreditation numbers, and tax rates.</li>
        <li><strong>Product Catalog:</strong> Full inventory catalog, prices, categories, and bundle options.</li>
        <li><strong>POS Terminals & Config:</strong> Active terminals list and terminal hardware preferences.</li>
        <li><strong>Promotions & Coupons:</strong> Active promotional campaigns and coupon code validation rules.</li>
        <li><strong>Customer Registry:</strong> Customer profiles and debt balances.</li>
      </ul>
      <p className="text-xs text-gray-600 italic mt-1">
        This pre-hydration guarantees that both the POS checkout register and System Settings pages are immediately ready to work online or offline without loading delays.
      </p>

      <h3 className="text-base font-semibold text-gray-800 mt-4">4. Session Actions</h3>
      <ul className="list-disc list-inside space-y-1.5 ml-2">
        <li><strong>Switch Persona:</strong> In the global header, clicking the 🔄 (RefreshCw) icon returns you to the role selection gate. Use this when cashiers switch shifts without requiring a full logout from the user email.</li>
        <li><strong>Sign Out:</strong> Click the ↪ (LogOut) icon to terminate the account session and return to the primary login window.</li>
      </ul>
    </div>
  )
}
