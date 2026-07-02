import React, { useState, useEffect } from 'react'
import { Edit3, Eye, EyeOff, X, AlertCircle } from 'lucide-react'
import { StaffAccount } from '../../services/personaService'

interface EditCredentialsModalProps {
  account: StaffAccount
  onClose: () => void
  onSubmit: (
    targetAccountId: number,
    newName: string,
    newPersonName: string,
    newPassword: string | null
  ) => Promise<void>
  loading: boolean
}

export const EditCredentialsModal: React.FC<EditCredentialsModalProps> = ({
  account,
  onClose,
  onSubmit,
  loading
}) => {
  const [name, setName] = useState(account.role_name)
  const [personName, setPersonName] = useState(account.person_name || '')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setName(account.role_name)
    setPersonName(account.person_name || '')
    setPassword('')
  }, [account])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!name.trim()) {
      setError('Login name is required')
      return
    }
    if (!personName.trim()) {
      setError('Person name is required')
      return
    }

    try {
      await onSubmit(
        account.account_id,
        name.trim(),
        personName.trim(),
        password.trim() ? password : null
      )
    } catch (err: any) {
      setError(err?.message || 'Failed to update credentials')
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-gray-500 bg-opacity-75 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="h-9 w-9 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
              <Edit3 className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              Edit {account.user_type === 'admin' ? 'Admin' : 'Staff'} Credentials
            </h3>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-500 hover:bg-gray-50 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-100 rounded-lg p-3 flex items-start space-x-2 text-red-700 text-sm">
              <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Login Username
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              placeholder="Username"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Full Person Name
            </label>
            <input
              type="text"
              required
              value={personName}
              onChange={(e) => setPersonName(e.target.value)}
              className="w-full px-3.5 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              placeholder="Real Name"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1 flex justify-between">
              <span>Change Password / PIN</span>
              <span className="text-xs font-normal text-gray-400">Leave blank to keep current</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm placeholder-gray-400"
                placeholder="Enter new PIN or password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
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
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
