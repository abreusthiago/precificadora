import { useMemo, useRef, useState } from 'react'
import html2pdf from 'html2pdf.js'

const initialPricingValues = {
  filamentKgPrice: '95',
  materialGrams: '120',
  printHours: '6',
  energyPrice: '0.95',
  printerWatts: '180',
  packagingCost: '3',
  otherCosts: '2',
  profitPercent: '40',
  marketplacePercent: '',
  companyName: '',
  clientName: '',
  productDescription: '',
  quoteExpiryDate: '',
}

const pricingFieldConfig = [
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
    help: 'Caixa, proteção e etiqueta.',
  },
  {
    key: 'otherCosts',
    label: 'Outros custos',
    suffix: 'R$',
    help: 'Cola, inserts, parafusos e extras.',
  },
  {
    key: 'profitPercent',
    label: 'Lucro desejado',
    suffix: '%',
    help: 'Percentual aplicado sobre o custo total.',
  },
  {
    key: 'marketplacePercent',
    label: '% Marketplace',
    suffix: '%',
    help: 'Percentual cobrado sobre o valor final da venda.',
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

function formatDate(date) {
  if (!date) return 'Não informada'
  const parsed = new Date(`${date}T00:00:00`)
  if (Number.isNaN(parsed.getTime())) return 'Não informada'
  return new Intl.DateTimeFormat('pt-BR').format(parsed)
}

function ResultItem({ label, value, highlight = false }) {
  return (
    <div className={`result-item ${highlight ? 'highlight' : ''}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

export default function PricingCalculator({ onBack }) {
  const [values, setValues] = useState(initialPricingValues)
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
    const marketplacePercent = parsePositiveNumber(values.marketplacePercent)

    const materialCost = (materialGrams / 1000) * filamentKgPrice
    const energyCost = (printerWatts / 1000) * printHours * energyPrice
    const totalCost = materialCost + energyCost + packagingCost + otherCosts
    const profitValue = totalCost * (profitPercent / 100)

    const desiredNetValue = totalCost + profitValue
    const marketplaceRate = marketplacePercent / 100

    const salePrice =
      marketplaceRate >= 1
        ? 0
        : desiredNetValue / (1 - marketplaceRate)

    const marketplaceCost = salePrice * marketplaceRate

    return {
      materialGrams,
      printHours,
      printerWatts,
      packagingCost,
      otherCosts,
      profitPercent,
      marketplacePercent,
      materialCost,
      energyCost,
      totalCost,
      profitValue,
      marketplaceCost,
      salePrice,
      desiredNetValue,
      invalidMarketplaceRate: marketplaceRate >= 1,
    }
  }, [values])

  const handleNumericChange = (key) => (event) => {
    const nextValue = event.target.value
    if (/^[0-9]*[.,]?[0-9]*$/.test(nextValue) || nextValue === '') {
      setValues((current) => ({ ...current, [key]: nextValue }))
    }
  }

  const handleTextChange = (key) => (event) => {
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
    setValues(initialPricingValues)
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
      `Custo do filamento: ${formatCurrency(numericValues.materialCost)}`,
      `Custo de energia: ${formatCurrency(numericValues.energyCost)}`,
      `Custo da embalagem: ${formatCurrency(numericValues.packagingCost)}`,
      `Outros custos: ${formatCurrency(numericValues.otherCosts)}`,
      `Custo total: ${formatCurrency(numericValues.totalCost)}`,
      `Lucro (${formatNumber(numericValues.profitPercent)}%): ${formatCurrency(numericValues.profitValue)}`,
      `Marketplace (${formatNumber(numericValues.marketplacePercent)}%): ${formatCurrency(numericValues.marketplaceCost)}`,
      `Preço final sugerido: ${formatCurrency(numericValues.salePrice)}`,
    ].join('\n')

    try {
      await navigator.clipboard.writeText(text)
      window.alert('Resumo copiado para a área de transferência.')
    } catch {
      window.alert('Não foi possível copiar o resumo neste navegador.')
    }
  }

  const generatePdf = async () => {
    if (!pdfRef.current || numericValues.invalidMarketplaceRate) return

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
    <main className="container">
      <section className="hero-card">
        <div>
          <button type="button" className="back-link" onClick={onBack}>
            ← Voltar ao início
          </button>
          <span className="eyebrow">Módulo</span>
          <h1>Precificadora 3D</h1>
          <p>
            Calcule o valor da impressão com material, energia, custos extras,
            lucro e taxa de marketplace, além de gerar o orçamento em PDF.
          </p>
        </div>

        <div className="hero-badge">
          <span>Preço final sugerido</span>
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
            {pricingFieldConfig.map((field) => (
              <label key={field.key} className="field">
                <span className="field-label">{field.label}</span>

                <div className="input-wrap">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={values[field.key]}
                    onChange={handleNumericChange(field.key)}
                    placeholder="0"
                    aria-label={field.label}
                  />
                  <span className="field-suffix">{field.suffix}</span>
                </div>

                <small>{field.help}</small>
              </label>
            ))}
          </div>

          {numericValues.invalidMarketplaceRate && (
            <p className="error-text">
              A taxa de marketplace deve ser menor que 100%.
            </p>
          )}
        </form>

        <aside className="panel result-panel">
          <div className="panel-header">
            <h2>Resumo do cálculo</h2>
            <button type="button" className="primary-button" onClick={copySummary}>
              Copiar resumo
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
            <ResultItem
              label={`Marketplace (${formatNumber(numericValues.marketplacePercent)}%)`}
              value={formatCurrency(numericValues.marketplaceCost)}
            />
          </div>

          <div className="total-card">
            <span>Preço final sugerido</span>
            <strong>{formatCurrency(numericValues.salePrice)}</strong>
            <p>
              Esse valor já considera material, energia, custos extras, lucro e
              a comissão do marketplace sobre o preço final de venda.
            </p>
          </div>
        </aside>
      </section>

      <section className="panel quote-panel">
        <div className="panel-header">
          <h2>Dados do orçamento</h2>
          <button
            type="button"
            className="primary-button"
            onClick={generatePdf}
            disabled={isGeneratingPdf || numericValues.invalidMarketplaceRate}
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
            <small>Esse nome aparecerá no topo do PDF.</small>
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
                placeholder="Descreva a peça, cor, acabamento, quantidade e observações."
                rows={5}
                aria-label="Descrição do produto"
              />
            </div>
            <small>Essa descrição aparecerá no corpo do orçamento.</small>
          </label>

          <label className="field">
            <span className="field-label">Validade do orçamento</span>
            <div className="input-wrap">
              <input
                type="date"
                value={values.quoteExpiryDate}
                onChange={handleTextChange('quoteExpiryDate')}
                aria-label="Validade do orçamento"
              />
            </div>
            <small>Defina até quando esse valor será válido.</small>
          </label>
        </div>
      </section>

      <section className="pdf-preview-wrapper">
        <div ref={pdfRef} className="pdf-preview">
          <header className="pdf-header">
            <div className="pdf-brand">
              {uploadedLogo ? (
                <img
                  src={uploadedLogo}
                  alt="Logo da empresa"
                  className="pdf-logo"
                />
              ) : (
                <div className="pdf-logo-placeholder">Logo</div>
              )}

              <div>
                <span className="pdf-company-name">
                  {values.companyName || 'Nome da empresa'}
                </span>
                <strong>Orçamento de impressão 3D</strong>
              </div>
            </div>

            <div className="pdf-meta">
              <span>Cliente: {values.clientName || 'Não informado'}</span>
              <span>Validade: {formatDate(values.quoteExpiryDate)}</span>
            </div>
          </header>

          <section className="pdf-section">
            <h3>Descrição do produto</h3>
            <p>{values.productDescription || 'Descrição não informada.'}</p>
          </section>

          <section className="pdf-section">
            <h3>Resumo financeiro</h3>
            <div className="pdf-summary">
              <div>
                <span>Custo do filamento</span>
                <strong>{formatCurrency(numericValues.materialCost)}</strong>
              </div>
              <div>
                <span>Custo de energia</span>
                <strong>{formatCurrency(numericValues.energyCost)}</strong>
              </div>
              <div>
                <span>Embalagem</span>
                <strong>{formatCurrency(numericValues.packagingCost)}</strong>
              </div>
              <div>
                <span>Outros custos</span>
                <strong>{formatCurrency(numericValues.otherCosts)}</strong>
              </div>
              <div>
                <span>Lucro</span>
                <strong>{formatCurrency(numericValues.profitValue)}</strong>
              </div>
              <div>
                <span>Marketplace</span>
                <strong>{formatCurrency(numericValues.marketplaceCost)}</strong>
              </div>
              <div className="pdf-total">
                <span>Valor total</span>
                <strong>{formatCurrency(numericValues.salePrice)}</strong>
              </div>
            </div>
          </section>
        </div>
      </section>
    </main>
  )
}