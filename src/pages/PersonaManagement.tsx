import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { PersonaService } from '../services/personaService'
import { Users, Shield, Plus, Trash2, CreditCard as Edit, Eye, EyeOff, AlertCircle, CheckCircle, Key, UserPlus, Settings } from 'lucide-react'

interface StaffAccount {
  name: string
}

const PersonaManagement: React.FC = () => {
  const { persona } = useAuth()
  const [staffAccounts, setStaffAccounts] = useState<StaffAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Create Staff Modal State
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newStaffName, setNewStaffName] = useState('')
  const [newStaffPassword, setNewStaffPassword] = useState('')
  const [newPersonName, setNewPersonName] = useState('')
  const [showNewStaffPassword, setShowNewStaffPassword] = useState(false)
  const [createLoading, setCreateLoading] = useState(false)

  // Update Staff Password Modal State
  const [showUpdateStaffModal, setShowUpdateStaffModal] = useState(false)
  const [selectedStaff, setSelectedStaff] = useState('')
  const [newStaffPasswordUpdate, setNewStaffPasswordUpdate] = useState('')
  const [showUpdateStaffPassword, setShowUpdateStaffPassword] = useState(false)
  const [updateStaffLoading, setUpdateStaffLoading] = useState(false)

  // Update Admin Password Modal State
  const [showUpdateAdminModal, setShowUpdateAdminModal] = useState(false)
  const [oldAdminPassword, setOldAdminPassword] = useState('')
  const [newAdminPassword, setNewAdminPassword] = useState('')
  const [confirmAdminPassword, setConfirmAdminPassword] = useState('')
  const [showOldAdminPassword, setShowOldAdminPassword] = useState(false)
  const [showNewAdminPassword, setShowNewAdminPassword] = useState(false)
  const [showConfirmAdminPassword, setShowConfirmAdminPassword] = useState(false)
  const [updateAdminLoading, setUpdateAdminLoading] = useState(false)

  // Delete confirmation state
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [staffToDelete, setStaffToDelete] = useState('')
  const [deleteLoading, setDeleteLoading] = useState(false)

  // Redirect if not admin
  if (persona?.type !== 'admin') {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-red-900 mb-2">Access Denied</h2>
          <p className="text-red-700">Only administrators can access persona management.</p>
        </div>
      </div>
    )
  }

  useEffect(() => {
    loadStaffAccounts()
  }, [])

  const loadStaffAccounts = async () => {
    setLoading(true)
    setError('')
    
    try {
      const result = await PersonaService.getStaffAccountNames()
      if (result.success) {
        setStaffAccounts(result.data.map(name => ({ name })))
      } else {
        setError(result.message)
      }
    } catch (err) {
      setError('Failed to load staff accounts')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreateLoading(true)
    setError('')
    setSuccess('')

    try {
      const result = await PersonaService.createStaffAccount(newStaffName, newStaffPassword, newPersonName)
      if (result.success) {
        setSuccess('Staff account created successfully')
        setNewStaffName('')
        setNewStaffPassword('')
        setNewPersonName('')
        setShowCreateModal(false)
        await loadStaffAccounts()
      } else {
        setError(result.message)
      }
    } catch (err) {
      setError('Failed to create staff account')
    } finally {
      setCreateLoading(false)
    }
  }

  const handleDeleteStaff = async () => {
    setDeleteLoading(true)
    setError('')
    setSuccess('')

    try {
      const result = await PersonaService.deleteStaffAccount(staffToDelete)
      if (result.success) {
        setSuccess('Staff account deleted successfully')
        setShowDeleteModal(false)
        setStaffToDelete('')
        await loadStaffAccounts()
      } else {
        setError(result.message)
      }
    } catch (err) {
      setError('Failed to delete staff account')
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleUpdateStaffPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setUpdateStaffLoading(true)
    setError('')
    setSuccess('')

    try {
      const result = await PersonaService.updateStaffPassword(selectedStaff, newStaffPasswordUpdate)
      if (result.success) {
        setSuccess('Staff password updated successfully')
        setNewStaffPasswordUpdate('')
        setShowUpdateStaffModal(false)
        setSelectedStaff('')
      } else {
        setError(result.message)
      }
    } catch (err) {
      setError('Failed to update staff password')
    } finally {
      setUpdateStaffLoading(false)
    }
  }

  const handleUpdateAdminPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setUpdateAdminLoading(true)
    setError('')
    setSuccess('')

    if (newAdminPassword !== confirmAdminPassword) {
      setError('New passwords do not match')
      setUpdateAdminLoading(false)
      return
    }

    try {
      const result = await PersonaService.updateAdminPassword(oldAdminPassword, newAdminPassword)
      if (result.success) {
        setSuccess('Admin password updated successfully')
        setOldAdminPassword('')
        setNewAdminPassword('')
        setConfirmAdminPassword('')
        setShowUpdateAdminModal(false)
      } else {
        setError(result.message)
      }
    } catch (err) {
      setError('Failed to update admin password')
    } finally {
      setUpdateAdminLoading(false)
    }
  }

  const clearMessages = () => {
    setError('')
    setSuccess('')
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Persona Management</h1>
        <p className="mt-1 text-sm text-gray-600">
          Manage staff accounts and administrator settings.
        </p>
      </div>

      {/* Status Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-3">
          <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
          <button onClick={clearMessages} className="ml-auto text-red-500 hover:text-red-700">
            ×
          </button>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center space-x-3">
          <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
          <p className="text-sm text-green-700">{success}</p>
          <button onClick={clearMessages} className="ml-auto text-green-500 hover:text-green-700">
            ×
          </button>
        </div>
      )}

      {/* Admin Settings */}
      <div className="bg-white shadow-sm rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center space-x-3">
          <Shield className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-medium text-gray-900">Administrator Settings</h3>
        </div>
        <div className="p-6">
          <button
            onClick={() => setShowUpdateAdminModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Key className="h-4 w-4" />
            <span>Change Admin Password</span>
          </button>
        </div>
      </div>

      {/* Staff Management */}
      <div className="bg-white shadow-sm rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Users className="h-5 w-5 text-green-600" />
            <h3 className="text-lg font-medium text-gray-900">Staff Accounts</h3>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <UserPlus className="h-4 w-4" />
            <span>Add Staff</span>
          </button>
        </div>
        
        <div className="p-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-2">Loading staff accounts...</p>
            </div>
          ) : staffAccounts.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No staff accounts found</p>
              <p className="text-sm text-gray-500 mt-1">Create your first staff account to get started</p>
            </div>
          ) : (
            <div className="space-y-3">
              {staffAccounts.map((staff) => (
                <div key={staff.name} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                      <Users className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{staff.name}</p>
                      <p className="text-sm text-gray-500">Staff Member</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => {
                        setSelectedStaff(staff.name)
                        setShowUpdateStaffModal(true)
                      }}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Change Password"
                    >
                      <Key className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => {
                        setStaffToDelete(staff.name)
                        setShowDeleteModal(true)
                      }}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete Account"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create Staff Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={() => setShowCreateModal(false)}></div>
            <div className="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg">
              <div className="flex items-center space-x-3 mb-4">
                <UserPlus className="h-6 w-6 text-green-600" />
                <h3 className="text-lg font-medium text-gray-900">Create Staff Account</h3>
              </div>
              
              <form onSubmit={handleCreateStaff} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Login Name
                  </label>
                  <input
                    type="text"
                    required
                    value={newStaffName}
                    onChange={(e) => setNewStaffName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Enter login name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Person Name
                  </label>
                  <input
                    type="text"
                    required
                    value={newPersonName}
                    onChange={(e) => setNewPersonName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Enter person name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showNewStaffPassword ? 'text' : 'password'}
                      required
                      value={newStaffPassword}
                      onChange={(e) => setNewStaffPassword(e.target.value)}
                      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="Enter password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewStaffPassword(!showNewStaffPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showNewStaffPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>
                
                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createLoading}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                  >
                    {createLoading ? 'Creating...' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Update Staff Password Modal */}
      {showUpdateStaffModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={() => setShowUpdateStaffModal(false)}></div>
            <div className="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg">
              <div className="flex items-center space-x-3 mb-4">
                <Key className="h-6 w-6 text-blue-600" />
                <h3 className="text-lg font-medium text-gray-900">Update Staff Password</h3>
              </div>
              
              <p className="text-sm text-gray-600 mb-4">
                Changing password for: <span className="font-medium">{selectedStaff}</span>
              </p>
              
              <form onSubmit={handleUpdateStaffPassword} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showUpdateStaffPassword ? 'text' : 'password'}
                      required
                      value={newStaffPasswordUpdate}
                      onChange={(e) => setNewStaffPasswordUpdate(e.target.value)}
                      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter new password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowUpdateStaffPassword(!showUpdateStaffPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showUpdateStaffPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>
                
                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowUpdateStaffModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updateStaffLoading}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    {updateStaffLoading ? 'Updating...' : 'Update'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Update Admin Password Modal */}
      {showUpdateAdminModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={() => setShowUpdateAdminModal(false)}></div>
            <div className="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg">
              <div className="flex items-center space-x-3 mb-4">
                <Shield className="h-6 w-6 text-blue-600" />
                <h3 className="text-lg font-medium text-gray-900">Change Admin Password</h3>
              </div>
              
              <form onSubmit={handleUpdateAdminPassword} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current Password
                  </label>
                  <div className="relative">
                    <input
                      type={showOldAdminPassword ? 'text' : 'password'}
                      required
                      value={oldAdminPassword}
                      onChange={(e) => setOldAdminPassword(e.target.value)}
                      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter current password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowOldAdminPassword(!showOldAdminPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showOldAdminPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showNewAdminPassword ? 'text' : 'password'}
                      required
                      value={newAdminPassword}
                      onChange={(e) => setNewAdminPassword(e.target.value)}
                      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter new password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewAdminPassword(!showNewAdminPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showNewAdminPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmAdminPassword ? 'text' : 'password'}
                      required
                      value={confirmAdminPassword}
                      onChange={(e) => setConfirmAdminPassword(e.target.value)}
                      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Confirm new password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmAdminPassword(!showConfirmAdminPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showConfirmAdminPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>
                
                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowUpdateAdminModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updateAdminLoading}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    {updateAdminLoading ? 'Updating...' : 'Update'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={() => setShowDeleteModal(false)}></div>
            <div className="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg">
              <div className="flex items-center space-x-3 mb-4">
                <AlertCircle className="h-6 w-6 text-red-600" />
                <h3 className="text-lg font-medium text-gray-900">Delete Staff Account</h3>
              </div>
              
              <p className="text-sm text-gray-600 mb-6">
                Are you sure you want to delete the staff account for <span className="font-medium">{staffToDelete}</span>? 
                This action cannot be undone.
              </p>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteStaff}
                  disabled={deleteLoading}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                >
                  {deleteLoading ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PersonaManagement