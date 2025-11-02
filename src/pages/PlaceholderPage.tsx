import React from 'react'

interface PlaceholderPageProps {
  title: string
  description: string
  icon: React.ComponentType<any>
}

const PlaceholderPage: React.FC<PlaceholderPageProps> = ({ 
  title, 
  description, 
  icon: Icon 
}) => {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        <p className="mt-1 text-sm text-gray-600">{description}</p>
      </div>

      {/* Placeholder Content */}
      <div className="bg-white shadow-sm rounded-lg">
        <div className="px-6 py-12 sm:px-12 text-center">
          <div className="mx-auto h-24 w-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
            <Icon className="h-12 w-12 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {title} Coming Soon
          </h3>
          <p className="text-gray-500 max-w-md mx-auto">
            This section is currently under development. Check back soon for new features and functionality.
          </p>
          <div className="mt-6">
            <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              Get Notified
            </button>
          </div>
        </div>
      </div>

      {/* Feature Preview */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((item) => (
          <div key={item} className="bg-white shadow-sm rounded-lg p-6">
            <div className="h-4 bg-gray-200 rounded mb-3 animate-pulse"></div>
            <div className="h-3 bg-gray-100 rounded mb-2 animate-pulse"></div>
            <div className="h-3 bg-gray-100 rounded w-3/4 animate-pulse"></div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default PlaceholderPage