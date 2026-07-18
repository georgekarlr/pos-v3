/**
 * Bridge Printer Transport — Coming Soon
 *
 * This transport will forward ESC/POS print jobs to a local bridge server
 * (e.g. a small Node/Python service running on the POS machine) via HTTP.
 * Useful for environments where QZ Tray cannot be installed.
 */

import type { PrinterTransport, PrinterStatusDetail, BridgeConfig } from '../types'

export class BridgeTransport implements PrinterTransport {
  private readonly cfg: BridgeConfig

  constructor(cfg: BridgeConfig) {
    this.cfg = cfg
  }

  async checkStatus(): Promise<PrinterStatusDetail> {
    return {
      status: 'idle',
      serviceAvailable: false,
      message: 'Bridge printer is not yet implemented. Coming soon.',
    }
  }

  async getPrinters(): Promise<string[]> {
    throw new Error('Bridge printer: coming soon.')
  }

  async connect(_opts?: { requestDevice?: boolean }): Promise<void> {
    throw new Error('Bridge printer: coming soon.')
  }

  async write(_data: Uint8Array): Promise<void> {
    throw new Error('Bridge printer: coming soon.')
  }

  async disconnect(): Promise<void> {
    // No-op
  }
}
