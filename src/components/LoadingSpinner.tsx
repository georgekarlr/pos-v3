import React from 'react'

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
}

const sizeMap = {
  small:  'h-6 w-6',
  medium: 'h-10 w-10',
  large:  'h-16 w-16',
};

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size }) => {
  const spinnerSize = sizeMap[size ?? 'medium'];
  const isFullPage = !size;

  return (
    <div className={isFullPage ? 'min-h-screen bg-gray-50 flex items-center justify-center' : 'flex items-center justify-center'}>
      <div className="flex flex-col items-center space-y-4">
        <div className={`animate-spin rounded-full border-b-2 border-blue-600 ${spinnerSize}`}></div>
        <p className="text-gray-600 text-sm">Loading...</p>
      </div>
    </div>
  )
}

export default LoadingSpinner