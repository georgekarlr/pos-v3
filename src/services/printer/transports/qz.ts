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
  // _connectWs — shared websocket connect logic
  // -------------------------------------------------------------------------
  private async _connectWs(): Promise<any> {
    const qz = await loadQz()
    const isSecure = typeof window !== 'undefined' && window.location.protocol === 'https:'
    const host = this.cfg.host || 'localhost'
    const port = this.cfg.port || 8181
    const usingSecure = port === 8181 ? true : (port === 8182 ? false : isSecure)
    const hosts = (host === '127.0.0.1' || host === 'localhost')
      ? ['localhost', 'localhost.qz.io', '127.0.0.1']
      : [host]

    qz.api.setWebSocketType(WebSocket)
    qz.websocket.setClosedCallbacks([])
    qz.websocket.setErrorCallbacks([])

    if (!qz.websocket.isActive()) {
      await qz.websocket.connect({
        host: hosts,
        port: { secure: [port], insecure: [port] },
        usingSecure,
        keepAlive: 20,
      })
    }
    return qz
  }

  // -------------------------------------------------------------------------
  // checkStatus — ping QZ Tray WebSocket, return availability + connection
  // -------------------------------------------------------------------------
  async checkStatus(): Promise<PrinterStatusDetail> {
    try {
      const qz = await this._connectWs()

      // If we were already connected keep the socket alive; otherwise close it
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
  // getPrinters — return full OS printer list via QZ Tray
  // Manages its own WS connection lifecycle if not already connected.
  // -------------------------------------------------------------------------
  async getPrinters(): Promise<string[]> {
    const wasActive = (await loadQz()).websocket.isActive()
    const qz = await this._connectWs()
    try {
      const list: string[] = await qz.printers.find()
      return list
    } finally {
      // Only disconnect if we opened the socket ourselves
      if (!wasActive && !this.connected) {
        qz.websocket.disconnect().catch(() => {})
      }
    }
  }

  // -------------------------------------------------------------------------
  // connect — establish WS to QZ Tray and select the configured printer
  // -------------------------------------------------------------------------
  async connect(_opts?: { requestDevice?: boolean }): Promise<void> {
    const qz = await this._connectWs()

    // Resolve printer name
    const desiredName = (this.cfg.printerName ?? '').trim()
    if (desiredName) {
      const allPrinters: string[] = await qz.printers.find(desiredName)
      if (!allPrinters.length) {
        const available: string[] = await qz.printers.find()
        throw new Error(
          `Printer "${desiredName}" not found. Available: ${available.join(', ')}`
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

    /**
     * Pass the Uint8Array directly with flavor:'base64'.
     * QZ Tray has built-in Uint8Array→base64 conversion (qz-tray.js line ~895).
     * Using Array.from() + flavor:'plain' would serialize the byte values as
     * a JSON array of numbers and print that text literally — causing the
     * "random words / PostScript garbage" output on the paper.
     */
    const config = qz.configs.create(this.printer, { jobName: 'Receipt' })
    const printData = [{ type: 'raw', format: 'command', flavor: 'base64', data }]
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


}

// ---------------------------------------------------------------------------
// Utility: quick ping — does not require a QzTransport instance
// ---------------------------------------------------------------------------
export async function isQzAvailable(host = 'localhost', port = 8181): Promise<boolean> {
  try {
    const qz = await loadQz()
    const hosts = (host === '127.0.0.1' || host === 'localhost')
      ? ['localhost', 'localhost.qz.io', '127.0.0.1']
      : [host]
    qz.api.setWebSocketType(WebSocket)
    await qz.websocket.connect({
      host: hosts,
      port: {
        secure: [port],
        insecure: [port]
      },
      usingSecure: port === 8181 ? true : false,
      keepAlive: 20
    })
    await qz.websocket.disconnect()
    return true
  } catch {
    return false
  }
}
