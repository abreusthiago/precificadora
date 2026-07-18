import { useState } from 'react'
import { Analytics } from '@vercel/analytics/react'
import PricingCalculator from './components/PricingCalculator'
import ScaleCalculator from './components/ScaleCalculator'

function HomeSelector({ onSelect }) {
  return (
    <main className="container">
      <section className="hero-card home-hero">
        <div>
          <span className="eyebrow">Ferramentas 3D</span>
          <h1>Menu de ferramentas T3D</h1>
          <p>
            Separe o cálculo de preço da análise de proporção para trabalhar com
            mais clareza no dia a dia.
          </p>
        </div>
      </section>

      <section className="tool-grid">
        <button
          type="button"
          className="tool-card"
          onClick={() => onSelect('pricing')}
        >
          <span className="tool-badge">Orçamento</span>
          <h2>Precificadora 3D</h2>
          <p>
            Calcule material, energia, custos extras, lucro e gere orçamento em
            PDF para o cliente.
          </p>
        </button>

        <button
          type="button"
          className="tool-card"
          onClick={() => onSelect('scale')}
        >
          <span className="tool-badge">Escala</span>
          <h2>Calculadora de proporção</h2>
          <p>
            Informe o tamanho atual e o tamanho desejado para descobrir a
            porcentagem correta de escala.
          </p>
        </button>
      </section>
    </main>
  )
}

export default function App() {
  const [activeView, setActiveView] = useState('home')

  return (
    <div className="app-shell">
      {activeView === 'home' && <HomeSelector onSelect={setActiveView} />}

      {activeView === 'pricing' && (
        <PricingCalculator onBack={() => setActiveView('home')} />
      )}

      {activeView === 'scale' && (
        <ScaleCalculator onBack={() => setActiveView('home')} />
      )}
      <Analytics />
    </div>
  )
}