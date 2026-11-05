import { describe, it, expect, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useToast } from '../lib/useToast'

describe('useToast', () => {
  it('inicia sem toast ativo', () => {
    const { result } = renderHook(() => useToast())
    expect(result.current.toast).toBeNull()
  })

  it('exibe toast de sucesso ao chamar showToast', () => {
    const { result } = renderHook(() => useToast())
    act(() => {
      result.current.showToast('Operação concluída')
    })
    expect(result.current.toast).not.toBeNull()
    expect(result.current.toast!.message).toBe('Operação concluída')
    expect(result.current.toast!.type).toBe('success')
  })

  it('exibe toast de erro quando type é "error"', () => {
    const { result } = renderHook(() => useToast())
    act(() => {
      result.current.showToast('Falha ao salvar', 'error')
    })
    expect(result.current.toast).not.toBeNull()
    expect(result.current.toast!.message).toBe('Falha ao salvar')
    expect(result.current.toast!.type).toBe('error')
  })

  it('remove toast ao chamar closeToast', () => {
    const { result } = renderHook(() => useToast())
    act(() => {
      result.current.showToast('Teste')
    })
    expect(result.current.toast).not.toBeNull()
    act(() => {
      result.current.closeToast()
    })
    expect(result.current.toast).toBeNull()
  })

  it('auto-remove toast após timeout', () => {
    vi.useFakeTimers()
    const { result } = renderHook(() => useToast())
    act(() => {
      result.current.showToast('Temporário')
    })
    expect(result.current.toast).not.toBeNull()
    act(() => {
      vi.advanceTimersByTime(3500)
    })
    expect(result.current.toast).toBeNull()
    vi.useRealTimers()
  })
})
