import React from 'react'
import { Layers, Minus, Plus, X } from 'lucide-react'
import { PosAction } from '../../types/pos'

interface ActionModeBarProps {
    value: PosAction
    onChange: (value: PosAction) => void
    className?: string
}

const entries: { key: PosAction; label: string; Icon: React.ElementType; color: string }[] = [
    { key: 'add', label: 'Add', Icon: Plus, color: 'text-blue-600' },
    { key: 'deduct', label: 'Deduct', Icon: Minus, color: 'text-amber-600' },
    { key: 'bundle', label: 'Bundle', Icon: Layers, color: 'text-indigo-600' },
    { key: 'clear', label: 'Clear', Icon: X, color: 'text-red-600' },
]

const ActionModeBar: React.FC<ActionModeBarProps> = ({ value, onChange, className }) => {
    return (
        <div className={"inline-flex rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden " + (className || '')} role="tablist" aria-label="Action mode selector">
            {entries.map(({ key, label, Icon, color }, idx) => {
                const selected = value === key
                return (
                    <button
                        key={key}
                        onClick={() => onChange(key)}
                        role="tab"
                        aria-selected={selected}
                        className={`px-4 sm:px-5 py-2.5 text-base font-medium flex items-center gap-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                            selected ? 'bg-blue-50 text-blue-700' : 'bg-white text-gray-700 hover:bg-gray-50'
                        } ${idx !== 0 ? 'border-l border-gray-200' : ''}`}
                        title={`Current action: ${label}`}
                    >
                        <Icon className={`h-5 w-5 ${selected ? 'text-blue-700' : color}`} />
                        <span className="hidden sm:inline">{label}</span>
                    </button>
                )
            })}
        </div>
    )
}

export default ActionModeBar