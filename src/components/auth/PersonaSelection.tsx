import React, { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { Shield, Users, AlertCircle, Eye, EyeOff, ArrowLeft, LogOut } from 'lucide-react'
import { PersonaType } from '../../types/auth'

const PersonaSelection: React.FC = () => {
  const { user, validateAdminPersona, validateStaffPersona, personaLoading, switchPersona, persona, signOut } = useAuth()
  const [selectedPersona, setSelectedPersona] = useState<PersonaType | null>(null)
  const [password, setPassword] = useState('')
  const [loginName, setLoginName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')

  const handlePersonaSelect = (personaType: PersonaType) => {
    setSelectedPersona(personaType)
    setError('')
    setPassword('')
    setLoginName('')
  }

  const handleBack = () => {
    setSelectedPersona(null)
    setError('')
    setPassword('')
    setLoginName('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!selectedPersona) return

    try {
      let result
      if (selectedPersona === 'admin') {
        result = await validateAdminPersona(password)
      } else {
        if (!loginName.trim()) {
          setError('Login name is required for staff access')
          return
        }
        result = await validateStaffPersona(loginName, password)
      }

      if (!result.success) {
        setError(result.message)
      }
    } catch (error) {
      setError('An unexpected error occurred')
    }
  }

  const handleSwitchPersona = () => {
    switchPersona()
  }

  const handleLogout = async () => {
    await signOut()
  }

  // If user already has a persona, show switch option
  if (persona) {
    const displayName = persona.type === 'admin' ? 'Admin' : (persona.personName || persona.loginName || 'Staff')

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="mx-auto h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              {persona.type === 'admin' ? (
                <Shield className="h-8 w-8 text-green-600" />
              ) : (
                <Users className="h-8 w-8 text-green-600" />
              )}
            </div>
            <h2 className="text-3xl font-bold text-gray-900">Welcome Back</h2>
            <p className="mt-2 text-sm text-gray-600">
              You're signed in as <span className="font-medium">{displayName}</span>
            </p>
            {persona.type === 'staff' && persona.loginName && (
              <p className="text-xs text-gray-500">Login: {persona.loginName}</p>
            )}
          </div>

          <div className="bg-white py-8 px-6 shadow-lg rounded-xl border border-gray-100">
            <div className="space-y-3">
              <button
                onClick={handleSwitchPersona}
                className="w-full flex justify-center py-3 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                Switch Persona
              </button>
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center space-x-2 py-3 px-4 border border-red-300 rounded-lg shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center relative">
          <button
            onClick={handleLogout}
            className="absolute -top-2 right-0 p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Logout"
          >
            <LogOut className="h-5 w-5" />
          </button>
          <h2 className="text-3xl font-bold text-gray-900">Select Your Role</h2>
          <p className="mt-2 text-sm text-gray-600">
            Choose your access level to continue
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Signed in as: {user?.email}
          </p>
        </div>
        
        <div className="bg-white py-8 px-6 shadow-lg rounded-xl border border-gray-100">
          {!selectedPersona ? (
            <div className="space-y-4">
              <button
                onClick={() => handlePersonaSelect('admin')}
                className="w-full flex items-center justify-center space-x-3 py-4 px-6 border-2 border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all group"
              >
                <Shield className="h-8 w-8 text-blue-600 group-hover:text-blue-700" />
                <div className="text-left">
                  <div className="font-medium text-gray-900">Administrator</div>
                  <div className="text-sm text-gray-500">Full system access</div>
                </div>
              </button>
              
              <button
                onClick={() => handlePersonaSelect('staff')}
                className="w-full flex items-center justify-center space-x-3 py-4 px-6 border-2 border-gray-200 rounded-lg hover:border-green-300 hover:bg-green-50 transition-all group"
              >
                <Users className="h-8 w-8 text-green-600 group-hover:text-green-700" />
                <div className="text-left">
                  <div className="font-medium text-gray-900">Staff Member</div>
                  <div className="text-sm text-gray-500">Limited access</div>
                </div>
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="flex items-center space-x-3 mb-6">
                <button
                  type="button"
                  onClick={handleBack}
                  className="p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <div className="flex items-center space-x-2">
                  {selectedPersona === 'admin' ? (
                    <Shield className="h-6 w-6 text-blue-600" />
                  ) : (
                    <Users className="h-6 w-6 text-green-600" />
                  )}
                  <span className="font-medium text-gray-900 capitalize">
                    {selectedPersona} Access
                  </span>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-3">
                  <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              {selectedPersona === 'staff' && (
                <div>
                  <label htmlFor="loginName" className="block text-sm font-medium text-gray-700 mb-2">
                    Login Name
                  </label>
                  <input
                    id="loginName"
                    name="loginName"
                    type="text"
                    required
                    value={loginName}
                    onChange={(e) => setLoginName(e.target.value)}
                    className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                    placeholder="Enter your login name"
                  />
                </div>
              )}

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  {selectedPersona === 'admin' ? 'Admin Password' : 'Staff Password'}
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full px-3 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={personaLoading}
                className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white transition-colors ${
                  selectedPersona === 'admin'
                    ? 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
                    : 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
                } focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {personaLoading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  `Continue as ${selectedPersona}`
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

export default PersonaSelection