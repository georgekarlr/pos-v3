import React, { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import Receipt, { ReceiptData } from './Receipt'

interface ReceiptModalProps {
  open: boolean
  data: ReceiptData | null
  onClose: () => void
}

const ReceiptModal: React.FC<ReceiptModalProps> = ({ open, data, onClose }) => {
  const [show, setShow] = useState(false)
  const receiptRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open) setTimeout(() => setShow(true), 10)
    else setShow(false)
  }, [open])

  if (!open || !data) return null

  const handleSaveImage = async () => {
    try {
      const node = receiptRef.current
      if (!node) return
      const { toPng } = await import('html-to-image')
      const dataUrl = await toPng(node, { cacheBust: true, pixelRatio: 2, backgroundColor: '#ffffff' })
      const link = document.createElement('a')
      link.download = `receipt-${data.orderId ?? 'sale'}.png`
      link.href = dataUrl
      link.click()
    } catch (e) {
      console.error('Failed to export image', e)
      alert('Failed to save image. Try printing instead.')
    }
  }

  const handlePrint = () => {
    try {
      const node = receiptRef.current
      if (!node) return
      const win = window.open('', 'PRINT', 'height=600,width=400')
      if (!win) return
      win.document.write('<html><head><title>Receipt</title>')
      win.document.write('<link rel="stylesheet" href="/tailwind.css" />')
      win.document.write('</head><body>')
      win.document.write(node.outerHTML)
      win.document.write('</body></html>')
      win.document.close()
      win.focus()
      setTimeout(() => {
        win.print()
        win.close()
      }, 300)
    } catch (e) {
      console.error('Print error', e)
      alert('Failed to open print dialog')
    }
  }

  const modal = (
    <div className="fixed inset-0 z-[1000] flex items-end sm:items-center justify-center p-0 sm:p-4" role="dialog" aria-modal="true">
      <div className={`absolute inset-0 bg-gray-900/60 transition-opacity duration-300 ${show ? 'opacity-100' : 'opacity-0'}`} onClick={onClose} />

      <div className={`relative bg-white w-full sm:w-auto sm:max-w-md rounded-t-lg sm:rounded-lg shadow-xl transition-all duration-300 ${show ? 'opacity-100 translate-y-0 sm:scale-100' : 'opacity-0 translate-y-3 sm:scale-95'}`}>
        <div className="px-4 py-3 border-b">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold">Receipt</h3>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">Close</button>
          </div>
        </div>

        <div className="p-4 flex items-center justify-center">
          <div ref={receiptRef}>
            <Receipt data={data} />
          </div>
        </div>

        <div className="px-4 pb-4 flex flex-col sm:flex-row gap-2 sm:justify-end">
          <button onClick={handlePrint} className="w-full sm:w-auto px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700">Print</button>
          <button onClick={handleSaveImage} className="w-full sm:w-auto px-4 py-2 rounded-md border border-gray-300 bg-white hover:bg-gray-50">Save Image</button>
        </div>
      </div>
    </div>
  )

  return createPortal(modal, document.body)
}

export default ReceiptModal
