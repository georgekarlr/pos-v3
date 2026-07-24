import React, { useState } from 'react';
import { Ticket, CheckCircle2, XCircle, Clock, X } from 'lucide-react';
import type { CouponStatus } from '../../utils/cartCalculator';

interface CouponSectionProps {
  appliedCoupons: string[];
  onApplyCoupon: (code: string) => CouponStatus;
  onRemoveCoupon: (code: string) => void;
  inputId?: string;
}

const COUPON_STATUS_CONFIG: Record<
  CouponStatus,
  { icon: React.ReactNode; text: string; color: string; bg: string; border: string }
> = {
  idle: {
    icon: null,
    text: '',
    color: '',
    bg: '',
    border: 'border-gray-300',
  },
  valid: {
    icon: <CheckCircle2 className="h-4 w-4 text-emerald-600" />,
    text: 'Coupon added successfully!',
    color: 'text-emerald-700',
    bg: 'bg-emerald-50',
    border: 'border-emerald-400',
  },
  invalid: {
    icon: <XCircle className="h-4 w-4 text-red-500" />,
    text: 'Invalid coupon code.',
    color: 'text-red-700',
    bg: 'bg-red-50',
    border: 'border-red-400',
  },
  expired: {
    icon: <XCircle className="h-4 w-4 text-orange-500" />,
    text: 'This coupon has expired.',
    color: 'text-orange-700',
    bg: 'bg-orange-50',
    border: 'border-orange-400',
  },
  upcoming: {
    icon: <Clock className="h-4 w-4 text-blue-500" />,
    text: 'This coupon is not active yet.',
    color: 'text-blue-700',
    bg: 'bg-blue-50',
    border: 'border-blue-400',
  },
  already_applied: {
    icon: <XCircle className="h-4 w-4 text-amber-500" />,
    text: 'This coupon is already applied.',
    color: 'text-amber-700',
    bg: 'bg-amber-50',
    border: 'border-amber-400',
  },
};

export const CouponSection: React.FC<CouponSectionProps> = ({
  appliedCoupons,
  onApplyCoupon,
  onRemoveCoupon,
  inputId = 'pos-coupon-code-input',
}) => {
  const [localCode, setLocalCode] = useState('');
  const [couponStatus, setCouponStatus] = useState<CouponStatus>('idle');

  const statusCfg = COUPON_STATUS_CONFIG[couponStatus];

  const handleApply = () => {
    if (!localCode.trim()) return;
    const status = onApplyCoupon(localCode);
    setCouponStatus(status);
    if (status === 'valid') {
      setLocalCode('');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalCode(e.target.value.toUpperCase());
    if (couponStatus !== 'idle') {
      setCouponStatus('idle');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleApply();
    }
  };

  return (
    <div className="space-y-3">
      <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 uppercase tracking-wider">
        <Ticket className="h-3.5 w-3.5 text-violet-500" />
        Coupon Codes
      </label>

      {/* Applied Coupons List */}
      {appliedCoupons.length > 0 && (
        <div className="flex flex-wrap gap-2 py-1">
          {appliedCoupons.map((code) => (
            <div
              key={code}
              className="flex items-center gap-1 bg-violet-55/80 bg-violet-50 border border-violet-200 rounded-full pl-2.5 pr-1.5 py-1 text-xs text-violet-800 font-semibold shadow-sm transition-all hover:border-violet-300"
            >
              <Ticket className="h-3 w-3 text-violet-500 flex-shrink-0" />
              <span className="font-mono uppercase tracking-wider">{code}</span>
              <button
                onClick={() => onRemoveCoupon(code)}
                className="ml-1 p-0.5 rounded-full hover:bg-violet-100 text-violet-600 hover:text-violet-800 transition-colors"
                title={`Remove coupon ${code}`}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input row */}
      <div className="space-y-1.5">
        <div className="flex gap-2">
          <input
            id={inputId}
            type="text"
            value={localCode}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Enter coupon code…"
            maxLength={50}
            className={`flex-1 px-3 py-2 border rounded-lg text-sm font-mono uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-colors ${couponStatus !== 'idle'
                ? statusCfg.border + ' ' + statusCfg.bg
                : 'border-gray-300 bg-white'
              }`}
          />
          <button
            onClick={handleApply}
            disabled={!localCode.trim()}
            className="px-3 py-2 bg-violet-600 text-white text-sm font-semibold rounded-lg hover:bg-violet-700 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors shadow-sm"
          >
            Apply
          </button>
        </div>

        {/* Status feedback */}
        {couponStatus !== 'idle' && statusCfg.text && (
          <div
            className={`flex items-center gap-1.5 text-xs font-medium ${statusCfg.color} animate-in fade-in slide-in-from-top-1 duration-200`}
          >
            {statusCfg.icon}
            {statusCfg.text}
          </div>
        )}
      </div>
    </div>
  );
};
