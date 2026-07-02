import React from 'react'

export interface ReceiptLine {
    name: string
    qty: number
    unitType?: string | null
    unitPrice: number
    lineTotal: number
    // Optional refund info per item (shown on Sales History receipts)
    refundedQty?: number
    refundedAmount?: number
}

export interface ReceiptPayment {
    method: string
    amount: number
    reference?: string | null
}

export interface ReceiptData {
    orderId?: number
    offlineId?: number
    invoiceNumber?: string
    terminalId?: number
    // Header fields
    businessName?: string
    businessAddress1?: string
    tin?: string           // VAT Reg TIN
    min?: string           // Machine Identification Number
    cashier?: string
    dateISO: string
    lines: ReceiptLine[]
    subtotal: number
    tax: number
    scPwdDiscount?: number
    regularDiscount?: number
    total: number
    payments: ReceiptPayment[]
    totalPaid: number
    change: number
    notes?: string | null
    totalTendered?: number | null
    // Footer fields
    ptuIssuedBy?: string
    softwareProviderName?: string
    softwareProviderAddress?: string
    softwareProviderTin?: string
    softwareProviderAccreditationNo?: string
}

// Narrow, thermal-like receipt using Tailwind
const Receipt: React.FC<{ data: ReceiptData; className?: string }>
    = ({ data, className }) => {
    const format = (n: number) => `\u20b1${n.toFixed(2)}`
    const date = new Date(data.dateISO)

    return (
        <div className={"receipt-paper bg-white text-gray-900 mx-auto " + (className || '')} style={{ width: 320 }}>
            <div className="px-4 py-3 text-center">
                <div className="font-bold text-base tracking-wide">
                    {data.businessName || 'POS Receipt'}
                </div>
                {data.businessAddress1 && (
                    <div className="text-[11px] leading-tight text-gray-600 mt-0.5">
                        {data.businessAddress1}
                    </div>
                )}
                {data.tin && (
                    <div className="text-[11px] leading-tight text-gray-600">
                        VAT Reg TIN: {data.tin}
                    </div>
                )}
                {data.min && (
                    <div className="text-[11px] leading-tight text-gray-600">
                        MIN: {data.min}
                    </div>
                )}
            </div>

            <div className="px-4 text-[11px] text-gray-700">
                {data.invoiceNumber ? (
                    <div className="flex justify-between">
                        <span>Invoice #</span>
                        <span className="font-semibold">{data.invoiceNumber}</span>
                    </div>
                ) : (
                    <div className="flex justify-between">
                        <span>{data.offlineId ? 'Offline Ref' : 'Order'}</span>
                        <span>#{data.offlineId ?? data.orderId ?? '—'}</span>
                    </div>
                )}
                {data.terminalId && (
                    <div className="flex justify-between">
                        <span>Terminal</span>
                        <span>#{data.terminalId}</span>
                    </div>
                )}
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
                        <div key={i} className="text-[11px]">
                            <div className="grid grid-cols-4">
                                <div className="col-span-2 pr-2">
                                    <div className="truncate">{l.name}</div>
                                    <div className="text-[10px] text-gray-500">@ {format(l.unitPrice)}</div>
                                </div>
                                <div className="text-right">
                                    {l.unitType ? l.qty.toFixed(2).replace(/\.?0+$/, '') : l.qty}
                                    {l.unitType && <span className="text-[9px] ml-0.5">{l.unitType}</span>}
                                </div>
                                <div className="text-right">{format(l.lineTotal)}</div>
                            </div>
                            {l.refundedAmount && l.refundedAmount > 0 && (
                                <div className="grid grid-cols-4 mt-0.5">
                                    <div className="col-span-2 pr-2 text-[10px] text-red-600">
                                        Refunded{typeof l.refundedQty === 'number' && l.refundedQty > 0 ? ` x${l.unitType ? l.refundedQty.toFixed(2).replace(/\.?0+$/, '') : l.refundedQty} @ ${format(l.unitPrice)}` : ''}
                                    </div>
                                    <div className="col-span-1" />
                                    <div className="text-right text-[10px] text-red-600">-{format(l.refundedAmount)}</div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
            <div className="my-2 border-t border-dashed" />


            <div className="px-4 text-[12px] space-y-1">
                <div className="flex justify-between"><span>Subtotal</span><span>{format(data.subtotal)}</span></div>
                <div className="flex justify-between"><span>Tax (VAT)</span><span>{format(data.tax)}</span></div>
                {data.scPwdDiscount !== undefined && data.scPwdDiscount > 0 && (
                    <div className="flex justify-between text-amber-700">
                        <span>SC/PWD Discount (20%)</span>
                        <span>-{format(data.scPwdDiscount)}</span>
                    </div>
                )}
                {data.regularDiscount !== undefined && data.regularDiscount > 0 && (
                    <div className="flex justify-between text-blue-700">
                        <span>Regular Discount</span>
                        <span>-{format(data.regularDiscount)}</span>
                    </div>
                )}
                <div className="my-2 border-t border-dashed" />
                <div className="flex justify-between font-semibold text-[13px] text-gray-900">
                    <span>Total Due</span>
                    <span>{format(data.total)}</span>
                </div>
            </div>

            <div className="px-4 text-[12px] space-y-1">
                {/**<div className="font-semibold">Payments</div>
                {data.payments.map((p, i) => (
                    <div key={i} className="flex justify-between">
                        <span>{p.method}{p.reference ? ` (${p.reference})` : ''}</span>
                        <span>{format(p.amount)}</span>
                    </div>
                ))} **/}
                <div className="flex justify-between text-gray-700"><span>Total Paid</span><span>{format(data.totalPaid)}</span></div>
                <div className="my-2 border-t border-dashed" />
                <div className="flex justify-between text-green-700 font-semibold"><span>Change</span><span>{format(data.change)}</span></div>

            </div>

            {data.notes && (
                <>
                    <div className="my-2 border-t border-dashed" />
                    <div className="px-4 pb-3">
                        <div className="text-[11px] text-gray-600 whitespace-pre-wrap">{data.notes}</div>
                    </div>
                </>
            )}

            <div className="mt-2 px-4 text-center text-[10px] text-gray-500">
                Thank you for your business!
            </div>

            {/* BIR / Provider Footer */}
            <div className="my-2 border-t border-dashed" />
            <div className="px-4 pb-4 text-[10px] text-gray-500 space-y-0.5 leading-tight">
                {data.ptuIssuedBy && (
                    <div>PTU Issued by RDO: {data.ptuIssuedBy}</div>
                )}
                {data.softwareProviderName && (
                    <div>Software Provider: {data.softwareProviderName}</div>
                )}
                {data.softwareProviderAddress && (
                    <div>Provider Address: {data.softwareProviderAddress}</div>
                )}
                {data.softwareProviderTin && (
                    <div>Provider TIN: {data.softwareProviderTin}</div>
                )}
                {data.softwareProviderAccreditationNo && (
                    <div>Accreditation No: {data.softwareProviderAccreditationNo}</div>
                )}
                {(data.ptuIssuedBy || data.softwareProviderName) && (
                    <div className="mt-1 text-center font-semibold text-[9px] text-gray-400 uppercase tracking-wide">
                        THIS RECEIPT SHALL BE VALID FOR 5 YEARS FROM THE DATE OF THE PERMIT TO USE.
                    </div>
                )}
            </div>
        </div>
    )
}

export default Receipt
