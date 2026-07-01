import React from 'react'
import { useAuth } from '../contexts/AuthContext'
import ZReadingPanel from '../components/reports/ZReadingPanel'

const ZReading: React.FC = () => {
  const { persona } = useAuth()

  if (persona?.type !== 'admin') {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-900">Z-Reading</h1>
        <p className="mt-2 text-sm text-gray-600">Admin access required.</p>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Z-Reading</h1>
        <p className="mt-1 text-sm text-gray-500">
          Generate the official end-of-day report. This is a permanent operation recorded in the database.
        </p>
      </div>
      <ZReadingPanel />
    </div>
  )
}

export default ZReading
