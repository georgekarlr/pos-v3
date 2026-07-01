import React, { useState, useEffect } from 'react'
import { Camera, Keyboard, Settings as SettingsIcon, Store, Monitor, Plus, Edit, AlertCircle, CheckCircle, Info } from 'lucide-react'
import { useScannerSettings } from '../contexts/ScannerSettingsContext'
import { useAuth } from '../contexts/AuthContext'
import { SettingsService } from '../services/settingsService'
import { BusinessSettings, Terminal } from '../types/settings'

const Settings: React.FC = () => {
  const { scanMode, setScanMode } = useScannerSettings()
  const { persona } = useAuth()
  const isAdmin = persona?.type === 'admin'
  const requestingAccountId = persona?.id || 0

  const [activeTab, setActiveTab] = useState<'scanner' | 'business' | 'terminals'>('scanner')
  
  // Status states
  const [error, setError] = useState<string>('')
  const [success, setSuccess] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)

  // Business settings state
  const [businessSettings, setBusinessSettings] = useState<BusinessSettings>({
    business_name: '',
    address: '',
    tin: '',
    min: '',
    ptu_issued_by: '',
    software_provider_name: 'Your Company Name',
    software_provider_address: 'Your Company Address',
    software_provider_tin: '000-000-000-000',
    software_provider_accreditation_no: '00000000000000',
    software_provider_date_issued: ''
  })

  // Terminals state
  const [terminals, setTerminals] = useState<Terminal[]>([])
  const [selectedTerminalId, setSelectedTerminalId] = useState<number | null>(null)
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false)
  const [showEditModal, setShowEditModal] = useState<boolean>(false)
  
  // Terminal Form state
  const [terminalForm, setTerminalForm] = useState({
    terminal_id: 0,
    terminal_name: '',
    min: '',
    ptu_number: '',
    ptu_date_issued: '',
    is_active: true,
    current_invoice_number: 0
  })

  useEffect(() => {
    loadBusinessSettings()
    loadTerminals()
    const savedId = localStorage.getItem('selected_pos_terminal_id')
    if (savedId) {
      setSelectedTerminalId(Number(savedId))
    }
  }, [])

  const loadBusinessSettings = async () => {
    setError('')
    try {
      const response = await SettingsService.getBusinessSettings()
      if (response.error) {
        setError(response.error)
      } else if (response.data) {
        setBusinessSettings({
          ...response.data,
          software_provider_date_issued: response.data.software_provider_date_issued || ''
        })
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load business settings')
    }
  }

  const loadTerminals = async () => {
    setError('')
    try {
      const response = await SettingsService.getTerminals()
      if (response.error) {
        setError(response.error)
      } else if (response.data) {
        setTerminals(response.data)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load terminals')
    }
  }

  const handleUpsertBusiness = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isAdmin) return
    
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      const params = {
        p_requesting_account_id: requestingAccountId,
        p_business_name: businessSettings.business_name,
        p_address: businessSettings.address || null,
        p_tin: businessSettings.tin || null,
        p_min: businessSettings.min || null,
        p_ptu_issued_by: businessSettings.ptu_issued_by || null,
        p_software_provider_name: businessSettings.software_provider_name || null,
        p_software_provider_address: businessSettings.software_provider_address || null,
        p_software_provider_tin: businessSettings.software_provider_tin || null,
        p_software_provider_accreditation_no: businessSettings.software_provider_accreditation_no || null,
        p_software_provider_date_issued: businessSettings.software_provider_date_issued || null
      }

      const response = await SettingsService.upsertBusinessSettings(params)
      if (response.error) {
        setError(response.error)
      } else if (response.data?.success) {
        setSuccess(response.data.message || 'Business settings saved successfully.')
        if (response.data.data) {
          setBusinessSettings(response.data.data)
        }
      } else {
        setError(response.data?.message || 'Failed to save business settings')
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while saving business settings')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTerminalSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isAdmin) return

    setError('')
    setSuccess('')
    setLoading(true)

    try {
      const params = {
        p_requesting_account_id: requestingAccountId,
        p_terminal_name: terminalForm.terminal_name,
        p_min: terminalForm.min,
        p_ptu_number: terminalForm.ptu_number,
        p_ptu_date_issued: terminalForm.ptu_date_issued
      }

      const response = await SettingsService.createTerminal(params)
      if (response.error) {
        setError(response.error)
      } else if (response.data?.success) {
        setSuccess(response.data.message || 'Terminal created successfully.')
        setShowCreateModal(false)
        resetTerminalForm()
        await loadTerminals()
      } else {
        setError(response.data?.message || 'Failed to create terminal')
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while creating terminal')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateTerminalSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isAdmin) return

    setError('')
    setSuccess('')
    setLoading(true)

    try {
      const params = {
        p_requesting_account_id: requestingAccountId,
        p_terminal_id: terminalForm.terminal_id,
        p_terminal_name: terminalForm.terminal_name,
        p_min: terminalForm.min,
        p_ptu_number: terminalForm.ptu_number,
        p_ptu_date_issued: terminalForm.ptu_date_issued,
        p_is_active: terminalForm.is_active
      }

      const response = await SettingsService.updateTerminal(params)
      if (response.error) {
        setError(response.error)
      } else if (response.data?.success) {
        setSuccess(response.data.message || 'Terminal updated successfully.')
        setShowEditModal(false)
        resetTerminalForm()
        await loadTerminals()
      } else {
        setError(response.data?.message || 'Failed to update terminal')
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while updating terminal')
    } finally {
      setLoading(false)
    }
  }

  const openCreateModal = () => {
    resetTerminalForm()
    setShowCreateModal(true)
  }

  const openEditModal = (t: Terminal) => {
    setTerminalForm({
      terminal_id: t.terminal_id,
      terminal_name: t.terminal_name,
      min: t.min || '',
      ptu_number: t.ptu_number || '',
      ptu_date_issued: t.ptu_date_issued || '',
      is_active: t.is_active,
      current_invoice_number: t.current_invoice_number || 0
    })
    setShowEditModal(true)
  }

  const resetTerminalForm = () => {
    setTerminalForm({
      terminal_id: 0,
      terminal_name: '',
      min: '',
      ptu_number: '',
      ptu_date_issued: '',
      is_active: true,
      current_invoice_number: 0
    })
  }

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(val)
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="mt-1 text-sm text-gray-600">Configure your system preferences, business profile, and POS terminals.</p>
        </div>
        
        {/* Permission Badge */}
        {!isAdmin && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-200 rounded-full text-amber-800 text-xs font-semibold">
            <Info className="h-3.5 w-3.5" />
            <span>Staff View (Read-Only)</span>
          </div>
        )}
      </div>

      {/* Alert Banner */}
      {error && (
        <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-md text-sm text-red-700 flex items-start gap-2">
          <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
          <div>{error}</div>
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-50 border-l-4 border-green-500 rounded-md text-sm text-green-700 flex items-start gap-2">
          <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
          <div>{success}</div>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8" aria-label="Tabs">
          <button
            onClick={() => { setActiveTab('scanner'); setError(''); setSuccess(''); }}
            className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-all ${
              activeTab === 'scanner'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <SettingsIcon className="h-4 w-4" />
            Scanner & Application
          </button>
          
          <button
            onClick={() => { setActiveTab('business'); setError(''); setSuccess(''); }}
            className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-all ${
              activeTab === 'business'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Store className="h-4 w-4" />
            Business Profile
          </button>
          
          <button
            onClick={() => { setActiveTab('terminals'); setError(''); setSuccess(''); }}
            className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-all ${
              activeTab === 'terminals'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Monitor className="h-4 w-4" />
            POS Terminals
          </button>
        </nav>
      </div>

      {/* Tab Contents */}
      <div className="mt-4">
        {activeTab === 'scanner' && (
          <div className="space-y-6">
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
            
            {/* Active Register Terminal */}
            <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center gap-2">
                <Monitor className="h-5 w-5 text-gray-500" />
                <h2 className="text-lg font-semibold text-gray-800">Active Register Terminal</h2>
              </div>
              <div className="p-6">
                <p className="text-sm text-gray-500 mb-4">
                  Select which register terminal is assigned to this device for processing checkouts and recording sales.
                </p>
                <div className="max-w-xs">
                  <select
                    value={selectedTerminalId || ''}
                    onChange={(e) => {
                      const id = e.target.value ? Number(e.target.value) : null
                      setSelectedTerminalId(id)
                      if (id) {
                        localStorage.setItem('selected_pos_terminal_id', id.toString())
                      } else {
                        localStorage.removeItem('selected_pos_terminal_id')
                      }
                    }}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">-- Select Active Terminal --</option>
                    {terminals.map((t) => (
                      <option key={t.terminal_id} value={t.terminal_id}>
                        {t.terminal_name} (MIN: {t.min || 'N/A'})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* App Info */}
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
        )}

        {activeTab === 'business' && (
          <form onSubmit={handleUpsertBusiness} className="space-y-6">
            <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <h2 className="text-lg font-semibold text-gray-800">Business Registration Information</h2>
                <p className="text-xs text-gray-500 mt-1">Official details used for taxpayer identification and BIR receipts.</p>
              </div>
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Business / Trade Name *</label>
                    <input
                      type="text"
                      disabled={!isAdmin}
                      required
                      value={businessSettings.business_name}
                      onChange={(e) => setBusinessSettings({ ...businessSettings, business_name: e.target.value })}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tax Identification Number (TIN)</label>
                    <input
                      type="text"
                      disabled={!isAdmin}
                      value={businessSettings.tin || ''}
                      onChange={(e) => setBusinessSettings({ ...businessSettings, tin: e.target.value })}
                      placeholder="e.g. 000-000-000-000"
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Registered Address</label>
                    <textarea
                      rows={2}
                      disabled={!isAdmin}
                      value={businessSettings.address || ''}
                      onChange={(e) => setBusinessSettings({ ...businessSettings, address: e.target.value })}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Machine Identification Number (MIN)</label>
                    <input
                      type="text"
                      disabled={!isAdmin}
                      value={businessSettings.min || ''}
                      onChange={(e) => setBusinessSettings({ ...businessSettings, min: e.target.value })}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">PTU Issued By</label>
                    <input
                      type="text"
                      disabled={!isAdmin}
                      value={businessSettings.ptu_issued_by || ''}
                      onChange={(e) => setBusinessSettings({ ...businessSettings, ptu_issued_by: e.target.value })}
                      placeholder="e.g. BIR Revenue Region 8"
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <h2 className="text-lg font-semibold text-gray-800">POS Software Provider Information</h2>
                <p className="text-xs text-gray-500 mt-1">Official details of the accredited software developer.</p>
              </div>
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Provider Name</label>
                    <input
                      type="text"
                      disabled={!isAdmin}
                      value={businessSettings.software_provider_name || ''}
                      onChange={(e) => setBusinessSettings({ ...businessSettings, software_provider_name: e.target.value })}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Provider TIN</label>
                    <input
                      type="text"
                      disabled={!isAdmin}
                      value={businessSettings.software_provider_tin || ''}
                      onChange={(e) => setBusinessSettings({ ...businessSettings, software_provider_tin: e.target.value })}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Provider Address</label>
                    <textarea
                      rows={2}
                      disabled={!isAdmin}
                      value={businessSettings.software_provider_address || ''}
                      onChange={(e) => setBusinessSettings({ ...businessSettings, software_provider_address: e.target.value })}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Accreditation Number</label>
                    <input
                      type="text"
                      disabled={!isAdmin}
                      value={businessSettings.software_provider_accreditation_no || ''}
                      onChange={(e) => setBusinessSettings({ ...businessSettings, software_provider_accreditation_no: e.target.value })}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Accreditation Date Issued</label>
                    <input
                      type="date"
                      disabled={!isAdmin}
                      value={businessSettings.software_provider_date_issued || ''}
                      onChange={(e) => setBusinessSettings({ ...businessSettings, software_provider_date_issued: e.target.value })}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {isAdmin && (
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-md shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-400 disabled:cursor-not-allowed"
                >
                  {loading ? 'Saving...' : 'Save Settings'}
                </button>
              </div>
            )}
          </form>
        )}

        {activeTab === 'terminals' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Terminals Directory</h3>
                <p className="text-xs text-gray-500">Manage individual POS registers, registrations, and invoice sequences.</p>
              </div>
              {isAdmin && (
                <button
                  onClick={openCreateModal}
                  className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-md shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Terminal
                </button>
              )}
            </div>

            <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-3 text-left">Terminal Details</th>
                      <th className="px-6 py-3 text-left">PTU Registration</th>
                      <th className="px-6 py-3 text-left">Invoice Status</th>
                      <th className="px-6 py-3 text-left">Cumulative Total</th>
                      <th className="px-6 py-3 text-center">Status</th>
                      {isAdmin && <th className="px-6 py-3 text-center">Actions</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 text-sm text-gray-900 bg-white">
                    {terminals.length === 0 ? (
                      <tr>
                        <td colSpan={isAdmin ? 6 : 5} className="px-6 py-8 text-center text-gray-500">
                          No terminals configured.
                        </td>
                      </tr>
                    ) : (
                      terminals.map((t) => (
                        <tr key={t.terminal_id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div className="font-semibold text-gray-900">{t.terminal_name}</div>
                            <div className="text-xs text-gray-500">MIN: {t.min || 'N/A'}</div>
                            {t.serial_number && <div className="text-xs text-gray-400">SN: {t.serial_number}</div>}
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-xs font-semibold text-gray-700">PTU: {t.ptu_number || 'N/A'}</div>
                            {t.ptu_date_issued && (
                              <div className="text-xs text-gray-500">Issued: {t.ptu_date_issued}</div>
                            )}
                          </td>
                          <td className="px-6 py-4 text-xs font-mono text-gray-700">
                            Invoice #{t.current_invoice_number || 0}
                          </td>
                          <td className="px-6 py-4 font-semibold text-gray-900">
                            {formatCurrency(t.cumulative_grand_total || 0)}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span
                              className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold leading-5 ${
                                t.is_active
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}
                            >
                              {t.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          {isAdmin && (
                            <td className="px-6 py-4 text-center">
                              <button
                                onClick={() => openEditModal(t)}
                                className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-900 font-medium text-xs bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded"
                              >
                                <Edit className="h-3 w-3" />
                                Edit
                              </button>
                            </td>
                          )}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* CREATE TERMINAL MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl border border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Create POS Terminal</h3>
            <form onSubmit={handleCreateTerminalSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Terminal Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Register 1"
                  value={terminalForm.terminal_name}
                  onChange={(e) => setTerminalForm({ ...terminalForm, terminal_name: e.target.value })}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">BIR MIN *</label>
                <input
                  type="text"
                  required
                  placeholder="Machine Identification Number"
                  value={terminalForm.min}
                  onChange={(e) => setTerminalForm({ ...terminalForm, min: e.target.value })}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">PTU Number *</label>
                <input
                  type="text"
                  required
                  placeholder="Permit to Use Number"
                  value={terminalForm.ptu_number}
                  onChange={(e) => setTerminalForm({ ...terminalForm, ptu_number: e.target.value })}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">PTU Date Issued *</label>
                <input
                  type="date"
                  required
                  value={terminalForm.ptu_date_issued}
                  onChange={(e) => setTerminalForm({ ...terminalForm, ptu_date_issued: e.target.value })}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium disabled:bg-blue-400"
                >
                  {loading ? 'Creating...' : 'Create Terminal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT TERMINAL MODAL */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl border border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Edit POS Terminal</h3>
            <form onSubmit={handleUpdateTerminalSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Terminal Name *</label>
                <input
                  type="text"
                  required
                  value={terminalForm.terminal_name}
                  onChange={(e) => setTerminalForm({ ...terminalForm, terminal_name: e.target.value })}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">BIR MIN *</label>
                <input
                  type="text"
                  required
                  disabled={terminalForm.current_invoice_number > 0}
                  value={terminalForm.min}
                  onChange={(e) => setTerminalForm({ ...terminalForm, min: e.target.value })}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none disabled:bg-gray-100 disabled:text-gray-500"
                />
                {terminalForm.current_invoice_number > 0 && (
                  <p className="text-xs text-amber-600 mt-1 font-medium flex items-start gap-1">
                    <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
                    Cannot change the MIN of a terminal that has already processed sales.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">PTU Number *</label>
                <input
                  type="text"
                  required
                  value={terminalForm.ptu_number}
                  onChange={(e) => setTerminalForm({ ...terminalForm, ptu_number: e.target.value })}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">PTU Date Issued *</label>
                <input
                  type="date"
                  required
                  value={terminalForm.ptu_date_issued}
                  onChange={(e) => setTerminalForm({ ...terminalForm, ptu_date_issued: e.target.value })}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="terminal-is-active"
                  checked={terminalForm.is_active}
                  onChange={(e) => setTerminalForm({ ...terminalForm, is_active: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="terminal-is-active" className="text-sm font-medium text-gray-700 cursor-pointer select-none">
                  Is Terminal Active
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium disabled:bg-blue-400"
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Settings

