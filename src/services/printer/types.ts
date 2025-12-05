export type TransportType = 'serial' | 'usb' | 'ble'

export interface SerialConfig {
  type: 'serial'
  baudRate: number
  dataBits?: 7 | 8
  stopBits?: 1 | 2
  parity?: 'none' | 'even' | 'odd'
}

export interface USBConfig {
  type: 'usb'
  vendorId?: number
  productId?: number
  configurationValue?: number
  interfaceNumber?: number
  endpointOut?: number
}

export interface BLEConfig {
  type: 'ble'
  serviceUUID: string | number
  characteristicUUID: string | number
}

export type PrinterConfig = SerialConfig | USBConfig | BLEConfig

export interface PrinterTransport {
  connect(opts?: { requestDevice?: boolean }): Promise<void>
  write(data: Uint8Array): Promise<void>
  close(): Promise<void>
}

export interface ESCPOSEncoder {
  initialize(): Uint8Array
  text(text: string): Uint8Array
  bold(on: boolean): Uint8Array
  align(mode: 'left' | 'center' | 'right'): Uint8Array
  size(widthMul: 1 | 2, heightMul: 1 | 2): Uint8Array
  newline(lines?: number): Uint8Array
  cut(): Uint8Array
}

export const PRINTER_CONFIG_KEY = 'pos_printer_config'

export function loadPrinterConfig(): PrinterConfig | null {
  try {
    const raw = localStorage.getItem(PRINTER_CONFIG_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return parsed as PrinterConfig
  } catch (e) {
    console.warn('Failed to load printer config', e)
    return null
  }
}

export function savePrinterConfig(cfg: PrinterConfig) {
  localStorage.setItem(PRINTER_CONFIG_KEY, JSON.stringify(cfg))
}

// --- Receipt design configuration ---
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
