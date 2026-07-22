import React from 'react'
import { SetupProgressState, SETUP_STEPS } from '../../services/offlineSetupService'
import { Sparkles, CheckCircle2, Loader2, Database, WifiOff, HardDriveDownload } from 'lucide-react'

interface SettingUpScreenProps {
  progressState?: SetupProgressState | null
}

export const SettingUpScreen: React.FC<SettingUpScreenProps> = ({ progressState }) => {
  const isOnline = navigator.onLine
  const currentStep = progressState?.currentStepIndex ?? 0
  const progressPct = progressState?.progressPercentage ?? 10
  const activeTitle = progressState?.stepTitle || SETUP_STEPS[Math.min(currentStep, SETUP_STEPS.length - 1)]

  return (
    <div className="min-h-screen bg-[#0B0F19] text-white flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
      {/* Background Decorative Mesh & Gradients */}
      <div className="absolute top-[-10%] right-[-10%] w-[450px] h-[450px] bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full filter blur-[130px] opacity-25 pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[450px] h-[450px] bg-gradient-to-tr from-fuchsia-600 to-purple-600 rounded-full filter blur-[130px] opacity-20 pointer-events-none" />
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:24px_24px]" />

      <div className="w-full max-w-lg space-y-8 relative z-10">
        {/* Top Brand Logo */}
        <div className="flex flex-col items-center justify-center text-center space-y-3">
          <div className="relative">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <img src="/icon.svg" alt="CPOS Pro" className="h-10 w-10 filter drop-shadow" />
            </div>
            <div className="absolute -bottom-1 -right-1 bg-emerald-500 rounded-full p-1 border-2 border-[#0B0F19]">
              <HardDriveDownload className="h-3.5 w-3.5 text-white" />
            </div>
          </div>

          <div>
            <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs font-semibold text-blue-400">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Workspace Initialization</span>
            </span>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
              Setting Up Your POS Workspace
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              Fetching system data and saving offline for seamless operations
            </p>
          </div>
        </div>

        {/* Card Container */}
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl shadow-black/50 space-y-6">
          {!isOnline && (
            <div className="flex items-center space-x-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-medium">
              <WifiOff className="h-4 w-4 text-amber-400 flex-shrink-0" />
              <span>Working offline. Loading cached database & store settings...</span>
            </div>
          )}

          {/* Active Step Highlight */}
          <div className="flex items-center space-x-3 bg-blue-950/40 border border-blue-500/20 rounded-xl p-4">
            <Loader2 className="h-5 w-5 text-blue-400 animate-spin flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wider text-blue-400">Current Task</p>
              <p className="text-sm font-medium text-slate-100 truncate">{activeTitle}</p>
            </div>
            <span className="text-sm font-bold text-blue-400">{progressPct}%</span>
          </div>

          {/* Progress Bar */}
          <div className="space-y-1.5">
            <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 h-2.5 rounded-full transition-all duration-300 ease-out shadow-sm shadow-blue-500/50"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          {/* Step Checklist */}
          <div className="space-y-3 pt-2">
            {SETUP_STEPS.map((step, idx) => {
              const isDone = idx < currentStep
              const isCurrent = idx === currentStep

              return (
                <div
                  key={idx}
                  className={`flex items-center space-x-3 p-2.5 rounded-lg text-xs font-medium transition-all ${
                    isDone
                      ? 'text-slate-300 bg-slate-800/40'
                      : isCurrent
                      ? 'text-blue-300 bg-blue-500/10 border border-blue-500/20'
                      : 'text-slate-500 bg-transparent'
                  }`}
                >
                  {isDone ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                  ) : isCurrent ? (
                    <Loader2 className="h-4 w-4 text-blue-400 animate-spin flex-shrink-0" />
                  ) : (
                    <div className="h-4 w-4 rounded-full border border-slate-700 flex items-center justify-center flex-shrink-0">
                      <div className="h-1.5 w-1.5 rounded-full bg-slate-700" />
                    </div>
                  )}
                  <span className="flex-1">{step}</span>
                  {isDone && <span className="text-[10px] uppercase font-bold text-emerald-400">Saved</span>}
                </div>
              )
            })}
          </div>

          {/* Footer Note */}
          <div className="flex items-center justify-center space-x-2 text-xs text-slate-500 border-t border-slate-800/80 pt-4">
            <Database className="h-3.5 w-3.5 text-slate-400" />
            <span>IndexedDB & Local Storage Sync Active</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SettingUpScreen
