import React from 'react'
import { KeyRound, X, ExternalLink, Mail, Settings, ShieldAlert, CheckCircle2 } from 'lucide-react'

interface ForgotAdminPasswordModalProps {
  isOpen: boolean
  onClose: () => void
}

export const ForgotAdminPasswordModal: React.FC<ForgotAdminPasswordModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 relative space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl border border-amber-200/60">
              <KeyRound className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">Forgot Admin Password?</h3>
              <p className="text-xs text-slate-500">Instructions for resetting your administrator PIN / password</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            title="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Highlighted Notice */}
        <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-4 flex items-start space-x-3">
          <ShieldAlert className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-amber-900 leading-relaxed">
            <span className="font-bold">Important Note:</span> Resetting your account password automatically resets your Admin password to{' '}
            <code className="bg-amber-100 text-amber-950 px-1.5 py-0.5 rounded font-mono font-bold border border-amber-300">
              admin123
            </code>.
          </div>
        </div>

        {/* Reset Options */}
        <div className="space-y-4">
          {/* Option 1 */}
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                Option 1
              </span>
              <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
                <Settings className="h-3.5 w-3.5 text-slate-400" /> Account Settings
              </span>
            </div>
            <h4 className="text-sm font-semibold text-slate-800">Reset via Account Settings (If Logged In)</h4>
            <ol className="list-decimal list-inside text-xs text-slate-600 space-y-1.5 ml-1">
              <li>
                Go to{' '}
                <a
                  href="https://ceintelly.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-blue-600 hover:underline inline-flex items-center gap-0.5"
                >
                  ceintelly.com <ExternalLink className="h-3 w-3" />
                </a>
              </li>
              <li>Login to your account</li>
              <li>Go to <strong>Settings</strong></li>
              <li>Reset account password (resets admin password to <code className="font-mono bg-slate-200/80 px-1 py-0.5 rounded">admin123</code>)</li>
            </ol>
          </div>

          {/* Option 2 */}
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800">
                Option 2
              </span>
              <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
                <Mail className="h-3.5 w-3.5 text-slate-400" /> Email Password Reset
              </span>
            </div>
            <h4 className="text-sm font-semibold text-slate-800">Reset via Email / Forgot Password (If Logged Out)</h4>
            <ol className="list-decimal list-inside text-xs text-slate-600 space-y-1.5 ml-1">
              <li>
                Go to{' '}
                <a
                  href="https://ceintelly.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-blue-600 hover:underline inline-flex items-center gap-0.5"
                >
                  ceintelly.com <ExternalLink className="h-3 w-3" />
                </a>
              </li>
              <li>Click <strong>Login</strong> button then click <strong>Forgot password</strong></li>
              <li>Send email to reset password</li>
              <li>Go to Gmail (or your email inbox) to reset password</li>
              <li>Reset account password (resets admin password to <code className="font-mono bg-slate-200/80 px-1 py-0.5 rounded">admin123</code>)</li>
            </ol>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-2 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-medium text-sm transition-colors shadow-sm"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  )
}
