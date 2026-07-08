import React from 'react'
import { Info } from 'lucide-react'

interface TerminalFormState {
  terminal_id: number
  terminal_name: string
  min: string
  ptu_number: string
  ptu_date_issued: string
  is_active: boolean
  current_invoice_number: number
}

interface CreateTerminalModalProps {
  form: TerminalFormState
  loading: boolean
  onChange: (form: TerminalFormState) => void
  onSubmit: (e: React.FormEvent) => void
  onClose: () => void
}

interface EditTerminalModalProps extends CreateTerminalModalProps {
  // same shape, just different title / submit label
}

const inputClass =
  'w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none'

const ModalShell: React.FC<{
  title: string
  onClose: () => void
  children: React.ReactNode
}> = ({ title, onClose, children }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 overflow-y-auto">
    <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl border border-gray-200">
      <h3 className="text-lg font-bold text-gray-900 mb-4">{title}</h3>
      {children}
    </div>
  </div>
)

const ModalFooter: React.FC<{
  loading: boolean
  submitLabel: string
  loadingLabel: string
  onClose: () => void
}> = ({ loading, submitLabel, loadingLabel, onClose }) => (
  <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
    <button
      type="button"
      onClick={onClose}
      className="px-4 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50"
    >
      Cancel
    </button>
    <button
      type="submit"
      disabled={loading}
      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium disabled:bg-blue-400"
    >
      {loading ? loadingLabel : submitLabel}
    </button>
  </div>
)

export const CreateTerminalModal: React.FC<CreateTerminalModalProps> = ({
  form,
  loading,
  onChange,
  onSubmit,
  onClose,
}) => {
  const set = (patch: Partial<TerminalFormState>) => onChange({ ...form, ...patch })

  return (
    <ModalShell title="Create POS Terminal" onClose={onClose}>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Terminal Name *</label>
          <input
            type="text"
            required
            placeholder="e.g. Register 1"
            value={form.terminal_name}
            onChange={(e) => set({ terminal_name: e.target.value })}
            className={inputClass}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">BIR MIN *</label>
          <input
            type="text"
            required
            placeholder="Machine Identification Number"
            value={form.min}
            onChange={(e) => set({ min: e.target.value })}
            className={inputClass}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">PTU Number *</label>
          <input
            type="text"
            required
            placeholder="Permit to Use Number"
            value={form.ptu_number}
            onChange={(e) => set({ ptu_number: e.target.value })}
            className={inputClass}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            PTU Date Issued *
          </label>
          <input
            type="date"
            required
            value={form.ptu_date_issued}
            onChange={(e) => set({ ptu_date_issued: e.target.value })}
            className={inputClass}
          />
        </div>

        <ModalFooter
          loading={loading}
          submitLabel="Create Terminal"
          loadingLabel="Creating..."
          onClose={onClose}
        />
      </form>
    </ModalShell>
  )
}

export const EditTerminalModal: React.FC<EditTerminalModalProps> = ({
  form,
  loading,
  onChange,
  onSubmit,
  onClose,
}) => {
  const set = (patch: Partial<TerminalFormState>) => onChange({ ...form, ...patch })
  const hasSales = form.current_invoice_number > 0

  return (
    <ModalShell title="Edit POS Terminal" onClose={onClose}>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Terminal Name *</label>
          <input
            type="text"
            required
            value={form.terminal_name}
            onChange={(e) => set({ terminal_name: e.target.value })}
            className={inputClass}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">BIR MIN *</label>
          <input
            type="text"
            required
            disabled={hasSales}
            value={form.min}
            onChange={(e) => set({ min: e.target.value })}
            className={`${inputClass} disabled:bg-gray-100 disabled:text-gray-500`}
          />
          {hasSales && (
            <p className="text-xs text-amber-600 mt-1 font-medium flex items-start gap-1">
              <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
              Cannot change the MIN of a terminal that has already processed sales.
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">PTU Number *</label>
          <input
            type="text"
            required
            value={form.ptu_number}
            onChange={(e) => set({ ptu_number: e.target.value })}
            className={inputClass}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            PTU Date Issued *
          </label>
          <input
            type="date"
            required
            value={form.ptu_date_issued}
            onChange={(e) => set({ ptu_date_issued: e.target.value })}
            className={inputClass}
          />
        </div>

        <div className="flex items-center gap-2 pt-2">
          <input
            type="checkbox"
            id="terminal-is-active"
            checked={form.is_active}
            onChange={(e) => set({ is_active: e.target.checked })}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <label
            htmlFor="terminal-is-active"
            className="text-sm font-medium text-gray-700 cursor-pointer select-none"
          >
            Is Terminal Active
          </label>
        </div>

        <ModalFooter
          loading={loading}
          submitLabel="Save Changes"
          loadingLabel="Saving..."
          onClose={onClose}
        />
      </form>
    </ModalShell>
  )
}

export type { TerminalFormState }
