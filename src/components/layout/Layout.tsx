import React, { useState } from 'react'
import Sidebar from './Sidebar'
import Header from './Header'
import { useLocation, Link } from 'react-router-dom'
import { getCachedBusinessSettings, isSubscriptionExpired } from '../../utils/settingsCache'
import { ShieldAlert, ArrowRight } from 'lucide-react'

interface LayoutProps {
  children: React.ReactNode
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()
  
  // Get settings, ignore expiry check so we can check it explicitly
  const settings = getCachedBusinessSettings(true)
  const expired = isSubscriptionExpired(settings)

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }

  const closeSidebar = () => {
    setSidebarOpen(false)
  }

  if (expired && location.pathname !== '/settings') {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-8 text-center text-white shadow-2xl relative overflow-hidden">
          {/* Decorative background glow */}
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-rose-500/20 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-rose-500/20 rounded-full blur-3xl"></div>

          <div className="mx-auto w-16 h-16 bg-rose-500/20 border border-rose-500/30 text-rose-400 rounded-full flex items-center justify-center mb-6 animate-pulse">
            <ShieldAlert className="w-8 h-8" />
          </div>

          <h1 className="text-2xl font-bold tracking-tight mb-2">
            Subscription Expired
          </h1>
          
          <p className="text-slate-300 text-sm mb-6 leading-relaxed">
            Your access to the POS register and back-office management has been suspended. Please renew your subscription to resume operations.
          </p>

          {settings?.expiry_date && (
            <div className="bg-white/5 border border-white/10 rounded-xl py-3 px-4 mb-6 flex justify-between items-center text-xs">
              <span className="text-slate-400 font-medium">Expired on</span>
              <span className="font-semibold text-rose-300">
                {new Date(settings.expiry_date).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </span>
            </div>
          )}

          <Link
            to="/settings"
            className="inline-flex items-center justify-center gap-2 w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900 group"
          >
            Go to Subscription Settings
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />
      
      {/* Main content - full width */}
      <div className="flex flex-col min-h-screen">
        {/* Header */}
        <Header onMenuClick={toggleSidebar} />
        
        {/* Page content */}
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default Layout