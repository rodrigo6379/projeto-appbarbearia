import { AlertTriangle, X } from 'lucide-react'

export function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-ink-850 rounded-2xl shadow-sm shadow-black/40 border border-ink-700 ${className}`}>
      {children}
    </div>
  )
}

export function Button({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  type = 'button',
  className = '',
  disabled = false,
}: {
  children: React.ReactNode
  onClick?: () => void
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md'
  type?: 'button' | 'submit'
  className?: string
  disabled?: boolean
}) {
  const variants = {
    primary: 'bg-gradient-to-r from-electric-500 to-electric-600 text-white hover:from-electric-400 hover:to-electric-500 shadow-md shadow-electric-500/25',
    secondary: 'bg-electric-500/10 text-electric-300 hover:bg-electric-500/20 border border-electric-500/30',
    ghost: 'text-slate-400 hover:text-slate-200 hover:bg-ink-700',
    danger: 'bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-400 hover:to-red-500 shadow-md shadow-red-500/25',
  }
  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2.5 text-sm',
  }
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 font-medium rounded-xl transition-all duration-200 active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {children}
    </button>
  )
}

export function Input({
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  required = false,
  step,
  min,
  max,
  error,
}: {
  label?: string
  type?: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  required?: boolean
  step?: string
  min?: string
  max?: string
  error?: string
}) {
  return (
    <label className="block">
      {label && (
        <span className="block text-sm font-medium text-slate-300 mb-1.5">{label}</span>
      )}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        step={step}
        min={min}
        max={max}
        className={`w-full px-4 py-2.5 rounded-xl border bg-ink-800 text-slate-100 text-sm focus:outline-none focus:ring-2 transition-all placeholder:text-slate-600 ${
          error
            ? 'border-red-500/60 focus:ring-red-500/40 focus:border-red-500'
            : 'border-ink-600 focus:ring-electric-500/50 focus:border-electric-500'
        }`}
      />
      {error && <span className="block text-xs text-red-400 mt-1">{error}</span>}
    </label>
  )
}

export function Select({
  label,
  value,
  onChange,
  options,
}: {
  label?: string
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <label className="block">
      {label && (
        <span className="block text-sm font-medium text-slate-300 mb-1.5">{label}</span>
      )}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-2.5 rounded-xl border border-ink-600 bg-ink-800 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-electric-500/50 focus:border-electric-500 transition-all cursor-pointer"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  )
}

export function EmptyState({ icon, message }: { icon: React.ReactNode; message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center px-4">
      <div className="w-14 h-14 rounded-full bg-electric-500/10 flex items-center justify-center text-electric-400/60 mb-3">
        {icon}
      </div>
      <p className="text-sm text-slate-500 max-w-xs">{message}</p>
    </div>
  )
}

export function Spinner() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="w-8 h-8 border-3 border-ink-600 border-t-electric-500 rounded-full animate-spin" />
    </div>
  )
}

export function Toast({ message, type, onClose }: { message: string; type: 'success' | 'error'; onClose: () => void }) {
  return (
    <div
      className={`fixed bottom-4 right-4 left-4 sm:left-auto sm:bottom-6 sm:right-6 z-50 px-5 py-3 rounded-xl shadow-lg animate-slide-up flex items-center gap-3 ${
        type === 'success'
          ? 'bg-electric-500/15 text-electric-200 border border-electric-500/30 backdrop-blur-md'
          : 'bg-red-500/15 text-red-300 border border-red-500/30 backdrop-blur-md'
      }`}
    >
      <span className="text-sm font-medium flex-1">{message}</span>
      <button onClick={onClose} className="text-current opacity-50 hover:opacity-100 transition-opacity shrink-0">
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Excluir',
  cancelLabel = 'Cancelar',
  onConfirm,
  onCancel,
}: {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void
  onCancel: () => void
}) {
  if (!open) return null
  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
      onClick={onCancel}
    >
      <div
        className="bg-ink-850 rounded-2xl shadow-xl shadow-black/50 w-full max-w-sm animate-scale-in border border-ink-700"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3 px-6 py-5">
          <div className="w-10 h-10 rounded-xl bg-red-500/15 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 text-red-400" />
          </div>
          <div className="flex-1">
            <h3 className="font-display text-base font-bold text-white">{title}</h3>
            <p className="text-sm text-slate-400 mt-1 leading-relaxed">{message}</p>
          </div>
        </div>
        <div className="flex gap-3 px-6 pb-5">
          <Button variant="secondary" onClick={onCancel} className="flex-1">
            {cancelLabel}
          </Button>
          <Button variant="danger" onClick={onConfirm} className="flex-1">
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}
