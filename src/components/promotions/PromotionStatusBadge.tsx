// components/promotions/PromotionStatusBadge.tsx
import React from 'react';
import type { PromoStatus } from '../../types/promotion';

interface PromotionStatusBadgeProps {
  status: PromoStatus;
}

const STATUS_CONFIG: Record<
  PromoStatus,
  { label: string; className: string }
> = {
  active: {
    label: 'Active',
    className:
      'bg-emerald-100 text-emerald-800 border border-emerald-200',
  },
  upcoming: {
    label: 'Upcoming',
    className: 'bg-blue-100 text-blue-800 border border-blue-200',
  },
  expired: {
    label: 'Expired',
    className: 'bg-gray-100 text-gray-600 border border-gray-200',
  },
  deactivated: {
    label: 'Deactivated',
    className: 'bg-red-100 text-red-700 border border-red-200',
  },
};

const PromotionStatusBadge: React.FC<PromotionStatusBadgeProps> = ({ status }) => {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.deactivated;

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${config.className}`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
          status === 'active'
            ? 'bg-emerald-500'
            : status === 'upcoming'
            ? 'bg-blue-500'
            : status === 'expired'
            ? 'bg-gray-400'
            : 'bg-red-500'
        }`}
      />
      {config.label}
    </span>
  );
};

export default PromotionStatusBadge;
