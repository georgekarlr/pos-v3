import React from 'react'
import { AlertTriangle, X } from 'lucide-react'
import { StaffAccount } from '../../services/personaService'

interface DeleteStaffModalProps {
  account: StaffAccount
  onClose: () => void
  onConfirm: () => Promise<void>
  loading: boolean
}

export const DeleteStaffModal: React.FC<DeleteStaffModalProps> = ({
  account,
  onClose,
  onConfirm,
  loading
}) => {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-gray-500 bg-opacity-75 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 animate-in fade-in zoom-in duration-200">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="h-9 w-9 bg-red-50 text-red-600 rounded-lg flex items-center justify-center">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Delete Staff Account</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-500 hover:bg-gray-50 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="text-sm text-gray-600 space-y-2">
            <p>
              Are you sure you want to delete the staff account for{' '}
              <span className="font-semibold text-gray-900">{account.person_name || account.role_name}</span>?
            </p>
            <p className="bg-red-50 text-red-700 text-xs p-3 rounded-lg border border-red-100">
              <strong>Warning:</strong> This action cannot be undone. This cashier/staff member will lose access to the system immediately.
            </p>
          </div>

          <div className="flex space-x-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              disabled={loading}
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={onConfirm}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center justify-center"
            >
              {loading ? 'Deleting...' : 'Delete Account'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
