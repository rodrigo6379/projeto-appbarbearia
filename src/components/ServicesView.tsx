import { useEffect, useState, useCallback } from 'react'
import { Plus, Search, Trash2, CheckCircle2, Circle, Calendar, X } from 'lucide-react'
import { supabase, type Service } from '../lib/supabase'
import { formatCurrency, formatDate, formatTime, todayISO, nowTime } from '../lib/format'
import { useToast } from '../lib/useToast'
import { Card, Button, Input, EmptyState, Spinner, Toast } from './ui'

type Filter = {
  clientName: string
  startDate: string
  endDate: string
}

export default function ServicesView() {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [filter, setFilter] = useState<Filter>({ clientName: '', startDate: '', endDate: '' })
  const { toast, showToast, closeToast } = useToast()

  const fetchServices = useCallback(async () => {
    setLoading(true)
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
      showToast('Erro ao carregar serviços', 'error')
    } else {
      setServices(data || [])
    }
    setLoading(false)
  }, [filter, showToast])

  useEffect(() => {
    fetchServices()
  }, [fetchServices])

  const totalRevenue = services.reduce((sum, s) => sum + Number(s.amount), 0)

  const handleDelete = async (id: string, posted: boolean, transactionId: string | null) => {
    if (!confirm('Excluir este serviço? Se ele já foi lançado no financeiro, o lançamento também será removido.')) return

    if (posted && transactionId) {
      await supabase.from('transactions').delete().eq('id', transactionId)
    }
    const { error } = await supabase.from('services').delete().eq('id', id)
    if (error) {
      showToast('Erro ao excluir serviço', 'error')
    } else {
      showToast('Serviço excluído')
      fetchServices()
    }
  }

  const togglePostToFinance = async (service: Service) => {
    if (service.posted_to_finance) {
      if (!confirm('Remover este serviço do controle financeiro? O lançamento será excluído.')) return
      if (service.transaction_id) {
        await supabase.from('transactions').delete().eq('id', service.transaction_id)
      }
      await supabase.from('services').update({ posted_to_finance: false, transaction_id: null }).eq('id', service.id)
      showToast('Removido do financeiro')
    } else {
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
        showToast('Erro ao lançar no financeiro', 'error')
        return
      }

      await supabase
        .from('services')
        .update({ posted_to_finance: true, transaction_id: txn.id })
        .eq('id', service.id)

      showToast('Lançado no financeiro')
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
            <div>
              <p className="text-electric-50 text-sm font-medium">Total faturado no período</p>
              <p className="text-white text-3xl font-bold font-display mt-1">{formatCurrency(totalRevenue)}</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center">
              <Calendar className="w-6 h-6 text-white" />
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm font-medium">Serviços no período</p>
              <p className="text-white text-3xl font-bold font-display mt-1">{services.length}</p>
              <p className="text-slate-500 text-xs mt-1">
                {services.filter((s) => s.posted_to_finance).length} lançados no financeiro
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-electric-500/10 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-electric-400" />
            </div>
          </div>
        </Card>
      </div>

      {/* Actions bar */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="flex flex-1 gap-2 flex-col sm:flex-row">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={filter.clientName}
              onChange={(e) => setFilter((f) => ({ ...f, clientName: e.target.value }))}
              placeholder="Buscar por cliente..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-ink-600 bg-ink-800 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-electric-500/50 focus:border-electric-500 transition-all placeholder:text-slate-600"
            />
          </div>
          <input
            type="date"
            value={filter.startDate}
            onChange={(e) => setFilter((f) => ({ ...f, startDate: e.target.value }))}
            className="px-3 py-2.5 rounded-xl border border-ink-600 bg-ink-800 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-electric-500/50 focus:border-electric-500 transition-all"
          />
          <span className="hidden sm:flex items-center text-slate-500 text-sm">até</span>
          <input
            type="date"
            value={filter.endDate}
            onChange={(e) => setFilter((f) => ({ ...f, endDate: e.target.value }))}
            className="px-3 py-2.5 rounded-xl border border-ink-600 bg-ink-800 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-electric-500/50 focus:border-electric-500 transition-all"
          />
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
                onDelete={() => handleDelete(service.id, service.posted_to_finance, service.transaction_id)}
                onToggleFinance={() => togglePostToFinance(service)}
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
        className="shrink-0 p-2 text-slate-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!clientName.trim() || !description.trim() || !amount || !date || !time) return

    setSaving(true)
    const amountNum = parseFloat(amount)
    if (isNaN(amountNum) || amountNum < 0) {
      setSaving(false)
      return
    }

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
        setSaving(false)
        alert('Erro ao criar lançamento financeiro')
        return
      }
      transactionId = txn.id
    }

    const { error } = await supabase.from('services').insert({
      client_name: clientName.trim(),
      description: description.trim(),
      amount: amountNum,
      service_date: date,
      service_time: time,
      posted_to_finance: postToFinance,
      transaction_id: transactionId,
    })

    if (error) {
      if (transactionId) {
        await supabase.from('transactions').delete().eq('id', transactionId)
      }
      setSaving(false)
      alert('Erro ao salvar serviço')
      return
    }

    // Link transaction back to service if both were created
    if (postToFinance && transactionId) {
      const { data: svc } = await supabase
        .from('services')
        .select('id')
        .eq('transaction_id', transactionId)
        .maybeSingle()
      if (svc) {
        await supabase.from('transactions').update({ service_id: svc.id }).eq('id', transactionId)
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
        <div className="flex items-center justify-between px-6 py-4 border-b border-ink-700">
          <h2 className="font-display text-lg font-bold text-white">Registrar Serviço</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <Input label="Nome do cliente" value={clientName} onChange={setClientName} placeholder="Ex: Maria Silva" required />
          <Input label="Serviço realizado" value={description} onChange={setDescription} placeholder="Ex: Corte + Escova" required />
          <Input label="Valor cobrado (R$)" type="number" step="0.01" min="0" value={amount} onChange={setAmount} placeholder="0,00" required />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Data" type="date" value={date} onChange={setDate} required />
            <Input label="Horário" type="time" value={time} onChange={setTime} required />
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
