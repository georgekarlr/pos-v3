import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { PersonaService, StaffAccount } from '../services/personaService'
import { Users, Shield, AlertCircle, CheckCircle, UserPlus } from 'lucide-react'
import { AccountRow } from '../components/persona/AccountRow'
import { CreateStaffModal } from '../components/persona/CreateStaffModal'
import { EditCredentialsModal } from '../components/persona/EditCredentialsModal'
import { DeleteStaffModal } from '../components/persona/DeleteStaffModal'

const PersonaManagement: React.FC = () => {
  const { persona, setPersona } = useAuth()
  const [accounts, setAccounts] = useState<StaffAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Create Staff Modal State
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createLoading, setCreateLoading] = useState(false)

  // Edit Credentials Modal State
  const [editingAccount, setEditingAccount] = useState<StaffAccount | null>(null)
  const [editLoading, setEditLoading] = useState(false)

  // Delete Staff Modal State
  const [deletingAccount, setDeletingAccount] = useState<StaffAccount | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  // Redirect/deny if not admin
  if (persona?.type !== 'admin') {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center max-w-lg mx-auto shadow-sm">
          <div className="h-12 w-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-200">
            <AlertCircle className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-bold text-red-950 mb-2">Access Denied</h2>
          <p className="text-red-700 text-sm">
            Only administrators are authorized to access and manage system personas.
          </p>
        </div>
      </div>
    )
  }

  useEffect(() => {
    loadAccounts()
  }, [])

  const loadAccounts = async () => {
    setLoading(true)
    setError('')
    try {
      const result = await PersonaService.getStaffAccounts()
      if (result.success) {
        setAccounts(result.data)
      } else {
        setError(result.message)
      }
    } catch (err) {
      setError('Failed to load accounts')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateStaff = async (name: string, personName: string, password: string) => {
    setCreateLoading(true)
    setError('')
    setSuccess('')
    try {
      const result = await PersonaService.createStaffAccount(name, password, personName)
      if (result.success) {
        setSuccess(`Staff account "${personName}" created successfully.`)
        setShowCreateModal(false)
        await loadAccounts()
      } else {
        throw new Error(result.message)
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to create staff account')
    } finally {
      setCreateLoading(false)
    }
  }

  const handleEditCredentials = async (
    targetAccountId: number,
    newName: string,
    newPersonName: string,
    newPassword: string | null
  ) => {
    if (!persona?.id) {
      setError('Your administrator persona session is invalid or expired. Please sign in again.')
      return
    }

    setEditLoading(true)
    setError('')
    setSuccess('')
    try {
      const result = await PersonaService.updateAccountCredentials(
        persona.id,
        targetAccountId,
        newName,
        newPersonName,
        newPassword
      )

      if (result.success) {
        setSuccess(`Credentials updated successfully.`)
        
        // If editing self, update the current logged-in persona information
        if (persona.id === targetAccountId) {
          setPersona({
            ...persona,
            loginName: newName,
            personName: newPersonName
          })
        }

        setEditingAccount(null)
        await loadAccounts()
      } else {
        throw new Error(result.message)
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to update credentials')
    } finally {
      setEditLoading(false)
    }
  }

  const handleDeleteStaff = async () => {
    if (!deletingAccount) return

    setDeleteLoading(true)
    setError('')
    setSuccess('')
    try {
      const result = await PersonaService.deleteStaffAccount(deletingAccount.role_name)
      if (result.success) {
        setSuccess(`Staff account "${deletingAccount.person_name || deletingAccount.role_name}" deleted successfully.`)
        setDeletingAccount(null)
        await loadAccounts()
      } else {
        setError(result.message)
      }
    } catch (err) {
      setError('Failed to delete staff account')
    } finally {
      setDeleteLoading(false)
    }
  }

  const clearMessages = () => {
    setError('')
    setSuccess('')
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center space-x-2">
            <Shield className="h-7 w-7 text-blue-600" />
            <span>Persona Management</span>
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Create staff credentials, modify real names, update passwords, and manage system roles.
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors"
        >
          <UserPlus className="h-4.5 w-4.5" />
          <span>Add Staff Account</span>
        </button>
      </div>

      {/* Notifications */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start space-x-3 shadow-sm animate-in fade-in slide-in-from-top-4 duration-200">
          <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-800">{error}</p>
          </div>
          <button onClick={clearMessages} className="text-red-400 hover:text-red-600 font-semibold text-lg leading-none">
            ×
          </button>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-start space-x-3 shadow-sm animate-in fade-in slide-in-from-top-4 duration-200">
          <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-green-800">{success}</p>
          </div>
          <button onClick={clearMessages} className="text-green-400 hover:text-green-600 font-semibold text-lg leading-none">
            ×
          </button>
        </div>
      )}

      {/* Account Directory Panel */}
      <div className="bg-white shadow-sm border border-gray-200 rounded-2xl overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div className="flex items-center space-x-2.5">
            <Users className="h-5 w-5 text-gray-500" />
            <h3 className="text-base font-bold text-gray-800">Accounts Directory</h3>
          </div>
          <span className="text-xs font-semibold text-gray-500 bg-gray-200/60 px-2.5 py-1 rounded-full">
            {accounts.length} Total {accounts.length === 1 ? 'Account' : 'Accounts'}
          </span>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="text-center py-12 space-y-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-sm text-gray-500">Loading directory profiles...</p>
            </div>
          ) : accounts.length === 0 ? (
            <div className="text-center py-12 max-w-sm mx-auto space-y-4">
              <Users className="h-12 w-12 text-gray-300 mx-auto" />
              <div className="space-y-1">
                <p className="font-semibold text-gray-800">No accounts found</p>
                <p className="text-xs text-gray-500">Ensure the database functions are properly initialized.</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {accounts.map((account) => (
                <AccountRow
                  key={account.account_id}
                  account={account}
                  currentPersonaId={persona?.id}
                  onEdit={setEditingAccount}
                  onDelete={setDeletingAccount}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showCreateModal && (
        <CreateStaffModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateStaff}
          loading={createLoading}
        />
      )}

      {editingAccount && (
        <EditCredentialsModal
          account={editingAccount}
          onClose={() => setEditingAccount(null)}
          onSubmit={handleEditCredentials}
          loading={editLoading}
        />
      )}

      {deletingAccount && (
        <DeleteStaffModal
          account={deletingAccount}
          onClose={() => setDeletingAccount(null)}
          onConfirm={handleDeleteStaff}
          loading={deleteLoading}
        />
      )}
    </div>
  )
}

export default PersonaManagement