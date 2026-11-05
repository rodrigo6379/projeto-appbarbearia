import { describe, it, expect } from 'vitest'
import {
  formatCurrency,
  formatDate,
  formatTime,
  todayISO,
  nowTime,
  getMonthRange,
  monthLabel,
} from '../lib/format'

describe('formatCurrency', () => {
  it('formata zero como moeda brasileira', () => {
    expect(formatCurrency(0)).toBe('R$\u00a00,00')
  })

  it('formata valor positivo', () => {
    expect(formatCurrency(1500.5)).toBe('R$\u00a01.500,50')
  })

  it('formata valor negativo', () => {
    expect(formatCurrency(-200)).toBe('-R$\u00a0200,00')
  })

  it('formata números grandes com separador de milhar', () => {
    expect(formatCurrency(1234567.89)).toBe('R$\u00a01.234.567,89')
  })
})

describe('formatDate', () => {
  it('formata data ISO para DD/MM/AAAA', () => {
    expect(formatDate('2026-11-05')).toBe('05/11/2026')
  })

  it('retorna string vazia para data vazia', () => {
    expect(formatDate('')).toBe('')
  })

  it('formata data do primeiro dia do ano', () => {
    expect(formatDate('2026-01-01')).toBe('01/01/2026')
  })
})

describe('formatTime', () => {
  it('formata horário HH:MM', () => {
    expect(formatTime('14:30')).toBe('14:30')
  })

  it('retorna string vazia para horário vazio', () => {
    expect(formatTime('')).toBe('')
  })

  it('preserva segundos se incluídos', () => {
    expect(formatTime('09:15:45')).toBe('09:15')
  })
})

describe('todayISO', () => {
  it('retorna data no formato ISO (AAAA-MM-DD)', () => {
    const result = todayISO()
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('não retorna string vazia', () => {
    expect(todayISO().length).toBeGreaterThan(0)
  })
})

describe('nowTime', () => {
  it('retorna horário no formato HH:MM', () => {
    const result = nowTime()
    expect(result).toMatch(/^\d{2}:\d{2}$/)
  })
})

describe('getMonthRange', () => {
  it('retorna início e fim de um mês de 31 dias', () => {
    const range = getMonthRange('2026-01-15')
    expect(range.start).toBe('2026-01-01')
    expect(range.end).toBe('2026-01-31')
  })

  it('retorna início e fim de um mês de 30 dias', () => {
    const range = getMonthRange('2026-04-10')
    expect(range.start).toBe('2026-04-01')
    expect(range.end).toBe('2026-04-30')
  })

  it('retorna início e fim de fevereiro em ano não bissexto', () => {
    const range = getMonthRange('2026-02-15')
    expect(range.start).toBe('2026-02-01')
    expect(range.end).toBe('2026-02-28')
  })

  it('retorna início e fim de fevereiro em ano bissexto', () => {
    const range = getMonthRange('2024-02-15')
    expect(range.start).toBe('2024-02-01')
    expect(range.end).toBe('2024-02-29')
  })

  it('funciona com o primeiro dia do mês', () => {
    const range = getMonthRange('2026-12-01')
    expect(range.start).toBe('2026-12-01')
    expect(range.end).toBe('2026-12-31')
  })
})

describe('monthLabel', () => {
  it('retorna nome do mês e ano em português', () => {
    const label = monthLabel('2026-11-05')
    expect(label).toContain('2026')
    expect(label.toLowerCase()).toContain('novembro')
  })

  it('funciona com janeiro', () => {
    const label = monthLabel('2026-01-15')
    expect(label.toLowerCase()).toContain('janeiro')
  })
})
