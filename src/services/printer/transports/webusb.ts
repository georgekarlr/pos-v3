/**
 * WebUSB Printer Transport
 *
 * Allows direct browser connection to USB receipt printers supporting ESC/POS.
 * Requires a Chromium-based browser (Chrome, Edge, Opera, etc.) and a user
 * gesture (click) to prompt the pairing interface for the first connection.
 */

import type { PrinterTransport, PrinterStatusDetail, WebUsbConfig } from '../types'

export class WebUsbTransport implements PrinterTransport {
  private readonly cfg: WebUsbConfig
  private device: any | null = null
  private interfaceNumber: number | null = null
  private endpointNumber: number | null = null
  private connected = false

  constructor(cfg: WebUsbConfig) {
    this.cfg = cfg
  }

  // Helper to access navigator.usb safely
  private get usb(): any {
    if (typeof navigator !== 'undefined' && 'usb' in navigator) {
      return (navigator as any).usb
    }
    return null
  }

  // -------------------------------------------------------------------------
  // getConfig
  // -------------------------------------------------------------------------
  getConfig(): WebUsbConfig {
    return this.cfg
  }

  // -------------------------------------------------------------------------
  // checkStatus
  // -------------------------------------------------------------------------
  async checkStatus(): Promise<PrinterStatusDetail> {
    const usb = this.usb
    if (!usb) {
      return {
        status: 'idle',
        serviceAvailable: false,
        message: 'WebUSB is not supported in this browser. Please use Chrome, Edge, or Opera.',
      }
    }
    return {
      status: this.connected ? 'connected' : 'disconnected',
      serviceAvailable: true,
      message: this.connected
        ? `Connected to "${this.device?.productName || 'USB Printer'}"`
        : 'WebUSB available. Not yet connected.',
    }
  }

  // -------------------------------------------------------------------------
  // getPrinters — list paired devices
  // -------------------------------------------------------------------------
  async getPrinters(): Promise<string[]> {
    const usb = this.usb
    if (!usb) return []
    try {
      const devices = await usb.getDevices()
      return devices.map((d: any) => d.productName || `USB Device (${d.vendorId}:${d.productId})`)
    } catch {
      return []
    }
  }

