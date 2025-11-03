import React from 'react'

export interface ReceiptLine {
  name: string
  qty: number
  unitPrice: number
  lineTotal: number
}

export interface ReceiptPayment {
  method: string
  amount: number
  reference?: string | null
}

export interface ReceiptData {
  orderId?: number
  businessName?: string
  businessAddress1?: string
  businessAddress2?: string
  cashier?: string
  dateISO: string
  lines: ReceiptLine[]
  subtotal: number
  tax: number
  total: number
  payments: ReceiptPayment[]
  totalPaid: number
  change: number
  notes?: string | null
}

// Narrow, thermal-like receipt using Tailwind
const Receipt: React.FC<{ data: ReceiptData; className?: string }>
  = ({ data, className }) => {
  const format = (n: number) => `$${n.toFixed(2)}`
  const date = new Date(data.dateISO)

  return (
    <div className={"bg-white text-gray-900 mx-auto " + (className || '')} style={{ width: 320 }}>
      <div className="px-4 py-3 text-center">
        <div className="font-bold text-base tracking-wide">
          {data.businessName || 'POS Receipt'}
        </div>
        {(data.businessAddress1 || data.businessAddress2) && (
          <div className="text-[11px] leading-tight text-gray-600 mt-1">
            {data.businessAddress1}<br/>{data.businessAddress2}
          </div>
        )}
      </div>

      <div className="px-4 text-[11px] text-gray-700">
        <div className="flex justify-between">
          <span>Order</span>
          <span>#{data.orderId ?? '—'}</span>
        </div>
        <div className="flex justify-between">
          <span>Date</span>
          <span>{date.toLocaleDateString()} {date.toLocaleTimeString()}</span>
        </div>
        {data.cashier && (
          <div className="flex justify-between">
            <span>Cashier</span>
            <span>{data.cashier}</span>
          </div>
        )}
      </div>

      <div className="my-2 border-t border-dashed" />

      <div className="px-4">
        <div className="grid grid-cols-4 text-[11px] font-semibold text-gray-700">
          <div className="col-span-2">Item</div>
          <div className="text-right">Qty</div>
          <div className="text-right">Total</div>
        </div>
        <div className="mt-1 space-y-1">
          {data.lines.map((l, i) => (
            <div key={i} className="grid grid-cols-4 text-[11px]">
              <div className="col-span-2 pr-2">
                <div className="truncate">{l.name}</div>
                <div className="text-[10px] text-gray-500">@ {format(l.unitPrice)}</div>
              </div>
              <div className="text-right">{l.qty}</div>
              <div className="text-right">{format(l.lineTotal)}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="my-2 border-t border-dashed" />

      <div className="px-4 text-[12px] space-y-1">
        <div className="flex justify-between"><span>Subtotal</span><span>{format(data.subtotal)}</span></div>
        <div className="flex justify-between"><span>Tax</span><span>{format(data.tax)}</span></div>
        <div className="flex justify-between font-semibold"><span>Total</span><span>{format(data.total)}</span></div>
      </div>

      <div className="my-2 border-t border-dashed" />

      <div className="px-4 text-[12px] space-y-1">
        <div className="font-semibold">Payments</div>
        {data.payments.map((p, i) => (
          <div key={i} className="flex justify-between">
            <span>{p.method}{p.reference ? ` (${p.reference})` : ''}</span>
            <span>{format(p.amount)}</span>
          </div>
        ))}
        <div className="flex justify-between text-gray-700"><span>Total Paid</span><span>{format(data.totalPaid)}</span></div>
        {data.change > 0 && (
          <div className="flex justify-between text-green-700 font-semibold"><span>Change</span><span>{format(data.change)}</span></div>
        )}
      </div>

      {data.notes && (
        <>
          <div className="my-2 border-t border-dashed" />
          <div className="px-4 pb-3">
            <div className="text-[11px] text-gray-600 whitespace-pre-wrap">{data.notes}</div>
          </div>
        </>
      )}

      <div className="mt-2 px-4 pb-4 text-center text-[10px] text-gray-500">
        Thank you for your business!
      </div>
    </div>
  )
}

export default Receipt
