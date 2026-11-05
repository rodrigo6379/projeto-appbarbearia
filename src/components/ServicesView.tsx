import { useEffect, useState, useCallback } from 'react'
import { Plus, Search, Trash2, CheckCircle2, Circle, Calendar, X, AlertCircle } from 'lucide-react'
import { supabase, type Service } from '../lib/supabase'
import { formatCurrency, formatDate, formatTime, todayISO, nowTime } from '../lib/format'
import { useToast } from '../lib/useToast'
import { Card, Button, Input, EmptyState, Spinner, Toast, ConfirmDialog } from './ui'

type Filter = {
  clientName: string
  startDate: string
  endDate: string
}

const MAX_AMOUNT = 9999999.99

export default function ServicesView() {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Service | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [toggleTarget, setToggleTarget] = useState<Service | null>(null)
  const [filter, setFilter] = useState<Filter>({ clientName: '', startDate: '', endDate: '' })
  const { toast, showToast, closeToast } = useToast()

  const fetchServices = useCallback(async () => {
    setLoading(true)
    setLoadError(false)
    let query = supabase.from('services').select('*').order('service_date', { ascending: false }).order('service_time', { ascending: false })

    if (filter.clientName.trim()) {
      query = query.ilike('client_name', `%${filter.clientName.trim()}%`)
    }
    if (filter.startDate) {
      query = query.gte('service_date', filter.startDate)
    }
    if (filter.endDate) {
      query = query.lte('service_date', filter.endDate)
    }

    const { data, error } = await query
    if (error) {
      console.error('fetchServices error', error)
      setLoadError(true)
      showToast('Não foi possível carregar os serviços. Tente novamente.', 'error')
    } else {
      setServices(data || [])
    }
    setLoading(false)
  }, [filter, showToast])

  useEffect(() => {
    fetchServices()
  }, [fetchServices])

  const totalRevenue = services.reduce((sum, s) => sum + Number(s.amount), 0)

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)

    if (deleteTarget.posted_to_finance && deleteTarget.transaction_id) {
      const { error: txnErr } = await supabase.from('transactions').delete().eq('id', deleteTarget.transaction_id)
      if (txnErr) {
        console.error('delete linked transaction error', txnErr)
      }
    }

    const { error } = await supabase.from('services').delete().eq('id', deleteTarget.id)
    if (error) {
      console.error('delete service error', error)
      showToast('Erro ao excluir serviço. Tente novamente.', 'error')
    } else {
      showToast('Serviço excluído')
      fetchServices()
    }
    setDeleting(false)
    setDeleteTarget(null)
  }

  const handleToggleFinance = async () => {
    if (!toggleTarget) return
    const service = toggleTarget
    setToggleTarget(null)

    if (service.posted_to_finance) {
      if (service.transaction_id) {
        const { error: txnErr } = await supabase.from('transactions').delete().eq('id', service.transaction_id)
        if (txnErr) {
          console.error('delete transaction on unpost error', txnErr)
          showToast('Erro ao remover do financeiro. Tente novamente.', 'error')
          return
        }
      }
      const { error: updErr } = await supabase
        .from('services')
        .update({ posted_to_finance: false, transaction_id: null })
        .eq('id', service.id)
      if (updErr) {
        console.error('unpost service error', updErr)
        showToast('Erro ao atualizar serviço. Tente novamente.', 'error')
      } else {
        showToast('Removido do financeiro')
      }
    } else {
      // Prevent duplicate: check if already posted
      if (service.transaction_id) {
        showToast('Este serviço já está lançado no financeiro.', 'error')
        fetchServices()
        return
      }

      const { data: txn, error: txnErr } = await supabase
        .from('transactions')
        .insert({
          description: `${service.description} — ${service.client_name}`,
          amount: Number(service.amount),
          type: 'income',
          category: 'serviço',
          transaction_date: service.service_date,
          source: 'service',
          service_id: service.id,
        })
        .select()
        .single()

      if (txnErr) {
        console.error('insert transaction on post error', txnErr)
        showToast('Erro ao lançar no financeiro. Tente novamente.', 'error')
        return
      }

      const { error: updErr } = await supabase
        .from('services')
        .update({ posted_to_finance: true, transaction_id: txn.id })
        .eq('id', service.id)

      if (updErr) {
        // Rollback the transaction
        await supabase.from('transactions').delete().eq('id', txn.id)
        console.error('update service on post error', updErr)
        showToast('Erro ao atualizar serviço. Tente novamente.', 'error')
      } else {
        showToast('Lançado no financeiro')
      }
    }
    fetchServices()
  }

  const hasActiveFilter = filter.clientName || filter.startDate || filter.endDate

  return (
    <div className="space-y-6">
      {toast && <Toast message={toast.message} type={toast.type} onClose={closeToast} />}

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="p-5 bg-gradient-to-br from-electric-500 to-electric-700 border-transparent">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-electric-50 text-sm font-medium">Total faturado no período</p>
              <p className="text-white text-2xl sm:text-3xl font-bold font-display mt-1 truncate">{formatCurrency(totalRevenue)}</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center shrink-0">
              <Calendar className="w-6 h-6 text-white" />
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-slate-400 text-sm font-medium">Serviços no período</p>
              <p className="text-white text-2xl sm:text-3xl font-bold font-display mt-1">{services.length}</p>
              <p className="text-slate-500 text-xs mt-1">
                {services.filter((s) => s.posted_to_finance).length} lançados no financeiro
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-electric-500/10 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-6 h-6 text-electric-400" />
            </div>
          </div>
        </Card>
      </div>

      {/* Actions bar */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="flex flex-1 gap-2 flex-col sm:flex-row">
          <div className="relative flex-1 max-w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={filter.clientName}
              onChange={(e) => setFilter((f) => ({ ...f, clientName: e.target.value }))}
              placeholder="Buscar por cliente..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-ink-600 bg-ink-800 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-electric-500/50 focus:border-electric-500 transition-all placeholder:text-slate-600"
            />
          </div>
          <div className="flex gap-2 items-center">
            <input
              type="date"
              value={filter.startDate}
              max={filter.endDate || undefined}
              onChange={(e) => setFilter((f) => ({ ...f, startDate: e.target.value }))}
              className="flex-1 px-3 py-2.5 rounded-xl border border-ink-600 bg-ink-800 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-electric-500/50 focus:border-electric-500 transition-all"
            />
            <span className="hidden sm:flex items-center text-slate-500 text-sm">até</span>
            <input
              type="date"
              value={filter.endDate}
              min={filter.startDate || undefined}
              onChange={(e) => setFilter((f) => ({ ...f, endDate: e.target.value }))}
              className="flex-1 px-3 py-2.5 rounded-xl border border-ink-600 bg-ink-800 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-electric-500/50 focus:border-electric-500 transition-all"
            />
          </div>
          {hasActiveFilter && (
            <Button variant="ghost" size="md" onClick={() => setFilter({ clientName: '', startDate: '', endDate: '' })} className="shrink-0">
              <X className="w-4 h-4" /> Limpar
            </Button>
          )}
        </div>
        <Button onClick={() => setShowForm(true)} className="shrink-0">
          <Plus className="w-4 h-4" /> Novo Serviço
        </Button>
      </div>

      {/* Services list */}
      <Card className="overflow-hidden">
        {loading ? (
          <Spinner />
        ) : loadError ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center text-red-400/60 mb-3">
              <AlertCircle className="w-7 h-7" />
            </div>
            <p className="text-sm text-slate-400 max-w-xs mb-4">Falha ao carregar os serviços.</p>
            <Button variant="secondary" size="sm" onClick={fetchServices}>Tentar novamente</Button>
          </div>
        ) : services.length === 0 ? (
          <EmptyState
            icon={<Calendar className="w-7 h-7" />}
            message={hasActiveFilter ? 'Nenhum serviço encontrado com esses filtros.' : 'Nenhum serviço registrado ainda. Clique em "Novo Serviço" para começar.'}
          />
        ) : (
          <div className="divide-y divide-ink-700/60">
            {services.map((service) => (
              <ServiceRow
                key={service.id}
                service={service}
                onDelete={() => setDeleteTarget(service)}
                onToggleFinance={() => {
                  if (service.posted_to_finance) {
                    setToggleTarget(service)
                  } else {
                    handleToggleFinance()
                    setToggleTarget(service)
                  }
                }}
              />
            ))}
          </div>
        )}
      </Card>

      {/* Form modal */}
      {showForm && (
        <ServiceForm
          onClose={() => setShowForm(false)}
          onSaved={() => {
            setShowForm(false)
            fetchServices()
            showToast('Serviço registrado com sucesso!')
          }}
        />
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Excluir serviço"
        message="Tem certeza que deseja excluir este serviço? Se ele já foi lançado no financeiro, o lançamento financeiro também será removido. Esta ação não pode ser desfeita."
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <ConfirmDialog
        open={!!toggleTarget && toggleTarget.posted_to_finance}
        title="Remover do financeiro"
        message="Remover este serviço do controle financeiro? O lançamento de receita será excluído."
        confirmLabel="Remover"
        onConfirm={handleToggleFinance}
        onCancel={() => setToggleTarget(null)}
      />
    </div>
  )
}

function ServiceRow({
  service,
  onDelete,
  onToggleFinance,
}: {
  service: Service
  onDelete: () => void
  onToggleFinance: () => void
}) {
  return (
    <div className="flex items-center gap-3 sm:gap-4 px-4 sm:px-5 py-4 hover:bg-ink-800/50 transition-colors animate-fade-in group">
      <button
        onClick={onToggleFinance}
        title={service.posted_to_finance ? 'Lançado no financeiro — clicar para remover' : 'Lançar no financeiro'}
        className="shrink-0 transition-transform hover:scale-110"
      >
        {service.posted_to_finance ? (
          <CheckCircle2 className="w-5 h-5 text-electric-400" />
        ) : (
          <Circle className="w-5 h-5 text-slate-600 hover:text-electric-400" />
        )}
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 flex-wrap">
          <p className="font-medium text-slate-100 text-sm truncate">{service.client_name}</p>
          <span className="text-xs text-slate-500">
            {formatDate(service.service_date)} às {formatTime(service.service_time)}
          </span>
        </div>
        <p className="text-sm text-slate-400 truncate mt-0.5">{service.description}</p>
        {service.posted_to_finance && (
          <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-medium text-electric-300 bg-electric-500/15 px-2 py-0.5 rounded-full">
            <CheckCircle2 className="w-3 h-3" /> no financeiro
          </span>
        )}
      </div>

      <div className="text-right shrink-0">
        <p className="font-semibold text-slate-100 text-sm font-display">{formatCurrency(Number(service.amount))}</p>
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

function ServiceForm({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [clientName, setClientName] = useState('')
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(todayISO())
  const [time, setTime] = useState(nowTime())
  const [postToFinance, setPostToFinance] = useState(true)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<{ clientName?: string; description?: string; amount?: string; date?: string; time?: string }>({})
  const { showToast } = useToast()

  const validate = () => {
    const errs: typeof errors = {}
    if (!clientName.trim()) {
      errs.clientName = 'Informe o nome do cliente.'
    } else if (clientName.trim().length < 2) {
      errs.clientName = 'O nome deve ter ao menos 2 caracteres.'
    }

    if (!description.trim()) {
      errs.description = 'Informe o serviço realizado.'
    } else if (description.trim().length < 2) {
      errs.description = 'A descrição deve ter ao menos 2 caracteres.'
    }

    const amountNum = parseFloat(amount)
    if (!amount || isNaN(amountNum)) {
      errs.amount = 'Informe um valor válido.'
    } else if (amountNum < 0) {
      errs.amount = 'O valor não pode ser negativo.'
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

    if (!time) {
      errs.time = 'Selecione um horário.'
    }

    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setSaving(true)
    const amountNum = parseFloat(amount)

    let transactionId: string | null = null

    if (postToFinance) {
      const { data: txn, error: txnErr } = await supabase
        .from('transactions')
        .insert({
          description: `${description.trim()} — ${clientName.trim()}`,
          amount: amountNum,
          type: 'income',
          category: 'serviço',
          transaction_date: date,
          source: 'service',
        })
        .select()
        .single()

      if (txnErr) {
        console.error('insert transaction for service error', txnErr)
        showToast('Erro ao criar lançamento financeiro. Tente novamente.', 'error')
        setSaving(false)
        return
      }
      transactionId = txn.id
    }

    const { data: svc, error } = await supabase.from('services').insert({
      client_name: clientName.trim(),
      description: description.trim(),
      amount: amountNum,
      service_date: date,
      service_time: time,
      posted_to_finance: postToFinance,
      transaction_id: transactionId,
    }).select().single()

    if (error) {
      // Rollback transaction if it was created
      if (transactionId) {
        await supabase.from('transactions').delete().eq('id', transactionId)
      }
      console.error('insert service error', error)
      showToast('Erro ao salvar serviço. Tente novamente.', 'error')
      setSaving(false)
      return
    }

    // Link transaction back to service if both were created
    if (postToFinance && transactionId && svc) {
      const { error: linkErr } = await supabase
        .from('transactions')
        .update({ service_id: svc.id })
        .eq('id', transactionId)
      if (linkErr) {
        console.error('link transaction to service error', linkErr)
      }
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
          <h2 className="font-display text-lg font-bold text-white">Registrar Serviço</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <Input label="Nome do cliente" value={clientName} onChange={setClientName} placeholder="Ex: Maria Silva" required error={errors.clientName} />
          <Input label="Serviço realizado" value={description} onChange={setDescription} placeholder="Ex: Corte + Escova" required error={errors.description} />
          <Input label="Valor cobrado (R$)" type="number" step="0.01" min="0" max={String(MAX_AMOUNT)} value={amount} onChange={setAmount} placeholder="0,00" required error={errors.amount} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Data" type="date" value={date} onChange={setDate} required error={errors.date} />
            <Input label="Horário" type="time" value={time} onChange={setTime} required error={errors.time} />
          </div>

          <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl bg-electric-500/5 hover:bg-electric-500/10 transition-colors border border-electric-500/15">
            <input
              type="checkbox"
              checked={postToFinance}
              onChange={(e) => setPostToFinance(e.target.checked)}
              className="w-5 h-5 rounded accent-electric-500"
            />
            <div>
              <p className="text-sm font-medium text-slate-200">Lançar no controle financeiro</p>
              <p className="text-xs text-slate-500">Cria automaticamente uma receita no financeiro</p>
            </div>
          </label>

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
