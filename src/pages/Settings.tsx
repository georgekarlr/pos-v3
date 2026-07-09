import React, { useState, useEffect, useMemo } from 'react'
import {
  Camera,
  Keyboard,
  Settings as SettingsIcon,
  Store,
  Monitor,
  Plus,
  AlertCircle,
  CheckCircle,
  Info,
  Printer,
} from 'lucide-react'
import { useScannerSettings } from '../contexts/ScannerSettingsContext'
import { useAuth } from '../contexts/AuthContext'
import { SettingsService } from '../services/settingsService'
import { BusinessSettings, Terminal } from '../types/settings'
import {
  BLEConfig,
  PrinterConfig,
  SerialConfig,
  USBConfig,
  loadPrinterConfig,
  savePrinterConfig,
} from '../services/printer/types'
import { printReceiptWithConfig } from '../services/printer'
import type { ReceiptData } from '../components/pos/Receipt'

// Composable settings sub-components
import { BusinessInfoForm } from '../components/settings/BusinessInfoForm'
import { SubscriptionStatusCard } from '../components/settings/SubscriptionStatusCard'
import { SoftwareProviderCard } from '../components/settings/SoftwareProviderCard'
import { TaxConfigSection } from '../components/settings/TaxConfigSection'
import {
  CreateTerminalModal,
  EditTerminalModal,
  TerminalFormState,
} from '../components/settings/TerminalModals'

// ---------------------------------------------------------------------------
// Printer helpers
// ---------------------------------------------------------------------------
type PrinterTab = 'serial' | 'usb' | 'ble'

const defaultSerial: SerialConfig = { type: 'serial', baudRate: 9600 }
const defaultUSB: USBConfig = { type: 'usb' }
const defaultBLE: BLEConfig = {
  type: 'ble',
  serviceUUID: '000018f0-0000-1000-8000-00805f9b34fb',
  characteristicUUID: '00002af1-0000-1000-8000-00805f9b34fb',
}

function sampleReceipt(): ReceiptData {
  const now = new Date().toISOString()
  return {
    orderId: 1234,
    businessName: 'POS Pro Demo',
    businessAddress1: '123 Main St',
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
    notes: 'Test print from Receipt Printer configuration page.',
  }
}

const capability = {
  serial: typeof (navigator as any).serial !== 'undefined',
  usb: typeof (navigator as any).usb !== 'undefined',
  ble: typeof (navigator as any).bluetooth !== 'undefined',
}

// ---------------------------------------------------------------------------
// Default states
// ---------------------------------------------------------------------------
const defaultBusinessSettings: BusinessSettings = {
  business_name: '',
  address: '',
  tin: '',
  min: '',
  ptu_issued_by: '',
  software_provider_name: null,
  software_provider_address: null,
  software_provider_tin: null,
  software_provider_accreditation_no: null,
  software_provider_date_issued: null,
  is_vat_registered: true,
}

const defaultTerminalForm: TerminalFormState = {
  terminal_id: 0,
  terminal_name: '',
  min: '',
  ptu_number: '',
  ptu_date_issued: '',
  is_active: true,
  current_invoice_number: 0,
}

