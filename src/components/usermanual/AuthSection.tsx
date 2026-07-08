import React from 'react'

export const AuthSection: React.FC = () => {
  return (
    <div className="space-y-4 text-sm text-gray-700">
      <h3 className="text-base font-semibold text-gray-800">1. User Authentication (Login & Signup)</h3>
      <p>
        The first layer of security uses Supabase email-based accounts. All users must register and sign in to connect to the store environment.
      </p>
      <ul className="list-disc list-inside space-y-1 ml-2">
        <li><strong>Login Page:</strong> Enter your registered store email and password. Click "Sign In".</li>
        <li><strong>Signup Page:</strong> If you are a new tenant or account holder, register your email, password, and click "Sign Up" to establish your workspace database.</li>
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

      <h3 className="text-base font-semibold text-gray-800 mt-4">3. Session Actions</h3>
      <ul className="list-disc list-inside space-y-1.5 ml-2">
        <li><strong>Switch Persona:</strong> In the global header, clicking the 🔄 (RefreshCw) icon returns you to the role selection gate. Use this when cashiers switch shifts without requiring a full logout from the user email.</li>
        <li><strong>Sign Out:</strong> Click the ↪ (LogOut) icon to terminate the account session and return to the primary login window.</li>
      </ul>
    </div>
  )
}
