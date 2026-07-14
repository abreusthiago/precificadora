import { useMemo, useRef, useState } from 'react'
import html2pdf from 'html2pdf.js'
import logoT3D from './assets/logo-t3d.jpg'

const initialValues = {
  filamentKgPrice: '95',
  materialGrams: '120',
  printHours: '6',
  energyPrice: '0.95',
  printerWatts: '180',
  packagingCost: '3',
  otherCosts: '2',
  profitPercent: '40',
  currentSize: '',
  currentUnit: 'cm',
  desiredSize: '',
  desiredUnit: 'cm',
  companyName: '',
  clientName: '',
  productDescription: '',
  quoteExpiryDate: '',
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

function convertToMm(value, unit) {
  const numericValue = parsePositiveNumber(value)

  if (unit === 'cm') return numericValue * 10
  if (unit === 'm') return numericValue * 1000
  return numericValue
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

function formatDate(date) {
  if (!date) return 'Não informada'
  const parsed = new Date(`${date}T00:00:00`)
  if (Number.isNaN(parsed.getTime())) return 'Não informada'

  return new Intl.DateTimeFormat('pt-BR').format(parsed)
}

export default function App() {
  const [values, setValues] = useState(initialValues)
  const [uploadedLogo, setUploadedLogo] = useState('')
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false)
  const pdfRef = useRef(null)

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

  const scaleValues = useMemo(() => {
    const currentSizeMm = convertToMm(values.currentSize, values.currentUnit)
    const desiredSizeMm = convertToMm(values.desiredSize, values.desiredUnit)

    const scalePercent =
      currentSizeMm > 0 ? (desiredSizeMm / currentSizeMm) * 100 : 0

    let scaleLabel = 'Informe os tamanhos para calcular'
    if (currentSizeMm > 0 && desiredSizeMm > 0) {
      if (scalePercent > 100) {
        scaleLabel = 'Ampliar a peça'
      } else if (scalePercent < 100) {
        scaleLabel = 'Reduzir a peça'
      } else {
        scaleLabel = 'Manter o tamanho atual'
      }
    }

    return {
      currentSizeMm,
      desiredSizeMm,
      scalePercent,
      scaleLabel,
    }
  }, [values.currentSize, values.currentUnit, values.desiredSize, values.desiredUnit])

  const handleChange = (key) => (event) => {
    const nextValue = event.target.value
    if (/^[0-9]*[.,]?[0-9]*$/.test(nextValue) || nextValue === '') {
      setValues((current) => ({ ...current, [key]: nextValue }))
    }
  }

  const handleTextChange = (key) => (event) => {
    const nextValue = event.target.value
    setValues((current) => ({ ...current, [key]: nextValue }))
  }

  const handleUnitChange = (key) => (event) => {
    const nextValue = event.target.value
    setValues((current) => ({ ...current, [key]: nextValue }))
  }

  const handleLogoUpload = (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      setUploadedLogo(reader.result?.toString() || '')
    }
    reader.readAsDataURL(file)
  }

  const resetForm = () => {
    setValues(initialValues)
    setUploadedLogo('')
  }

  const copySummary = async () => {
    const text = [
      'Orçamento de impressão 3D',
      `Empresa: ${values.companyName || 'Não informada'}`,
      `Cliente: ${values.clientName || 'Não informado'}`,
      `Descrição do produto: ${values.productDescription || 'Não informada'}`,
      `Validade do orçamento: ${formatDate(values.quoteExpiryDate)}`,
      '',
      `Custo de material: ${formatCurrency(numericValues.materialCost)}`,
      `Custo de energia: ${formatCurrency(numericValues.energyCost)}`,
      `Custo da embalagem: ${formatCurrency(numericValues.packagingCost)}`,
      `Outros custos: ${formatCurrency(numericValues.otherCosts)}`,
      `Custo total: ${formatCurrency(numericValues.totalCost)}`,
      `Lucro (${formatNumber(numericValues.profitPercent)}%): ${formatCurrency(numericValues.profitValue)}`,
      `Preço sugerido: ${formatCurrency(numericValues.salePrice)}`,
      '',
      'Escala de tamanho',
      `Tamanho atual: ${values.currentSize || 0} ${values.currentUnit}`,
      `Tamanho desejado: ${values.desiredSize || 0} ${values.desiredUnit}`,
      `Escala necessária: ${formatNumber(scaleValues.scalePercent)}%`,
      `Ação: ${scaleValues.scaleLabel}`,
    ].join('\n')

    try {
      await navigator.clipboard.writeText(text)
      window.alert('Resumo copiado para a área de transferência.')
    } catch {
      window.alert('Não foi possível copiar o resumo neste navegador.')
    }
  }

  const generatePdf = async () => {
    if (!pdfRef.current) return

    setIsGeneratingPdf(true)

    const clientSlug = values.clientName
      ? values.clientName.toLowerCase().trim().replace(/\s+/g, '-')
      : 'cliente'

    const options = {
      margin: 10,
      filename: `orcamento-${clientSlug}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    }

    try {
      await html2pdf().set(options).from(pdfRef.current).save()
    } catch {
      window.alert('Não foi possível gerar o PDF.')
    } finally {
      setIsGeneratingPdf(false)
    }
  }

  return (
    <div className="app-shell">
      <main className="container">
        <section className="hero-card">
          <div>
            <div className="brand">
              <img
                src={logoT3D}
                alt="Logo da T3D Tudo em 3D"
                className="brand-logo"
              />

              <div>
                <span className="eyebrow">T3D · Tudo em 3D</span>
                <h1>Calcule o preço, a escala e gere o orçamento em PDF</h1>
              </div>
            </div>

            <p>
              Informe os custos da peça, defina a escala desejada e preencha os
              dados do orçamento para gerar um PDF profissional para seu cliente.
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

        <section className="panel scale-panel">
          <div className="panel-header">
            <h2>Escala de tamanho</h2>
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
                    onChange={handleChange('currentSize')}
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
                    onChange={handleChange('desiredSize')}
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
              Tamanho desejado: {formatNumber(scaleValues.desiredSizeMm)} mm
            </small>
          </div>
        </section>

        <section className="panel quote-panel">
          <div className="panel-header">
            <h2>Dados do orçamento</h2>
            <button
              type="button"
              className="primary-button"
              onClick={generatePdf}
              disabled={isGeneratingPdf}
            >
              {isGeneratingPdf ? 'Gerando PDF...' : 'Gerar orçamento em PDF'}
            </button>
          </div>

          <div className="quote-grid">
            <label className="field">
              <span className="field-label">Logo da empresa</span>
              <div className="input-wrap file-input-wrap">
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/jpg"
                  onChange={handleLogoUpload}
                  aria-label="Logo da empresa"
                />
              </div>
              <small>Envie uma imagem JPG ou PNG para aparecer no orçamento.</small>
            </label>

            <label className="field">
              <span className="field-label">Nome da empresa</span>
              <div className="input-wrap">
                <input
                  type="text"
                  value={values.companyName}
                  onChange={handleTextChange('companyName')}
                  placeholder="Ex.: Minha Empresa 3D"
                  aria-label="Nome da empresa"
                />
              </div>
              <small>Esse nome aparecerá no topo do PDF gerado.</small>
            </label>

            <label className="field">
              <span className="field-label">Nome do cliente</span>
              <div className="input-wrap">
                <input
                  type="text"
                  value={values.clientName}
                  onChange={handleTextChange('clientName')}
                  placeholder="Ex.: João Silva"
                  aria-label="Nome do cliente"
                />
              </div>
              <small>Nome da pessoa ou empresa que receberá o orçamento.</small>
            </label>

            <label className="field field-full">
              <span className="field-label">Descrição do produto</span>
              <div className="textarea-wrap">
                <textarea
                  value={values.productDescription}
                  onChange={handleTextChange('productDescription')}
                  placeholder="Descreva a peça, cor, acabamento, quantidade ou observações."
                  rows={4}
                  aria-label="Descrição do produto"
                />
              </div>
              <small>Essa descrição aparecerá no PDF do orçamento.</small>
            </label>

            <label className="field">
              <span className="field-label">Validade do orçamento</span>
              <div className="input-wrap">
                <input
                  type="date"
                  value={values.quoteExpiryDate}
                  onChange={handleTextChange('quoteExpiryDate')}
                  aria-label="Data de validade do orçamento"
                />
              </div>
              <small>Informe até quando este valor será válido.</small>
            </label>
          </div>
        </section>

        <section className="panel preview-panel">
          <div className="panel-header">
            <h2>Prévia do orçamento</h2>
          </div>

          <div ref={pdfRef} className="pdf-document">
            <div className="pdf-header">
              <div className="pdf-brand-block">
                {uploadedLogo ? (
                  <img
                    src={uploadedLogo}
                    alt="Logo enviada para o orçamento"
                    className="pdf-client-logo"
                  />
                ) : (
                  <img
                    src={logoT3D}
                    alt="Logo padrão da aplicação"
                    className="pdf-client-logo"
                  />
                )}

                <div>
                  <h3>Orçamento de Impressão 3D</h3>
                  <p>{values.companyName || 'Empresa não informada'}</p>
                </div>
              </div>

              <div className="pdf-meta">
                <span>Validade</span>
                <strong>{formatDate(values.quoteExpiryDate)}</strong>
              </div>
            </div>

            <div className="pdf-section">
              <span className="pdf-label">Cliente</span>
              <strong>{values.clientName || 'Não informado'}</strong>
            </div>

            <div className="pdf-section">
              <span className="pdf-label">Descrição do produto</span>
              <p>{values.productDescription || 'Não informada'}</p>
            </div>

            <div className="pdf-values pdf-values-single">
              <div className="pdf-value-card">
                <span>Valor total do orçamento</span>
                <strong>{formatCurrency(numericValues.salePrice)}</strong>
              </div>
            </div>
          </div>
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