import React, { useState } from 'react'
import { UserPlus, Eye, EyeOff, X, AlertCircle } from 'lucide-react'

interface CreateStaffModalProps {
  onClose: () => void
  onSubmit: (name: string, personName: string, PIN: string) => Promise<void>
  loading: boolean
}

export const CreateStaffModal: React.FC<CreateStaffModalProps> = ({
  onClose,
  onSubmit,
  loading
}) => {
  const [name, setName] = useState('')
  const [personName, setPersonName] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')

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
    if (!password.trim()) {
      setError('Password/PIN is required')
      return
    }

    try {
      await onSubmit(name.trim(), personName.trim(), password)
    } catch (err: any) {
      setError(err?.message || 'Failed to create staff account')
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-gray-500 bg-opacity-75 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 animate-in fade-in zoom-in duration-200">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="h-9 w-9 bg-green-50 text-green-600 rounded-lg flex items-center justify-center">
              <UserPlus className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Create Staff Account</h3>
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
              className="w-full px-3.5 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm placeholder-gray-400"
              placeholder="e.g. cashier1"
            />
            <p className="mt-1 text-xs text-gray-500">The username they'll type when choosing their role.</p>
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
              className="w-full px-3.5 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm placeholder-gray-400"
              placeholder="e.g. Juan Dela Cruz"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Initial Password / PIN
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm placeholder-gray-400"
                placeholder="PIN or secure password"
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
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center justify-center"
            >
              {loading ? 'Creating...' : 'Create Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
