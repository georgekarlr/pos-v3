import React from 'react'

interface ProductCostMarginBadgeProps {
  basePrice: number
  costPrice: number
  showAmount?: boolean
  className?: string
}

export const ProductCostMarginBadge: React.FC<ProductCostMarginBadgeProps> = ({
  basePrice,
  costPrice,
  showAmount = true,
  className = ''
}) => {
  const cost = costPrice || 0
  const profit = basePrice - cost
  const marginPercent = basePrice > 0 ? (profit / basePrice) * 100 : 0

  const isPositive = profit >= 0

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount)
  }

  return (
    <div className={`inline-flex items-center gap-1.5 ${className}`}>
      <span
        className={`inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded-full ${
          isPositive
            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            : 'bg-rose-50 text-rose-700 border border-rose-200'
        }`}
        title={`Cost Price: ${formatCurrency(cost)} | Base Price: ${formatCurrency(basePrice)}`}
      >
        {marginPercent.toFixed(1)}% margin
      </span>
      {showAmount && (
        <span className={`text-xs font-medium ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
          ({isPositive ? '+' : ''}{formatCurrency(profit)})
        </span>
      )}
    </div>
  )
}

export default ProductCostMarginBadge
