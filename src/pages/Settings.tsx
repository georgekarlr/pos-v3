import React from 'react'
import { Camera, Keyboard, Settings as SettingsIcon } from 'lucide-react'
import { useScannerSettings } from '../contexts/ScannerSettingsContext'

const Settings: React.FC = () => {
  const { scanMode, setScanMode } = useScannerSettings()

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="mt-1 text-sm text-gray-600">Configure your application settings and preferences.</p>
      </div>

      {/* Barcode Scanner Settings */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center gap-2">
            <SettingsIcon className="h-5 w-5 text-gray-500" />
            <h2 className="text-lg font-semibold text-gray-800">Barcode Scanner Configuration</h2>
        </div>
        <div className="p-6">
          <p className="text-sm text-gray-500 mb-6">
            Choose how you want to scan products in the POS. Hardware mode uses a physical scanner (keyboard wedge), 
            while Camera mode uses your device's built-in camera.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              onClick={() => setScanMode('hardware')}
              className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
                scanMode === 'hardware'
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-200 hover:border-blue-200 hover:bg-gray-50'
              }`}
            >
              <div className={`p-3 rounded-lg ${scanMode === 'hardware' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500'}`}>
                <Keyboard className="h-6 w-6" />
              </div>
              <div className="text-left">
                <div className={`font-bold ${scanMode === 'hardware' ? 'text-blue-900' : 'text-gray-900'}`}>Hardware Scanner</div>
                <div className="text-xs text-gray-500">Fast keyboard wedge input</div>
              </div>
              {scanMode === 'hardware' && (
                <div className="ml-auto">
                  <div className="h-3 w-3 rounded-full bg-blue-600"></div>
                </div>
              )}
            </button>

            <button
              onClick={() => setScanMode('camera')}
              className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
                scanMode === 'camera'
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-200 hover:border-blue-200 hover:bg-gray-50'
              }`}
            >
              <div className={`p-3 rounded-lg ${scanMode === 'camera' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500'}`}>
                <Camera className="h-6 w-6" />
              </div>
              <div className="text-left">
                <div className={`font-bold ${scanMode === 'camera' ? 'text-blue-900' : 'text-gray-900'}`}>Camera Scanner</div>
                <div className="text-xs text-gray-500">Built-in device camera</div>
              </div>
              {scanMode === 'camera' && (
                <div className="ml-auto">
                  <div className="h-3 w-3 rounded-full bg-blue-600"></div>
                </div>
              )}
            </button>
          </div>
        </div>
      </div>
      
      {/* App Info / Other Settings Placeholder */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
        <h3 className="text-sm font-medium text-gray-900 mb-4">Application Information</h3>
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Version</span>
            <span className="font-mono text-gray-900">0.1.0</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Scanner Status</span>
            <span className={`font-medium ${scanMode === 'hardware' ? 'text-green-600' : 'text-blue-600'}`}>
              {scanMode === 'hardware' ? 'Ready (Hardware)' : 'Ready (Camera)'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Settings
