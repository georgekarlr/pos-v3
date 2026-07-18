/**
 * QZ Tray Transport — Desktop (Windows / Linux / macOS)
 *
 * QZ Tray is a local print middleware that runs as a system tray application
 * and exposes a WebSocket on ws://localhost:8181 (default). The browser
 * communicates with it through the `qz-tray` npm package.
 *
 * Setup for end-users:
 *   1. Download & install QZ Tray from https://qz.io/download/
 *   2. Launch QZ Tray (appears in system tray)
 *   3. Open the POS in Chrome/Edge — QZ Tray will prompt for trust on first use
 */

import type { PrinterTransport, PrinterStatusDetail, QzConfig } from '../types'

// qz-tray exposes a global `qz` object; the npm package is an ES module wrapper
// We import it lazily so this file can load even when QZ Tray isn't installed
let qzLib: any = null

async function loadQz(): Promise<any> {
  if (qzLib) return qzLib
  // Dynamic import — avoids bundling issues on platforms where qz-tray isn't needed
  const mod = await import('qz-tray')
  qzLib = (mod as any).default ?? mod
  return qzLib
}

// ---------------------------------------------------------------------------
// QzTransport
// ---------------------------------------------------------------------------
export class QzTransport implements PrinterTransport {
  private readonly cfg: QzConfig
  private printer: string | null = null
  private connected = false

  constructor(cfg: QzConfig) {
    this.cfg = cfg
  }

  // -------------------------------------------------------------------------
  // checkStatus — ping QZ Tray WebSocket, return availability + connection
  // -------------------------------------------------------------------------
  async checkStatus(): Promise<PrinterStatusDetail> {
    try {
      const qz = await loadQz()
      const isSecure = typeof window !== 'undefined' && window.location.protocol === 'https:'
      const host = this.cfg.host || '127.0.0.1'
      const port = this.cfg.port || (isSecure ? 8182 : 8181)

      qz.api.setWebSocketType(WebSocket)
      qz.websocket.setClosedCallbacks([])
      qz.websocket.setErrorCallbacks([])

      await qz.websocket.connect({ host, port, usingSecure: isSecure, keepAlive: 20 })

      // If we reach here QZ Tray is running
      if (!this.connected) {
        await qz.websocket.disconnect()
      }
      return {
        status: this.connected ? 'connected' : 'idle',
        serviceAvailable: true,
        message: this.connected
          ? `Connected to "${this.printer ?? 'default printer'}"`
          : 'QZ Tray is running. Not yet connected to a printer.',
      }
    } catch (err: any) {
      if (this.connected) {
        this.connected = false
        this.printer = null
      }
      const errMsg = err?.message || String(err)
      return {
        status: 'error',
        serviceAvailable: false,
        message: `QZ Tray not reachable: ${errMsg}. Make sure the QZ Tray desktop app is running.`,
      }
    }
  }

  // -------------------------------------------------------------------------
  // getPrinters — return OS printer list via QZ Tray
  // -------------------------------------------------------------------------
  async getPrinters(): Promise<string[]> {
    const qz = await this._ensureConnected()
    const printers: string[] = await qz.printers.find()
    return printers
  }

  // -------------------------------------------------------------------------
  // connect — establish WS to QZ Tray and select the configured printer
  // -------------------------------------------------------------------------
  async connect(_opts?: { requestDevice?: boolean }): Promise<void> {
    const qz = await loadQz()
    const isSecure = typeof window !== 'undefined' && window.location.protocol === 'https:'
    const host = this.cfg.host || '127.0.0.1'
    const port = this.cfg.port || (isSecure ? 8182 : 8181)

    qz.api.setWebSocketType(WebSocket)

    if (!qz.websocket.isActive()) {
      await qz.websocket.connect({ host, port, usingSecure: isSecure, keepAlive: 20 })
    }

    // Resolve printer name
    const desiredName = (this.cfg.printerName ?? '').trim()
    if (desiredName) {
      const allPrinters: string[] = await qz.printers.find(desiredName)
      if (!allPrinters.length) {
        throw new Error(
          `Printer "${desiredName}" not found. Available: ${(await qz.printers.find()).join(', ')}`
        )
      }
      this.printer = allPrinters[0]
    } else {
      this.printer = await qz.printers.getDefault()
    }

    this.connected = true
  }

  // -------------------------------------------------------------------------
  // write — send raw ESC/POS bytes
  // -------------------------------------------------------------------------
  async write(data: Uint8Array): Promise<void> {
    if (!this.connected || !this.printer) {
      throw new Error('QZ Transport: not connected. Call connect() first.')
    }
    const qz = await loadQz()

    // Convert Uint8Array to a plain JS Array of numbers (QZ Tray expects this)
    const byteArray = Array.from(data)

    const config = qz.configs.create(this.printer)
    const printData = [{ type: 'raw', format: 'command', data: byteArray }]
    await qz.print(config, printData)
  }

  // -------------------------------------------------------------------------
  // disconnect — clean up WebSocket connection
  // -------------------------------------------------------------------------
  async disconnect(): Promise<void> {
    try {
      const qz = await loadQz()
      if (qz.websocket.isActive()) {
        await qz.websocket.disconnect()
      }
    } catch {
      // Ignore disconnect errors
    } finally {
      this.connected = false
      this.printer = null
    }
  }

  // -------------------------------------------------------------------------
  // Internal helpers
  // -------------------------------------------------------------------------
  private async _ensureConnected(): Promise<any> {
    const qz = await loadQz()
    if (!qz.websocket.isActive()) {
      await this.connect()
    }
    return qz
  }
}

// ---------------------------------------------------------------------------
// Utility: quick ping — does not require a QzTransport instance
// ---------------------------------------------------------------------------
export async function isQzAvailable(host = 'localhost', port = 8181): Promise<boolean> {
  try {
    const qz = await loadQz()
    qz.api.setWebSocketType(WebSocket)
    await qz.websocket.connect({ host, port, usingSecure: false, keepAlive: 20 })
    await qz.websocket.disconnect()
    return true
  } catch {
    return false
  }
}
