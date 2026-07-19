import React from 'react'
import {
    ReceiptData,
    ReceiptHeader,
    InstallmentDetails,
    VATBreakdown,
    ReceiptFooter
} from './Receipt'

interface InstallmentReceiptProps {
    data: ReceiptData
    className?: string
}

const InstallmentReceipt: React.FC<InstallmentReceiptProps> = ({ data, className }) => {
    const isRecovery = data.businessName?.includes('Recovery');
    const isDownpayment = data.businessName?.includes('Downpayment');
    const isPayment = !isRecovery && !isDownpayment;

    let title = "OFFICIAL RECEIPT";
    let subtitle = "Installment Payment";

    if (isRecovery) {
        subtitle = "Debt Recovery";
    } else if (isDownpayment) {
        subtitle = "Downpayment";
    }

    return (
        <div className={"receipt-paper bg-white text-gray-900 mx-auto " + (className || '')} style={{ width: 320, fontSize: '9px' }}>
            <ReceiptHeader data={data} />
            <div className="my-2 border-t border-dashed" />
            
            <div className="px-4 py-2 text-center bg-gray-50 mb-2">
                <div className="font-bold text-[12px]">{title}</div>
                <div className="text-[10px] text-gray-500 italic">{subtitle}</div>
            </div>

            <InstallmentDetails data={data} />
            
            {data.isVatRegistered && (
                <>
                    <div className="my-2 border-t border-dashed" />
                    <VATBreakdown data={data} />
                </>
            )}

            <div className="my-2 border-t border-dashed" />
            <ReceiptFooter data={data} />
        </div>
    )
}

export default InstallmentReceipt
