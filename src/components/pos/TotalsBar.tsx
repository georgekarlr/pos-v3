import React from 'react'

interface TotalsBarProps {
  items: number
  subtotal: number
  tax: number
  total: number
  paid: number
  className?: string
}

const currency = (n: number) => `$${n.toFixed(2)}`

const TotalsBar: React.FC<TotalsBarProps> = ({ items, subtotal, tax, total, paid, className }) => {
  const remaining = Math.max(0, total - paid)
  const chip = (label: string, value: string, emphasis?: boolean) => (
    <div className={`px-3 py-1.5 rounded-full text-xs sm:text-sm border ${emphasis ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-700 border-gray-200'}`}>
      <span className="text-gray-500 mr-1.5">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  )

  return (
    <div className={(className || '') + ' flex flex-wrap items-center gap-2'}>
      {chip('Items', String(items))}
      {chip('Subtotal', currency(subtotal))}
      {chip('Tax', currency(tax))}
      {chip('Total', currency(total))}
      {chip('Paid', currency(paid))}
      {chip('Remaining', currency(remaining), remaining === 0 && total > 0)}
    </div>
  )
}

export default TotalsBar
