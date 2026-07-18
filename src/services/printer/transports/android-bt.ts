/**
 * Android Web Bluetooth Printer Transport
 *
 * Connects to BLE receipt printers directly from the browser via Web Bluetooth.
 * Works on Android Chrome (6+) and desktop Chrome/Edge.
 * Does NOT support Bluetooth Classic (SPP) — BLE only.
 *
 * Common ESC/POS BLE profiles covered:
 *   - Generic BLE UART / Serial Port Profile (many Xprinter, Rongta, etc.)
 *   - Epson-style BLE printing service
 *
 * The transport will scan for any of the known service UUIDs and auto-detect
 * the appropriate write characteristic.
 */

import type { PrinterTransport, PrinterStatusDetail, AndroidBtConfig } from '../types'

// ---------------------------------------------------------------------------
// Well-known BLE UART / ESC/POS service + characteristic UUIDs
// ---------------------------------------------------------------------------

/**
 * Common BLE UART service UUIDs used by thermal receipt printers.
 * The Web Bluetooth `requestDevice` filter must include at least one.
 */
export const BLE_ESCPOS_SERVICE_UUIDS: string[] = [
  // Generic Printer Service (Epson TM, Bixolon, Sewoo)
  '000018f0-0000-1000-8000-00805f9b34fb',
  // Nordic UART Service (NUS) — used by many generic BLE serial printers
  '6e400001-b5a3-f393-e0a9-e50e24dcca9e',
  // Common SPP-over-BLE (Xprinter, iDPRT, etc.)
  '49535343-fe7d-4ae5-8fa9-9fafd205e455',
  // Alternate generic printer service
  '000018f1-0000-1000-8000-00805f9b34fb',
]

/**
 * Common BLE write characteristic UUIDs (in priority order).
 * The transport will try these in sequence until it finds one supported
 * by the connected device.
 */
const WRITE_CHARACTERISTIC_UUIDS: string[] = [
  // Epson generic printer write characteristic
  '00002af1-0000-1000-8000-00805f9b34fb',
  // Nordic UART TX (write to printer)
  '6e400002-b5a3-f393-e0a9-e50e24dcca9e',
  // iDPRT / Xprinter write
  '49535343-8841-43f4-a8d4-ecbe34729bb3',
  // Alternate write
  '00002af0-0000-1000-8000-00805f9b34fb',
]

/** Maximum bytes per BLE write operation (conservative for broad compatibility) */
const BLE_CHUNK_SIZE = 512

// ---------------------------------------------------------------------------
// Transport class
// ---------------------------------------------------------------------------

export class AndroidBtTransport implements PrinterTransport {
  private readonly cfg: AndroidBtConfig
  private device: BluetoothDevice | null = null
  private server: BluetoothRemoteGATTServer | null = null
  private writeChar: BluetoothRemoteGATTCharacteristic | null = null
  private connected = false

  constructor(cfg: AndroidBtConfig) {
    this.cfg = cfg
  }

  // -------------------------------------------------------------------------
  // Bluetooth API availability guard
  // -------------------------------------------------------------------------
  private get bt(): Bluetooth | null {
    if (typeof navigator !== 'undefined' && 'bluetooth' in navigator) {
      return (navigator as any).bluetooth as Bluetooth
    }
    return null
  }

  // -------------------------------------------------------------------------
  // getConfig — return current runtime config (updated on connect)
  // -------------------------------------------------------------------------
  getConfig(): AndroidBtConfig {
    return this.cfg
  }

  // -------------------------------------------------------------------------
  // checkStatus
  // -------------------------------------------------------------------------
  async checkStatus(): Promise<PrinterStatusDetail> {
    const bt = this.bt
    if (!bt) {
      return {
        status: 'idle',
        serviceAvailable: false,
        message:
          'Web Bluetooth is not supported in this browser. ' +
          'Please use Chrome on Android or Chrome/Edge on desktop.',
      }
    }

    // Check if browser has BT enabled (availability can be async)
    let available = false
    try {
      available = await (bt as any).getAvailability()
    } catch {
      available = true // Assume available if API throws (some desktop builds)
    }

    if (!available) {
      return {
        status: 'idle',
        serviceAvailable: false,
        message: 'Bluetooth is not available or disabled on this device.',
      }
    }

    return {
      status: this.connected ? 'connected' : 'disconnected',
      serviceAvailable: true,
      message: this.connected
        ? `Connected to "${this.cfg.deviceName || this.device?.name || 'BT Printer'}"`
        : 'Web Bluetooth available. Not yet connected.',
    }
  }

  // -------------------------------------------------------------------------
  // getPrinters — not applicable for BT (device chosen at connect time)
  // -------------------------------------------------------------------------
  async getPrinters(): Promise<string[]> {
    return []
  }

