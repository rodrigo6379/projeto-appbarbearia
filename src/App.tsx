import { FormEvent, useEffect, useState } from 'react';
import {
  ArrowDownRight,
  ArrowUpRight,
  CalendarDays,
  Check,
  ChevronRight,
  CircleDollarSign,
  CreditCard,
  LayoutDashboard,
  LogOut,
  Menu,
  MoreHorizontal,
  Pencil,
  Phone,
  Plus,
  Scissors,
  Search,
  Settings,
  Trash2,
  UsersRound,
  WalletCards,
  X,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

type Tab = 'home' | 'agenda' | 'clients' | 'cash' | 'settings';
type Modal = 'appointment' | 'client' | 'transaction' | 'service' | null;
type Appointment = { id: string; client_id: string | null; service_id: string | null; client_name: string; service_name: string; appointment_date: string; appointment_time: string; status: string; notes: string };
type AgendaFilter = 'today' | 'week' | 'month';
type Client = { id: string; name: string; phone: string; notes: string; visits: number };
type Service = { id: string; name: string; price: number; duration: number };
type Transaction = { id: string; type: 'income' | 'expense'; description: string; amount: number; transaction_date: string; category: string; payment_method: string };

const logo = '/assets/images/IMG_2627.png';
const toDateKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
const today = toDateKey(new Date());
const statusLabels: Record<string, string> = { scheduled: 'Agendado', confirmed: 'Confirmado', completed: 'Concluído', cancelled: 'Cancelado' };
const agendaFilters: [AgendaFilter, string][] = [['today', 'Hoje'], ['week', 'Semana'], ['month', 'Mês']];
function weekRange() { const start = new Date(); start.setDate(start.getDate() - ((start.getDay() + 6) % 7)); const end = new Date(start); end.setDate(start.getDate() + 6); return [toDateKey(start), toDateKey(end)] as const; }
const money = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const dateLabel = (value: string) => new Date(`${value}T12:00:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });

function App() {
  const [session, setSession] = useState<Awaited<ReturnType<typeof supabase.auth.getSession>>['data']['session']>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [authError, setAuthError] = useState('');
  const [tab, setTab] = useState<Tab>('home');
  const [modal, setModal] = useState<Modal>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [search, setSearch] = useState('');
  const [notice, setNotice] = useState('');
  const [agendaFilter, setAgendaFilter] = useState<AgendaFilter>('today');
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setAuthLoading(false); });
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => setSession(nextSession));
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => { if (session) loadData(); }, [session]);

  async function loadData() {
    const [a, c, s, t] = await Promise.all([
      supabase.from('barbershop_appointments').select('id, client_id, service_id, client_name, service_name, appointment_date, appointment_time, status, notes').order('appointment_date').order('appointment_time'),
      supabase.from('barbershop_clients').select('id, name, phone, notes, visits').order('name'),
      supabase.from('barbershop_services').select('id, name, price, duration').order('name'),
      supabase.from('barbershop_transactions').select('id, type, description, amount, transaction_date, category, payment_method').order('transaction_date', { ascending: false }),
    ]);
    if (a.data) setAppointments(a.data as Appointment[]);
    if (c.data) setClients(c.data as Client[]);
    if (s.data) setServices(s.data as Service[]);
    if (t.data) setTransactions(t.data as Transaction[]);
    if (s.data?.length === 0) {
      const defaults = [{ name: 'Corte masculino', price: 35, duration: 45 }, { name: 'Barba', price: 25, duration: 30 }, { name: 'Corte + barba', price: 55, duration: 60 }];
      const seeded = await supabase.from('barbershop_services').insert(defaults).select('id, name, price, duration');
      if (seeded.data) setServices(seeded.data as Service[]);
    }
  }

  const todayAppointments = appointments.filter((item) => item.appointment_date === today && item.status !== 'cancelled');
  const todayTransactions = transactions.filter((item) => item.transaction_date === today);
  const income = todayTransactions.filter((item) => item.type === 'income').reduce((sum, item) => sum + Number(item.amount), 0);
  const expenses = todayTransactions.filter((item) => item.type === 'expense').reduce((sum, item) => sum + Number(item.amount), 0);
  const balance = income - expenses;
  const [weekStart, weekEnd] = weekRange();
  const agendaAppointments = appointments.filter((item) => {
    if (agendaFilter === 'today') return item.appointment_date === today;
    if (agendaFilter === 'week') return item.appointment_date >= weekStart && item.appointment_date <= weekEnd;
    return item.appointment_date.startsWith(today.slice(0, 7));
  });

  async function authSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setAuthError('');
    const form = new FormData(event.currentTarget); const email = String(form.get('email')); const password = String(form.get('password'));
    const result = authMode === 'login' ? await supabase.auth.signInWithPassword({ email, password }) : await supabase.auth.signUp({ email, password });
    if (result.error) setAuthError(result.error.message.includes('Invalid') ? 'E-mail ou senha inválidos.' : result.error.message);
    else if (authMode === 'signup') setAuthError('Conta criada. Você já pode acessar o painel.');
  }

  async function signOut() { await supabase.auth.signOut(); setMenuOpen(false); }
  async function remove(table: string, id: string) { const { error } = await supabase.from(table).delete().eq('id', id); if (error) { setNotice('Não foi possível excluir. Tente novamente.'); return; } await loadData(); setNotice('Item removido'); }
  function openNewAppointment() { setEditingAppointment(null); setModal('appointment'); }
  async function updateAppointment(id: string, status: string) { const { error } = await supabase.from('barbershop_appointments').update({ status }).eq('id', id); if (error) { setNotice('Não foi possível atualizar o status.'); return; } await loadData(); }
  const filteredClients = clients.filter((item) => item.name.toLowerCase().includes(search.toLowerCase()) || item.phone.includes(search));

  if (authLoading) return <div className="splash"><img src={logo} alt="Barb Shop" /><div className="loader" /></div>;
  if (!session) return <Auth mode={authMode} setMode={setAuthMode} onSubmit={authSubmit} error={authError} />;

  return <div className="app-shell">
    <header className="topbar"><div className="brand"><img src={logo} alt="Barb Shop" /><div><strong>BARB<span>SHOP</span></strong><small>gestão inteligente</small></div></div><button className="icon-button" onClick={() => setMenuOpen(!menuOpen)}><Menu size={21} /></button>{menuOpen && <div className="profile-menu"><span>{session.user.email}</span><button onClick={signOut}><LogOut size={16} /> Sair</button></div>}</header>
    <main className="content">
      {notice && <div className="notice"><Check size={16} /> {notice}<button onClick={() => setNotice('')}><X size={15} /></button></div>}
      {tab === 'home' && <Home appointments={todayAppointments} income={income} expenses={expenses} balance={balance} onTab={setTab} onConfirm={updateAppointment} />}
      {tab === 'agenda' && <Agenda appointments={agendaAppointments} filter={agendaFilter} onFilter={setAgendaFilter} onAdd={openNewAppointment} onEdit={(item) => { setEditingAppointment(item); setModal('appointment'); }} onConfirm={updateAppointment} onDelete={(id) => { if (window.confirm('Excluir este horário?')) remove('barbershop_appointments', id); }} />}
      {tab === 'clients' && <Clients clients={filteredClients} search={search} setSearch={setSearch} onAdd={() => setModal('client')} onDelete={(id) => remove('barbershop_clients', id)} />}
      {tab === 'cash' && <Cash transactions={transactions} income={income} expenses={expenses} balance={balance} onAdd={() => setModal('transaction')} onDelete={(id) => remove('barbershop_transactions', id)} />}
      {tab === 'settings' && <SettingsView services={services} onAdd={() => setModal('service')} onDelete={(id) => remove('barbershop_services', id)} signOut={signOut} />}
    </main>
    <nav className="bottom-nav">{([['home', LayoutDashboard, 'Início'], ['agenda', CalendarDays, 'Agenda'], ['clients', UsersRound, 'Clientes'], ['cash', WalletCards, 'Caixa'], ['settings', Settings, 'Ajustes']] as const).map(([key, Icon, label]) => <button className={tab === key ? 'active' : ''} onClick={() => setTab(key)} key={key}><Icon size={20} /><span>{label}</span></button>)}</nav>
    {modal && <ModalWindow modal={modal} editing={editingAppointment} close={() => setModal(null)} clients={clients} services={services} onSaved={async () => { setModal(null); await loadData(); setNotice('Salvo com sucesso'); }} />}
  </div>;
}

function Auth({ mode, setMode, onSubmit, error }: { mode: 'login' | 'signup'; setMode: (mode: 'login' | 'signup') => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void; error: string }) {
  return <div className="auth-page"><div className="auth-card"><img src={logo} alt="Dom Men Barber Shop" /><div className="eyebrow">PAINEL DO BARBEIRO</div><h1>{mode === 'login' ? 'Bem-vindo de volta' : 'Crie seu acesso'}</h1><p>Organize sua barbearia de um jeito simples, bonito e profissional.</p><form onSubmit={onSubmit}><label>E-mail<input name="email" type="email" placeholder="seu@email.com" required /></label><label>Senha<input name="password" type="password" placeholder="••••••••" minLength={6} required /></label>{error && <div className="form-error">{error}</div>}<button className="primary-button" type="submit">{mode === 'login' ? 'Entrar no painel' : 'Criar minha conta'}<ChevronRight size={18} /></button></form><button className="switch-auth" onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}>{mode === 'login' ? 'Ainda não tenho uma conta' : 'Já tenho uma conta'}</button></div></div>;
}

function Home({ appointments, income, expenses, balance, onTab, onConfirm }: { appointments: Appointment[]; income: number; expenses: number; balance: number; onTab: (tab: Tab) => void; onConfirm: (id: string, status: string) => void }) {
  return <><section className="hero"><div><span className="eyebrow">VISÃO DE HOJE</span><h1>Bom dia, barbeiro.</h1><p>Seu dia começa com foco no que importa.</p></div><div className="hero-mark"><Scissors size={24} /></div></section><section className="metric-grid"><Metric label="Recebido hoje" value={money(income)} icon={ArrowUpRight} tone="blue" /><Metric label="Despesas" value={money(expenses)} icon={ArrowDownRight} tone="red" /><Metric label="Saldo do dia" value={money(balance)} icon={CircleDollarSign} tone="green" /></section><section className="section-heading"><div><span className="eyebrow">AGENDA DE HOJE</span><h2>Próximos clientes</h2></div><button className="text-button" onClick={() => onTab('agenda')}>Ver agenda <ChevronRight size={15} /></button></section><div className="appointment-list">{appointments.length === 0 ? <Empty icon={CalendarDays} text="Nenhum atendimento marcado para hoje." /> : appointments.slice(0, 4).map((item) => <AppointmentRow item={item} key={item.id} onConfirm={onConfirm} />)}</div><section className="quick-actions"><button onClick={() => onTab('agenda')}><CalendarDays size={20} /><span>Novo horário</span><Plus size={16} /></button><button onClick={() => onTab('cash')}><WalletCards size={20} /><span>Lançar no caixa</span><Plus size={16} /></button></section></>;
}

function Metric({ label, value, icon: Icon, tone }: { label: string; value: string; icon: typeof ArrowUpRight; tone: string }) { return <div className={`metric-card ${tone}`}><div className="metric-icon"><Icon size={17} /></div><span>{label}</span><strong>{value}</strong></div>; }
function AppointmentRow({ item, onConfirm }: { item: Appointment; onConfirm: (id: string, status: string) => void }) { return <div className="appointment-row"><div className="time-pill"><strong>{item.appointment_time.slice(0, 5)}</strong><span>{item.status === 'confirmed' ? 'Confirmado' : 'Aguardando'}</span></div><div className="avatar">{item.client_name.charAt(0)}</div><div className="row-copy"><strong>{item.client_name}</strong><span>{item.service_name}</span></div>{item.status !== 'confirmed' && item.status !== 'completed' && <button className="round-action" onClick={() => onConfirm(item.id, 'confirmed')}><Check size={16} /></button>}<MoreHorizontal size={19} className="muted-icon" /></div>; }
function Empty({ icon: Icon, text }: { icon: typeof CalendarDays; text: string }) { return <div className="empty"><Icon size={25} /><span>{text}</span></div>; }

function Agenda({ appointments, filter, onFilter, onAdd, onEdit, onConfirm, onDelete }: { appointments: Appointment[]; filter: AgendaFilter; onFilter: (filter: AgendaFilter) => void; onAdd: () => void; onEdit: (item: Appointment) => void; onConfirm: (id: string, status: string) => void; onDelete: (id: string) => void }) {
  const periodLabel = filter === 'today' ? 'hoje' : filter === 'week' ? 'nesta semana' : 'neste mês';
  return <><PageHeader eyebrow="ROTINA" title="Agenda" action="Novo horário" onAction={onAdd} /><div className="filter-tabs">{agendaFilters.map(([key, label]) => <button className={filter === key ? 'selected' : ''} onClick={() => onFilter(key)} key={key}>{label}</button>)}</div><div className="date-banner"><CalendarDays size={18} /><div><strong>{new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</strong><span>{appointments.length} atendimentos {periodLabel}</span></div></div><div className="appointment-list large-list">{appointments.length === 0 ? <Empty icon={CalendarDays} text="Sua agenda está livre para este período." /> : appointments.map((item) => <div className="appointment-row detailed" key={item.id}><div className="time-pill"><strong>{item.appointment_time.slice(0, 5)}</strong><span>{dateLabel(item.appointment_date)}</span></div><div className="avatar">{item.client_name.charAt(0)}</div><div className="row-copy"><strong>{item.client_name}</strong><span>{item.service_name} · {statusLabels[item.status] ?? item.status}</span>{item.notes && <small>{item.notes}</small>}</div><div className="row-actions">{item.status !== 'confirmed' && item.status !== 'completed' && item.status !== 'cancelled' && <button className="mini-confirm" onClick={() => onConfirm(item.id, 'confirmed')}><Check size={14} /> Confirmar</button>}<button className="mini-confirm" onClick={() => onEdit(item)}><Pencil size={14} /> Editar</button><button className="icon-danger" onClick={() => onDelete(item.id)}><Trash2 size={16} /></button></div></div>)}</div></>;
}

function Clients({ clients, search, setSearch, onAdd, onDelete }: { clients: Client[]; search: string; setSearch: (value: string) => void; onAdd: () => void; onDelete: (id: string) => void }) { return <><PageHeader eyebrow="RELACIONAMENTO" title="Clientes" action="Novo cliente" onAction={onAdd} /><div className="search-box"><Search size={18} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por nome ou telefone" /></div><div className="client-summary"><strong>{clients.length}</strong><span>clientes cadastrados</span></div><div className="client-list">{clients.length === 0 ? <Empty icon={UsersRound} text="Cadastre seu primeiro cliente." /> : clients.map((client) => <div className="client-card" key={client.id}><div className="avatar large">{client.name.charAt(0)}</div><div className="row-copy"><strong>{client.name}</strong><span><Phone size={13} /> {client.phone}</span><small>{client.visits} atendimentos</small></div><button className="icon-danger" onClick={() => onDelete(client.id)}><Trash2 size={16} /></button></div>)}</div></>; }

function Cash({ transactions, income, expenses, balance, onAdd, onDelete }: { transactions: Transaction[]; income: number; expenses: number; balance: number; onAdd: () => void; onDelete: (id: string) => void }) { return <><PageHeader eyebrow="MOVIMENTAÇÕES" title="Caixa" action="Lançar" onAction={onAdd} /><div className="cash-total"><span>Saldo de hoje</span><strong>{money(balance)}</strong><div><span className="positive">Entradas {money(income)}</span><span className="negative">Saídas {money(expenses)}</span></div></div><div className="payment-chips"><span><CircleDollarSign size={15} /> Dinheiro</span><span><CreditCard size={15} /> Cartões</span><span><ArrowUpRight size={15} /> Pix</span></div><div className="section-heading compact"><h2>Histórico recente</h2><button className="text-button">Ver relatório</button></div><div className="transaction-list">{transactions.length === 0 ? <Empty icon={WalletCards} text="Nenhuma movimentação registrada." /> : transactions.slice(0, 8).map((item) => <div className="transaction-row" key={item.id}><div className={`transaction-icon ${item.type}`} >{item.type === 'income' ? <ArrowUpRight size={17} /> : <ArrowDownRight size={17} />}</div><div className="row-copy"><strong>{item.description}</strong><span>{item.category} · {item.payment_method} · {dateLabel(item.transaction_date)}</span></div><strong className={item.type === 'income' ? 'positive' : 'negative'}>{item.type === 'income' ? '+' : '-'}{money(Number(item.amount))}</strong><button className="icon-danger" onClick={() => onDelete(item.id)}><Trash2 size={15} /></button></div>)}</div></>; }

function SettingsView({ services, onAdd, onDelete, signOut }: { services: Service[]; onAdd: () => void; onDelete: (id: string) => void; signOut: () => void }) { return <><PageHeader eyebrow="PERSONALIZE SEU ESPAÇO" title="Ajustes" /><div className="settings-card"><div className="settings-icon"><Settings size={21} /></div><div><strong>Dom Men Barber Shop</strong><span>Seu espaço está pronto para crescer</span></div><ChevronRight size={17} className="muted-icon" /></div><div className="section-heading compact"><div><span className="eyebrow">CATÁLOGO</span><h2>Serviços e preços</h2></div><button className="add-small" onClick={onAdd}><Plus size={16} /> Adicionar</button></div><div className="service-list">{services.map((service) => <div className="service-row" key={service.id}><div className="service-icon"><Scissors size={17} /></div><div className="row-copy"><strong>{service.name}</strong><span>{service.duration} minutos</span></div><strong>{money(Number(service.price))}</strong><button className="icon-danger" onClick={() => onDelete(service.id)}><Trash2 size={15} /></button></div>)}</div><button className="logout-button" onClick={signOut}><LogOut size={17} /> Sair da conta</button></>; }
function PageHeader({ eyebrow, title, action, onAction }: { eyebrow: string; title: string; action?: string; onAction?: () => void }) { return <div className="page-header"><div><span className="eyebrow">{eyebrow}</span><h1>{title}</h1></div>{action && <button className="primary-button small" onClick={onAction}><Plus size={16} /> {action}</button>}</div>; }

function ModalWindow({ modal, editing, close, clients, services, onSaved }: { modal: Exclude<Modal, null>; editing: Appointment | null; close: () => void; clients: Client[]; services: Service[]; onSaved: () => Promise<void> }) {
  const [error, setError] = useState('');
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setError(''); const form = new FormData(event.currentTarget); let table = ''; let payload: Record<string, string | number> = {};
    if (modal === 'client') { table = 'barbershop_clients'; payload = { name: String(form.get('name')), phone: String(form.get('phone')), notes: String(form.get('notes') || '') }; }
    if (modal === 'service') { table = 'barbershop_services'; payload = { name: String(form.get('name')), price: Number(form.get('price')), duration: Number(form.get('duration')) }; }
    if (modal === 'appointment') { table = 'barbershop_appointments'; const client = clients.find((item) => item.id === form.get('client_id')); const service = services.find((item) => item.id === form.get('service_id')); payload = { client_id: String(form.get('client_id')), service_id: String(form.get('service_id')), client_name: client?.name || 'Cliente', service_name: service?.name || 'Serviço', appointment_date: String(form.get('appointment_date')), appointment_time: String(form.get('appointment_time')), status: editing ? String(form.get('status')) : 'scheduled', notes: String(form.get('notes') || '') }; }
    if (modal === 'transaction') { table = 'barbershop_transactions'; payload = { type: String(form.get('type')), description: String(form.get('description')), amount: Number(form.get('amount')), transaction_date: String(form.get('transaction_date')), category: String(form.get('category')), payment_method: String(form.get('payment_method')) }; }
    const { error: saveError } = editing ? await supabase.from(table).update(payload).eq('id', editing.id) : await supabase.from(table).insert(payload); if (saveError) setError('Não foi possível salvar. Confira os dados e tente novamente.'); else await onSaved();
  }
  const titles = { appointment: 'Novo horário', client: 'Novo cliente', transaction: 'Lançar no caixa', service: 'Novo serviço' };
  return <div className="modal-backdrop" onMouseDown={close}><div className="modal-card" onMouseDown={(event) => event.stopPropagation()}><div className="modal-header"><div><span className="eyebrow">BARB SHOP</span><h2>{modal === 'appointment' && editing ? 'Editar horário' : titles[modal]}</h2></div><button className="icon-button" onClick={close}><X size={19} /></button></div><form onSubmit={submit}>{modal === 'client' && <><label>Nome completo<input name="name" placeholder="Ex: João da Silva" required /></label><label>Telefone<input name="phone" placeholder="(00) 00000-0000" required /></label><label>Observações<textarea name="notes" placeholder="Preferências, detalhes..." /></label></>}{modal === 'service' && <><label>Nome do serviço<input name="name" placeholder="Ex: Corte degradê" required /></label><div className="form-grid"><label>Preço<input name="price" type="number" step="0.01" min="0" placeholder="35,00" required /></label><label>Duração<input name="duration" type="number" min="5" step="5" placeholder="45" required /></label></div></>}{modal === 'appointment' && <><label>Cliente<select name="client_id" required defaultValue={editing?.client_id ?? ''}><option value="">Selecione um cliente</option>{clients.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select></label><label>Serviço<select name="service_id" required defaultValue={editing?.service_id ?? ''}><option value="">Selecione um serviço</option>{services.map((item) => <option value={item.id} key={item.id}>{item.name} · {money(Number(item.price))}</option>)}</select></label><div className="form-grid"><label>Data<input name="appointment_date" type="date" defaultValue={editing?.appointment_date ?? today} required /></label><label>Horário<input name="appointment_time" type="time" defaultValue={editing ? editing.appointment_time.slice(0, 5) : '09:00'} required /></label></div>{editing && <label>Situação<select name="status" defaultValue={editing.status}><option value="scheduled">Agendado</option><option value="confirmed">Confirmado</option><option value="completed">Concluído</option><option value="cancelled">Cancelado</option></select></label>}<label>Observações<textarea name="notes" defaultValue={editing?.notes ?? ''} placeholder="Ex: Quer degradê baixo" /></label></>}{modal === 'transaction' && <><div className="type-switch"><label><input type="radio" name="type" value="income" defaultChecked /> Entrada</label><label><input type="radio" name="type" value="expense" /> Saída</label></div><label>Descrição<input name="description" placeholder="Ex: Corte + barba" required /></label><div className="form-grid"><label>Valor<input name="amount" type="number" step="0.01" min="0" placeholder="0,00" required /></label><label>Data<input name="transaction_date" type="date" defaultValue={today} required /></label></div><div className="form-grid"><label>Categoria<select name="category"><option>Serviços</option><option>Aluguel</option><option>Produtos</option><option>Energia</option><option>Manutenção</option><option>Geral</option></select></label><label>Pagamento<select name="payment_method"><option>Pix</option><option>Dinheiro</option><option>Débito</option><option>Crédito</option><option>Outro</option></select></label></div></>}{error && <div className="form-error">{error}</div>}<button className="primary-button submit-button" type="submit">Salvar registro <Check size={17} /></button></form></div></div>;
}

export default App;
