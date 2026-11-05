import { useEffect, useState, useCallback } from 'react'
import {
  CalendarClock,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Wallet,
  RefreshCw,
  AlertCircle,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { formatCurrency, formatDate, todayISO, getMonthRange, monthLabel } from '../lib/format'
import { Card, Button, Spinner } from './ui'

type DashboardData = {
  todayAppointments: number
  completedServices: number
  totalIncome: number
  totalExpense: number
  balance: number
}

type Period = { startDate: string; endDate: string; label: string }

const periodOptions: { value: 'today' | 'month' | 'all'; label: string }[] = [
  { value: 'today', label: 'Hoje' },
  { value: 'month', label: 'Este mês' },
  { value: 'all', label: 'Tudo' },
]

export default function DashboardView() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [periodKey, setPeriodKey] = useState<'today' | 'month' | 'all'>('month')

  const currentPeriod: Period = (() => {
    if (periodKey === 'today') {
      const t = todayISO()
      return { startDate: t, endDate: t, label: 'Hoje' }
    }
    if (periodKey === 'month') {
      const range = getMonthRange(todayISO())
      return { startDate: range.start, endDate: range.end, label: monthLabel(range.start) }
    }
    return { startDate: '', endDate: '', label: 'Todo o período' }
  })()

  const fetchDashboard = useCallback(async () => {
    setLoading(true)
    setLoadError(false)

    const today = todayISO()

    const [apptRes, svcRes, txnRes] = await Promise.all([
      supabase.from('barbershop_appointments').select('id, appointment_date, status').eq('appointment_date', today),
      supabase.from('services').select('id, service_date'),
      supabase.from('transactions').select('id, amount, type, transaction_date'),
    ])

    if (apptRes.error || svcRes.error || txnRes.error) {
      console.error('dashboard fetch error', apptRes.error, svcRes.error, txnRes.error)
      setLoadError(true)
      setLoading(false)
      return
    }

    const todayAppointments = (apptRes.data ?? []).filter((a) => a.status !== 'cancelled').length

    let completedServices = (svcRes.data ?? []).length
    if (periodKey !== 'all') {
      const { startDate, endDate } = currentPeriod
      completedServices = (svcRes.data ?? []).filter((s) => {
        const d = s.service_date
        if (startDate && d < startDate) return false
        if (endDate && d > endDate) return false
        return true
      }).length
    }

    const txns = txnRes.data ?? []
    const periodTxns = txns.filter((t) => {
      if (periodKey === 'all') return true
      const d = t.transaction_date
      if (currentPeriod.startDate && d < currentPeriod.startDate) return false
      if (currentPeriod.endDate && d > currentPeriod.endDate) return false
      return true
    })

    const totalIncome = periodTxns
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0)
    const totalExpense = periodTxns
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0)

    setData({
      todayAppointments,
      completedServices,
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense,
    })
    setLoading(false)
  }, [periodKey, currentPeriod.startDate, currentPeriod.endDate])

  useEffect(() => {
    fetchDashboard()
  }, [fetchDashboard])

  useEffect(() => {
    const refetch = () => fetchDashboard()
    window.addEventListener('focus', refetch)
    return () => window.removeEventListener('focus', refetch)
  }, [fetchDashboard])

  return (
    <div className="space-y-6">
      {/* Period selector */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="flex gap-2 flex-wrap items-center">
          {periodOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setPeriodKey(opt.value)}
              className={`px-4 py-2 text-sm font-medium rounded-xl border transition-all ${
                periodKey === opt.value
                  ? 'border-electric-500 bg-electric-500/15 text-electric-300'
                  : 'border-ink-600 bg-ink-800 text-slate-400 hover:border-electric-500/40 hover:text-electric-300'
              }`}
            >
              {opt.label}
            </button>
          ))}
          <span className="text-xs text-slate-500 capitalize ml-1 hidden sm:inline">
            {currentPeriod.label}
          </span>
        </div>
        <Button variant="ghost" size="sm" onClick={fetchDashboard} className="shrink-0 self-start sm:self-auto">
          <RefreshCw className="w-4 h-4" /> Atualizar
        </Button>
      </div>

      {loading ? (
        <Spinner />
      ) : loadError ? (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
          <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center text-red-400/60 mb-3">
            <AlertCircle className="w-7 h-7" />
          </div>
          <p className="text-sm text-slate-400 max-w-xs mb-4">Falha ao carregar os indicadores.</p>
          <Button variant="secondary" size="sm" onClick={fetchDashboard}>Tentar novamente</Button>
        </div>
      ) : (
        <>
          {/* Indicator cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <IndicatorCard
              label="Agendamentos de hoje"
              value={String(data?.todayAppointments ?? 0)}
              hint={formatDate(todayISO())}
              icon={<CalendarClock className="w-5 h-5 text-white" />}
              gradient="from-electric-500 to-electric-700"
              badgeColor="bg-white/15"
            />
            <IndicatorCard
              label="Serviços concluídos"
              value={String(data?.completedServices ?? 0)}
              hint={periodKey === 'all' ? 'total registrado' : currentPeriod.label}
              icon={<CheckCircle2 className="w-5 h-5 text-white" />}
              gradient="from-electric-600 to-electric-800"
              badgeColor="bg-white/15"
            />
            <IndicatorCard
              label="Receitas do período"
              value={formatCurrency(data?.totalIncome ?? 0)}
              icon={<TrendingUp className="w-5 h-5 text-white" />}
              gradient="from-emerald-500 to-emerald-700"
              badgeColor="bg-white/15"
            />
            <IndicatorCard
              label="Despesas do período"
              value={formatCurrency(data?.totalExpense ?? 0)}
              icon={<TrendingDown className="w-5 h-5 text-white" />}
              gradient="from-red-500 to-red-700"
              badgeColor="bg-white/15"
            />
            <IndicatorCard
              label="Saldo atual"
              value={formatCurrency(data?.balance ?? 0)}
              hint={data && data.balance >= 0 ? 'positivo' : 'negativo'}
              icon={<Wallet className="w-5 h-5 text-white" />}
              gradient={
                (data?.balance ?? 0) >= 0 ? 'from-electric-500 to-electric-700' : 'from-slate-600 to-slate-800'
              }
              badgeColor="bg-white/15"
            />
          </div>

          {/* Summary insight */}
          <Card className="p-5">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-electric-500/10 flex items-center justify-center shrink-0">
                <Wallet className="w-5 h-5 text-electric-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-display text-base font-bold text-white">Resumo financeiro</h3>
                <p className="text-sm text-slate-400 mt-1 leading-relaxed">
                  {periodKey === 'today' && 'Visão de hoje: '}
                  {periodKey === 'month' && `${currentPeriod.label}: `}
                  {periodKey === 'all' && 'Todo o histórico: '}
                  {(data?.completedServices ?? 0) === 0
                    ? 'Nenhum serviço registrado neste período. '
                    : `${data?.completedServices} serviço(s) concluído(s), `}
                  gerando {formatCurrency(data?.totalIncome ?? 0)} em receitas contra{' '}
                  {formatCurrency(data?.totalExpense ?? 0)} em despesas, resultando em saldo de{' '}
                  <span className={((data?.balance ?? 0) >= 0 ? 'text-emerald-400' : 'text-red-400') + ' font-semibold'}>
                    {formatCurrency(data?.balance ?? 0)}
                  </span>
                  .
                </p>
              </div>
            </div>
          </Card>
        </>
      )}
    </div>
  )
}

function IndicatorCard({
  label,
  value,
  hint,
  icon,
  gradient,
  badgeColor,
}: {
  label: string
  value: string
  hint?: string
  icon: React.ReactNode
  gradient: string
  badgeColor: string
}) {
  return (
    <Card className={`p-5 bg-gradient-to-br ${gradient} border-transparent`}>
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-white/80 text-sm font-medium">{label}</p>
          <p className="text-white text-xl sm:text-2xl font-bold font-display mt-1 truncate">{value}</p>
          {hint && <p className="text-white/60 text-xs mt-1 capitalize">{hint}</p>}
        </div>
        <div className={`w-11 h-11 rounded-2xl ${badgeColor} flex items-center justify-center shrink-0`}>
          {icon}
        </div>
      </div>
    </Card>
  )
}
