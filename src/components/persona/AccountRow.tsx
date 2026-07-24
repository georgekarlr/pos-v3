import React from 'react'
import { Shield, Users, Edit2, Calendar } from 'lucide-react'
import { StaffAccount } from '../../services/personaService'

interface AccountRowProps {
  account: StaffAccount
  currentPersonaId: number | undefined
  onEdit: (account: StaffAccount) => void
}

export const AccountRow: React.FC<AccountRowProps> = ({
  account,
  currentPersonaId,
  onEdit
}) => {
  const isAdmin = account.user_type === 'admin'
  const isSelf = currentPersonaId !== undefined && account.account_id === currentPersonaId

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr)
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    } catch (e) {
      return dateStr
    }
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-gray-200 rounded-xl bg-white hover:border-gray-300 transition-all shadow-sm space-y-4 sm:space-y-0">
      <div className="flex items-start space-x-4">
        <div className={`h-12 w-12 rounded-full flex items-center justify-center flex-shrink-0 ${isAdmin
          ? 'bg-blue-50 text-blue-600 border border-blue-100'
          : 'bg-green-50 text-green-600 border border-green-100'
          }`}>
          {isAdmin ? (
            <Shield className="h-6 w-6" />
          ) : (
            <Users className="h-6 w-6" />
          )}
        </div>
        <div className="space-y-1">
          <div className="flex items-center flex-wrap gap-2">
            <h4 className="font-semibold text-gray-900">
              {account.person_name || 'Unnamed Persona'}
            </h4>
            {isSelf && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
                You
              </span>
            )}
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${isAdmin
              ? 'bg-blue-50 text-blue-700 border-blue-200'
              : 'bg-green-50 text-green-700 border-green-200'
              }`}>
              {isAdmin ? 'Administrator' : 'Staff Member'}
            </span>
          </div>
          <div className="flex flex-col text-sm text-gray-500 space-y-1 sm:flex-row sm:space-y-0 sm:space-x-4">
            <span>
              <span className="font-medium text-gray-700">Login username:</span> {account.role_name}
            </span>
            <span className="hidden sm:inline text-gray-300">•</span>
            <span className="flex items-center space-x-1">
              <Calendar className="h-3.5 w-3.5 text-gray-400" />
              <span>Created {formatDate(account.created_at)}</span>
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end space-x-2 border-t pt-3 sm:border-t-0 sm:pt-0">
        <button
          onClick={() => onEdit(account)}
          className="flex items-center space-x-1.5 px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-100"
          title="Edit credentials"
        >
          <Edit2 className="h-4 w-4" />
          <span>Edit</span>
        </button>
      </div>
    </div>
  )
}
