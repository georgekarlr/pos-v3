/**
 * Android Bluetooth Transport
 *
 * Uses the Capacitor Bluetooth LE community plugin when running inside a
 * Capacitor Android app. In a plain browser / PWA context, all methods
 * degrade gracefully with informative error messages.
 *
 * Plugin: @capacitor-community/bluetooth-le
 * Install (when Capacitor project is set up):
 *   npm install @capacitor-community/bluetooth-le
 *   npx cap sync android
 */

import type { PrinterTransport, PrinterStatusDetail, AndroidBtConfig } from '../types'

// We access Capacitor and BLE dynamically so this module can load on web too
type BleClientType = {
  initialize(): Promise<void>
  requestDevice(opts: any): Promise<any>
  connect(deviceId: string, onDisconnect?: () => void): Promise<void>
  disconnect(deviceId: string): Promise<void>
  write(deviceId: string, service: string, characteristic: string, data: DataView): Promise<void>
  getDevices(deviceIds: string[]): Promise<any[]>
}

// ---------------------------------------------------------------------------
// Environment detection
// ---------------------------------------------------------------------------

/** Returns true when running inside a native Capacitor app on Android */
export function isAndroidBtAvailable(): boolean {
  return !!(
    typeof window !== 'undefined' &&
    (window as any).Capacitor?.isNative &&
    (window as any).Capacitor?.getPlatform() === 'android'
  )
}

async function getBleClient(): Promise<BleClientType> {
  if (!isAndroidBtAvailable()) {
    throw new Error(
      'Android Bluetooth is only available when running as a native Android app (Capacitor). ' +
      'Use QZ Tray for desktop printing.'
    )
  }
  try {
    const pkgName = '@capacitor-community/bluetooth-le'
    const mod = await import(/* @vite-ignore */ pkgName)
    return (mod as any).BleClient as BleClientType
  } catch {
    throw new Error(
      '@capacitor-community/bluetooth-le is not installed. ' +
      'Run: npm install @capacitor-community/bluetooth-le && npx cap sync android'
    )
  }
}

// ---------------------------------------------------------------------------
// AndroidBtTransport
// ---------------------------------------------------------------------------
const CHUNK_SIZE = 512 // BLE MTU safe chunk size

export class AndroidBtTransport implements PrinterTransport {
  private readonly cfg: AndroidBtConfig
  private deviceId: string | null = null
  private connected = false

  constructor(cfg: AndroidBtConfig) {
    this.cfg = cfg
  }

  // -------------------------------------------------------------------------
  // checkStatus
  // -------------------------------------------------------------------------
  async checkStatus(): Promise<PrinterStatusDetail> {
    if (!isAndroidBtAvailable()) {
      return {
        status: 'idle',
        serviceAvailable: false,
        message: 'Android Bluetooth is only available in the native Android app.',
      }
    }
    return {
      status: this.connected ? 'connected' : 'disconnected',
      serviceAvailable: true,
      message: this.connected
        ? `Connected to "${this.deviceId ?? 'device'}"`
        : 'Bluetooth available. Not yet connected.',
    }
  }

  // -------------------------------------------------------------------------
  // getPrinters — scan for nearby BLE devices (requires Capacitor)
  // -------------------------------------------------------------------------
  async getPrinters(): Promise<string[]> {
    const ble = await getBleClient()
    await ble.initialize()
    // On Android we can't easily "list" printers like QZ Tray; instead return
    // the previously paired/known device name from config (if any), or instruct
    // the user to scan and pair via Android Bluetooth settings.
    const knownName = (this.cfg.deviceName ?? '').trim()
    if (knownName) return [knownName]
    return []
  }

  // -------------------------------------------------------------------------
  // connect
  // -------------------------------------------------------------------------
  async connect(_opts?: { requestDevice?: boolean }): Promise<void> {
    const ble = await getBleClient()
    await ble.initialize()

    // Request device selection from the user
    const serviceUUID = this.cfg.serviceUUID ?? '000018f0-0000-1000-8000-00805f9b34fb'
    const device = await ble.requestDevice({
      services: [serviceUUID],
      namePrefix: (this.cfg.deviceName ?? '').trim() || undefined,
    })

    this.deviceId = device.deviceId
    await ble.connect(this.deviceId, () => {
      // onDisconnect callback
      this.connected = false
      this.deviceId = null
    })
    this.connected = true
  }

  // -------------------------------------------------------------------------
  // write — chunk and send to GATT characteristic
  // -------------------------------------------------------------------------
  async write(data: Uint8Array): Promise<void> {
    if (!this.connected || !this.deviceId) {
      throw new Error('Android BT Transport: not connected. Call connect() first.')
    }
    const ble = await getBleClient()
    const serviceUUID = this.cfg.serviceUUID ?? '000018f0-0000-1000-8000-00805f9b34fb'
    const charUUID = this.cfg.characteristicUUID ?? '00002af1-0000-1000-8000-00805f9b34fb'

    for (let i = 0; i < data.length; i += CHUNK_SIZE) {
      const chunk = data.slice(i, i + CHUNK_SIZE)
      const dataView = new DataView(chunk.buffer, chunk.byteOffset, chunk.byteLength)
      await ble.write(this.deviceId, serviceUUID, charUUID, dataView)
    }
  }

  // -------------------------------------------------------------------------
  // disconnect
  // -------------------------------------------------------------------------
  async disconnect(): Promise<void> {
    if (this.deviceId) {
      try {
        const ble = await getBleClient()
        await ble.disconnect(this.deviceId)
      } catch {
        // Ignore
      }
    }
    this.connected = false
    this.deviceId = null
  }
}
