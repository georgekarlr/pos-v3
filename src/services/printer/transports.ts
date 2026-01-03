import { BLEConfig, PrinterTransport, SerialConfig, USBConfig } from './types'

// Web Serial transport
export class SerialTransport implements PrinterTransport {
  private port: any | null = null
  private writer: WritableStreamDefaultWriter<Uint8Array> | null = null
  private readonly cfg: SerialConfig

  constructor(cfg: SerialConfig) {
    this.cfg = cfg
  }

  async connect(opts?: { requestDevice?: boolean }): Promise<void> {
    const nav: any = navigator as any
    if (!nav.serial) throw new Error('Web Serial is not supported in this browser')
    if (!this.port || opts?.requestDevice) {
      this.port = await nav.serial.requestPort({})
    }
    if (!this.port) throw new Error('No serial port selected')
    await this.port.open({
      baudRate: this.cfg.baudRate,
      dataBits: this.cfg.dataBits ?? 8,
      stopBits: this.cfg.stopBits ?? 1,
      parity: this.cfg.parity ?? 'none'
    })
    this.writer = this.port.writable.getWriter()
  }

  async write(data: Uint8Array): Promise<void> {
    if (!this.writer) throw new Error('Serial port not open')
    await this.writer.write(data)
  }

  async close(): Promise<void> {
    try {
      if (this.writer) {
        this.writer.releaseLock()
        this.writer = null
      }
      if (this.port) {
        await this.port.close()
      }
    } finally {
      this.port = null
    }
  }
}

// WebUSB transport (basic)
export class USBTransport implements PrinterTransport {
  private device: any | null = null
  private readonly cfg: USBConfig

  constructor(cfg: USBConfig) { this.cfg = cfg }

  async connect(opts?: { requestDevice?: boolean }): Promise<void> {
    const nav: any = navigator as any
    if (!nav.usb) throw new Error('WebUSB is not supported in this browser')
    if (!this.device || opts?.requestDevice) {
      const filters: any[] = []
      if (this.cfg.vendorId) {
        filters.push({ vendorId: this.cfg.vendorId, productId: this.cfg.productId })
      }
      this.device = await nav.usb.requestDevice({ filters: filters.length ? filters : [{}] })
    }
    if (!this.device) throw new Error('No USB device selected')
    await this.device.open()
    if (this.cfg.configurationValue) {
      await this.device.selectConfiguration(this.cfg.configurationValue)
    } else if (!this.device.configuration && this.device.configurations?.length) {
      await this.device.selectConfiguration(this.device.configurations[0].configurationValue)
    }
    const iface = this.cfg.interfaceNumber ?? 0
    await this.device.claimInterface(iface)
  }

  async write(data: Uint8Array): Promise<void> {
    if (!this.device) throw new Error('USB device not open')
    const endpoint = this.cfg.endpointOut ?? 1
    await this.device.transferOut(endpoint, data)
  }

  async close(): Promise<void> {
    if (this.device) {
      try { await this.device.close() } catch {}
      this.device = null
    }
  }
}

// Web Bluetooth transport (GATT characteristic write)
export class BLETransport implements PrinterTransport {
  private server: any | null = null
  private characteristic: any | null = null
  private readonly cfg: BLEConfig

  constructor(cfg: BLEConfig) { this.cfg = cfg }

  async connect(opts?: { requestDevice?: boolean }): Promise<void> {
    const nav: any = navigator as any
    if (!nav.bluetooth) throw new Error('Web Bluetooth is not supported in this browser')
    const device: any = await nav.bluetooth.requestDevice({
      filters: [{ services: [this.cfg.serviceUUID] }]
    })
    if (!device.gatt) throw new Error('Failed to get GATT server')
    this.server = await device.gatt.connect()
    const service = await this.server.getPrimaryService(this.cfg.serviceUUID)
    this.characteristic = await service.getCharacteristic(this.cfg.characteristicUUID)
  }

  async write(data: Uint8Array): Promise<void> {
    if (!this.characteristic) throw new Error('BLE not connected')
    await this.characteristic.writeValue(data)
  }

  async close(): Promise<void> {
    if (this.server && this.server.connected) {
      this.server.disconnect()
    }
    this.server = null
    this.characteristic = null
  }
}
