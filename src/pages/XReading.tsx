import React from 'react'
import XReadingPanel from '../components/reports/XReadingPanel'

const XReading: React.FC = () => {
  return (
    <div className="p-4 sm:p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">X-Reading</h1>
        <p className="mt-1 text-sm text-gray-500">
          Generate a mid-day snapshot report for any terminal. Read-only — no data is saved.
        </p>
      </div>
      <XReadingPanel />
    </div>
  )
}

export default XReading