// ---------------------------------------------------------------------------
// Settings page
// ---------------------------------------------------------------------------
const Settings: React.FC = () => {
  const { scanMode, setScanMode } = useScannerSettings()
  const { persona } = useAuth()
  const isAdmin = persona?.type === 'admin'
  const requestingAccountId = persona?.id || 0

  const [activeTab, setActiveTab] = useState<'scanner' | 'business' | 'terminals' | 'printer'>(
    'scanner'
  )

  // Shared status
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  // Business settings
  const [businessSettings, setBusinessSettings] =
    useState<BusinessSettings>(defaultBusinessSettings)

  // Terminals
  const [terminals, setTerminals] = useState<Terminal[]>([])
  const [selectedTerminalId, setSelectedTerminalId] = useState<number | null>(null)

  // Terminal modals
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [terminalForm, setTerminalForm] = useState<TerminalFormState>(defaultTerminalForm)

  // Printer
  const initialPrinterConfig = useMemo(() => loadPrinterConfig() ?? defaultSerial, [])
  const [printerTab, setPrinterTab] = useState<PrinterTab>(initialPrinterConfig.type)
  const [serial, setSerial] = useState<SerialConfig>(
    initialPrinterConfig.type === 'serial'
      ? (initialPrinterConfig as SerialConfig)
      : defaultSerial
  )
  const [usb, setUsb] = useState<USBConfig>(
    initialPrinterConfig.type === 'usb' ? (initialPrinterConfig as USBConfig) : defaultUSB
  )
  const [ble, setBle] = useState<BLEConfig>(
    initialPrinterConfig.type === 'ble' ? (initialPrinterConfig as BLEConfig) : defaultBLE
  )
  const [printerBusy, setPrinterBusy] = useState(false)
  const [printerMessage, setPrinterMessage] = useState<string | null>(null)

  const currentPrinterConfig: PrinterConfig = useMemo(() => {
    if (printerTab === 'serial') return serial
    if (printerTab === 'usb') return usb
    return ble
  }, [printerTab, serial, usb, ble])

  // ---------------------------------------------------------------------------
  // Lifecycle
  // ---------------------------------------------------------------------------
  useEffect(() => {
    loadBusinessSettings()
    loadTerminals()
    const savedId = localStorage.getItem('selected_pos_terminal_id')
    if (savedId) setSelectedTerminalId(Number(savedId))
  }, [])

  // ---------------------------------------------------------------------------
  // Data loaders
  // ---------------------------------------------------------------------------
  const loadBusinessSettings = async () => {
    setError('')
    try {
      const response = await SettingsService.getBusinessSettings(true)
      if (response.error) {
        setError(response.error)
      } else if (response.data) {
        setBusinessSettings({
          ...response.data,
          software_provider_date_issued: response.data.software_provider_date_issued || '',
          is_vat_registered: response.data.is_vat_registered ?? true,
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

  // ---------------------------------------------------------------------------
  // Business settings submit — matches updated API (no software_provider_* params)
  // ---------------------------------------------------------------------------
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

  // ---------------------------------------------------------------------------
  // Terminal handlers
  // ---------------------------------------------------------------------------
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
        p_ptu_date_issued: terminalForm.ptu_date_issued,
      }

      const response = await SettingsService.createTerminal(params)
      if (response.error) {
        setError(response.error)
      } else if (response.data?.success) {
        setSuccess(response.data.message || 'Terminal created successfully.')
        setShowCreateModal(false)
        setTerminalForm(defaultTerminalForm)
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
        p_is_active: terminalForm.is_active,
      }

      const response = await SettingsService.updateTerminal(params)
      if (response.error) {
        setError(response.error)
      } else if (response.data?.success) {
        setSuccess(response.data.message || 'Terminal updated successfully.')
        setShowEditModal(false)
        setTerminalForm(defaultTerminalForm)
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
    setTerminalForm(defaultTerminalForm)
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
      current_invoice_number: t.current_invoice_number || 0,
    })
    setShowEditModal(true)
  }

  // ---------------------------------------------------------------------------
  // Printer handlers
  // ---------------------------------------------------------------------------
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
      setPrinterMessage(
        'Saved configuration, but connection/print failed: ' + (e?.message || e)
      )
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

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------
  const clearAlerts = () => {
    setError('')
    setSuccess('')
  }

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(val)

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="mt-1 text-sm text-gray-600">
            Configure your system preferences, business profile, and POS terminals.
          </p>
        </div>

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
          {(
            [
              { id: 'scanner', label: 'Scanner & Application', icon: <SettingsIcon className="h-4 w-4" /> },
              { id: 'business', label: 'Business Profile', icon: <Store className="h-4 w-4" /> },
              { id: 'terminals', label: 'POS Terminals', icon: <Monitor className="h-4 w-4" /> },
              { id: 'printer', label: 'Receipt Printer', icon: <Printer className="h-4 w-4" /> },
            ] as const
          ).map(({ id, label, icon }) => (
            <button
              key={id}
              onClick={() => { setActiveTab(id); clearAlerts() }}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-all ${
                activeTab === id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {icon}
              {label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Contents */}
      <div className="mt-4">
        {/* ---------------------------------------------------------------- */}
        {/* SCANNER TAB                                                       */}
        {/* ---------------------------------------------------------------- */}
        {activeTab === 'scanner' && (
          <div className="space-y-6">
            {/* Barcode Scanner Settings */}
            <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center gap-2">
                <SettingsIcon className="h-5 w-5 text-gray-500" />
                <h2 className="text-lg font-semibold text-gray-800">
                  Barcode Scanner Configuration
                </h2>
              </div>
              <div className="p-6">
                <p className="text-sm text-gray-500 mb-6">
                  Choose how you want to scan products in the POS. Hardware mode uses a physical
                  scanner (keyboard wedge), while Camera mode uses your device's built-in camera.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {(
                    [
                      {
                        mode: 'hardware' as const,
                        icon: <Keyboard className="h-6 w-6" />,
                        title: 'Hardware Scanner',
                        subtitle: 'Fast keyboard wedge input',
                      },
                      {
                        mode: 'camera' as const,
                        icon: <Camera className="h-6 w-6" />,
                        title: 'Camera Scanner',
                        subtitle: "Built-in device camera",
                      },
                    ]
                  ).map(({ mode, icon, title, subtitle }) => (
                    <button
                      key={mode}
                      onClick={() => setScanMode(mode)}
                      className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
                        scanMode === mode
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-200 hover:border-blue-200 hover:bg-gray-50'
                      }`}
                    >
                      <div
                        className={`p-3 rounded-lg ${
                          scanMode === mode ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {icon}
                      </div>
                      <div className="text-left">
                        <div
                          className={`font-bold ${
                            scanMode === mode ? 'text-blue-900' : 'text-gray-900'
                          }`}
                        >
                          {title}
                        </div>
                        <div className="text-xs text-gray-500">{subtitle}</div>
                      </div>
                      {scanMode === mode && (
                        <div className="ml-auto">
                          <div className="h-3 w-3 rounded-full bg-blue-600" />
                        </div>
                      )}
                    </button>
                  ))}
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
                  Select which register terminal is assigned to this device for processing checkouts
                  and recording sales.
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
                  <span
                    className={`font-medium ${
                      scanMode === 'hardware' ? 'text-green-600' : 'text-blue-600'
                    }`}
                  >
                    {scanMode === 'hardware' ? 'Ready (Hardware)' : 'Ready (Camera)'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ---------------------------------------------------------------- */}
        {/* BUSINESS PROFILE TAB                                             */}
        {/* ---------------------------------------------------------------- */}
        {activeTab === 'business' && (
          <form onSubmit={handleUpsertBusiness} className="space-y-6">
            <BusinessInfoForm
              settings={businessSettings}
              isAdmin={isAdmin}
              onChange={setBusinessSettings}
            />

            <SubscriptionStatusCard settings={businessSettings} />

            <SoftwareProviderCard settings={businessSettings} />

            <TaxConfigSection
              settings={businessSettings}
              isAdmin={false}
              onChange={setBusinessSettings}
            />

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

        {/* ---------------------------------------------------------------- */}
        {/* TERMINALS TAB                                                    */}
        {/* ---------------------------------------------------------------- */}
        {activeTab === 'terminals' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Terminals Directory</h3>
                <p className="text-xs text-gray-500">
                  Manage individual POS registers, registrations, and invoice sequences.
                </p>
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
                        <td
                          colSpan={isAdmin ? 6 : 5}
                          className="px-6 py-8 text-center text-gray-500"
                        >
                          No terminals configured.
                        </td>
                      </tr>
                    ) : (
                      terminals.map((t) => (
                        <tr key={t.terminal_id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div className="font-semibold text-gray-900">{t.terminal_name}</div>
                            <div className="text-xs text-gray-500">MIN: {t.min || 'N/A'}</div>
                            {t.serial_number && (
                              <div className="text-xs text-gray-400">SN: {t.serial_number}</div>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-xs font-semibold text-gray-700">
                              PTU: {t.ptu_number || 'N/A'}
                            </div>
                            {t.ptu_date_issued && (
                              <div className="text-xs text-gray-500">
                                Issued: {t.ptu_date_issued}
                              </div>
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

        {/* ---------------------------------------------------------------- */}
        {/* PRINTER TAB                                                      */}
        {/* ---------------------------------------------------------------- */}
        {activeTab === 'printer' && (
          <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center gap-2">
              <Printer className="h-5 w-5 text-gray-500" />
              <h2 className="text-lg font-semibold text-gray-800">Receipt Printer Configuration</h2>
            </div>
            <div className="p-6">
              <p className="text-sm text-gray-500 mb-4">
                Configure Web Serial, WebUSB, or Web Bluetooth to print receipts directly to a
                thermal printer.
              </p>

              <div className="inline-flex rounded-md shadow-sm border mb-6 bg-gray-50 p-0.5">
                {(
                  [
                    { id: 'serial' as const, label: 'Serial', cap: capability.serial },
                    { id: 'usb' as const, label: 'USB', cap: capability.usb },
                    { id: 'ble' as const, label: 'Bluetooth', cap: capability.ble },
                  ]
                ).map(({ id, label, cap }) => (
                  <button
                    key={id}
                    type="button"
                    disabled={!cap}
                    onClick={() => setPrinterTab(id)}
                    title={cap ? '' : `${label} not supported in this browser`}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                      printerTab === id
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-transparent text-gray-700 hover:text-gray-900'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <div className="max-w-xl space-y-6">
                {printerTab === 'serial' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Baud Rate
                      </label>
                      <input
                        type="number"
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                        value={serial.baudRate}
                        onChange={(e) => setSerial({ ...serial, baudRate: Number(e.target.value) })}
                      />
                    </div>
                    <PrinterButtons printerBusy={printerBusy} onSave={savePrinter} />
                  </div>
                )}

                {printerTab === 'usb' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Vendor ID (optional)
                        </label>
                        <input
                          type="number"
                          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                          value={usb.vendorId ?? ''}
                          onChange={(e) =>
                            setUsb({
                              ...usb,
                              vendorId: e.target.value ? Number(e.target.value) : undefined,
                            })
                          }
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Product ID (optional)
                        </label>
                        <input
                          type="number"
                          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                          value={usb.productId ?? ''}
                          onChange={(e) =>
                            setUsb({
                              ...usb,
                              productId: e.target.value ? Number(e.target.value) : undefined,
                            })
                          }
                        />
                      </div>
                    </div>
                    <PrinterButtons printerBusy={printerBusy} onSave={savePrinter} />
                  </div>
                )}

                {printerTab === 'ble' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Service UUID
                      </label>
                      <input
                        type="text"
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                        value={String(ble.serviceUUID)}
                        onChange={(e) => setBle({ ...ble, serviceUUID: e.target.value as any })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Characteristic UUID
                      </label>
                      <input
                        type="text"
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                        value={String(ble.characteristicUUID)}
                        onChange={(e) =>
                          setBle({ ...ble, characteristicUUID: e.target.value as any })
                        }
                      />
                    </div>
                    <PrinterButtons printerBusy={printerBusy} onSave={savePrinter} />
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
                  {printerMessage && (
                    <p className="mt-2 text-sm text-gray-700 font-medium">{printerMessage}</p>
                  )}
                  <p className="mt-2 text-xs text-gray-500">
                    Notes: You must click a button to grant access to devices. Web Serial works best
                    on Chromium browsers. WebUSB and Web Bluetooth require HTTPS and specific browser
                    support.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* MODALS                                                              */}
      {/* ------------------------------------------------------------------ */}
      {showCreateModal && (
        <CreateTerminalModal
          form={terminalForm}
          loading={loading}
          onChange={setTerminalForm}
          onSubmit={handleCreateTerminalSubmit}
          onClose={() => setShowCreateModal(false)}
        />
      )}

      {showEditModal && (
        <EditTerminalModal
          form={terminalForm}
          loading={loading}
          onChange={setTerminalForm}
          onSubmit={handleUpdateTerminalSubmit}
          onClose={() => setShowEditModal(false)}
        />
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Small inline composable — Printer save/test buttons (shared across tabs)
// ---------------------------------------------------------------------------
const PrinterButtons: React.FC<{
  printerBusy: boolean
  onSave: (withDevice: boolean) => void
}> = ({ printerBusy, onSave }) => (
  <div className="flex gap-2">
    <button
      type="button"
      disabled={printerBusy}
      onClick={() => onSave(false)}
      className="px-4 py-2 text-sm font-medium border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50"
    >
      Save
    </button>
    <button
      type="button"
      disabled={printerBusy}
      onClick={() => onSave(true)}
      className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow-sm disabled:opacity-50"
    >
      Save &amp; Test
    </button>
  </div>
)

export default Settings
