import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useAccessibility } from '../lib/useAccessibility'

describe('useAccessibility', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.className = ''
  })

  it('inicia com valores padrão (fonte normal, contraste desligado)', () => {
    const { result } = renderHook(() => useAccessibility())
    expect(result.current.prefs.fontSize).toBe('normal')
    expect(result.current.prefs.highContrast).toBe(false)
  })

  it('aplica classe de fonte normal no documentElement', () => {
    renderHook(() => useAccessibility())
    expect(document.documentElement.classList.contains('a11y-font-normal')).toBe(true)
  })

  it('alterna o tamanho da fonte para grande', () => {
    const { result } = renderHook(() => useAccessibility())
    act(() => result.current.setFontSize('large'))
    expect(result.current.prefs.fontSize).toBe('large')
    expect(document.documentElement.classList.contains('a11y-font-large')).toBe(true)
    expect(document.documentElement.classList.contains('a11y-font-normal')).toBe(false)
  })

  it('alterna o tamanho da fonte para muito grande', () => {
    const { result } = renderHook(() => useAccessibility())
    act(() => result.current.setFontSize('xlarge'))
    expect(result.current.prefs.fontSize).toBe('xlarge')
    expect(document.documentElement.classList.contains('a11y-font-xlarge')).toBe(true)
  })

  it('ativa e desativa o alto contraste', () => {
    const { result } = renderHook(() => useAccessibility())
    act(() => result.current.toggleHighContrast())
    expect(result.current.prefs.highContrast).toBe(true)
    expect(document.documentElement.classList.contains('a11y-contrast')).toBe(true)
    act(() => result.current.toggleHighContrast())
    expect(result.current.prefs.highContrast).toBe(false)
    expect(document.documentElement.classList.contains('a11y-contrast')).toBe(false)
  })

  it('salva as preferências no localStorage', () => {
    const { result } = renderHook(() => useAccessibility())
    act(() => result.current.setFontSize('large'))
    act(() => result.current.toggleHighContrast())
    const raw = localStorage.getItem('dommen-a11y')
    expect(raw).not.toBeNull()
    const parsed = JSON.parse(raw!)
    expect(parsed.fontSize).toBe('large')
    expect(parsed.highContrast).toBe(true)
  })

  it('carrega preferências salvas do localStorage ao iniciar', () => {
    localStorage.setItem(
      'dommen-a11y',
      JSON.stringify({ fontSize: 'xlarge', highContrast: true }),
    )
    const { result } = renderHook(() => useAccessibility())
    expect(result.current.prefs.fontSize).toBe('xlarge')
    expect(result.current.prefs.highContrast).toBe(true)
    expect(document.documentElement.classList.contains('a11y-font-xlarge')).toBe(true)
    expect(document.documentElement.classList.contains('a11y-contrast')).toBe(true)
  })

  it('ignora valores inválidos no localStorage', () => {
    localStorage.setItem(
      'dommen-a11y',
      JSON.stringify({ fontSize: 'gigante', highContrast: 'sim' }),
    )
    const { result } = renderHook(() => useAccessibility())
    expect(result.current.prefs.fontSize).toBe('normal')
    expect(result.current.prefs.highContrast).toBe(false)
  })
})
