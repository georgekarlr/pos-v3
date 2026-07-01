import React from 'react'
import { useAuth } from '../contexts/AuthContext'
import EJournalPanel from '../components/reports/EJournalPanel'

const EJournal: React.FC = () => {
  const { persona } = useAuth()

  if (persona?.type !== 'admin') {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-900">Electronic Journal</h1>
        <p className="mt-2 text-sm text-gray-600">Admin access required.</p>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Electronic Journal</h1>
        <p className="mt-1 text-sm text-gray-500">
          Full audit trail of all POS events across terminals and accounts.
        </p>
      </div>
      <EJournalPanel />
    </div>
  )
}

export default EJournal
