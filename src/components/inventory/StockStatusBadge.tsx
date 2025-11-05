// StockStatusBadge.tsx
import React from 'react';

interface StockStatusBadgeProps {
    quantity: number;
}

const StockStatusBadge: React.FC<StockStatusBadgeProps> = ({ quantity }) => {
    let badgeStyles = 'bg-green-100 text-green-800';
    let statusText = 'In Stock';

    if (quantity === 0) {
        badgeStyles = 'bg-red-100 text-red-800';
        statusText = 'Out of Stock';
    } else if (quantity <= 10) { // Assuming '10' is the low stock threshold
        badgeStyles = 'bg-yellow-100 text-yellow-800';
        statusText = 'Low Stock';
    }

    return (
        <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${badgeStyles}`}>
      {statusText}
    </span>
    );
};

export default StockStatusBadge;