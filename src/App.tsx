import { useState } from 'react'
import { Scissors, Wallet, Calendar } from 'lucide-react'
import ServicesView from './components/ServicesView'
import FinanceView from './components/FinanceView'

type Tab = 'services' | 'finance'

export default function App() {
  const [tab, setTab] = useState<Tab>('services')

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 via-white to-rose-50/30">
      {/* Header */}
      <header className="sticky top-0 z-30 backdrop-blur-md bg-white/80 border-b border-rose-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-rose-400 to-rose-600 flex items-center justify-center shadow-lg shadow-rose-200">
              <Scissors className="w-6 h-6 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold text-stone-800 leading-none">
                Barbi Shop
              </h1>
              <p className="text-xs text-rose-400 font-medium mt-0.5">
                Gestão de Serviços & Finanças
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <nav className="flex gap-1 pb-px">
            <TabButton
              active={tab === 'services'}
              onClick={() => setTab('services')}
              icon={<Calendar className="w-4 h-4" />}
              label="Histórico de Serviços"
            />
            <TabButton
              active={tab === 'finance'}
              onClick={() => setTab('finance')}
              icon={<Wallet className="w-4 h-4" />}
              label="Controle Financeiro"
            />
          </nav>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 animate-fade-in">
        {tab === 'services' ? <ServicesView /> : <FinanceView />}
      </main>

      <footer className="max-w-6xl mx-auto px-4 sm:px-6 py-8 text-center">
        <p className="text-xs text-stone-400">
          Barbi Shop — Sistema de gestão de serviços e finanças
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
      className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-all duration-200 border-b-2 -mb-px ${
        active
          ? 'text-rose-600 border-rose-500'
          : 'text-stone-400 border-transparent hover:text-stone-600 hover:border-stone-200'
      }`}
    >
      {icon}
      {label}
    </button>
  )
}
