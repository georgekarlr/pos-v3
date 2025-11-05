import React from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { Menu, LogOut, User, Shield, Users, RefreshCw } from 'lucide-react'

interface HeaderProps {
  onMenuClick: () => void
}

const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const { user, signOut, persona, switchPersona } = useAuth()

  const handleLogout = async () => {
    await signOut()
  }

  const handleSwitchPersona = () => {
    switchPersona()
  }

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="flex items-center justify-between h-16 px-4 sm:px-6">
        {/* Left side */}
        <div className="flex items-center">
          <button
            onClick={onMenuClick}
            className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 transition-colors"
            aria-label="Open sidebar"
          >
            <Menu className="h-5 w-5" />
          </button>
          <h2 className="ml-2 text-lg font-semibold text-gray-900">
            POS Pro
          </h2>
        </div>

        {/* Right side */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-3">
            {/* Persona indicator */}
            {persona && (
              <div className="hidden sm:flex sm:items-center sm:space-x-2 sm:px-3 sm:py-1 sm:bg-gray-100 sm:rounded-full">
                {persona.type === 'admin' ? (
                  <Shield className="h-4 w-4 text-blue-600" />
                ) : (
                  <Users className="h-4 w-4 text-green-600" />
                )}
                <span className="text-xs font-medium text-gray-700">
                  {persona.type === 'admin' ? 'Admin' : (persona.personName || persona.loginName || 'Staff')}
                </span>
                {persona.type === 'staff' && persona.loginName && (
                  <span className="text-xs text-gray-500">
                    ({persona.loginName})
                  </span>
                )}
              </div>
            )}

            <div className="hidden sm:flex sm:flex-col sm:text-right">
              <span className="text-sm font-medium text-gray-900">
                {user?.email}
              </span>
              <span className="text-xs text-gray-500">
                {persona ? (persona.type === 'admin' ? 'Admin access' : `${persona.personName || persona.loginName || 'Staff'} access`) : 'No persona selected'}
              </span>
            </div>
            
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="h-4 w-4 text-blue-600" />
              </div>
              
              {persona && (
                <button
                  onClick={handleSwitchPersona}
                  className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 transition-colors"
                  aria-label="Switch persona"
                  title="Switch persona"
                >
                  <RefreshCw className="h-4 w-4" />
                </button>
              )}
              
              <button
                onClick={handleLogout}
                className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 transition-colors"
                aria-label="Sign out"
                title="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header