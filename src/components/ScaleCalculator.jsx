import { useMemo, useState } from 'react'

const initialScaleValues = {
  currentSize: '',
  currentUnit: 'cm',
  desiredSize: '',
  desiredUnit: 'cm',
}

function parsePositiveNumber(value) {
  if (value === '') return 0
  const normalized = String(value).replace(',', '.')
  const parsed = Number(normalized)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0
}

function convertToMm(value, unit) {
  const numericValue = parsePositiveNumber(value)
  if (unit === 'cm') return numericValue * 10
  if (unit === 'm') return numericValue * 1000
  return numericValue
}

function formatNumber(value, options = {}) {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
    ...options,
  }).format(value)
}

export default function ScaleCalculator({ onBack }) {
  const [values, setValues] = useState(initialScaleValues)

  const scaleValues = useMemo(() => {
    const currentSizeMm = convertToMm(values.currentSize, values.currentUnit)
    const desiredSizeMm = convertToMm(values.desiredSize, values.desiredUnit)

    const scalePercent =
      currentSizeMm > 0 ? (desiredSizeMm / currentSizeMm) * 100 : 0

    let scaleLabel = 'Informe os tamanhos para calcular'
    if (currentSizeMm > 0 && desiredSizeMm > 0) {
      if (scalePercent > 100) scaleLabel = 'Ampliar a peça'
      else if (scalePercent < 100) scaleLabel = 'Reduzir a peça'
      else scaleLabel = 'Manter o tamanho atual'
    }

    return {
      currentSizeMm,
      desiredSizeMm,
      scalePercent,
      scaleLabel,
    }
  }, [values])

  const handleNumericChange = (key) => (event) => {
    const nextValue = event.target.value
    if (/^[0-9]*[.,]?[0-9]*$/.test(nextValue) || nextValue === '') {
      setValues((current) => ({ ...current, [key]: nextValue }))
    }
  }

  const handleUnitChange = (key) => (event) => {
    const nextValue = event.target.value
    setValues((current) => ({ ...current, [key]: nextValue }))
  }

  const resetForm = () => {
    setValues(initialScaleValues)
  }

  const copyScale = async () => {
    const text = [
      'Calculadora de proporção 3D',
      `Tamanho atual: ${values.currentSize || 0} ${values.currentUnit}`,
      `Tamanho desejado: ${values.desiredSize || 0} ${values.desiredUnit}`,
      `Escala necessária: ${formatNumber(scaleValues.scalePercent)}%`,
      `Ação: ${scaleValues.scaleLabel}`,
      `Atual em mm: ${formatNumber(scaleValues.currentSizeMm)} mm`,
      `Desejado em mm: ${formatNumber(scaleValues.desiredSizeMm)} mm`,
    ].join('\n')

    try {
      await navigator.clipboard.writeText(text)
      window.alert('Resultado copiado para a área de transferência.')
    } catch {
      window.alert('Não foi possível copiar o resultado neste navegador.')
    }
  }

  return (
    <main className="container">
      <section className="hero-card">
        <div>
          <button type="button" className="back-link" onClick={onBack}>
            ← Voltar ao início
          </button>
          <span className="eyebrow">Módulo</span>
          <h1>Calculadora de proporção</h1>
          <p>
            Descubra a porcentagem exata para ampliar ou reduzir sua peça com
            base no tamanho atual e no tamanho desejado.
          </p>
        </div>

        <div className="hero-badge">
          <span>Escala necessária</span>
          <strong>{formatNumber(scaleValues.scalePercent)}%</strong>
        </div>
      </section>

      <section className="panel scale-panel solo-panel">
        <div className="panel-header">
          <h2>Medidas da peça</h2>
          <div className="header-actions">
            <button type="button" className="ghost-button" onClick={resetForm}>
              Limpar
            </button>
            <button type="button" className="primary-button" onClick={copyScale}>
              Copiar resultado
            </button>
          </div>
        </div>

        <div className="scale-grid">
          <label className="field">
            <span className="field-label">Tamanho atual</span>
            <div className="inline-input-group">
              <div className="input-wrap">
                <input
                  type="text"
                  inputMode="decimal"
                  value={values.currentSize}
                  onChange={handleNumericChange('currentSize')}
                  placeholder="0"
                  aria-label="Tamanho atual"
                />
              </div>

              <select
                className="unit-select"
                value={values.currentUnit}
                onChange={handleUnitChange('currentUnit')}
                aria-label="Unidade do tamanho atual"
              >
                <option value="mm">mm</option>
                <option value="cm">cm</option>
                <option value="m">m</option>
              </select>
            </div>

            <small>Informe a medida atual da peça.</small>
          </label>

          <label className="field">
            <span className="field-label">Tamanho desejado</span>
            <div className="inline-input-group">
              <div className="input-wrap">
                <input
                  type="text"
                  inputMode="decimal"
                  value={values.desiredSize}
                  onChange={handleNumericChange('desiredSize')}
                  placeholder="0"
                  aria-label="Tamanho desejado"
                />
              </div>

              <select
                className="unit-select"
                value={values.desiredUnit}
                onChange={handleUnitChange('desiredUnit')}
                aria-label="Unidade do tamanho desejado"
              >
                <option value="mm">mm</option>
                <option value="cm">cm</option>
                <option value="m">m</option>
              </select>
            </div>

            <small>Informe a medida final que você quer atingir.</small>
          </label>
        </div>

        <div className="scale-result-card">
          <span>Escala necessária no slicer</span>
          <strong>{formatNumber(scaleValues.scalePercent)}%</strong>
          <p>{scaleValues.scaleLabel}</p>
          <small>
            Tamanho atual: {formatNumber(scaleValues.currentSizeMm)} mm ·
            Tamanho desejado: {` ${formatNumber(scaleValues.desiredSizeMm)} mm`}
          </small>
        </div>
      </section>
    </main>
  )
}