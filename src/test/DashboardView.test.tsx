import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'

vi.mock('../lib/supabase', () => {
  const mockQuery = {
    select: vi.fn(() => mockQuery),
    eq: vi.fn(() => mockQuery),
    order: vi.fn(() => mockQuery),
    then: vi.fn((resolve: (v: unknown) => unknown) =>
      Promise.resolve({ data: [], error: null }).then(resolve),
    ),
    catch: vi.fn(),
  }
  return { supabase: { from: vi.fn(() => mockQuery) } }
})

import DashboardView from '../components/DashboardView'

describe('DashboardView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renderiza seletor de período com opções Hoje, Este mês, Tudo', () => {
    render(<DashboardView />)
    expect(screen.getByText('Hoje')).toBeInTheDocument()
    expect(screen.getByText('Este mês')).toBeInTheDocument()
    expect(screen.getByText('Tudo')).toBeInTheDocument()
  })

  it('renderiza botão Atualizar', () => {
    render(<DashboardView />)
    expect(screen.getByText('Atualizar')).toBeInTheDocument()
  })

  it('exibe estado de carregamento inicial', () => {
    render(<DashboardView />)
    expect(document.querySelector('.animate-spin')).toBeInTheDocument()
  })

  it('renderiza cartões de indicadores após carregar', async () => {
    render(<DashboardView />)
    await waitFor(() => {
      expect(screen.getByText('Agendamentos de hoje')).toBeInTheDocument()
      expect(screen.getByText('Serviços concluídos')).toBeInTheDocument()
      expect(screen.getByText('Receitas do período')).toBeInTheDocument()
      expect(screen.getByText('Despesas do período')).toBeInTheDocument()
      expect(screen.getByText('Saldo atual')).toBeInTheDocument()
    })
  })

  it('renderiza card de resumo financeiro', async () => {
    render(<DashboardView />)
    await waitFor(() => {
      expect(screen.getByText('Resumo financeiro')).toBeInTheDocument()
    })
  })
})
