import { useState } from 'react'
import { Scissors, Wallet, Calendar, LayoutDashboard, Settings } from 'lucide-react'
import ServicesView from './components/ServicesView'
import FinanceView from './components/FinanceView'
import DashboardView from './components/DashboardView'
import SettingsView from './components/SettingsView'
import { useAccessibility } from './lib/useAccessibility'

type Tab = 'dashboard' | 'services' | 'finance' | 'settings'

export default function App() {
  const [tab, setTab] = useState<Tab>('dashboard')
  const { prefs, setFontSize, toggleHighContrast } = useAccessibility()

  return (
    <div className="min-h-screen bg-ink-950 bg-[radial-gradient(ellipse_at_top,_#0d1828_0%,_#060a12_55%)]">
      {/* Header */}
      <header className="sticky top-0 z-30 backdrop-blur-md bg-ink-950/80 border-b border-ink-700">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-electric-500 to-electric-700 flex items-center justify-center shadow-lg shadow-electric-500/30 ring-1 ring-electric-400/30">
              <Scissors className="w-6 h-6 text-white" strokeWidth={2.5} aria-hidden="true" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold text-white leading-none tracking-wide">
                DOM <span className="text-electric-400">MEN</span>
              </h1>
              <p className="text-xs text-slate-400 font-medium mt-0.5 tracking-wider uppercase">
                Gestão para Barbearias
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <nav className="flex gap-1 pb-px" aria-label="Navegação principal">
            <TabButton
              active={tab === 'dashboard'}
              onClick={() => setTab('dashboard')}
              icon={<LayoutDashboard className="w-4 h-4" aria-hidden="true" />}
              label="Início"
            />
            <TabButton
              active={tab === 'services'}
              onClick={() => setTab('services')}
              icon={<Calendar className="w-4 h-4" aria-hidden="true" />}
              label="Agenda"
            />
            <TabButton
              active={tab === 'finance'}
              onClick={() => setTab('finance')}
              icon={<Wallet className="w-4 h-4" aria-hidden="true" />}
              label="Caixa"
            />
            <TabButton
              active={tab === 'settings'}
              onClick={() => setTab('settings')}
              icon={<Settings className="w-4 h-4" aria-hidden="true" />}
              label="Ajustes"
            />
          </nav>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 animate-fade-in">
        {tab === 'dashboard' ? (
          <DashboardView />
        ) : tab === 'services' ? (
          <ServicesView />
        ) : tab === 'finance' ? (
          <FinanceView />
        ) : (
          <SettingsView
            prefs={prefs}
            setFontSize={setFontSize}
            toggleHighContrast={toggleHighContrast}
          />
        )}
      </main>

      <footer className="max-w-6xl mx-auto px-4 sm:px-6 py-8 text-center">
        <p className="text-xs text-slate-500">
          DOM MEN — Sistema de gestão premium para barbearias
        </p>
      </footer>
    </div>
  )
}

function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  label: string
}) {
  return (
    <button
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-all duration-200 border-b-2 -mb-px ${
        active
          ? 'text-electric-400 border-electric-500'
          : 'text-slate-500 border-transparent hover:text-slate-300 hover:border-ink-600'
      }`}
    >
      {icon}
      {label}
    </button>
  )
}
