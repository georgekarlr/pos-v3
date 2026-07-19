/**
 * PrinterContext
 *
 * Global React context that manages the ESC/POS printer lifecycle:
 *   - Connection status (idle / connecting / connected / disconnected / error)
 *   - Connect / disconnect lifecycle
 *   - autoPrint toggle: when true, the receipt is automatically sent to the
 *     configured printer after every successful checkout (no manual click needed)
 *   - print(receiptData) — sends ESC/POS bytes through the active transport
 *
 * The context keeps a single long-lived transport instance while connected,
 * so the WebSocket to the WebUSB interface claim stays open
 * across multiple print jobs during a session.
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import type { PrinterConfig, PrinterStatus, PrinterStatusDetail } from '../services/printer/types'
import {
  loadAutoPrint,
  loadPrinterConfig,
  saveAutoPrint,
  savePrinterConfig,
} from '../services/printer/types'
import { createTransport, buildEscposFromReceipt, buildEscposFromRawText } from '../services/printer'
import type { PrinterTransport } from '../services/printer/types'
import type { ReceiptData } from '../components/pos/Receipt'

// ---------------------------------------------------------------------------
// Context shape
// ---------------------------------------------------------------------------
interface PrinterContextType {
  /** Current connection lifecycle status */
  status: PrinterStatus
  /** Human-readable status message (errors, info) */
  statusMessage: string
  /** WebUSB service is reachable at all */
  serviceAvailable: boolean
  /** Printers reported by the active transport (paired USB devices) */
  printers: string[]
  /** Currently selected/connected printer name */
  selectedPrinter: string | null
  /** Whether a transport is actively connected and ready to print */
  isConnected: boolean
  /** When true, print() is called automatically on every checkout */
  autoPrint: boolean
  /** Toggle auto-print (persisted to localStorage) */
  setAutoPrint: (enabled: boolean) => void
  /** Active printer config (loaded from localStorage) */
  config: PrinterConfig | null
  /** Save a new config (updates localStorage and re-initialises transport) */
  setConfig: (cfg: PrinterConfig) => void
  /** Ping the transport to get current status */
  checkStatus: () => Promise<void>
  /** Fetch available printer names from the transport */
  getPrinters: () => Promise<void>
  /** Connect to the configured printer */
  connect: () => Promise<void>
  /** Disconnect from the printer */
  disconnect: () => Promise<void>
  /** Send a receipt to the printer (must be connected) */
  print: (data: ReceiptData) => Promise<void>
  /** Send raw text to the printer (must be connected) */
  printRaw: (text: string) => Promise<void>
  /** True while any async printer operation is in flight */
  busy: boolean
}

// ---------------------------------------------------------------------------
// Context + hook
// ---------------------------------------------------------------------------
const PrinterContext = createContext<PrinterContextType | undefined>(undefined)