  // -------------------------------------------------------------------------
  // connect
  // -------------------------------------------------------------------------
  async connect(opts?: { requestDevice?: boolean }): Promise<void> {
    const usb = this.usb
    if (!usb) {
      throw new Error(
        'WebUSB is not supported in this browser. ' +
        'Please use a Chromium-based browser like Chrome, Edge, or Opera.'
      )
    }

    let device: any = null

    // If requestDevice is false/not provided, try to find a previously paired device
    if (!opts?.requestDevice) {
      const pairedDevices = await usb.getDevices()
      if (this.cfg.vendorId !== undefined) {
        device = pairedDevices.find(
          (d: any) =>
            d.vendorId === this.cfg.vendorId &&
            (this.cfg.productId === undefined || d.productId === this.cfg.productId)
        )
      }
      // Fallback: If only one paired device exists, use it
      if (!device && pairedDevices.length > 0) {
        device = pairedDevices[0]
      }
    }

    // Prompt user to select device if not resolved
    if (!device) {
      const filters: any[] = []
      if (this.cfg.vendorId !== undefined) {
        filters.push({
          vendorId: this.cfg.vendorId,
          ...(this.cfg.productId !== undefined ? { productId: this.cfg.productId } : {}),
        })
      }
      device = await usb.requestDevice({ filters })
    }

    if (!device) {
      throw new Error('No USB device selected.')
    }

    this.device = device

    // ---- Open the device (close first if it was left open from a prior session) ----
    if (this.device.opened) {
      try { await this.device.close() } catch { /* ignore */ }
    }
    await this.device.open()

    // Select configuration 1 by default if configuration not active
    if (this.device.configuration === null) {
      await this.device.selectConfiguration(1)
    }

    // Inspect the active configuration to find the Bulk OUT endpoint
    const configuration = this.device.configuration || this.device.configurations[0]
    if (!configuration) {
      throw new Error('No active USB configuration found on this device.')
    }

    let foundInterface: number | null = null
    let foundEndpoint: number | null = null

    for (const iface of configuration.interfaces) {
      for (const alt of iface.alternates) {
        // Look for any bulk OUT endpoint (often vendor-specific class 255 or printer class 7)
        for (const endpoint of alt.endpoints) {
          if (endpoint.direction === 'out' && endpoint.type === 'bulk') {
            foundInterface = iface.interfaceNumber
            foundEndpoint = endpoint.endpointNumber
            break
          }
        }
        if (foundEndpoint !== null) break
      }
      if (foundEndpoint !== null) break
    }

    if (foundInterface === null || foundEndpoint === null) {
      throw new Error('Could not find a valid bulk OUT endpoint on the selected USB device.')
    }

    this.interfaceNumber = foundInterface
    this.endpointNumber = foundEndpoint

    // Attempt 1: silently release any stale claim from the browser itself, then claim.
    try {
      await this.device.releaseInterface(this.interfaceNumber)
    } catch { /* not previously claimed — fine */ }

    try {
      await this.device.claimInterface(this.interfaceNumber)
    } catch (firstErr: any) {
      // Attempt 2: The OS kernel driver (e.g. Linux usblp) may hold the interface.
      // Fully close the device and reopen it — Chrome will try to detach the kernel
      // driver on the new open() call on supported platforms.
      console.warn('WebUSB: first claimInterface failed, retrying after close/reopen…', firstErr)
      try {
        await this.device.close()
      } catch { /* ignore */ }
      try {
        await this.device.open()
        if (this.device.configuration === null) {
          await this.device.selectConfiguration(1)
        }
        await this.device.claimInterface(this.interfaceNumber)
      } catch (secondErr: any) {
        // Both attempts failed — provide a clear, actionable error.
        const isLinux = navigator.platform?.toLowerCase().includes('linux') ||
          navigator.userAgent?.toLowerCase().includes('linux')
        const hint = isLinux
          ? '\n\nOn Linux, the "usblp" kernel driver may be blocking access.\n' +
            'Fix option 1 (temporary): run in terminal →  sudo modprobe -r usblp\n' +
            'Fix option 2 (permanent): add a udev rule:\n' +
            '  echo \'SUBSYSTEM=="usb", ATTRS{idVendor}=="' +
            (this.cfg.vendorId ? this.cfg.vendorId.toString(16).padStart(4, '0') : 'XXXX') +
            '", MODE="0666", GROUP="plugdev"\' | sudo tee /etc/udev/rules.d/99-usb-printer.rules\n' +
            '  sudo udevadm control --reload-rules && sudo udevadm trigger'
          : '\n\nMake sure no other application or driver is using the printer.'
        throw new Error(
          `Unable to claim the USB printer interface.\n${hint}\n\nOriginal error: ${secondErr?.message ?? secondErr}`
        )
      }
    }

    this.connected = true

    // Update config reference dynamically with actual selected device info
    this.cfg.vendorId = this.device.vendorId
    this.cfg.productId = this.device.productId
    this.cfg.deviceName = this.device.productName || `USB Device (${this.device.vendorId}:${this.device.productId})`
  }

  // -------------------------------------------------------------------------
  // write — send data over bulk OUT endpoint
  // -------------------------------------------------------------------------
  async write(data: Uint8Array): Promise<void> {
    if (!this.connected || !this.device || !this.device.opened) {
      throw new Error('WebUSB Transport: not connected. Call connect() first.')
    }
    if (this.endpointNumber === null) {
      throw new Error('WebUSB Transport: endpoint not resolved.')
    }
    await this.device.transferOut(this.endpointNumber, data)
  }

  // -------------------------------------------------------------------------
  // disconnect
  // -------------------------------------------------------------------------
  async disconnect(): Promise<void> {
    if (this.device) {
      try {
        if (this.device.opened) {
          if (this.interfaceNumber !== null) {
            await this.device.releaseInterface(this.interfaceNumber)
          }
          await this.device.close()
        }
      } catch (e) {
        console.warn('Error disconnecting WebUSB device:', e)
      }
    }
    this.device = null
    this.interfaceNumber = null
    this.endpointNumber = null
    this.connected = false
  }
}
