import React, { useState, useEffect, useMemo } from 'react'
import { Camera, Keyboard, Settings as SettingsIcon, Store, Monitor, Plus, Edit, AlertCircle, CheckCircle, Info, Printer } from 'lucide-react'
import { useScannerSettings } from '../contexts/ScannerSettingsContext'
import { useAuth } from '../contexts/AuthContext'
import { SettingsService } from '../services/settingsService'
import { BusinessSettings, Terminal } from '../types/settings'
import { BLEConfig, PrinterConfig, SerialConfig, USBConfig, loadPrinterConfig, savePrinterConfig } from '../services/printer/types'
import { printReceiptWithConfig } from '../services/printer'
import type { ReceiptData } from '../components/pos/Receipt'

type PrinterTab = 'serial' | 'usb' | 'ble'

const defaultSerial: SerialConfig = { type: 'serial', baudRate: 9600 }
const defaultUSB: USBConfig = { type: 'usb' }
const defaultBLE: BLEConfig = { type: 'ble', serviceUUID: '000018f0-0000-1000-8000-00805f9b34fb', characteristicUUID: '00002af1-0000-1000-8000-00805f9b34fb' }

function sampleReceipt(): ReceiptData {
  const now = new Date().toISOString()
  return {
    orderId: 1234,
    businessName: 'POS Pro Demo',
    businessAddress1: '123 Main St',
    businessAddress2: 'City, Country',
    cashier: 'Admin',
    dateISO: now,
    lines: [
      { name: 'Example Item A', qty: 1, unitPrice: 50, lineTotal: 50 },
      { name: 'Example Item B', qty: 2, unitPrice: 25.5, lineTotal: 51 },
    ],
    subtotal: 101,
    tax: 0,
    total: 101,
    payments: [{ method: 'Cash', amount: 200 }],
    totalPaid: 200,
    change: 99,
    notes: 'Test print from Receipt Printer configuration page.'
  }
}

const capability = {
  serial: typeof (navigator as any).serial !== 'undefined',
  usb: typeof (navigator as any).usb !== 'undefined',
  ble: typeof (navigator as any).bluetooth !== 'undefined'
}

