import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'

vi.mock('../lib/supabase', () => {
  const mockQuery = {
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
    then: vi.fn((resolve: (v: unknown) => unknown) =>
      Promise.resolve({ data: [], error: null }).then(resolve),
    ),
    catch: vi.fn(),
  }
  return { supabase: { from: vi.fn(() => mockQuery) } }
})

import FinanceView from '../components/FinanceView'

describe('FinanceView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renderiza cartões de resumo (Receitas, Despesas, Saldo)', async () => {
    render(<FinanceView />)
    expect(screen.getByText('Receitas')).toBeInTheDocument()
    expect(screen.getByText('Despesas')).toBeInTheDocument()
    expect(screen.getByText('Saldo do período')).toBeInTheDocument()
  })

  it('renderiza botão "Novo Lançamento"', () => {
    render(<FinanceView />)
    expect(screen.getByText('Novo Lançamento')).toBeInTheDocument()
  })

  it('exibe estado de carregamento inicial', () => {
    render(<FinanceView />)
    expect(document.querySelector('.animate-spin')).toBeInTheDocument()
  })

  it('exibe estado vazio quando não há transações', async () => {
    render(<FinanceView />)
    await waitFor(() => {
      expect(screen.getByText(/Nenhum lançamento neste período/i)).toBeInTheDocument()
    })
  })

  it('abre formulário ao clicar em "Novo Lançamento"', async () => {
    render(<FinanceView />)
    fireEvent.click(screen.getByText('Novo Lançamento'))
    await waitFor(() => {
      expect(screen.getByText('Novo Lançamento', { selector: 'h2' })).toBeInTheDocument()
    })
  })

  it('renderiza campos do formulário (Descrição, Valor, Data, Categoria)', async () => {
    render(<FinanceView />)
    fireEvent.click(screen.getByText('Novo Lançamento'))
    await waitFor(() => {
      expect(screen.getByText('Descrição')).toBeInTheDocument()
      expect(screen.getByText('Valor (R$)')).toBeInTheDocument()
      expect(screen.getByText('Categoria')).toBeInTheDocument()
    })
  })

  it('exibe botões Receita e Despesa no formulário', async () => {
    render(<FinanceView />)
    fireEvent.click(screen.getByText('Novo Lançamento'))
    await waitFor(() => {
      expect(screen.getByText('Receita')).toBeInTheDocument()
      expect(screen.getByText('Despesa')).toBeInTheDocument()
    })
  })
})
