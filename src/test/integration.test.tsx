import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

const mockResult = { data: null, error: null }
const mockInsert = vi.fn(() => ({ ...mockQuery, select: vi.fn(() => ({ single: vi.fn(() => Promise.resolve(mockResult)) })) }))

let mockQuery: any

function setupMock(tables: Record<string, { data?: unknown[]; error?: unknown }>) {
  mockQuery = {
    select: vi.fn(() => mockQuery),
    insert: vi.fn(() => mockQuery),
    update: vi.fn(() => mockQuery),
    delete: vi.fn(() => mockQuery),
    eq: vi.fn(() => mockQuery),
    order: vi.fn(() => mockQuery),
    gte: vi.fn(() => mockQuery),
    lte: vi.fn(() => mockQuery),
    ilike: vi.fn(() => mockQuery),
    single: vi.fn(() => mockQuery),
    maybeSingle: vi.fn(() => mockQuery),
    then: vi.fn((resolve: (v: unknown) => unknown) => {
      const table = vi.mocked(supabase.from).mock.calls.at(-1)?.[0] ?? ''
      const entry = tables[table] ?? { data: [], error: null }
      return Promise.resolve(entry).then(resolve)
    }),
    catch: vi.fn(),
  }

  const supabase = { from: vi.fn(() => mockQuery) }
  return supabase
}

let supabase: ReturnType<typeof setupMock>

vi.mock('../lib/supabase', () => ({
  get supabase() { return supabase },
}))

import FinanceView from '../components/FinanceView'
import ServicesView from '../components/ServicesView'

describe('Integração: FinanceView com dados', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('exibe transações retornadas pelo banco na lista', async () => {
    supabase = setupMock({
      transactions: {
        data: [
          { id: '1', description: 'Venda de produto', amount: 150, type: 'income', category: 'produto', transaction_date: '2026-11-05', source: 'manual', service_id: null, created_at: '2026-11-05' },
          { id: '2', description: 'Aluguel', amount: -80, type: 'expense', category: 'aluguel', transaction_date: '2026-11-04', source: 'manual', service_id: null, created_at: '2026-11-04' },
        ],
        error: null,
      },
    })

    render(<FinanceView />)

    await waitFor(() => {
      expect(screen.getByText('Venda de produto')).toBeInTheDocument()
      expect(screen.getByText('Aluguel')).toBeInTheDocument()
    })
  })

  it('calcula totais de receitas e despesas corretamente', async () => {
    supabase = setupMock({
      transactions: {
        data: [
          { id: '1', description: 'Receita A', amount: 200, type: 'income', category: 'geral', transaction_date: '2026-11-05', source: 'manual', service_id: null, created_at: '' },
          { id: '2', description: 'Receita B', amount: 100, type: 'income', category: 'geral', transaction_date: '2026-11-05', source: 'manual', service_id: null, created_at: '' },
          { id: '3', description: 'Despesa A', amount: -50, type: 'expense', category: 'geral', transaction_date: '2026-11-05', source: 'manual', service_id: null, created_at: '' },
        ],
        error: null,
      },
    })

    render(<FinanceView />)

    await waitFor(() => {
      expect(screen.getByText('R$ 300,00')).toBeInTheDocument()
      expect(screen.getByText('R$ 50,00')).toBeInTheDocument()
    })
  })

  it('exibe estado de erro quando o banco retorna erro', async () => {
    supabase = setupMock({
      transactions: { data: null, error: { message: 'Database error', code: '42501' } },
    })

    render(<FinanceView />)

    await waitFor(() => {
      expect(screen.getByText('Falha ao carregar os lançamentos.')).toBeInTheDocument()
    })
    expect(screen.getByText('Tentar novamente')).toBeInTheDocument()
  })
})

describe('Integração: ServicesView com dados', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('exibe serviços retornados pelo banco na lista', async () => {
    supabase = setupMock({
      services: {
        data: [
          { id: '1', client_name: 'João Silva', description: 'Corte + Barba', amount: 60, service_date: '2026-11-05', service_time: '14:30', posted_to_finance: true, transaction_id: 't1', created_at: '' },
          { id: '2', client_name: 'Pedro Santos', description: 'Corte simples', amount: 35, service_date: '2026-11-04', service_time: '10:00', posted_to_finance: false, transaction_id: null, created_at: '' },
        ],
        error: null,
      },
    })

    render(<ServicesView />)

    await waitFor(() => {
      expect(screen.getByText('João Silva')).toBeInTheDocument()
      expect(screen.getByText('Pedro Santos')).toBeInTheDocument()
      expect(screen.getByText('Corte + Barba')).toBeInTheDocument()
      expect(screen.getByText('Corte simples')).toBeInTheDocument()
    })
  })

  it('calcula total faturado corretamente', async () => {
    supabase = setupMock({
      services: {
        data: [
          { id: '1', client_name: 'A', description: 'Serviço A', amount: 100, service_date: '2026-11-05', service_time: '10:00', posted_to_finance: false, transaction_id: null, created_at: '' },
          { id: '2', client_name: 'B', description: 'Serviço B', amount: 50, service_date: '2026-11-05', service_time: '11:00', posted_to_finance: false, transaction_id: null, created_at: '' },
        ],
        error: null,
      },
    })

    render(<ServicesView />)

    await waitFor(() => {
      expect(screen.getByText('R$ 150,00')).toBeInTheDocument()
    })
  })

  it('exibe estado de erro quando o banco retorna erro', async () => {
    supabase = setupMock({
      services: { data: null, error: { message: 'Database error', code: '42501' } },
    })

    render(<ServicesView />)

    await waitFor(() => {
      expect(screen.getByText('Falha ao carregar os serviços.')).toBeInTheDocument()
    })
  })
})

describe('Integração: Validação de formulário FinanceView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    supabase = setupMock({ transactions: { data: [], error: null } })
  })

  it('não envia formulário com campos vazios', async () => {
    const user = userEvent.setup()
    render(<FinanceView />)

    fireEvent.click(screen.getByText('Novo Lançamento'))

    await waitFor(() => {
      expect(screen.getByText('Salvar')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Salvar'))

    await waitFor(() => {
      expect(screen.getByText('Informe uma descrição.')).toBeInTheDocument()
      expect(screen.getByText('Informe um valor válido.')).toBeInTheDocument()
    })
  })
})
