import { useEffect, useState, useCallback } from 'react'
import { Plus, Trash2, TrendingUp, TrendingDown, Wallet, X, ArrowUpRight, ArrowDownRight, Sparkles, AlertCircle } from 'lucide-react'
import { supabase, type Transaction } from '../lib/supabase'
import { formatCurrency, formatDate, todayISO, getMonthRange, monthLabel } from '../lib/format'
import { useToast } from '../lib/useToast'
import { Card, Button, Input, Select, EmptyState, Spinner, Toast, ConfirmDialog } from './ui'

type Filter = { startDate: string; endDate: string }

const MAX_AMOUNT = 9999999.99

export default function FinanceView() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Transaction | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [filter, setFilter] = useState<Filter>(() => {
    const range = getMonthRange(todayISO())
    return { startDate: range.start, endDate: range.end }
  })
  const { toast, showToast, closeToast } = useToast()

  const fetchTransactions = useCallback(async () => {
    setLoading(true)
    setLoadError(false)
    let query = supabase.from('transactions').select('*').order('transaction_date', { ascending: false }).order('created_at', { ascending: false })

    if (filter.startDate) {
      query = query.gte('transaction_date', filter.startDate)
    }
    if (filter.endDate) {
      query = query.lte('transaction_date', filter.endDate)
    }

    const { data, error } = await query
    if (error) {
      console.error('fetchTransactions error', error)
      setLoadError(true)
      showToast('Não foi possível carregar os lançamentos. Tente novamente.', 'error')
    } else {
      setTransactions(data || [])
    }
    setLoading(false)
  }, [filter, showToast])

  useEffect(() => {
    fetchTransactions()
  }, [fetchTransactions])

  const totalIncome = transactions.filter((t) => t.type === 'income').reduce((sum, t) => sum + Number(t.amount), 0)
  const totalExpense = transactions.filter((t) => t.type === 'expense').reduce((sum, t) => sum + Number(t.amount), 0)
  const balance = totalIncome - totalExpense

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)

    if (deleteTarget.source === 'service' && deleteTarget.service_id) {
      const { error: updErr } = await supabase
        .from('services')
        .update({ posted_to_finance: false, transaction_id: null })
        .eq('id', deleteTarget.service_id)
      if (updErr) {
        console.error('unlink service error', updErr)
      }
    }

    const { error } = await supabase.from('transactions').delete().eq('id', deleteTarget.id)
    if (error) {
      console.error('delete transaction error', error)
      showToast('Erro ao excluir lançamento. Tente novamente.', 'error')
    } else {
      showToast('Lançamento excluído')
      fetchTransactions()
    }
    setDeleting(false)
    setDeleteTarget(null)
  }

  const goToThisMonth = () => {
    const range = getMonthRange(todayISO())
    setFilter({ startDate: range.start, endDate: range.end })
  }
  const clearFilter = () => setFilter({ startDate: '', endDate: '' })

  return (
    <div className="space-y-6">
      {toast && <Toast message={toast.message} type={toast.type} onClose={closeToast} />}

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-5 bg-gradient-to-br from-emerald-500 to-emerald-700 border-transparent">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-emerald-50 text-sm font-medium">Receitas</p>
              <p className="text-white text-2xl font-bold font-display mt-1 truncate">{formatCurrency(totalIncome)}</p>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-white/15 flex items-center justify-center shrink-0">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
          </div>
        </Card>

        <Card className="p-5 bg-gradient-to-br from-red-500 to-red-700 border-transparent">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-red-50 text-sm font-medium">Despesas</p>
              <p className="text-white text-2xl font-bold font-display mt-1 truncate">{formatCurrency(totalExpense)}</p>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-white/15 flex items-center justify-center shrink-0">
              <TrendingDown className="w-5 h-5 text-white" />
            </div>
          </div>
        </Card>

        <Card className={`p-5 bg-gradient-to-br ${balance >= 0 ? 'from-electric-500 to-electric-700' : 'from-slate-600 to-slate-800'} border-transparent`}>
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-electric-50 text-sm font-medium">Saldo do período</p>
              <p className="text-white text-2xl font-bold font-display mt-1 truncate">{formatCurrency(balance)}</p>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-white/15 flex items-center justify-center shrink-0">
              <Wallet className="w-5 h-5 text-white" />
            </div>
          </div>
        </Card>
      </div>

      {/* Filter bar */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="flex flex-1 gap-2 items-center flex-wrap">
          <input
            type="date"
            value={filter.startDate}
            max={filter.endDate || undefined}
            onChange={(e) => setFilter((f) => ({ ...f, startDate: e.target.value }))}
            className="px-3 py-2.5 rounded-xl border border-ink-600 bg-ink-800 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-electric-500/50 focus:border-electric-500 transition-all"
          />
          <span className="text-slate-500 text-sm">até</span>
          <input
            type="date"
            value={filter.endDate}
            min={filter.startDate || undefined}
            onChange={(e) => setFilter((f) => ({ ...f, endDate: e.target.value }))}
            className="px-3 py-2.5 rounded-xl border border-ink-600 bg-ink-800 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-electric-500/50 focus:border-electric-500 transition-all"
          />
          <Button variant="ghost" size="sm" onClick={goToThisMonth} className="shrink-0">
            Este mês
          </Button>
          {(filter.startDate || filter.endDate) && (
            <Button variant="ghost" size="sm" onClick={clearFilter} className="shrink-0">
              <X className="w-4 h-4" /> Limpar
            </Button>
          )}
          {filter.startDate && filter.endDate && (
            <span className="text-xs text-slate-500 capitalize ml-1">
              {monthLabel(filter.startDate)}
            </span>
          )}
        </div>
        <Button onClick={() => setShowForm(true)} className="shrink-0">
          <Plus className="w-4 h-4" /> Novo Lançamento
        </Button>
      </div>

      {/* Transactions list */}
      <Card className="overflow-hidden">
        {loading ? (
          <Spinner />
        ) : loadError ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center text-red-400/60 mb-3">
              <AlertCircle className="w-7 h-7" />
            </div>
            <p className="text-sm text-slate-400 max-w-xs mb-4">Falha ao carregar os lançamentos.</p>
            <Button variant="secondary" size="sm" onClick={fetchTransactions}>Tentar novamente</Button>
          </div>
        ) : transactions.length === 0 ? (
          <EmptyState
            icon={<Wallet className="w-7 h-7" />}
            message={'Nenhum lançamento neste período. Clique em "Novo Lançamento" para adicionar.'}
          />
        ) : (
          <div className="divide-y divide-ink-700/60">
            {transactions.map((t) => (
              <TransactionRow key={t.id} transaction={t} onDelete={() => setDeleteTarget(t)} />
            ))}
          </div>
        )}
      </Card>

      {showForm && (
        <TransactionForm
          onClose={() => setShowForm(false)}
          onSaved={() => {
            setShowForm(false)
            fetchTransactions()
            showToast('Lançamento criado com sucesso!')
          }}
        />
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Excluir lançamento"
        message={
          deleteTarget?.source === 'service'
            ? 'Este lançamento veio de um serviço. Removê-lo do financeiro também desmarcará o serviço como lançado. Deseja continuar?'
            : 'Tem certeza que deseja excluir este lançamento? Esta ação não pode ser desfeita.'
        }
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}

function TransactionRow({ transaction, onDelete }: { transaction: Transaction; onDelete: () => void }) {
  const isIncome = transaction.type === 'income'
  const isFromService = transaction.source === 'service'

  return (
    <div className="flex items-center gap-3 sm:gap-4 px-4 sm:px-5 py-4 hover:bg-ink-800/50 transition-colors animate-fade-in group">
      <div
        className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${
          isIncome ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'
        }`}
      >
        {isIncome ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-medium text-slate-100 text-sm truncate">{transaction.description}</p>
          {isFromService && (
            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-electric-300 bg-electric-500/15 px-2 py-0.5 rounded-full shrink-0">
              <Sparkles className="w-3 h-3" /> serviço
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-slate-500">{formatDate(transaction.transaction_date)}</span>
          <span className="text-xs text-slate-600">·</span>
          <span className="text-xs text-slate-500 capitalize">{transaction.category}</span>
        </div>
      </div>

      <div className={`text-right shrink-0 font-semibold text-sm font-display ${isIncome ? 'text-emerald-400' : 'text-red-400'}`}>
        {isIncome ? '+' : '-'}{formatCurrency(Math.abs(Number(transaction.amount)))}
      </div>

      <button
        onClick={onDelete}
        className="shrink-0 p-2 text-slate-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all sm:opacity-0 sm:group-hover:opacity-100"
        title="Excluir"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  )
}

function TransactionForm({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [type, setType] = useState<'income' | 'expense'>('income')
  const [category, setCategory] = useState('geral')
  const [date, setDate] = useState(todayISO())
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<{ description?: string; amount?: string; date?: string }>({})
  const { showToast } = useToast()

  const categoryOptions = [
    { value: 'geral', label: 'Geral' },
    { value: 'serviço', label: 'Serviço' },
    { value: 'produto', label: 'Produto' },
    { value: 'aluguel', label: 'Aluguel' },
    { value: 'salário', label: 'Salário' },
    { value: 'equipamento', label: 'Equipamento' },
    { value: 'marketing', label: 'Marketing' },
    { value: 'outros', label: 'Outros' },
  ]

  const validate = () => {
    const errs: typeof errors = {}
    if (!description.trim()) {
      errs.description = 'Informe uma descrição.'
    } else if (description.trim().length < 3) {
      errs.description = 'A descrição deve ter ao menos 3 caracteres.'
    }

    const amountNum = parseFloat(amount)
    if (!amount || isNaN(amountNum)) {
      errs.amount = 'Informe um valor válido.'
    } else if (amountNum <= 0) {
      errs.amount = 'O valor deve ser maior que zero.'
    } else if (amountNum > MAX_AMOUNT) {
      errs.amount = 'O valor é muito alto.'
    }

    if (!date) {
      errs.date = 'Selecione uma data.'
    } else {
      const selected = new Date(date + 'T00:00:00')
      const now = new Date()
      const maxFuture = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate())
      if (selected > maxFuture) {
        errs.date = 'A data não pode ser muito no futuro.'
      }
    }

    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setSaving(true)
    const amountNum = parseFloat(amount)
    const signedAmount = type === 'income' ? amountNum : -amountNum

    const { error } = await supabase.from('transactions').insert({
      description: description.trim(),
      amount: signedAmount,
      type,
      category,
      transaction_date: date,
      source: 'manual',
    })

    if (error) {
      console.error('insert transaction error', error)
      showToast('Erro ao salvar lançamento. Tente novamente.', 'error')
      setSaving(false)
      return
    }

    setSaving(false)
    onSaved()
  }

  return (
    <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      <div
        className="bg-ink-850 rounded-2xl shadow-xl shadow-black/50 w-full max-w-md animate-scale-in max-h-[90vh] overflow-y-auto border border-ink-700"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-ink-700 sticky top-0 bg-ink-850 z-10">
          <h2 className="font-display text-lg font-bold text-white">Novo Lançamento</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {/* Type toggle */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setType('income')}
              className={`flex items-center justify-center gap-2 py-3 rounded-xl border-2 font-medium text-sm transition-all ${
                type === 'income'
                  ? 'border-emerald-500 bg-emerald-500/15 text-emerald-400'
                  : 'border-ink-600 bg-ink-800 text-slate-500 hover:border-ink-500'
              }`}
            >
              <TrendingUp className="w-4 h-4" /> Receita
            </button>
            <button
              type="button"
              onClick={() => setType('expense')}
              className={`flex items-center justify-center gap-2 py-3 rounded-xl border-2 font-medium text-sm transition-all ${
                type === 'expense'
                  ? 'border-red-500 bg-red-500/15 text-red-400'
                  : 'border-ink-600 bg-ink-800 text-slate-500 hover:border-ink-500'
              }`}
            >
              <TrendingDown className="w-4 h-4" /> Despesa
            </button>
          </div>

          <Input label="Descrição" value={description} onChange={setDescription} placeholder="Ex: Compra de produtos" required error={errors.description} />
          <Input label="Valor (R$)" type="number" step="0.01" min="0" max={String(MAX_AMOUNT)} value={amount} onChange={setAmount} placeholder="0,00" required error={errors.amount} />
          <div className="grid grid-cols-2 gap-3">
            <Select label="Categoria" value={category} onChange={setCategory} options={categoryOptions} />
            <Input label="Data" type="date" value={date} onChange={setDate} required error={errors.date} />
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="secondary" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" disabled={saving} className="flex-1">
              {saving ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
