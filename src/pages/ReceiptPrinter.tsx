import React, { useMemo, useState } from 'react'
import { BLEConfig, PrinterConfig, SerialConfig, USBConfig, loadPrinterConfig, savePrinterConfig, ReceiptDesign, loadReceiptDesign, saveReceiptDesign } from '../services/printer/types'
import { printReceiptWithConfig, layoutReceiptLines, withDesignDefaults } from '../services/printer'
import type { ReceiptData } from '../components/pos/Receipt'

type Tab = 'serial' | 'usb' | 'ble'

const defaultSerial: SerialConfig = { type: 'serial', baudRate: 9600 }
const defaultUSB: USBConfig = { type: 'usb' }
const defaultBLE: BLEConfig = { type: 'ble', serviceUUID: '000018f0-0000-1000-8000-00805f9b34fb', characteristicUUID: '00002af1-0000-1000-8000-00805f9b34fb' }

function sampleReceipt(): ReceiptData {
  const now = new Date().toISOString()
  return {
    orderId: 1234,
    businessName: 'POS Pro Demo',
    businessAddress1: '123 Main St',
    businessAddress2: 'City, Country',
    cashier: 'Admin',
    dateISO: now,
    lines: [
      { name: 'Example Item A', qty: 1, unitPrice: 50, lineTotal: 50 },
      { name: 'Example Item B', qty: 2, unitPrice: 25.5, lineTotal: 51 },
    ],
    subtotal: 101,
    tax: 0,
    total: 101,
    payments: [{ method: 'Cash', amount: 200 }],
    totalPaid: 200,
    change: 99,
    notes: 'Test print from Receipt Printer configuration page.'
  }
}

const capability = {
  serial: typeof (navigator as any).serial !== 'undefined',
  usb: typeof (navigator as any).usb !== 'undefined',
  ble: typeof (navigator as any).bluetooth !== 'undefined'
}

