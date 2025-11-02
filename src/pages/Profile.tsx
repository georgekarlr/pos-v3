import React from 'react'
import { useAuth } from '../contexts/AuthContext'
import { User, Mail, Calendar, Shield, Users } from 'lucide-react'

const Profile: React.FC = () => {
  const { user, persona } = useAuth()

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
        <p className="mt-1 text-sm text-gray-600">
          Manage your account settings and preferences.
        </p>
      </div>

      {/* Profile Card */}
      <div className="bg-white shadow-sm rounded-lg">
        <div className="px-6 py-8 sm:px-8">
          <div className="flex items-center space-x-6">
            <div className="h-24 w-24 bg-blue-100 rounded-full flex items-center justify-center">
              <User className="h-12 w-12 text-blue-600" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-gray-900">
                {user?.email?.split('@')[0] || 'User'}
              </h2>
              <p className="text-gray-600">{user?.email}</p>
              {persona && (
                <div className="mt-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    persona.type === 'admin' 
                      ? 'bg-blue-100 text-blue-800' 
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {persona.type === 'admin' ? 'Administrator' : 'Staff Member'}
                  </span>
                  {persona.loginName && (
                    <span className="ml-2 text-sm text-gray-500">
                      Login: {persona.loginName}
                    </span>
                  )}
                </div>
              )}
              <div className="mt-4 flex items-center space-x-6">
                <div className="flex items-center text-sm text-gray-500">
                  <Calendar className="h-4 w-4 mr-1" />
                  Joined {new Date(user?.created_at || '').toLocaleDateString()}
                </div>
                <div className="flex items-center text-sm text-gray-500">
                  <Shield className="h-4 w-4 mr-1" />
                  {user?.email_confirmed_at ? 'Verified' : 'Unverified'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Account Information */}
      <div className="bg-white shadow-sm rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Account Information</h3>
        </div>
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="flex items-center space-x-3">
                <Mail className="h-5 w-5 text-gray-400" />
                <span className="text-sm text-gray-900">{user?.email}</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                User ID
              </label>
              <div className="flex items-center space-x-3">
                <User className="h-5 w-5 text-gray-400" />
                <span className="text-sm text-gray-900 font-mono">{user?.id}</span>
              </div>
            </div>
            {persona && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Role
                </label>
                <div className="flex items-center space-x-3">
                  {persona.type === 'admin' ? (
                    <Shield className="h-5 w-5 text-blue-600" />
                  ) : (
                    <User className="h-5 w-5 text-green-600" />
                  )}
                  <span className="text-sm text-gray-900 capitalize">
                    {persona.type} Access
                    {persona.loginName && ` (${persona.loginName})`}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="bg-white shadow-sm rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Account Actions</h3>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            <button className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors">
              Update Profile
            </button>
            <button className="w-full sm:w-auto ml-0 sm:ml-3 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors">
              Change Password
            </button>
            <button className="w-full sm:w-auto ml-0 sm:ml-3 px-4 py-2 border border-red-300 rounded-md text-sm font-medium text-red-700 bg-white hover:bg-red-50 transition-colors">
              Delete Account
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Profile