export function usePrinter(): PrinterContextType {
  const ctx = useContext(PrinterContext)
  if (!ctx) throw new Error('usePrinter must be used inside <PrinterProvider>')
  return ctx
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------
export const PrinterProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [config, setConfigState] = useState<PrinterConfig | null>(() => loadPrinterConfig())
  const [status, setStatus] = useState<PrinterStatus>('idle')
  const [statusMessage, setStatusMessage] = useState('')
  const [serviceAvailable, setServiceAvailable] = useState(false)
  const [printers, setPrinters] = useState<string[]>([])
  const [selectedPrinter, setSelectedPrinter] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [autoPrint, setAutoPrintState] = useState(() => loadAutoPrint())
  const [busy, setBusy] = useState(false)

  // Keep a long-lived transport instance while connected
  const transportRef = useRef<PrinterTransport | null>(null)

  // Whenever the config changes, tear down any existing transport
  const resetTransport = useCallback(() => {
    if (transportRef.current) {
      transportRef.current.disconnect().catch(() => {})
      transportRef.current = null
    }
    setIsConnected(false)
    setSelectedPrinter(null)
    setStatus('idle')
    setStatusMessage('')
    setServiceAvailable(false)
    setPrinters([])
  }, [])

  // -------------------------------------------------------------------------
  // setConfig — persist and reset
  // -------------------------------------------------------------------------
  const setConfig = useCallback(
    (cfg: PrinterConfig) => {
      savePrinterConfig(cfg)
      setConfigState(cfg)
      resetTransport()
    },
    [resetTransport]
  )

  // -------------------------------------------------------------------------
  // setAutoPrint — persist
  // -------------------------------------------------------------------------
  const setAutoPrint = useCallback((enabled: boolean) => {
    setAutoPrintState(enabled)
    saveAutoPrint(enabled)
  }, [])

  // -------------------------------------------------------------------------
  // checkStatus
  // -------------------------------------------------------------------------
  const checkStatus = useCallback(async () => {
    if (!config) {
      setStatus('idle')
      setStatusMessage('No printer configured.')
      setServiceAvailable(false)
      return
    }
    setBusy(true)
    try {
      // Reuse existing transport or create a temporary one for the ping
      const transport = transportRef.current ?? createTransport(config)
      const detail: PrinterStatusDetail = await transport.checkStatus()
      applyStatusDetail(detail)

    } catch (err: any) {
      setStatus('error')
      setStatusMessage(err?.message ?? 'Unknown error')
      setServiceAvailable(false)
    } finally {
      setBusy(false)
    }
  }, [config])

  // -------------------------------------------------------------------------
  // getPrinters
  // -------------------------------------------------------------------------
  const getPrinters = useCallback(async () => {
    if (!config) {
      setStatusMessage('No printer configured.')
      return
    }
    setBusy(true)
    try {
      const transport = transportRef.current ?? createTransport(config)
      const list = await transport.getPrinters()
      setPrinters(list)
    } catch (err: any) {
      setStatusMessage(err?.message ?? 'Failed to get printers')
    } finally {
      setBusy(false)
    }
  }, [config])

  // -------------------------------------------------------------------------
  // connect
  // -------------------------------------------------------------------------
  const connect = useCallback(async () => {
    if (!config) throw new Error('No printer config saved. Configure a printer first.')
    if (isConnected) return // already connected

    setBusy(true)
    setStatus('connecting')
    setStatusMessage('Connecting…')
    try {
      const transport = createTransport(config)
      await transport.connect({ requestDevice: true })
      transportRef.current = transport

      // If it's WebUSB, retrieve details of the device user actually paired
      if (config.type === 'webusb' && 'getConfig' in transport) {
        const updatedConfig = (transport as any).getConfig() as PrinterConfig
        savePrinterConfig(updatedConfig)
        setConfigState(updatedConfig)
      }

      // Fetch printer name from status after connect
      const detail = await transport.checkStatus()
      applyStatusDetail(detail)
      setIsConnected(true)

      // Refresh printer list after connecting
      try {
        const list = await transport.getPrinters()
        setPrinters(list)
      } catch {
        // Non-fatal
      }

      // Extract selected printer name from message if possible
      const nameMatch = detail.message?.match(/Connected to "(.+)"/)
      if (nameMatch) setSelectedPrinter(nameMatch[1])
    } catch (err: any) {
      setStatus('error')
      setStatusMessage(err?.message ?? 'Connection failed')
      setIsConnected(false)
      transportRef.current = null
      throw err
    } finally {
      setBusy(false)
    }
  }, [config, isConnected])

  // -------------------------------------------------------------------------
  // disconnect
  // -------------------------------------------------------------------------
  const disconnect = useCallback(async () => {
    setBusy(true)
    try {
      if (transportRef.current) {
        await transportRef.current.disconnect()
        transportRef.current = null
      }
    } finally {
      setIsConnected(false)
      setSelectedPrinter(null)
      setStatus('disconnected')
      setStatusMessage('Disconnected.')
      setBusy(false)
    }
  }, [])

  // -------------------------------------------------------------------------
  // print
  // -------------------------------------------------------------------------
  const print = useCallback(
    async (data: ReceiptData) => {
      if (!config) throw new Error('No printer configured.')
      setBusy(true)
      try {
        // Auto-connect if not already connected
        if (!transportRef.current || !isConnected) {
          const transport = createTransport(config)
          await transport.connect({ requestDevice: true })
          transportRef.current = transport
          setIsConnected(true)
          setStatus('connected')
        }
        const payload = buildEscposFromReceipt(data)
        await transportRef.current!.write(payload)
      } finally {
        setBusy(false)
      }
    },
    [config, isConnected]
  )

  const printRaw = useCallback(
    async (text: string) => {
      if (!config) throw new Error('No printer configured.')
      setBusy(true)
      try {
        if (!transportRef.current || !isConnected) {
          const transport = createTransport(config)
          await transport.connect({ requestDevice: true })
          transportRef.current = transport
          setIsConnected(true)
          setStatus('connected')
        }
        const payload = buildEscposFromRawText(text)
        await transportRef.current!.write(payload)
      } finally {
        setBusy(false)
      }
    },
    [config, isConnected]
  )

  // -------------------------------------------------------------------------
  // On mount: ping status if config exists
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (config) {
      checkStatus().catch(() => {})
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // -------------------------------------------------------------------------
  // Cleanup on unmount
  // -------------------------------------------------------------------------
  useEffect(() => {
    return () => {
      transportRef.current?.disconnect().catch(() => {})
    }
  }, [])

  // -------------------------------------------------------------------------
  // Internal helper
  // -------------------------------------------------------------------------
  function applyStatusDetail(detail: PrinterStatusDetail) {
    setStatus(detail.status)
    setStatusMessage(detail.message ?? '')
    setServiceAvailable(detail.serviceAvailable ?? false)
  }

  return (
    <PrinterContext.Provider
      value={{
        status,
        statusMessage,
        serviceAvailable,
        printers,
        selectedPrinter,
        isConnected,
        autoPrint,
        setAutoPrint,
        config,
        setConfig,
        checkStatus,
        getPrinters,
        connect,
        disconnect,
        print,
        printRaw,
        busy,
      }}
    >
      {children}
    </PrinterContext.Provider>
  )
}
