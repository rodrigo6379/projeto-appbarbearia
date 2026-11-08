import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import SettingsView from '../components/SettingsView'
import type { AccessibilityPrefs } from '../lib/useAccessibility'

const defaultPrefs: AccessibilityPrefs = {
  fontSize: 'normal',
  highContrast: false,
}

describe('SettingsView', () => {
  it('renderiza o título Acessibilidade', () => {
    render(
      <SettingsView
        prefs={defaultPrefs}
        setFontSize={() => {}}
        toggleHighContrast={() => {}}
      />,
    )
    expect(screen.getByText('Acessibilidade')).toBeInTheDocument()
  })

  it('renderiza as três opções de tamanho de fonte', () => {
    render(
      <SettingsView
        prefs={defaultPrefs}
        setFontSize={() => {}}
        toggleHighContrast={() => {}}
      />,
    )
    expect(screen.getByRole('radio', { name: /^Tamanho de fonte Normal/i })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: /^Tamanho de fonte Grande,/i })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: /Muito grande/i })).toBeInTheDocument()
  })

  it('renderiza o botão de alto contraste com nome acessível', () => {
    render(
      <SettingsView
        prefs={defaultPrefs}
        setFontSize={() => {}}
        toggleHighContrast={() => {}}
      />,
    )
    const switchBtn = screen.getByRole('switch', { name: /alto contraste/i })
    expect(switchBtn).toBeInTheDocument()
    expect(switchBtn).toHaveAttribute('aria-checked', 'false')
  })

  it('marca a opção de fonte ativa como selecionada', () => {
    render(
      <SettingsView
        prefs={{ fontSize: 'large', highContrast: false }}
        setFontSize={() => {}}
        toggleHighContrast={() => {}}
      />,
    )
    const largeRadio = screen.getByRole('radio', { name: /^Tamanho de fonte Grande,/i })
    expect(largeRadio).toHaveAttribute('aria-checked', 'true')
    const normalRadio = screen.getByRole('radio', { name: /^Tamanho de fonte Normal/i })
    expect(normalRadio).toHaveAttribute('aria-checked', 'false')
  })

  it('chama setFontSize ao clicar em uma opção', () => {
    const setFontSize = vi.fn()
    render(
      <SettingsView
        prefs={defaultPrefs}
        setFontSize={setFontSize}
        toggleHighContrast={() => {}}
      />,
    )
    fireEvent.click(screen.getByRole('radio', { name: /Muito grande/i }))
    expect(setFontSize).toHaveBeenCalledWith('xlarge')
  })

  it('chama toggleHighContrast ao clicar no switch', () => {
    const toggleHighContrast = vi.fn()
    render(
      <SettingsView
        prefs={defaultPrefs}
        setFontSize={() => {}}
        toggleHighContrast={toggleHighContrast}
      />,
    )
    fireEvent.click(screen.getByRole('switch', { name: /alto contraste/i }))
    expect(toggleHighContrast).toHaveBeenCalledTimes(1)
  })

  it('mostra o switch como ativo quando highContrast é true', () => {
    render(
      <SettingsView
        prefs={{ fontSize: 'normal', highContrast: true }}
        setFontSize={() => {}}
        toggleHighContrast={() => {}}
      />,
    )
    const switchBtn = screen.getByRole('switch', { name: /alto contraste/i })
    expect(switchBtn).toHaveAttribute('aria-checked', 'true')
  })
})
