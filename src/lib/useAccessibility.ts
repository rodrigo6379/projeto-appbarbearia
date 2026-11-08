import { useEffect, useState, useCallback } from 'react'

export type FontSize = 'normal' | 'large' | 'xlarge'

export type AccessibilityPrefs = {
  fontSize: FontSize
  highContrast: boolean
}

const STORAGE_KEY = 'dommen-a11y'

const defaults: AccessibilityPrefs = {
  fontSize: 'normal',
  highContrast: false,
}

function readPrefs(): AccessibilityPrefs {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<AccessibilityPrefs>
      return {
        fontSize:
          parsed.fontSize === 'large' || parsed.fontSize === 'xlarge'
            ? parsed.fontSize
            : 'normal',
        highContrast: typeof parsed.highContrast === 'boolean' ? parsed.highContrast : false,
      }
    }
  } catch {
    // ignore parse / storage errors
  }
  return defaults
}

export function useAccessibility() {
  const [prefs, setPrefs] = useState<AccessibilityPrefs>(() => {
    if (typeof window === 'undefined') return defaults
    return readPrefs()
  })

  useEffect(() => {
    const root = document.documentElement
    root.classList.remove('a11y-font-normal', 'a11y-font-large', 'a11y-font-xlarge')
    root.classList.add(`a11y-font-${prefs.fontSize}`)
    root.classList.toggle('a11y-contrast', prefs.highContrast)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs))
    } catch {
      // ignore storage errors
    }
  }, [prefs])

  const setFontSize = useCallback((fontSize: FontSize) => {
    setPrefs((prev) => ({ ...prev, fontSize }))
  }, [])

  const toggleHighContrast = useCallback(() => {
    setPrefs((prev) => ({ ...prev, highContrast: !prev.highContrast }))
  }, [])

  return { prefs, setFontSize, toggleHighContrast }
}
