import { Accessibility, Type, Contrast, Check } from 'lucide-react'
import { Card } from './ui'
import type { FontSize, AccessibilityPrefs } from '../lib/useAccessibility'

type SettingsViewProps = {
  prefs: AccessibilityPrefs
  setFontSize: (size: FontSize) => void
  toggleHighContrast: () => void
}

const fontOptions: { value: FontSize; label: string; hint: string }[] = [
  { value: 'normal', label: 'Normal', hint: '16px' },
  { value: 'large', label: 'Grande', hint: '18px' },
  { value: 'xlarge', label: 'Muito grande', hint: '20px' },
]

export default function SettingsView({ prefs, setFontSize, toggleHighContrast }: SettingsViewProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-xl font-bold text-white">Ajustes</h2>
        <p className="text-sm text-slate-400 mt-1">
          Personalize a aparência do aplicativo para melhor conforto visual.
        </p>
      </div>

      {/* Seção Acessibilidade */}
      <section aria-labelledby="a11y-title">
        <Card className="overflow-hidden">
          {/* Cabeçalho da seção */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-ink-700">
            <div className="w-10 h-10 rounded-xl bg-electric-500/10 flex items-center justify-center shrink-0">
              <Accessibility className="w-5 h-5 text-electric-400" aria-hidden="true" />
            </div>
            <div>
              <h3
                id="a11y-title"
                className="font-display text-base font-bold text-white"
              >
                Acessibilidade
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                As preferências são salvas no navegador.
              </p>
            </div>
          </div>

          {/* Tamanho de fonte */}
          <div className="px-5 py-5 border-b border-ink-700">
            <div className="flex items-center gap-2 mb-3">
              <Type className="w-4 h-4 text-electric-400" aria-hidden="true" />
              <h4 className="text-sm font-semibold text-slate-200">
                Tamanho da fonte
              </h4>
            </div>
            <div
              role="radiogroup"
              aria-label="Tamanho da fonte"
              className="grid grid-cols-3 gap-2 sm:gap-3"
            >
              {fontOptions.map((opt) => {
                const active = prefs.fontSize === opt.value
                return (
                  <button
                    key={opt.value}
                    role="radio"
                    aria-checked={active}
                    aria-label={`Tamanho de fonte ${opt.label}, ${opt.hint}`}
                    onClick={() => setFontSize(opt.value)}
                    className={`flex flex-col items-center justify-center gap-1 px-3 py-3 rounded-xl border transition-all duration-200 ${
                      active
                        ? 'border-electric-500 bg-electric-500/15 text-electric-300'
                        : 'border-ink-600 bg-ink-800 text-slate-400 hover:border-electric-500/40 hover:text-electric-300'
                    }`}
                  >
                    <span
                      className="font-semibold leading-none"
                      style={{
                        fontSize:
                          opt.value === 'xlarge' ? '20px' : opt.value === 'large' ? '18px' : '16px',
                      }}
                    >
                      Aa
                    </span>
                    <span className="text-xs font-medium">{opt.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Alto contraste */}
          <div className="px-5 py-5">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Contrast className="w-4 h-4 text-electric-400" aria-hidden="true" />
                <div>
                  <h4 className="text-sm font-semibold text-slate-200">
                    Alto contraste
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Aumenta o contraste entre texto e fundo.
                  </p>
                </div>
              </div>
              <button
                role="switch"
                aria-checked={prefs.highContrast}
                aria-label="Ativar ou desativar alto contraste"
                onClick={toggleHighContrast}
                className={`relative shrink-0 w-14 h-7 rounded-full transition-all duration-200 border ${
                  prefs.highContrast
                    ? 'bg-electric-500 border-electric-400'
                    : 'bg-ink-700 border-ink-600'
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white shadow-md transition-all duration-200 flex items-center justify-center ${
                    prefs.highContrast ? 'translate-x-7' : 'translate-x-0'
                  }`}
                >
                  {prefs.highContrast && (
                    <Check className="w-3.5 h-3.5 text-electric-600" aria-hidden="true" />
                  )}
                </span>
              </button>
            </div>
          </div>
        </Card>
      </section>
    </div>
  )
}
