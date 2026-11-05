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

import ServicesView from '../components/ServicesView'

describe('ServicesView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renderiza cartão de total faturado', () => {
    render(<ServicesView />)
    expect(screen.getByText('Total faturado no período')).toBeInTheDocument()
  })

  it('renderiza cartão de serviços no período', () => {
    render(<ServicesView />)
    expect(screen.getByText('Serviços no período')).toBeInTheDocument()
  })

  it('renderiza botão "Novo Serviço"', () => {
    render(<ServicesView />)
    expect(screen.getByText('Novo Serviço')).toBeInTheDocument()
  })

  it('exibe estado de carregamento inicial', () => {
    render(<ServicesView />)
    expect(document.querySelector('.animate-spin')).toBeInTheDocument()
  })

  it('exibe estado vazio quando não há serviços', async () => {
    render(<ServicesView />)
    await waitFor(() => {
      expect(screen.getByText(/Nenhum serviço registrado ainda/i)).toBeInTheDocument()
    })
  })

  it('abre formulário ao clicar em "Novo Serviço"', async () => {
    render(<ServicesView />)
    fireEvent.click(screen.getByText('Novo Serviço'))
    await waitFor(() => {
      expect(screen.getByText('Registrar Serviço')).toBeInTheDocument()
    })
  })

  it('renderiza campos do formulário (Nome, Serviço, Valor, Data, Horário)', async () => {
    render(<ServicesView />)
    fireEvent.click(screen.getByText('Novo Serviço'))
    await waitFor(() => {
      expect(screen.getByText('Nome do cliente')).toBeInTheDocument()
      expect(screen.getByText('Serviço realizado')).toBeInTheDocument()
      expect(screen.getByText('Valor cobrado (R$)')).toBeInTheDocument()
      expect(screen.getByText('Data')).toBeInTheDocument()
      expect(screen.getByText('Horário')).toBeInTheDocument()
    })
  })

  it('exibe checkbox para lançar no financeiro', async () => {
    render(<ServicesView />)
    fireEvent.click(screen.getByText('Novo Serviço'))
    await waitFor(() => {
      expect(screen.getByText('Lançar no controle financeiro')).toBeInTheDocument()
    })
  })
})