  // -------------------------------------------------------------------------
  // connect
  // -------------------------------------------------------------------------
  async connect(_opts?: { requestDevice?: boolean }): Promise<void> {
    const bt = this.bt
    if (!bt) {
      throw new Error(
        'Web Bluetooth is not supported in this browser. ' +
        'Please use Chrome on Android or Chrome/Edge on desktop.'
      )
    }

    // Build service UUID filter list — prefer configured UUID if set
    const serviceUuids: string[] =
      this.cfg.serviceUuid
        ? [this.cfg.serviceUuid, ...BLE_ESCPOS_SERVICE_UUIDS.filter((u) => u !== this.cfg.serviceUuid)]
        : [...BLE_ESCPOS_SERVICE_UUIDS]

    // Request device — browser shows the BLE device picker
    let device: BluetoothDevice
    try {
      device = await bt.requestDevice({
        filters: serviceUuids.map((uuid) => ({ services: [uuid] })),
        // Also accept any printer-class device (optional broadened filter)
        optionalServices: serviceUuids,
      })
    } catch (e: any) {
      if (e?.name === 'NotFoundError' || e?.message?.includes('cancelled')) {
        throw new Error('Bluetooth device selection was cancelled.')
      }
      throw new Error('Failed to request Bluetooth device: ' + (e?.message || e))
    }

    this.device = device

    // Handle unexpected disconnection
    device.addEventListener('gattserverdisconnected', () => {
      this.connected = false
      this.server = null
      this.writeChar = null
    })

    // Connect to GATT server
    if (!device.gatt) {
      throw new Error('This Bluetooth device does not support GATT.')
    }
    const server = await device.gatt.connect()
    this.server = server

    // Discover services and find write characteristic
    const writeChar = await this._discoverWriteChar(server, serviceUuids)
    if (!writeChar) {
      await server.disconnect()
      this.server = null
      throw new Error(
        'Could not find a writable characteristic on this Bluetooth device. ' +
        'Make sure it is a BLE ESC/POS printer and try again.'
      )
    }

    this.writeChar = writeChar
    this.connected = true

    // Update config with actual device info
    this.cfg.deviceName = device.name || 'BT Printer'
    this.cfg.deviceId = device.id
  }

  // -------------------------------------------------------------------------
  // _discoverWriteChar — iterate services and find a write characteristic
  // -------------------------------------------------------------------------
  private async _discoverWriteChar(
    server: BluetoothRemoteGATTServer,
    serviceUuids: string[]
  ): Promise<BluetoothRemoteGATTCharacteristic | null> {
    // If user configured a specific characteristic UUID, try it first
    if (this.cfg.characteristicUuid) {
      const char = await this._tryChar(server, serviceUuids, this.cfg.characteristicUuid)
      if (char) return char
    }

    // Try known write characteristic UUIDs across all services
    for (const charUuid of WRITE_CHARACTERISTIC_UUIDS) {
      const char = await this._tryChar(server, serviceUuids, charUuid)
      if (char) return char
    }

    // Fallback: enumerate all services and look for any writable characteristic
    for (const serviceUuid of serviceUuids) {
      try {
        const service = await server.getPrimaryService(serviceUuid)
        const characteristics = await service.getCharacteristics()
        for (const c of characteristics) {
          if (c.properties.write || c.properties.writeWithoutResponse) {
            return c
          }
        }
      } catch {
        // service not found on this device — try next
      }
    }

    return null
  }

  private async _tryChar(
    server: BluetoothRemoteGATTServer,
    serviceUuids: string[],
    charUuid: string
  ): Promise<BluetoothRemoteGATTCharacteristic | null> {
    for (const serviceUuid of serviceUuids) {
      try {
        const service = await server.getPrimaryService(serviceUuid)
        const char = await service.getCharacteristic(charUuid)
        if (char && (char.properties.write || char.properties.writeWithoutResponse)) {
          return char
        }
      } catch {
        // not available on this service/device
      }
    }
    return null
  }

  // -------------------------------------------------------------------------
  // write — send ESC/POS bytes, chunked for BLE MTU
  // -------------------------------------------------------------------------
  async write(data: Uint8Array): Promise<void> {
    if (!this.connected || !this.writeChar) {
      throw new Error('Android BT Transport: not connected. Call connect() first.')
    }

    const useWriteWithoutResponse =
      !this.writeChar.properties.write && this.writeChar.properties.writeWithoutResponse

    // Split into chunks to respect BLE MTU
    let offset = 0
    while (offset < data.length) {
      const end = Math.min(offset + BLE_CHUNK_SIZE, data.length)
      const chunk = data.slice(offset, end)

      if (useWriteWithoutResponse) {
        await this.writeChar.writeValueWithoutResponse(chunk)
      } else {
        await this.writeChar.writeValueWithResponse(chunk)
      }

      offset = end

      // Small delay between chunks to prevent buffer overflow on slower printers
      if (offset < data.length) {
        await new Promise<void>((r) => setTimeout(r, 20))
      }
    }
  }

  // -------------------------------------------------------------------------
  // disconnect
  // -------------------------------------------------------------------------
  async disconnect(): Promise<void> {
    if (this.server?.connected) {
      try {
        this.server.disconnect()
      } catch (e) {
        console.warn('Error disconnecting BT device:', e)
      }
    }
    this.device = null
    this.server = null
    this.writeChar = null
    this.connected = false
  }
}
