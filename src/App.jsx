import { useMemo, useState } from 'react'

const initialValues = {
  filamentKgPrice: '95',
  materialGrams: '120',
  printHours: '6',
  energyPrice: '0.95',
  printerWatts: '180',
  packagingCost: '3',
  otherCosts: '2',
  profitPercent: '40',
}

const fieldConfig = [
  {
    key: 'filamentKgPrice',
    label: 'Valor do kg do filamento',
    suffix: 'R$',
    help: 'Ex.: 95,00 por kg',
  },
  {
    key: 'materialGrams',
    label: 'Material usado na impressão',
    suffix: 'g',
    help: 'Peso total usado na peça',
  },
  {
    key: 'printHours',
    label: 'Duração da impressão',
    suffix: 'h',
    help: 'Tempo total em horas',
  },
  {
    key: 'energyPrice',
    label: 'Valor da energia',
    suffix: 'R$/kWh',
    help: 'Tarifa de energia por kWh',
  },
  {
    key: 'printerWatts',
    label: 'Consumo médio da impressora',
    suffix: 'W',
    help: 'Potência média em watts',
  },
  {
    key: 'packagingCost',
    label: 'Custo da embalagem',
    suffix: 'R$',
    help: 'Caixa, saquinho, etiqueta e proteção.',
  },
  {
    key: 'otherCosts',
    label: 'Outros custos',
    suffix: 'R$',
    help: 'Cola, parafusos, inserts e extras.',
  },
  {
    key: 'profitPercent',
    label: 'Lucro desejado',
    suffix: '%',
    help: 'Percentual aplicado sobre o custo total.',
  },
]

function parsePositiveNumber(value) {
  if (value === '') return 0
  const normalized = String(value).replace(',', '.')
  const parsed = Number(normalized)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0
}

function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

function formatNumber(value, options = {}) {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
    ...options,
  }).format(value)
}

export default function App() {
  const [values, setValues] = useState(initialValues)

  const numericValues = useMemo(() => {
    const filamentKgPrice = parsePositiveNumber(values.filamentKgPrice)
    const materialGrams = parsePositiveNumber(values.materialGrams)
    const printHours = parsePositiveNumber(values.printHours)
    const energyPrice = parsePositiveNumber(values.energyPrice)
    const printerWatts = parsePositiveNumber(values.printerWatts)
    const packagingCost = parsePositiveNumber(values.packagingCost)
    const otherCosts = parsePositiveNumber(values.otherCosts)
    const profitPercent = parsePositiveNumber(values.profitPercent)

    const materialCost = (materialGrams / 1000) * filamentKgPrice
    const energyCost = (printerWatts / 1000) * printHours * energyPrice
    const totalCost = materialCost + energyCost + packagingCost + otherCosts
    const profitValue = totalCost * (profitPercent / 100)
    const salePrice = totalCost + profitValue

    return {
      filamentKgPrice,
      materialGrams,
      printHours,
      energyPrice,
      printerWatts,
      packagingCost,
      otherCosts,
      profitPercent,
      materialCost,
      energyCost,
      totalCost,
      profitValue,
      salePrice,
    }
  }, [values])

  const handleChange = (key) => (event) => {
    const nextValue = event.target.value
    if (/^[0-9]*[.,]?[0-9]*$/.test(nextValue) || nextValue === '') {
      setValues((current) => ({ ...current, [key]: nextValue }))
    }
  }

  const resetForm = () => setValues(initialValues)

  const copySummary = async () => {
    const text = [
      'Orçamento de impressão 3D',
      `Custo de material: ${formatCurrency(numericValues.materialCost)}`,
      `Custo de energia: ${formatCurrency(numericValues.energyCost)}`,
      `Custo da embalagem: ${formatCurrency(numericValues.packagingCost)}`,
      `Outros custos: ${formatCurrency(numericValues.otherCosts)}`,
      `Custo total: ${formatCurrency(numericValues.totalCost)}`,
      `Lucro (${formatNumber(numericValues.profitPercent)}%): ${formatCurrency(numericValues.profitValue)}`,
      `Preço sugerido: ${formatCurrency(numericValues.salePrice)}`,
    ].join('\n')

    try {
      await navigator.clipboard.writeText(text)
      window.alert('Resumo copiado para a área de transferência.')
    } catch {
      window.alert('Não foi possível copiar o resumo neste navegador.')
    }
  }

  return (
    <div className="app-shell">
      <main className="container">
        <section className="hero-card">
          <div>
            <span className="eyebrow">Precificadora 3D</span>
            <h1>Calcule o preço de venda da sua impressão 3D</h1>
            <p>
              Informe filamento, material usado, tempo, energia, consumo,
              embalagem, outros custos e a margem de lucro para obter um preço
              final sugerido.
            </p>
          </div>

          <div className="hero-badge">
            <span>Preço sugerido</span>
            <strong>{formatCurrency(numericValues.salePrice)}</strong>
          </div>
        </section>

        <section className="content-grid">
          <form className="panel form-panel" onSubmit={(e) => e.preventDefault()}>
            <div className="panel-header">
              <h2>Dados da impressão</h2>
              <button type="button" className="ghost-button" onClick={resetForm}>
                Limpar
              </button>
            </div>

            <div className="form-grid">
              {fieldConfig.map((field) => (
                <label key={field.key} className="field">
                  <span className="field-label">{field.label}</span>

                  <div className="input-wrap">
                    <input
                      type="text"
                      inputMode="decimal"
                      value={values[field.key]}
                      onChange={handleChange(field.key)}
                      placeholder="0"
                      aria-label={field.label}
                    />
                    <span className="field-suffix">{field.suffix}</span>
                  </div>

                  <small>{field.help}</small>
                </label>
              ))}
            </div>
          </form>

          <aside className="panel result-panel">
            <div className="panel-header">
              <h2>Resumo do cálculo</h2>
              <button type="button" className="primary-button" onClick={copySummary}>
                Copiar orçamento
              </button>
            </div>

            <div className="result-list">
              <ResultItem
                label="Custo do filamento"
                value={formatCurrency(numericValues.materialCost)}
              />
              <ResultItem
                label="Custo de energia"
                value={formatCurrency(numericValues.energyCost)}
              />
              <ResultItem
                label="Custo da embalagem"
                value={formatCurrency(numericValues.packagingCost)}
              />
              <ResultItem
                label="Outros custos"
                value={formatCurrency(numericValues.otherCosts)}
              />
              <ResultItem
                label="Custo total"
                value={formatCurrency(numericValues.totalCost)}
                highlight
              />
              <ResultItem
                label={`Lucro (${formatNumber(numericValues.profitPercent)}%)`}
                value={formatCurrency(numericValues.profitValue)}
              />
            </div>

            <div className="total-card">
              <span>Preço final sugerido</span>
              <strong>{formatCurrency(numericValues.salePrice)}</strong>
              <p>
                Baseado em {formatNumber(numericValues.materialGrams)} g de material,
                {` ${formatNumber(numericValues.printHours)} h de impressão, `}
                {formatNumber(numericValues.printerWatts)} W médios e custos extras
                já considerados no cálculo.
              </p>
            </div>
          </aside>
        </section>
      </main>
    </div>
  )
}

function ResultItem({ label, value, highlight = false }) {
  return (
    <div className={`result-item ${highlight ? 'highlight' : ''}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}