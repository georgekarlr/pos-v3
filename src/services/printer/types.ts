// ---------------------------------------------------------------------------
// Transport platform types
// ---------------------------------------------------------------------------

/** Which platform/protocol handles the physical print job */
export type TransportType = 'qz' | 'webusb' | 'bridge' | 'android-bt'

// --- QZ Tray (desktop: Windows / Linux / macOS) ---
export type QzConnectionType = 'usb' | 'serial' | 'network' | 'file'

export interface QzConfig {
  type: 'qz'
  /** QZ Tray WebSocket host (default: localhost) */
  host?: string
  /** QZ Tray WebSocket port (default: 8181) */
  port?: number
  /** Exact printer name as shown in QZ Tray / OS printer list. Empty = OS default printer */
  printerName?: string
  /** Physical connection type of the printer attached to the desktop */
  connectionType?: QzConnectionType
  /** Optional: path to PEM certificate for signed printing */
  certPath?: string
}

// --- WebUSB (direct USB printing in browser) ---
export interface WebUsbConfig {
  type: 'webusb'
  vendorId?: number
  productId?: number
  deviceName?: string
}

// --- Bridge Printer (coming soon) ---
export interface BridgeConfig {
  type: 'bridge'
  /** HTTP endpoint for the bridge server */
  endpoint?: string
}

// --- Android Web Bluetooth (BLE receipt printers) ---
export interface AndroidBtConfig {
  type: 'android-bt'
  /** Display name of the paired BT device (filled in after connect) */
  deviceName?: string
  /** Browser-assigned device ID (filled in after connect) */
  deviceId?: string
  /** Override BLE service UUID (leave empty to auto-detect from known list) */
  serviceUuid?: string
  /** Override write characteristic UUID (leave empty to auto-detect) */
  characteristicUuid?: string
}

export type PrinterConfig = QzConfig | WebUsbConfig | BridgeConfig | AndroidBtConfig

// ---------------------------------------------------------------------------
// Transport lifecycle status
// ---------------------------------------------------------------------------
export type PrinterStatus =
  | 'idle'          // not yet attempted
  | 'connecting'    // in progress
  | 'connected'     // ready to print
  | 'disconnected'  // cleanly closed
  | 'error'         // failed

export interface PrinterStatusDetail {
  status: PrinterStatus
  message?: string
  /** Whether QZ Tray (or the native plugin) is reachable at all */
  serviceAvailable?: boolean
}

// ---------------------------------------------------------------------------
// Core transport interface
// ---------------------------------------------------------------------------
export interface PrinterTransport {
  /** Check whether the transport service (QZ Tray / BT) is reachable */
  checkStatus(): Promise<PrinterStatusDetail>
  /** Return list of printer names available on this transport */
  getPrinters(): Promise<string[]>
  /** Connect to the configured printer (or the first/default one) */
  connect(opts?: { requestDevice?: boolean }): Promise<void>
  /** Send raw ESC/POS bytes to the connected printer */
  write(data: Uint8Array): Promise<void>
  /** Gracefully disconnect / release resources */
  disconnect(): Promise<void>
}

// ---------------------------------------------------------------------------
// ESC/POS encoder interface (unchanged)
// ---------------------------------------------------------------------------
export interface ESCPOSEncoder {
  initialize(): Uint8Array
  text(text: string): Uint8Array
  bold(on: boolean): Uint8Array
  align(mode: 'left' | 'center' | 'right'): Uint8Array
  size(widthMul: 1 | 2, heightMul: 1 | 2): Uint8Array
  newline(lines?: number): Uint8Array
  cut(): Uint8Array
}

// ---------------------------------------------------------------------------
// Persistence helpers
// ---------------------------------------------------------------------------
export const PRINTER_CONFIG_KEY = 'pos_printer_config'
export const PRINTER_AUTO_PRINT_KEY = 'pos_printer_auto_print'

export function loadPrinterConfig(): PrinterConfig | null {
  try {
    const raw = localStorage.getItem(PRINTER_CONFIG_KEY)
    if (!raw) return null
    return JSON.parse(raw) as PrinterConfig
  } catch (e) {
    console.warn('Failed to load printer config', e)
    return null
  }
}

export function savePrinterConfig(cfg: PrinterConfig) {
  localStorage.setItem(PRINTER_CONFIG_KEY, JSON.stringify(cfg))
}

export function loadAutoPrint(): boolean {
  return localStorage.getItem(PRINTER_AUTO_PRINT_KEY) === 'true'
}

export function saveAutoPrint(enabled: boolean) {
  localStorage.setItem(PRINTER_AUTO_PRINT_KEY, String(enabled))
}

// ---------------------------------------------------------------------------
// Receipt design configuration (unchanged)
// ---------------------------------------------------------------------------
export type ReceiptTextAlign = 'left' | 'center' | 'right'
export type ReceiptTextSize = 'normal' | 'double'

export interface ReceiptDesign {
  headerText?: string
  headerAlign?: ReceiptTextAlign
  headerBold?: boolean
  headerSize?: ReceiptTextSize

  // Store information (overrides businessName/businessAddress from receipt data when provided)
  storeName?: string
  storeAddress1?: string
  storeAddress2?: string

  footerText?: string
  footerAlign?: ReceiptTextAlign
  footerBold?: boolean
  footerSize?: ReceiptTextSize

  // --- Main body layout ---
  // Paper width in characters for monospaced layout (typical 32 or 42 for 58mm printers)
  paperWidth?: number
  // Column labels
  itemLabel?: string
  qtyLabel?: string
  totalLabel?: string
  // Column widths (characters)
  itemWidth?: number
  qtyWidth?: number
  totalWidth?: number
  // Column alignments
  itemAlign?: ReceiptTextAlign
  qtyAlign?: ReceiptTextAlign
  totalAlign?: ReceiptTextAlign
  // Separators and dashes
  separatorChar?: string // default '-'
  showTopSeparator?: boolean // before header row
  showHeaderSeparator?: boolean // after header row
  showItemsSeparatorBottom?: boolean // after all items
}

export const PRINTER_DESIGN_KEY = 'pos_printer_design'

export function loadReceiptDesign(): ReceiptDesign {
  try {
    const raw = localStorage.getItem(PRINTER_DESIGN_KEY)
    if (!raw) return {}
    return JSON.parse(raw) as ReceiptDesign
  } catch (e) {
    console.warn('Failed to load receipt design', e)
    return {}
  }
}

export function saveReceiptDesign(design: ReceiptDesign) {
  localStorage.setItem(PRINTER_DESIGN_KEY, JSON.stringify(design))
}
