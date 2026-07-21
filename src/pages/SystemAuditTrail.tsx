import React from 'react'
import { useAuth } from '../contexts/AuthContext'
import SystemAuditTrailPanel from '../components/reports/SystemAuditTrailPanel'

const SystemAuditTrail: React.FC = () => {
  const { persona } = useAuth()

  if (persona?.type !== 'admin') {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-900">System Audit Trail</h1>
        <p className="mt-2 text-sm text-gray-600">Admin access required.</p>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">System Audit Trail</h1>
        <p className="mt-1 text-sm text-gray-500">
          Database-level change history for all core tables. Every INSERT, UPDATE, and DELETE is captured with before/after field values.
        </p>
      </div>
      <SystemAuditTrailPanel />
    </div>
  )
}

export default SystemAuditTrail