const ReceiptPrinterPage: React.FC = () => {
  const initial = loadPrinterConfig() ?? defaultSerial
  const [tab, setTab] = useState<Tab>(initial.type)
  const [serial, setSerial] = useState<SerialConfig>(initial.type === 'serial' ? initial as SerialConfig : defaultSerial)
  const [usb, setUsb] = useState<USBConfig>(initial.type === 'usb' ? initial as USBConfig : defaultUSB)
  const [ble, setBle] = useState<BLEConfig>(initial.type === 'ble' ? initial as BLEConfig : defaultBLE)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [design, setDesign] = useState<ReceiptDesign>(() => loadReceiptDesign())

  const currentConfig: PrinterConfig = useMemo(() => {
    if (tab === 'serial') return serial
    if (tab === 'usb') return usb
    return ble
  }, [tab, serial, usb, ble])

  const save = async (withDeviceRequest: boolean) => {
    setMessage(null)
    try {
      // Attempt a quick connection to persist permissions where applicable
      if (withDeviceRequest) {
        setBusy(true)
        // persist both printer config and design
        savePrinterConfig(currentConfig)
        saveReceiptDesign(design)
        await printReceiptWithConfig(currentConfig, sampleReceipt())
        setMessage('Successfully saved and printed test receipt.')
      } else {
        savePrinterConfig(currentConfig)
        saveReceiptDesign(design)
        setMessage('Configuration saved.')
      }
    } catch (e: any) {
      console.error(e)
      savePrinterConfig(currentConfig)
      saveReceiptDesign(design)
      setMessage('Saved configuration, but connection/print failed: ' + (e?.message || e))
    } finally {
      setBusy(false)
    }
  }

  const testPrint = async () => {
    setMessage(null)
    setBusy(true)
    try {
      savePrinterConfig(currentConfig)
      saveReceiptDesign(design)
      await printReceiptWithConfig(currentConfig, sampleReceipt())
      setMessage('Test receipt sent to printer.')
    } catch (e: any) {
      console.error(e)
      setMessage('Test print failed: ' + (e?.message || e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold">Receipt Printer</h1>
      <p className="text-gray-600 mt-1">Configure Web Serial, WebUSB, or Web Bluetooth to print receipts directly to a thermal printer.</p>

      <div className="mt-4 inline-flex rounded-md shadow-sm border">
        <button
          className={`px-4 py-2 ${tab === 'serial' ? 'bg-blue-600 text-white' : 'bg-white'} border-r`}
          onClick={() => setTab('serial')}
          disabled={!capability.serial}
          title={capability.serial ? '' : 'Web Serial not supported in this browser'}
        >Serial</button>
        <button
          className={`px-4 py-2 ${tab === 'usb' ? 'bg-blue-600 text-white' : 'bg-white'} border-r`}
          onClick={() => setTab('usb')}
          disabled={!capability.usb}
          title={capability.usb ? '' : 'WebUSB not supported in this browser'}
        >USB</button>
        <button
          className={`px-4 py-2 ${tab === 'ble' ? 'bg-blue-600 text-white' : 'bg-white'}`}
          onClick={() => setTab('ble')}
          disabled={!capability.ble}
          title={capability.ble ? '' : 'Web Bluetooth not supported in this browser'}
        >Bluetooth</button>
      </div>

      <div className="mt-6 max-w-4xl space-y-6">
        {tab === 'serial' && (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium">Baud Rate</label>
              <input type="number" className="mt-1 w-full border rounded-md px-3 py-2"
                     value={serial.baudRate}
                     onChange={e => setSerial({ ...serial, baudRate: Number(e.target.value) })}
              />
            </div>
            <div className="flex gap-2">
              <button disabled={busy} onClick={() => save(false)} className="px-4 py-2 rounded-md border">Save</button>
              <button disabled={busy} onClick={() => save(true)} className="px-4 py-2 rounded-md bg-blue-600 text-white">Save & Test</button>
            </div>
          </div>
        )}

        {tab === 'usb' && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium">Vendor ID (optional)</label>
                <input type="number" className="mt-1 w-full border rounded-md px-3 py-2"
                       value={usb.vendorId ?? ''}
                       onChange={e => setUsb({ ...usb, vendorId: e.target.value ? Number(e.target.value) : undefined })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Product ID (optional)</label>
                <input type="number" className="mt-1 w-full border rounded-md px-3 py-2"
                       value={usb.productId ?? ''}
                       onChange={e => setUsb({ ...usb, productId: e.target.value ? Number(e.target.value) : undefined })}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button disabled={busy} onClick={() => save(false)} className="px-4 py-2 rounded-md border">Save</button>
              <button disabled={busy} onClick={() => save(true)} className="px-4 py-2 rounded-md bg-blue-600 text-white">Save & Test</button>
            </div>
          </div>
        )}

        {tab === 'ble' && (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium">Service UUID</label>
              <input className="mt-1 w-full border rounded-md px-3 py-2"
                     value={String(ble.serviceUUID)}
                     onChange={e => setBle({ ...ble, serviceUUID: e.target.value as any })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Characteristic UUID</label>
              <input className="mt-1 w-full border rounded-md px-3 py-2"
                     value={String(ble.characteristicUUID)}
                     onChange={e => setBle({ ...ble, characteristicUUID: e.target.value as any })}
              />
            </div>
            <div className="flex gap-2">
              <button disabled={busy} onClick={() => save(false)} className="px-4 py-2 rounded-md border">Save</button>
              <button disabled={busy} onClick={() => save(true)} className="px-4 py-2 rounded-md bg-blue-600 text-white">Save & Test</button>
            </div>
          </div>
        )}

        {/* Design editor */}
        <div className="border rounded-md p-4">
          <h2 className="text-lg font-medium">Print Design</h2>
          <p className="text-sm text-gray-500 mb-3">Customize header, main layout, and footer. Configure column labels, widths, alignment, and separators (dashes). Live preview updates as you edit.</p>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Editor controls */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium">Header Text</label>
                <textarea className="mt-1 w-full border rounded-md px-3 py-2 h-20"
                          placeholder="e.g., STORE NAME"
                          value={design.headerText ?? ''}
                          onChange={e => setDesign(d => ({ ...d, headerText: e.target.value }))}
                />
                <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                  <label className="flex items-center gap-1">
                    <span>Align</span>
                    <select className="border rounded px-2 py-1"
                            value={design.headerAlign ?? 'center'}
                            onChange={e => setDesign(d => ({ ...d, headerAlign: e.target.value as any }))}
                    >
                      <option value="left">Left</option>
                      <option value="center">Center</option>
                      <option value="right">Right</option>
                    </select>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={!!design.headerBold} onChange={e => setDesign(d => ({ ...d, headerBold: e.target.checked }))} />
                    <span>Bold</span>
                  </label>
                  <label className="flex items-center gap-1">
                    <span>Size</span>
                    <select className="border rounded px-2 py-1"
                            value={design.headerSize ?? 'normal'}
                            onChange={e => setDesign(d => ({ ...d, headerSize: e.target.value as any }))}
                    >
                      <option value="normal">Normal</option>
                      <option value="double">Double</option>
                    </select>
                  </label>
                </div>
              </div>

              {/* Main layout controls */}
              <div className="border-t pt-4">
                <div className="font-medium mb-2">Main Layout</div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium">Paper Width (chars)</label>
                    <input type="number" className="mt-1 w-full border rounded-md px-3 py-2"
                           min={16}
                           value={design.paperWidth ?? 32}
                           onChange={e => setDesign(d => ({ ...d, paperWidth: Number(e.target.value || 32) }))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium">Separator Char</label>
                    <input className="mt-1 w-full border rounded-md px-3 py-2"
                           maxLength={1}
                           value={design.separatorChar ?? '-'}
                           onChange={e => setDesign(d => ({ ...d, separatorChar: e.target.value.slice(0,1) }))}
                    />
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs text-gray-600">Item Label</label>
                    <input className="mt-1 w-full border rounded-md px-2 py-1"
                           value={design.itemLabel ?? 'Item'}
                           onChange={e => setDesign(d => ({ ...d, itemLabel: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600">Qty Label</label>
                    <input className="mt-1 w-full border rounded-md px-2 py-1"
                           value={design.qtyLabel ?? 'Qty'}
                           onChange={e => setDesign(d => ({ ...d, qtyLabel: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600">Total Label</label>
                    <input className="mt-1 w-full border rounded-md px-2 py-1"
                           value={design.totalLabel ?? 'Total'}
                           onChange={e => setDesign(d => ({ ...d, totalLabel: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs text-gray-600">Item Width</label>
                    <input type="number" className="mt-1 w-full border rounded-md px-2 py-1"
                           min={4}
                           value={design.itemWidth ?? ''}
                           onChange={e => setDesign(d => ({ ...d, itemWidth: e.target.value ? Number(e.target.value) : undefined }))}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600">Qty Width</label>
                    <input type="number" className="mt-1 w-full border rounded-md px-2 py-1"
                           min={2}
                           value={design.qtyWidth ?? ''}
                           onChange={e => setDesign(d => ({ ...d, qtyWidth: e.target.value ? Number(e.target.value) : undefined }))}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600">Total Width</label>
                    <input type="number" className="mt-1 w-full border rounded-md px-2 py-1"
                           min={4}
                           value={design.totalWidth ?? ''}
                           onChange={e => setDesign(d => ({ ...d, totalWidth: e.target.value ? Number(e.target.value) : undefined }))}
                    />
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs text-gray-600">Item Align</label>
                    <select className="mt-1 w-full border rounded-md px-2 py-1"
                            value={design.itemAlign ?? 'left'}
                            onChange={e => setDesign(d => ({ ...d, itemAlign: e.target.value as any }))}
                    >
                      <option value="left">Left</option>
                      <option value="center">Center</option>
                      <option value="right">Right</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600">Qty Align</label>
                    <select className="mt-1 w-full border rounded-md px-2 py-1"
                            value={design.qtyAlign ?? 'right'}
                            onChange={e => setDesign(d => ({ ...d, qtyAlign: e.target.value as any }))}
                    >
                      <option value="left">Left</option>
                      <option value="center">Center</option>
                      <option value="right">Right</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600">Total Align</label>
                    <select className="mt-1 w-full border rounded-md px-2 py-1"
                            value={design.totalAlign ?? 'right'}
                            onChange={e => setDesign(d => ({ ...d, totalAlign: e.target.value as any }))}
                    >
                      <option value="left">Left</option>
                      <option value="center">Center</option>
                      <option value="right">Right</option>
                    </select>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-4 text-sm">
                  <label className="inline-flex items-center gap-2">
                    <input type="checkbox" checked={design.showTopSeparator ?? true}
                           onChange={e => setDesign(d => ({ ...d, showTopSeparator: e.target.checked }))} />
                    <span>Top Separator</span>
                  </label>
                  <label className="inline-flex items-center gap-2">
                    <input type="checkbox" checked={design.showHeaderSeparator ?? true}
                           onChange={e => setDesign(d => ({ ...d, showHeaderSeparator: e.target.checked }))} />
                    <span>After Header Separator</span>
                  </label>
                  <label className="inline-flex items-center gap-2">
                    <input type="checkbox" checked={design.showItemsSeparatorBottom ?? true}
                           onChange={e => setDesign(d => ({ ...d, showItemsSeparatorBottom: e.target.checked }))} />
                    <span>Bottom Separator</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium">Footer Text</label>
                <textarea className="mt-1 w-full border rounded-md px-3 py-2 h-20"
                          placeholder="e.g., Thank you!"
                          value={design.footerText ?? ''}
                          onChange={e => setDesign(d => ({ ...d, footerText: e.target.value }))}
                />
                <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                  <label className="flex items-center gap-1">
                    <span>Align</span>
                    <select className="border rounded px-2 py-1"
                            value={design.footerAlign ?? 'center'}
                            onChange={e => setDesign(d => ({ ...d, footerAlign: e.target.value as any }))}
                    >
                      <option value="left">Left</option>
                      <option value="center">Center</option>
                      <option value="right">Right</option>
                    </select>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={!!design.footerBold} onChange={e => setDesign(d => ({ ...d, footerBold: e.target.checked }))} />
                    <span>Bold</span>
                  </label>
                  <label className="flex items-center gap-1">
                    <span>Size</span>
                    <select className="border rounded px-2 py-1"
                            value={design.footerSize ?? 'normal'}
                            onChange={e => setDesign(d => ({ ...d, footerSize: e.target.value as any }))}
                    >
                      <option value="normal">Normal</option>
                      <option value="double">Double</option>
                    </select>
                  </label>
                </div>
              </div>

              <div className="flex gap-2">
                <button disabled={busy} onClick={() => { saveReceiptDesign(design); setMessage('Design saved.') }} className="px-4 py-2 rounded-md border">Save Design</button>
                <button disabled={busy} onClick={testPrint} className="px-4 py-2 rounded-md bg-green-600 text-white">Save & Test Print</button>
              </div>
            </div>

            {/* Preview */}
            <div>
              <div className="text-sm text-gray-600 mb-2">Preview</div>
              <div className="bg-gray-50 border rounded-md p-4 shadow-sm">
                {(() => {
                  const d = withDesignDefaults(design)
                  const widthPx = Math.max(200, Math.min(360, Math.round((d.paperWidth || 32) * 7)))
                  const lines = layoutReceiptLines(sampleReceipt(), design)
                  return (
                    <div className="mx-auto" style={{ width: widthPx }}>
                      {/* Paper */}
                      <div
                        className="relative bg-white border rounded-md shadow p-3"
                        style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace' }}
                      >
                        {/* Header preview */}
                        {design.headerText && (
                          <div
                            className="whitespace-pre-wrap"
                            style={{
                              textAlign: (design.headerAlign ?? 'center') as any,
                              fontWeight: design.headerBold ? 700 : 400,
                              fontSize: design.headerSize === 'double' ? '1.4em' : '1em',
                              lineHeight: '1.3'
                            }}
                          >{design.headerText}</div>
                        )}

                        {/* Business heading */}
                        <div className="text-center font-bold">{sampleReceipt().businessName}</div>
                        <div className="text-center">{sampleReceipt().businessAddress1}</div>
                        <div className="text-center">{sampleReceipt().businessAddress2}</div>
                        <div className="my-2 h-px bg-gray-200" />

                        {/* Main lines */}
                        <pre className="text-[13px] leading-5 whitespace-pre-wrap">
{lines.join('\n')}
                        </pre>

                        <div className="my-2" />
                        {/* Footer preview */}
                        {design.footerText ? (
                          <div
                            className="whitespace-pre-wrap"
                            style={{
                              textAlign: (design.footerAlign ?? 'center') as any,
                              fontWeight: design.footerBold ? 700 : 400,
                              fontSize: design.footerSize === 'double' ? '1.2em' : '1em',
                              lineHeight: '1.3'
                            }}
                          >
                            {design.footerText}
                          </div>
                        ) : (
                          <div className="text-center">Thank you for your business!</div>
                        )}
                      </div>
                    </div>
                  )
                })()}
              </div>
            </div>
          </div>
        </div>

        <div className="pt-2 border-t">
          <div className="flex items-center gap-2">
            <button disabled={busy} onClick={testPrint} className="px-4 py-2 rounded-md bg-green-600 text-white">Test Print</button>
            {busy && <span className="text-sm text-gray-500">Working…</span>}
          </div>
          {message && <p className="mt-2 text-sm text-gray-700">{message}</p>}
          <p className="mt-3 text-xs text-gray-500">Notes: You must click a button to grant access to devices. Web Serial works best on Chromium browsers. WebUSB and Web Bluetooth require HTTPS and specific browser support.</p>
        </div>
      </div>
    </div>
  )
}

export default ReceiptPrinterPage
