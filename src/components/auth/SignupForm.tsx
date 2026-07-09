import React, { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { Mail, Lock, AlertCircle, Eye, EyeOff, Sparkles, HelpCircle, CheckCircle } from 'lucide-react'

const SignupForm: React.FC = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const { signUp, user } = useAuth()

  if (user) {
    return <Navigate to="/dashboard" replace />
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    const { error } = await signUp(email, password)

    if (error) {
      setError(error.message)
    } else {
      setSuccess('Account created successfully! Please check your email to verify your account.')
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans">
      {/* Left Visual Banner (Desktop only) */}
      <div className="hidden md:flex md:w-5/12 bg-[#0B0F19] relative overflow-hidden flex-col justify-between p-12 text-white">
        {/* Glowing Background Mesh */}
        <div className="absolute top-[-10%] right-[-10%] w-[350px] h-[350px] bg-gradient-to-br from-[#129CFF] to-blue-600 rounded-full filter blur-[110px] opacity-25 pointer-events-none" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[350px] h-[350px] bg-gradient-to-tr from-[#D329D0] to-purple-600 rounded-full filter blur-[110px] opacity-20 pointer-events-none" />

        {/* Subtle Grid overlay */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:24px_24px]" />

        {/* Top Branding */}
        <div className="flex items-center space-x-3 relative z-10">
          <img src="/icon.svg" alt="CPOS Pro Logo" className="h-10 w-10 filter drop-shadow-[0_2px_8px_rgba(18,156,255,0.3)]" />
          <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-blue-400 via-indigo-300 to-fuchsia-400 bg-clip-text text-transparent">
            CPOS Pro
          </span>
        </div>

        {/* Content Body */}
        <div className="my-auto relative z-10 space-y-6 max-w-md">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/5 backdrop-blur-md border border-white/10 text-xs text-blue-300 font-medium">
            <Sparkles className="h-3.5 w-3.5 text-blue-400" />
            <span>Modern Retail &amp; Point of Sale</span>
          </div>

          <h1 className="text-4xl font-extrabold tracking-tight leading-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
            Start selling smarter, today.
          </h1>

          <p className="text-slate-400 text-sm leading-relaxed">
            Join thousands of retailers using CPOS Pro for seamless transactions, real-time analytics, and enterprise-grade reporting.
          </p>

          {/* Quick List */}
          <div className="pt-4 space-y-3">
            {[
              "Real-time Inventory & Sales Sync",
              "Integrated Installment & Debt Wizard",
              "Compliant Z-Reading & E-Journal Reporting",
              "Secure multi-persona login protocols"
            ].map((feature, i) => (
              <div key={i} className="flex items-center space-x-3 text-sm text-slate-300">
                <div className="h-5 w-5 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 font-semibold text-[10px]">
                  ✓
                </div>
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer info */}
        <div className="relative z-10 text-xs text-slate-500 flex justify-between items-center border-t border-white/5 pt-4">
          <span>&copy; {new Date().getFullYear()} CPOS Pro</span>
          <a
            href="https://ceintelly.org"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-slate-300 hover:underline transition-all"
          >
            ceintelly.org
          </a>
        </div>
      </div>

      {/* Right Form Pane */}
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-20 xl:px-24 bg-white relative overflow-hidden">
        {/* Decorative subtle top gradient on mobile */}
        <div className="block md:hidden absolute top-0 left-0 right-0 h-48 bg-gradient-to-b from-blue-50/50 to-transparent pointer-events-none -z-10" />

        <div className="mx-auto w-full max-w-md space-y-8 relative">
          {/* Mobile logo */}
          <div className="md:hidden flex items-center justify-center space-x-2.5 mb-2">
            <img src="/icon.svg" alt="CPOS Pro" className="h-10 w-10" />
            <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-blue-500 to-indigo-600 bg-clip-text text-transparent">
              CPOS Pro
            </span>
          </div>

          <div className="text-center md:text-left">
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              Create your account
            </h2>
            <p className="mt-3 text-sm text-slate-600">
              Already have an account?{' '}
              <Link
                to="/login"
                className="font-semibold text-blue-600 hover:text-blue-500 transition-colors underline decoration-blue-600/30 hover:decoration-blue-500"
              >
                Sign in here
              </Link>
            </p>
          </div>

          <div className="bg-white/80 backdrop-blur-sm border border-slate-100 rounded-2xl p-6 sm:p-8 shadow-xl shadow-slate-100/50">
            <form className="space-y-5" onSubmit={handleSubmit}>
              {error && (
                <div className="bg-red-50/60 backdrop-blur-sm border border-red-100 rounded-xl p-4 flex items-start space-x-3 text-red-800">
                  <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm font-medium leading-tight">{error}</p>
                </div>
              )}

              {success && (
                <div className="bg-green-50/60 backdrop-blur-sm border border-green-100 rounded-xl p-4 flex items-start space-x-3 text-green-800">
                  <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm font-medium leading-tight">{success}</p>
                </div>
              )}

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                  Email Address
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                    <Mail className="h-4 w-4" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-10 pr-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 hover:border-slate-300 transition-all text-slate-800 placeholder-slate-400 text-sm outline-none"
                    placeholder="name@company.com"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                  Password
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-10 pr-11 py-3 bg-slate-50/50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 hover:border-slate-300 transition-all text-slate-800 placeholder-slate-400 text-sm outline-none"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label htmlFor="confirmPassword" className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                  Confirm Password
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="block w-full pl-10 pr-11 py-3 bg-slate-50/50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 hover:border-slate-300 transition-all text-slate-800 placeholder-slate-400 text-sm outline-none"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center py-3.5 px-4 border border-transparent rounded-xl shadow-lg shadow-blue-500/25 text-sm font-semibold text-white bg-gradient-to-r from-[#129CFF] to-[#D329D0] hover:from-[#1b8aff] hover:to-[#db42d8] focus:outline-none focus:ring-4 focus:ring-blue-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.01] active:scale-[0.99] duration-200"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-b-transparent"></div>
                ) : (
                  'Create account'
                )}
              </button>
            </form>

            {/* Manage Links */}
            <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-3">
              <span className="flex items-center space-x-1">
                <HelpCircle className="h-3.5 w-3.5 text-slate-400" />
                <span>Account &amp; subscription management</span>
              </span>
              <a
                href="https://ceintelly.org"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-blue-600 hover:text-blue-500 hover:underline transition-colors flex items-center space-x-0.5"
              >
                <span>Manage on ceintelly.org</span>
                <span>&rarr;</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SignupForm