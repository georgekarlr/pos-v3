import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import {
  LayoutDashboard,
  Settings,
  BarChart3,
  X,
  Shield,
  ShoppingCart,
  Package,
  ChevronDown,
  ChevronRight,
  Printer
} from 'lucide-react'

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

interface NavigationItem {
  name: string
  href?: string
  icon: React.ElementType
  children?: { name: string; href: string }[]
}

const adminNavigation: NavigationItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'POS', href: '/pos', icon: ShoppingCart },
  {
    name: 'Management',
    icon: Package,
    children: [
      { name: 'Products', href: '/management/products' },
      { name: 'Inventory', href: '/management/inventory' },
      { name: 'Sales History', href: '/management/sales-history' },
    ]
  },
  { name: 'Analytics Reports', href: '/analytics-reports', icon: BarChart3 },
  { name: 'Receipt Printer', href: '/settings/receipt-printer', icon: Printer },
  { name: 'Settings', href: '/settings', icon: Settings },
  { name: 'Persona Management', href: '/persona-management', icon: Shield },

]

const staffNavigation: NavigationItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'POS', href: '/pos', icon: ShoppingCart },
  {
    name: 'Management',
    icon: Package,
    children: [
      { name: 'Sales History', href: '/management/sales-history' },
    ]
  },
  { name: 'Receipt Printer', href: '/settings/receipt-printer', icon: Printer },
  { name: 'Settings', href: '/settings', icon: Settings },
]

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const location = useLocation()
  const { persona } = useAuth()
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set(['Management']))

  const navigation = persona?.type === 'admin' ? adminNavigation : staffNavigation

  const toggleExpanded = (name: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev)
      if (newSet.has(name)) {
        newSet.delete(name)
      } else {
        newSet.add(name)
      }
      return newSet
    })
  }

  return (
    <>
      {/* Backdrop - shown on all screen sizes when sidebar is open */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
            <div>
              <h1 className="text-xl font-bold text-gray-900">POS Pro</h1>
              {persona && (
                <p className="text-xs text-gray-500">
                  {persona.type === 'admin' ? 'Admin' : (persona.personName || persona.loginName || 'Staff')} Portal
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 transition-colors"
              aria-label="Close sidebar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const Icon = item.icon
              const isExpanded = expandedItems.has(item.name)
              const hasChildren = item.children && item.children.length > 0

              if (hasChildren) {
                const isAnyChildActive = item.children!.some(child => location.pathname === child.href)

                return (
                  <div key={item.name}>
                    <button
                      onClick={() => toggleExpanded(item.name)}
                      className={`
                        w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200
                        ${isAnyChildActive
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                        }
                      `}
                    >
                      <div className="flex items-center">
                        <Icon className={`
                          h-5 w-5 mr-3 flex-shrink-0
                          ${isAnyChildActive ? 'text-blue-700' : 'text-gray-400'}
                        `} />
                        {item.name}
                      </div>
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </button>

                    {isExpanded && (
                      <div className="mt-1 ml-8 space-y-1">
                        {item.children!.map((child) => {
                          const isChildActive = location.pathname === child.href

                          return (
                            <Link
                              key={child.name}
                              to={child.href}
                              onClick={onClose}
                              className={`
                                block px-3 py-2 text-sm rounded-lg transition-all duration-200
                                ${isChildActive
                                  ? 'bg-blue-50 text-blue-700 font-medium border-r-2 border-blue-700'
                                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                }
                              `}
                            >
                              {child.name}
                            </Link>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              }

              const isActive = location.pathname === item.href

              return (
                <Link
                  key={item.name}
                  to={item.href!}
                  onClick={onClose}
                  className={`
                    flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200
                    ${isActive
                      ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                    }
                  `}
                >
                  <Icon className={`
                    h-5 w-5 mr-3 flex-shrink-0
                    ${isActive ? 'text-blue-700' : 'text-gray-400 group-hover:text-gray-500'}
                  `} />
                  {item.name}
                </Link>
              )
            })}
          </nav>
        </div>
      </div>
    </>
  )
}

export default Sidebar