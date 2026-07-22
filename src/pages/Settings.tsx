import React, { useState, useEffect, useCallback } from 'react'
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
  Wifi,
  WifiOff,
  RefreshCw,
  Plug,
  Power,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react'
import { useScannerSettings } from '../contexts/ScannerSettingsContext'
import { usePrinter } from '../contexts/PrinterContext'
import { useAuth } from '../contexts/AuthContext'
import { SettingsService } from '../services/settingsService'
import { BusinessSettings, Terminal } from '../types/settings'
import { WebUsbConfig, AndroidBtConfig } from '../services/printer/types'
import { DEFAULT_WEBUSB_CONFIG } from '../services/printer/config/webusb-defaults'
import { DEFAULT_ANDROID_BT_CONFIG } from '../services/printer/config/android-bt-defaults'
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
import { FormatDateTime } from '../utils/formatDateTime'
import { getTerminalId, saveTerminalId, clearTerminalId } from '../utils/terminalStorage'

// ---------------------------------------------------------------------------
// Printer helpers
// ---------------------------------------------------------------------------
type PrinterTab = 'webusb' | 'android-bt'


function sampleReceipt(): ReceiptData {
  const now = FormatDateTime.formatLocalTimestampForDatabase(new Date())
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


  // Printer (driven by PrinterContext)
  const {
    status: printerStatus,
    statusMessage: printerStatusMsg,
    printers,
    selectedPrinter,
    isConnected,
    autoPrint,
    setAutoPrint,
    config: printerConfig,
    setConfig: setPrinterConfig,
    checkStatus,
    connect: connectPrinter,
    disconnect: disconnectPrinter,
    print: printReceipt,
    busy: printerBusy,
  } = usePrinter()

  const [printerTab, setPrinterTab] = useState<PrinterTab>(
    () =>
      printerConfig?.type === 'webusb'
        ? 'webusb'
        : printerConfig?.type === 'android-bt'
        ? 'android-bt' : 'android-bt'
  )

  const [usbForm, setUsbForm] = useState<WebUsbConfig>(
    printerConfig?.type === 'webusb' ? (printerConfig as WebUsbConfig) : { ...DEFAULT_WEBUSB_CONFIG }
  )
  const [btForm, setBtForm] = useState<AndroidBtConfig>(
    printerConfig?.type === 'android-bt' ? (printerConfig as AndroidBtConfig) : { ...DEFAULT_ANDROID_BT_CONFIG }
  )
  const [printerMessage, setPrinterMessage] = useState<string | null>(null)

  // Sync state if printerConfig updates in background
  useEffect(() => {
    if (printerConfig?.type === 'webusb') {
      setUsbForm(printerConfig)
    } else if (printerConfig?.type === 'android-bt') {
      setBtForm(printerConfig)
    }
  }, [printerConfig])


  // ---------------------------------------------------------------------------
  // Lifecycle
  // ---------------------------------------------------------------------------
  useEffect(() => {
    loadBusinessSettings()
    loadTerminals()
    const savedId = getTerminalId()
    if (savedId) setSelectedTerminalId(savedId)
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
  // Printer handlers (via PrinterContext)
  // ---------------------------------------------------------------------------
  const handleTabChange = useCallback((tab: PrinterTab) => {
    setPrinterTab(tab)
    const cfg = tab === 'webusb' ? usbForm : btForm
    setPrinterConfig(cfg)
    setPrinterMessage(null)
  }, [usbForm, btForm, setPrinterConfig])

  const handleSaveConfig = useCallback(async (withTest: boolean) => {
    setPrinterMessage(null)
    const cfg = printerTab === 'webusb' ? usbForm : btForm
    setPrinterConfig(cfg)
    if (withTest) {
      try {
        await printReceipt(sampleReceipt())
        setPrinterMessage('Configuration saved and test receipt sent ✓')
      } catch (e: any) {
        setPrinterMessage('Saved, but test print failed: ' + (e?.message || e))
      }
    } else {
      setPrinterMessage('Configuration saved.')
    }
  }, [printerTab, usbForm, btForm, setPrinterConfig, printReceipt])

  const handleConnect = useCallback(async () => {
    setPrinterMessage(null)
    try {
      const targetConfig: PrinterConfig = printerTab === 'android-bt' ? btForm : usbForm
      await connectPrinter(targetConfig)
      setPrinterMessage('Connected ✓')
    } catch (e: any) {
      setPrinterMessage('Connect failed: ' + (e?.message || e))
    }
  }, [printerTab, btForm, usbForm, connectPrinter])

  const handleDisconnect = useCallback(async () => {
    setPrinterMessage(null)
    await disconnectPrinter()
    setPrinterMessage('Disconnected.')
  }, [disconnectPrinter])

  const handleCheckStatus = useCallback(async () => {
    setPrinterMessage(null)
    await checkStatus()
  }, [checkStatus])

  const handleTestPrint = useCallback(async () => {
    setPrinterMessage(null)
    try {
      await printReceipt(sampleReceipt())
      setPrinterMessage('Test receipt sent ✓')
    } catch (e: any) {
      setPrinterMessage('Test print failed: ' + (e?.message || e))
    }
  }, [printReceipt])


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
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-all ${activeTab === id
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
                      className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${scanMode === mode
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-200 hover:bg-gray-50'
                        }`}
                    >
                      <div
                        className={`p-3 rounded-lg ${scanMode === mode ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500'
                          }`}
                      >
                        {icon}
                      </div>
                      <div className="text-left">
                        <div
                          className={`font-bold ${scanMode === mode ? 'text-blue-900' : 'text-gray-900'
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
                        saveTerminalId(id)
                      } else {
                        clearTerminalId()
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
                    className={`font-medium ${scanMode === 'hardware' ? 'text-green-600' : 'text-blue-600'
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
                              className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold leading-5 ${t.is_active
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
          <div className="space-y-5">
            {/* ── Platform Tabs at the Top ── */}
            <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-800">Select Platform</span>
                <div className="inline-flex rounded-md shadow-sm border bg-white p-0.5">
                  {([{ id: 'webusb' as const, label: '🔌 USB' },
                    { id: 'android-bt' as const, label: '📶 Bluetooth' },
                  ]).map(({ id, label }) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => handleTabChange(id)}
                      className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all ${
                        printerTab === id
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'bg-transparent text-gray-700 hover:text-gray-900'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* ── Status Bar & Details (Below) ── */}
            <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden p-6 space-y-6">
              {/* Receipt Printer Status Box */}
              <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
                <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Printer className="h-4 w-4 text-gray-500" />
                    <h3 className="text-sm font-semibold text-gray-800">Receipt Printer</h3>
                  </div>
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    printerStatus === 'connected' ? 'bg-green-100 text-green-800' :
                    printerStatus === 'connecting' ? 'bg-yellow-100 text-yellow-800' :
                    printerStatus === 'error' ? 'bg-red-100 text-red-700' :
                    printerStatus === 'disconnected' ? 'bg-gray-100 text-gray-600' :
                    'bg-gray-100 text-gray-500'
                  }`}>
                    {printerStatus === 'connected' ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
                    {printerStatus.charAt(0).toUpperCase() + printerStatus.slice(1)}
                  </span>
                </div>
                <div className="px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3 bg-white">
                  <p className="text-xs text-gray-600 flex-1 font-mono">
                    {printerStatusMsg || (printerConfig ? 'Printer configured. Ready to connect.' : 'No printer configured yet.')}
                    {selectedPrinter && <span className="ml-1 font-medium text-gray-800">— {selectedPrinter}</span>}
                  </p>
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      id="btn-check-printer-status"
                      type="button"
                      disabled={printerBusy}
                      onClick={handleCheckStatus}
                      className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                    >
                      <RefreshCw className={`h-3 w-3 ${printerBusy ? 'animate-spin' : ''}`} />
                      Check Status
                    </button>
                    {isConnected ? (
                      <button
                        id="btn-disconnect-printer"
                        type="button"
                        disabled={printerBusy}
                        onClick={handleDisconnect}
                        className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-red-50 border border-red-200 rounded-md text-red-700 hover:bg-red-100 disabled:opacity-50"
                      >
                        <Power className="h-3 w-3" />
                        Disconnect
                      </button>
                    ) : (
                      <button
                        id="btn-connect-printer"
                        type="button"
                        disabled={printerBusy || !printerConfig}
                        onClick={handleConnect}
                        className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                      >
                        <Plug className="h-3 w-3" />
                        Connect
                      </button>
                    )}
                  </div>
                </div>

                {printers.length > 0 && (
                  <div className="px-4 py-3 border-t border-gray-100 pt-2 bg-gray-50/30">
                    <p className="text-[10px] text-gray-400 mb-1.5 font-semibold uppercase tracking-wide">Available Printers</p>
                    <div className="flex flex-wrap gap-1">
                      {printers.map((p) => (
                        <span
                          key={p}
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium border ${
                            selectedPrinter === p
                              ? 'bg-blue-50 border-blue-300 text-blue-800'
                              : 'bg-gray-50 border-gray-200 text-gray-700'
                          }`}
                        >
                          {p}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="max-w-xl space-y-4 pt-2">
                {/* ── WebUSB form ── */}
                {printerTab === 'webusb' && (
                  <div className="space-y-4">
                    {typeof navigator === 'undefined' || !('usb' in navigator) ? (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-800">
                        ⚠️ WebUSB is not supported in this browser. Please use a Chromium-based browser like Google Chrome, Microsoft Edge, or Opera.
                      </div>
                    ) : (
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-md text-sm text-blue-800">
                        🔌 WebUSB allows you to connect directly to standard USB receipt printers from the browser without installing any bridge software.
                      </div>
                    )}

                    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50/50 space-y-3">
                      <h4 className="text-sm font-semibold text-gray-800">Paired Printer Device</h4>
                      {usbForm.vendorId !== undefined ? (
                        <div className="space-y-1.5 text-xs text-gray-600">
                          <div><strong className="text-gray-700">Device:</strong> {usbForm.deviceName || 'Standard USB Printer'}</div>
                          <div><strong className="text-gray-700">Vendor ID (Hex):</strong> 0x{usbForm.vendorId.toString(16).padStart(4, '0')} ({usbForm.vendorId})</div>
                          <div><strong className="text-gray-700">Product ID (Hex):</strong> {usbForm.productId !== undefined ? `0x${usbForm.productId.toString(16).padStart(4, '0')} (${usbForm.productId})` : 'N/A'}</div>
                        </div>
                      ) : (
                        <p className="text-xs text-gray-500 italic">No USB printer paired yet. Click the button below to connect/pair a device.</p>
                      )}

                      <div className="pt-2 flex flex-wrap gap-2">
                        <button
                          id="btn-pair-usb-printer"
                          type="button"
                          disabled={printerBusy || (typeof navigator !== 'undefined' && !('usb' in navigator))}
                          onClick={handleConnect}
                          className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-md text-xs font-semibold shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          {usbForm.vendorId !== undefined ? 'Change / Reconnect USB Printer' : 'Select & Pair USB Printer'}
                        </button>
                        {usbForm.vendorId !== undefined && (
                          <button
                            id="btn-clear-usb-printer"
                            type="button"
                            onClick={() => {
                              setUsbForm({
                                type: 'webusb',
                                vendorId: undefined,
                                productId: undefined,
                                deviceName: '',
                              })
                              handleDisconnect()
                            }}
                            className="px-3.5 py-1.5 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-md text-xs font-semibold transition-all focus:outline-none"
                          >
                            Reset
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Manual Override Settings */}
                    <details className="text-xs text-gray-500">
                      <summary className="cursor-pointer hover:text-gray-700 font-medium select-none">
                        Advanced / Manual Settings
                      </summary>
                      <div className="space-y-3 mt-3 pl-3 border-l-2 border-gray-200">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Vendor ID (Decimal or Hex)
                          </label>
                          <input
                            type="text"
                            className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-xs font-mono focus:border-blue-500 focus:outline-none"
                            placeholder="e.g. 0x0fe5 or 4069"
                            value={usbForm.vendorId !== undefined ? (usbForm.vendorId.toString().startsWith('0x') ? usbForm.vendorId : '0x' + usbForm.vendorId.toString(16)) : ''}
                            onChange={(e) => {
                              const val = e.target.value.trim()
                              if (!val) {
                                setUsbForm({ ...usbForm, vendorId: undefined })
                                return
                              }
                              const num = val.toLowerCase().startsWith('0x') ? parseInt(val, 16) : parseInt(val, 10)
                              if (!isNaN(num)) {
                                setUsbForm({ ...usbForm, vendorId: num })
                              }
                            }}
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Product ID (Decimal or Hex)
                          </label>
                          <input
                            type="text"
                            className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-xs font-mono focus:border-blue-500 focus:outline-none"
                            placeholder="e.g. 0x0801 or 2049"
                            value={usbForm.productId !== undefined ? (usbForm.productId.toString().startsWith('0x') ? usbForm.productId : '0x' + usbForm.productId.toString(16)) : ''}
                            onChange={(e) => {
                              const val = e.target.value.trim()
                              if (!val) {
                                setUsbForm({ ...usbForm, productId: undefined })
                                return
                              }
                              const num = val.toLowerCase().startsWith('0x') ? parseInt(val, 16) : parseInt(val, 10)
                              if (!isNaN(num)) {
                                setUsbForm({ ...usbForm, productId: num })
                              }
                            }}
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Custom Display Name
                          </label>
                          <input
                            type="text"
                            className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-xs focus:border-blue-500 focus:outline-none"
                            placeholder="e.g. My USB Printer"
                            value={usbForm.deviceName ?? ''}
                            onChange={(e) => setUsbForm({ ...usbForm, deviceName: e.target.value })}
                          />
                        </div>
                      </div>
                    </details>

                    <div className="flex gap-2 pt-2">
                      <button
                        type="button"
                        disabled={printerBusy}
                        onClick={() => handleSaveConfig(false)}
                        className="px-4 py-2 text-sm font-medium border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        disabled={printerBusy || usbForm.vendorId === undefined}
                        onClick={() => handleSaveConfig(true)}
                        className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow-sm disabled:opacity-50"
                      >
                        Save &amp; Test Print
                      </button>
                    </div>
                  </div>
                )}

                {/* ── Bluetooth (Android) form ── */}
                {printerTab === 'android-bt' && (
                  <div className="space-y-4">
                    {typeof navigator === 'undefined' || !('bluetooth' in navigator) ? (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-800">
                        ⚠️ Web Bluetooth is not supported in this browser. Please use Chrome on Android or Chrome/Edge on desktop.
                      </div>
                    ) : (
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-md text-sm text-blue-800">
                        📶 Web Bluetooth lets you print directly to BLE thermal printers from Android Chrome or desktop Chrome/Edge — no drivers or bridge software needed.
                      </div>
                    )}

                    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50/50 space-y-3">
                      <h4 className="text-sm font-semibold text-gray-800">Paired Bluetooth Printer</h4>
                      {btForm.deviceName ? (
                        <div className="space-y-1.5 text-xs text-gray-600">
                          <div><strong className="text-gray-700">Device:</strong> {btForm.deviceName}</div>
                          {btForm.deviceId && (
                            <div><strong className="text-gray-700">Device ID:</strong> <span className="font-mono">{btForm.deviceId}</span></div>
                          )}
                        </div>
                      ) : (
                        <p className="text-xs text-gray-500 italic">No Bluetooth printer paired yet. Click the button below to scan and pair a device.</p>
                      )}

                      <div className="pt-2 flex flex-wrap gap-2">
                        <button
                          id="btn-pair-bt-printer"
                          type="button"
                          disabled={printerBusy || (typeof navigator !== 'undefined' && !('bluetooth' in navigator))}
                          onClick={handleConnect}
                          className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-md text-xs font-semibold shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          {btForm.deviceName ? 'Change / Reconnect BT Printer' : 'Scan & Pair Bluetooth Printer'}
                        </button>
                        {btForm.deviceName && (
                          <button
                            id="btn-clear-bt-printer"
                            type="button"
                            onClick={() => {
                              setBtForm({ ...DEFAULT_ANDROID_BT_CONFIG })
                              handleDisconnect()
                            }}
                            className="px-3.5 py-1.5 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-md text-xs font-semibold transition-all focus:outline-none"
                          >
                            Reset
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Advanced BLE UUID overrides */}
                    <details className="text-xs text-gray-500">
                      <summary className="cursor-pointer hover:text-gray-700 font-medium select-none">
                        Advanced / Manual BLE Settings
                      </summary>
                      <div className="space-y-3 mt-3 pl-3 border-l-2 border-gray-200">
                        <p className="text-xs text-gray-400">Leave these blank to auto-detect from common ESC/POS BLE profiles. Only set manually if auto-detection fails.</p>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Service UUID
                          </label>
                          <input
                            type="text"
                            className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-xs font-mono focus:border-blue-500 focus:outline-none"
                            placeholder="e.g. 000018f0-0000-1000-8000-00805f9b34fb"
                            value={btForm.serviceUuid ?? ''}
                            onChange={(e) => setBtForm({ ...btForm, serviceUuid: e.target.value.trim() || undefined })}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Write Characteristic UUID
                          </label>
                          <input
                            type="text"
                            className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-xs font-mono focus:border-blue-500 focus:outline-none"
                            placeholder="e.g. 00002af1-0000-1000-8000-00805f9b34fb"
                            value={btForm.characteristicUuid ?? ''}
                            onChange={(e) => setBtForm({ ...btForm, characteristicUuid: e.target.value.trim() || undefined })}
                          />
                        </div>
                      </div>
                    </details>

                    <div className="flex gap-2 pt-2">
                      <button
                        type="button"
                        disabled={printerBusy}
                        onClick={() => handleSaveConfig(false)}
                        className="px-4 py-2 text-sm font-medium border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        disabled={printerBusy || !btForm.deviceName}
                        onClick={() => handleSaveConfig(true)}
                        className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow-sm disabled:opacity-50"
                      >
                        Save &amp; Test Print
                      </button>
                    </div>
                  </div>
                )}

                {/* ── Shared: Test Print + Auto-print toggle ── */}
                <div className="pt-4 border-t space-y-4">
                  <div className="flex items-center gap-3">
                    <button
                      id="btn-test-print"
                      type="button"
                      disabled={printerBusy}
                      onClick={handleTestPrint}
                      className="px-4 py-2 text-sm font-medium bg-green-600 hover:bg-green-700 text-white rounded-md shadow-sm disabled:opacity-50"
                    >
                      Test Print
                    </button>
                    {printerBusy && <span className="text-sm text-gray-500 animate-pulse">Working…</span>}
                  </div>

                  {printerMessage && (
                    <p className={`text-sm font-medium ${printerMessage.includes('failed') || printerMessage.includes('Failed') ? 'text-red-600' : 'text-green-700'}`}>
                      {printerMessage}
                    </p>
                  )}

                  {/* Auto-print toggle */}
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div>
                      <p className="text-sm font-medium text-gray-800">Auto-Print on Checkout</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Automatically send receipt to printer after every successful sale
                      </p>
                    </div>
                    <button
                      id="btn-toggle-auto-print"
                      type="button"
                      onClick={() => setAutoPrint(!autoPrint)}
                      className={`flex-shrink-0 transition-colors ${autoPrint ? 'text-blue-600' : 'text-gray-400'}`}
                      title={autoPrint ? 'Auto-print ON — click to disable' : 'Auto-print OFF — click to enable'}
                    >
                      {autoPrint
                        ? <ToggleRight className="h-8 w-8" />
                        : <ToggleLeft className="h-8 w-8" />
                      }
                    </button>
                  </div>

                  <p className="text-xs text-gray-400">
                    <strong>USB:</strong> WebUSB — directly access USB receipt printers from Chrome, Edge, or Opera.<br />
                    <strong>Bluetooth:</strong> Web Bluetooth — pair BLE receipt printers from Android Chrome or desktop Chrome/Edge.
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

export default Settings
