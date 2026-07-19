import React, { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ReceiptData } from './Receipt'
import InstallmentReceipt from './InstallmentReceipt'
import { usePrinter } from '../../contexts/PrinterContext'

interface InstallmentReceiptModalProps {
  open: boolean
  data: ReceiptData | null
  onClose: () => void
  autoDevicePrint?: boolean
}

const InstallmentReceiptModal: React.FC<InstallmentReceiptModalProps> = ({ open, data, onClose, autoDevicePrint }) => {
  const [show, setShow] = useState(false)
  const [deviceBusy, setDeviceBusy] = useState(false)
  const [deviceMsg, setDeviceMsg] = useState<string | null>(null)
  const receiptRef = useRef<HTMLDivElement>(null)
  const { print: printerPrint, config: printerConfig } = usePrinter()
  const autoPrintFired = useRef(false)

  useEffect(() => {
    if (open) setTimeout(() => setShow(true), 10)
    else {
      setShow(false)
      autoPrintFired.current = false
      setDeviceMsg(null)
    }
  }, [open])

  useEffect(() => {
    if (open && autoDevicePrint && data && printerConfig && !autoPrintFired.current) {
      autoPrintFired.current = true
      handleDevicePrint()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, autoDevicePrint, data, printerConfig])

  if (!open || !data) return null

  const handleSaveImage = async () => {
    try {
      const node = receiptRef.current
      if (!node) return
      const { toPng } = await import('html-to-image')
      const dataUrl = await toPng(node, { cacheBust: true, pixelRatio: 2, backgroundColor: '#ffffff' })
      const link = document.createElement('a')
      link.download = `receipt-installment-${data.installmentContract?.invoiceNumber || 'payment'}.png`
      link.href = dataUrl
      link.click()
    } catch (e) {
      console.error('Failed to export image', e)
      alert('Failed to save image. Try printing instead.')
    }
  }

  const handlePrint = () => {
    try {
      const container = receiptRef.current
      if (!container) return

      const printWindow = window.open('', 'PRINT', 'height=800,width=420')
      if (!printWindow) return

      const doc = printWindow.document
      doc.open()
      doc.write('<!doctype html><html><head><meta charset="utf-8"><title>Installment Receipt</title></head><body></body></html>')
      doc.close()

      const head = doc.head
      const styleNodes = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
      styleNodes.forEach((n) => head.appendChild(n.cloneNode(true)))

      const extraStyle = doc.createElement('style')
      extraStyle.type = 'text/css'
      extraStyle.textContent = `
        :root { --receipt-width: 80mm; }
        @media print {
          @page { size: var(--receipt-width) auto; margin: 0; }
          html, body { margin: 0; padding: 0; background: #ffffff; }
          .receipt-paper { width: var(--receipt-width) !important; }
        }
        body { display: flex; justify-content: center; }
      `
      head.appendChild(extraStyle)

      const sourceNode = container.cloneNode(true) as HTMLElement
      doc.body.appendChild(sourceNode)

      const waitForLinks = Array.from(head.querySelectorAll('link[rel="stylesheet"]'))
        .map((lnk) => new Promise<void>((resolve) => {
          if ((lnk as HTMLLinkElement).sheet) return resolve()
          lnk.addEventListener('load', () => resolve())
          lnk.addEventListener('error', () => resolve())
        }))

      Promise.all(waitForLinks).then(() => {
        printWindow.focus()
        setTimeout(() => {
          printWindow.print()
          printWindow.close()
        }, 200)
      })
    } catch (e) {
      console.error('Print error', e)
      alert('Failed to open print dialog')
    }
  }

  const handleDevicePrint = async () => {
    if (!data) return
    if (!printerConfig) {
      const go = confirm('No receipt printer configured. Open the Receipt Printer settings now?')
      if (go) window.location.href = '/settings'
      return
    }
    setDeviceBusy(true)
    setDeviceMsg(null)
    try {
      await printerPrint(data)
      setDeviceMsg('Receipt sent to printer ✓')
    } catch (e: any) {
      console.error(e)
      setDeviceMsg('Device print failed: ' + (e?.message || e))
    } finally {
      setDeviceBusy(false)
    }
  }

  const modal = (
    <div className="fixed inset-0 z-[1000] flex items-end sm:items-center justify-center p-0 sm:p-4" role="dialog" aria-modal="true">
      <div className={`absolute inset-0 bg-gray-900/60 transition-opacity duration-300 ${show ? 'opacity-100' : 'opacity-0'}`} onClick={onClose} />

      <div className={`relative bg-white w-full sm:w-auto sm:max-w-md rounded-t-lg sm:rounded-lg shadow-xl transition-all duration-300 ${show ? 'opacity-100 translate-y-0 sm:scale-100' : 'opacity-0 translate-y-3 sm:scale-95'}`}>
        <div className="px-4 py-3 border-b">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold">Installment Receipt</h3>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">Close</button>
          </div>
        </div>

        <div className="p-4 flex items-start justify-center overflow-y-auto max-h-[calc(100vh-16rem)] min-h-[200px]">
          <div ref={receiptRef}>
            <InstallmentReceipt data={data} />
          </div>
        </div>

        {deviceMsg && (
          <div className={`mx-4 mb-2 px-3 py-2 rounded text-sm ${deviceMsg.includes('failed') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
            {deviceMsg}
          </div>
        )}

        <div className="px-4 pb-4 flex flex-col sm:flex-row gap-2 sm:justify-end">
          <button onClick={handlePrint} className="w-full sm:w-auto px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700">Print</button>
          <button
            disabled={deviceBusy}
            onClick={handleDevicePrint}
            className="w-full sm:w-auto px-4 py-2 rounded-md bg-green-600 text-white hover:bg-green-700 disabled:opacity-60"
          >
            {deviceBusy ? 'Sending…' : 'Send to Printer'}
          </button>
          <button onClick={handleSaveImage} className="w-full sm:w-auto px-4 py-2 rounded-md border border-gray-300 bg-white hover:bg-gray-50">Save Image</button>
        </div>
      </div>
    </div>
  )

  return createPortal(modal, document.body)
}

export default InstallmentReceiptModal