const Settings: React.FC = () => {
  const { scanMode, setScanMode } = useScannerSettings()
  const { persona } = useAuth()
  const isAdmin = persona?.type === 'admin'
  const requestingAccountId = persona?.id || 0

  const [activeTab, setActiveTab] = useState<'scanner' | 'business' | 'terminals' | 'printer'>('scanner')
  
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

  // Printer config states
  const initialPrinterConfig = useMemo(() => loadPrinterConfig() ?? defaultSerial, [])
  const [printerTab, setPrinterTab] = useState<PrinterTab>(initialPrinterConfig.type)
  const [serial, setSerial] = useState<SerialConfig>(initialPrinterConfig.type === 'serial' ? initialPrinterConfig as SerialConfig : defaultSerial)
  const [usb, setUsb] = useState<USBConfig>(initialPrinterConfig.type === 'usb' ? initialPrinterConfig as USBConfig : defaultUSB)
  const [ble, setBle] = useState<BLEConfig>(initialPrinterConfig.type === 'ble' ? initialPrinterConfig as BLEConfig : defaultBLE)
  const [printerBusy, setPrinterBusy] = useState(false)
  const [printerMessage, setPrinterMessage] = useState<string | null>(null)

  const currentPrinterConfig: PrinterConfig = useMemo(() => {
    if (printerTab === 'serial') return serial
    if (printerTab === 'usb') return usb
    return ble
  }, [printerTab, serial, usb, ble])

  const savePrinter = async (withDeviceRequest: boolean) => {
    setPrinterMessage(null)
    try {
      if (withDeviceRequest) {
        setPrinterBusy(true)
        savePrinterConfig(currentPrinterConfig)
        await printReceiptWithConfig(currentPrinterConfig, sampleReceipt())
        setPrinterMessage('Successfully saved and printed test receipt.')
      } else {
        savePrinterConfig(currentPrinterConfig)
        setPrinterMessage('Configuration saved.')
      }
    } catch (e: any) {
      console.error(e)
      savePrinterConfig(currentPrinterConfig)
      setPrinterMessage('Saved configuration, but connection/print failed: ' + (e?.message || e))
    } finally {
      setPrinterBusy(false)
    }
  }

  const testPrint = async () => {
    setPrinterMessage(null)
    setPrinterBusy(true)
    try {
      savePrinterConfig(currentPrinterConfig)
      await printReceiptWithConfig(currentPrinterConfig, sampleReceipt())
      setPrinterMessage('Test receipt sent to printer.')
    } catch (e: any) {
      console.error(e)
      setPrinterMessage('Test print failed: ' + (e?.message || e))
    } finally {
      setPrinterBusy(false)
    }
  }

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
          
          <button
            onClick={() => { setActiveTab('printer'); setError(''); setSuccess(''); }}
            className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-all ${
              activeTab === 'printer'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Printer className="h-4 w-4" />
            Receipt Printer
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

        {activeTab === 'printer' && (
          <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center gap-2">
              <Printer className="h-5 w-5 text-gray-500" />
              <h2 className="text-lg font-semibold text-gray-800">Receipt Printer Configuration</h2>
            </div>
            <div className="p-6">
              <p className="text-sm text-gray-500 mb-4">
                Configure Web Serial, WebUSB, or Web Bluetooth to print receipts directly to a thermal printer.
              </p>

              <div className="inline-flex rounded-md shadow-sm border mb-6 bg-gray-50 p-0.5">
                <button
                  type="button"
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                    printerTab === 'serial'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-transparent text-gray-700 hover:text-gray-900'
                  }`}
                  onClick={() => setPrinterTab('serial')}
                  disabled={!capability.serial}
                  title={capability.serial ? '' : 'Web Serial not supported in this browser'}
                >
                  Serial
                </button>
                <button
                  type="button"
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                    printerTab === 'usb'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-transparent text-gray-700 hover:text-gray-900'
                  }`}
                  onClick={() => setPrinterTab('usb')}
                  disabled={!capability.usb}
                  title={capability.usb ? '' : 'WebUSB not supported in this browser'}
                >
                  USB
                </button>
                <button
                  type="button"
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                    printerTab === 'ble'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-transparent text-gray-700 hover:text-gray-900'
                  }`}
                  onClick={() => setPrinterTab('ble')}
                  disabled={!capability.ble}
                  title={capability.ble ? '' : 'Web Bluetooth not supported in this browser'}
                >
                  Bluetooth
                </button>
              </div>

              <div className="max-w-xl space-y-6">
                {printerTab === 'serial' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Baud Rate</label>
                      <input
                        type="number"
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                        value={serial.baudRate}
                        onChange={e => setSerial({ ...serial, baudRate: Number(e.target.value) })}
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={printerBusy}
                        onClick={() => savePrinter(false)}
                        className="px-4 py-2 text-sm font-medium border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        disabled={printerBusy}
                        onClick={() => savePrinter(true)}
                        className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow-sm disabled:opacity-50"
                      >
                        Save & Test
                      </button>
                    </div>
                  </div>
                )}

                {printerTab === 'usb' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Vendor ID (optional)</label>
                        <input
                          type="number"
                          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                          value={usb.vendorId ?? ''}
                          onChange={e => setUsb({ ...usb, vendorId: e.target.value ? Number(e.target.value) : undefined })}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Product ID (optional)</label>
                        <input
                          type="number"
                          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                          value={usb.productId ?? ''}
                          onChange={e => setUsb({ ...usb, productId: e.target.value ? Number(e.target.value) : undefined })}
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={printerBusy}
                        onClick={() => savePrinter(false)}
                        className="px-4 py-2 text-sm font-medium border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        disabled={printerBusy}
                        onClick={() => savePrinter(true)}
                        className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow-sm disabled:opacity-50"
                      >
                        Save & Test
                      </button>
                    </div>
                  </div>
                )}

                {printerTab === 'ble' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Service UUID</label>
                      <input
                        type="text"
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                        value={String(ble.serviceUUID)}
                        onChange={e => setBle({ ...ble, serviceUUID: e.target.value as any })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Characteristic UUID</label>
                      <input
                        type="text"
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                        value={String(ble.characteristicUUID)}
                        onChange={e => setBle({ ...ble, characteristicUUID: e.target.value as any })}
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={printerBusy}
                        onClick={() => savePrinter(false)}
                        className="px-4 py-2 text-sm font-medium border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        disabled={printerBusy}
                        onClick={() => savePrinter(true)}
                        className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow-sm disabled:opacity-50"
                      >
                        Save & Test
                      </button>
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={printerBusy}
                      onClick={testPrint}
                      className="px-4 py-2 text-sm font-medium bg-green-600 hover:bg-green-700 text-white rounded-md shadow-sm disabled:opacity-50"
                    >
                      Test Print
                    </button>
                    {printerBusy && <span className="text-sm text-gray-500">Working…</span>}
                  </div>
                  {printerMessage && <p className="mt-2 text-sm text-gray-700 font-medium">{printerMessage}</p>}
                  <p className="mt-2 text-xs text-gray-500">
                    Notes: You must click a button to grant access to devices. Web Serial works best on Chromium browsers. WebUSB and Web Bluetooth require HTTPS and specific browser support.
                  </p>
                </div>
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

