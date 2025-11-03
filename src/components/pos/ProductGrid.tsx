import React from 'react'
import { Product } from '../../types/product'
import ProductTile from './ProductTile'
import { PosAction } from '../../types/pos'

interface ProductGridProps {
  products: Product[]
  orderQtyById: Record<number, number>
  action: PosAction
  onProductClick: (productId: number) => void
}

const ProductGrid: React.FC<ProductGridProps> = ({ products, orderQtyById, action, onProductClick }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
      {products.map(p => (
        <ProductTile
          key={p.id}
          product={p}
          orderQty={orderQtyById[p.id] || 0}
          action={action}
          onClick={() => onProductClick(p.id)}
        />
      ))}
    </div>
  )
}

export default ProductGrid
