import { useMemo, useRef, useState } from 'react'
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'

const initialPricingValues = {
  printHours: '',
  energyPrice: '',
  printerWatts: '',
  packagingCost: '',
  otherCosts: '',
  profitPercent: '',
  marketplacePercent: '',
  companyName: '',
  clientName: '',
  productDescription: '',
  quoteExpiryDate: '',
}

const initialFilamentRows = [
  { id: 1, name: '', filamentKgPrice: '', materialGrams: '' },
]

function createFilamentRow(id) {
  return { id, name: '', filamentKgPrice: '', materialGrams: '' }
}

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
  const [filaments, setFilaments] = useState(initialFilamentRows)
  const [uploadedLogo, setUploadedLogo] = useState('')
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false)
  const pdfRef = useRef(null)

  const numericValues = useMemo(() => {
    const printHours = parsePositiveNumber(values.printHours)
    const energyPrice = parsePositiveNumber(values.energyPrice)
    const printerWatts = parsePositiveNumber(values.printerWatts)
    const packagingCost = parsePositiveNumber(values.packagingCost)
    const otherCosts = parsePositiveNumber(values.otherCosts)
    const profitPercent = parsePositiveNumber(values.profitPercent)
    const marketplacePercent = parsePositiveNumber(values.marketplacePercent)

    const materialBreakdown = filaments.map((item) => {
      const filamentKgPrice = parsePositiveNumber(item.filamentKgPrice)
      const materialGrams = parsePositiveNumber(item.materialGrams)
      const subtotal = (materialGrams / 1000) * filamentKgPrice
      return {
        ...item,
        filamentKgPrice,
        materialGrams,
        subtotal,
      }
    })

    const materialCost = materialBreakdown.reduce((total, item) => total + item.subtotal, 0)
    const energyCost = (printerWatts / 1000) * printHours * energyPrice
    const totalCost = materialCost + energyCost + packagingCost + otherCosts
    const profitValue = totalCost * (profitPercent / 100)

    const desiredNetValue = totalCost + profitValue
    const marketplaceRate = marketplacePercent / 100

    const salePrice = marketplaceRate >= 1 ? 0 : desiredNetValue / (1 - marketplaceRate)
    const marketplaceCost = salePrice * marketplaceRate

    return {
      materialBreakdown,
      materialCost,
      energyCost,
      packagingCost,
      otherCosts,
      totalCost,
      profitPercent,
      profitValue,
      printHours,
      energyPrice,
      printerWatts,
      marketplacePercent,
      marketplaceCost,
      salePrice,
    }
  }, [values, filaments])

  const handleChange = (field) => (event) => {
    const { value } = event.target
    if (
      ['printHours', 'energyPrice', 'printerWatts', 'packagingCost', 'otherCosts', 'profitPercent', 'marketplacePercent'].includes(field)
    ) {
      if (!/^[0-9]*[.,]?[0-9]*$/.test(value) && value !== '') return
    }
    setValues((current) => ({ ...current, [field]: value }))
  }

  const addFilament = () => {
    const newId = Date.now()
    setFilaments((current) => [...current, createFilamentRow(newId)])
  }

  const removeFilament = (id) => {
    setFilaments((current) => current.filter((item) => item.id !== id))
  }

  const updateFilament = (id, key, value) => {
    if (key !== 'name' && !/^[0-9]*[.,]?[0-9]*$/.test(value) && value !== '') return
    setFilaments((current) =>
      current.map((item) => (item.id === id ? { ...item, [key]: value } : item)),
    )
  }

  const handleLogoUpload = (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result
      if (typeof result === 'string') {
        setUploadedLogo(result)
      }
    }
    reader.readAsDataURL(file)
  }

  const generatePdf = async () => {
    if (!pdfRef.current) return
    try {
      setIsGeneratingPdf(true)

      const element = pdfRef.current

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
      })

      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF('p', 'mm', 'a4')
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()

      const imgProps = pdf.getImageProperties(imgData)
      const pdfWidth = pageWidth
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width

      const marginTop = 8

      pdf.addImage(imgData, 'PNG', 0, marginTop, pdfWidth, pdfHeight)
      pdf.save('orcamento-impressao-3d.pdf')
    } catch (error) {
      console.error('Erro ao gerar PDF:', error)
    } finally {
      setIsGeneratingPdf(false)
    }
  }

  const currentDate = useMemo(() => new Date(), [])
  const currentDateFormatted = useMemo(
    () => new Intl.DateTimeFormat('pt-BR').format(currentDate),
    [currentDate],
  )

  return (
    <div className="app-shell">
      <div className="container">
        <button type="button" className="back-link" onClick={onBack}>
          ← Voltar para escolher ferramenta
        </button>

        <section className="hero-card">
          <div>
            <div className="eyebrow">Precificador de impressão 3D</div>
            <h1>Calcule o preço justo da sua peça em segundos.</h1>
            <p>
              Informe o custo do filamento, energia, embalagem e sua margem de lucro. A ferramenta sugere
              um preço final já considerando marketplace, se você quiser.
            </p>
          </div>
          <aside className="hero-badge">
            <span>Resumo da simulação</span>
            <strong>{formatCurrency(numericValues.salePrice || 0)}</strong>
            <span>
              Valor sugerido de venda com base nos custos informados e na margem de lucro desejada.
            </span>
          </aside>
        </section>

        <section className="content-grid">
          <section className="panel">
            <header className="panel-header">
              <h2>Custos da impressão</h2>
            </header>

            <div className="form-grid">
              <fieldset className="field field-full">
                <legend className="field-label">Filamentos utilizados</legend>
                <small>
                  Adicione uma linha para cada cor ou tipo de filamento usada nesta impressão, informando nome,
                  valor do kg e peso consumido.
                </small>
                <div className="filament-list">
                  <div className="filament-list-head">
                    <h3>Materiais</h3>
                    <button type="button" className="ghost-button" onClick={addFilament}>
                      + Adicionar filamento
                    </button>
                  </div>

                  {filaments.map((item, index) => (
                    <div key={item.id} className="filament-row">
                      <div className="filament-row-header">
                        <label className="field filament-name-field">
                          <span className="field-label">Nome do filamento</span>
                          <div className="input-wrap">
                            <input
                              type="text"
                              value={item.name}
                              onChange={(e) => updateFilament(item.id, 'name', e.target.value)}
                              placeholder="Ex.: PLA Preto"
                            />
                          </div>
                        </label>
                        {filaments.length > 1 && (
                          <button
                            type="button"
                            className="remove-button"
                            onClick={() => removeFilament(item.id)}
                          >
                            Remover
                          </button>
                        )}
                      </div>

                      <div className="filament-grid">
                        <label className="field">
                          <span className="field-label">Valor do kg do filamento</span>
                          <div className="input-wrap">
                            <input
                              type="text"
                              inputMode="decimal"
                              value={item.filamentKgPrice}
                              onChange={(e) =>
                                updateFilament(item.id, 'filamentKgPrice', e.target.value)
                              }
                              placeholder="0"
                            />
                            <span className="field-suffix">R$</span>
                          </div>
                          <small>Ex.: 95,00 por kg</small>
                        </label>

                        <label className="field">
                          <span className="field-label">Material usado na impressão</span>
                          <div className="input-wrap">
                            <input
                              type="text"
                              inputMode="decimal"
                              value={item.materialGrams}
                              onChange={(e) =>
                                updateFilament(item.id, 'materialGrams', e.target.value)
                              }
                              placeholder="0"
                            />
                            <span className="field-suffix">g</span>
                          </div>
                          <small>Peso usado nessa cor/filamento.</small>
                        </label>
                      </div>

                      <div className="filament-subtotal">
                        <span>Subtotal deste filamento</span>
                        <strong>{formatCurrency(item.subtotal || 0)}</strong>
                      </div>
                    </div>
                  ))}
                </div>
              </fieldset>

              <label className="field">
                <span className="field-label">Duração da impressão</span>
                <div className="input-wrap">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={values.printHours}
                    onChange={handleChange('printHours')}
                    placeholder="0"
                  />
                  <span className="field-suffix">h</span>
                </div>
                <small>Tempo total estimado da impressão da peça.</small>
              </label>

              <label className="field">
                <span className="field-label">Valor da energia (kWh)</span>
                <div className="input-wrap">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={values.energyPrice}
                    onChange={handleChange('energyPrice')}
                    placeholder="0"
                  />
                  <span className="field-suffix">R$/kWh</span>
                </div>
                <small>Valor do kWh da sua conta de energia.</small>
              </label>

              <label className="field">
                <span className="field-label">Consumo médio da impressora</span>
                <div className="input-wrap">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={values.printerWatts}
                    onChange={handleChange('printerWatts')}
                    placeholder="0"
                  />
                  <span className="field-suffix">W</span>
                </div>
                <small>Consumo médio em watts (W) durante a impressão.</small>
              </label>

              <div className="secondary-grid field-full">
                <label className="field">
                  <span className="field-label">Custo de embalagem</span>
                  <div className="input-wrap">
                    <input
                      type="text"
                      inputMode="decimal"
                      value={values.packagingCost}
                      onChange={handleChange('packagingCost')}
                      placeholder="0"
                    />
                    <span className="field-suffix">R$</span>
                  </div>
                  <small>Caixa, plástico bolha, etiquetas, etc.</small>
                </label>

                <label className="field">
                  <span className="field-label">Outros custos</span>
                  <div className="input-wrap">
                    <input
                      type="text"
                      inputMode="decimal"
                      value={values.otherCosts}
                      onChange={handleChange('otherCosts')}
                      placeholder="0"
                    />
                    <span className="field-suffix">R$</span>
                  </div>
                  <small>Lixa, primer, pintura, deslocamento, etc.</small>
                </label>
              </div>

              <label className="field">
                <span className="field-label">Lucro desejado</span>
                <div className="input-wrap">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={values.profitPercent}
                    onChange={handleChange('profitPercent')}
                    placeholder="0"
                  />
                  <span className="field-suffix">%</span>
                </div>
                <small>Margem de lucro sobre o custo total da peça.</small>
              </label>

              <label className="field">
                <span className="field-label">Taxa do marketplace (opcional)</span>
                <div className="input-wrap">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={values.marketplacePercent}
                    onChange={handleChange('marketplacePercent')}
                    placeholder="0"
                  />
                  <span className="field-suffix">%</span>
                </div>
                <small>
                  Taxa cobrada por plataformas como Mercado Livre, Shopee, etc. Deixe em branco ou 0 se não
                  for vender por marketplace.
                </small>
              </label>
            </div>
          </section>

          <aside className="panel result-panel">
            <header className="panel-header">
              <h2>Resumo dos custos</h2>
            </header>

            <div className="result-list">
              <ResultItem
                label="Custo total de filamento"
                value={formatCurrency(numericValues.materialCost || 0)}
              />
              <ResultItem
                label={`Energia (${formatNumber(numericValues.printerWatts || 0)} W × ${formatNumber(
                  numericValues.printHours || 0,
                )} h)`}
                value={formatCurrency(numericValues.energyCost || 0)}
              />
              <ResultItem label="Embalagem" value={formatCurrency(numericValues.packagingCost || 0)} />
              <ResultItem label="Outros custos" value={formatCurrency(numericValues.otherCosts || 0)} />
              <ResultItem
                label="Custo total da peça"
                value={formatCurrency(numericValues.totalCost || 0)}
                highlight
              />
              <ResultItem
                label={`Lucro (${formatNumber(numericValues.profitPercent || 0)}%)`}
                value={formatCurrency(numericValues.profitValue || 0)}
              />
              {numericValues.marketplacePercent > 0 && (
                <ResultItem
                  label={`Taxa do marketplace (${formatNumber(
                    numericValues.marketplacePercent || 0,
                  )}%)`}
                  value={formatCurrency(numericValues.marketplaceCost || 0)}
                />
              )}
            </div>

            <section className="total-card">
              <span>Preço final sugerido</span>
              <strong>{formatCurrency(numericValues.salePrice || 0)}</strong>
              <p>
                Valor sugerido de venda considerando todos os custos, a margem de lucro desejada e, se
                informado, a taxa do marketplace.
              </p>
            </section>

            <section className="panel quote-panel">
              <header className="panel-header">
                <h2>Dados para o orçamento em PDF</h2>
              </header>

              <div className="quote-grid">
                <label className="field">
                  <span className="field-label">Nome da sua empresa (opcional)</span>
                  <div className="input-wrap">
                    <input
                      type="text"
                      value={values.companyName}
                      onChange={handleChange('companyName')}
                      placeholder="Ex.: Estúdio 3D XYZ"
                    />
                  </div>
                </label>

                <label className="field">
                  <span className="field-label">Nome do cliente</span>
                  <div className="input-wrap">
                    <input
                      type="text"
                      value={values.clientName}
                      onChange={handleChange('clientName')}
                      placeholder="Ex.: João Silva"
                    />
                  </div>
                </label>

                <label className="field field-full">
                  <span className="field-label">Descrição do produto</span>
                  <div className="textarea-wrap">
                    <textarea
                      value={values.productDescription}
                      onChange={handleChange('productDescription')}
                      placeholder="Ex.: Bustos de personagem em PLA, 15 cm de altura, acabamento liso, impressão em alta qualidade."
                    />
                  </div>
                </label>

                <label className="field">
                  <span className="field-label">Data de validade do orçamento</span>
                  <div className="input-wrap">
                    <input
                      type="date"
                      value={values.quoteExpiryDate}
                      onChange={handleChange('quoteExpiryDate')}
                    />
                  </div>
                  <small>Data até quando este valor será válido.</small>
                </label>

                <label className="field">
                  <span className="field-label">Logo da empresa (opcional)</span>
                  <div className="file-input-wrap">
                    <input type="file" accept="image/*" onChange={handleLogoUpload} />
                  </div>
                  <small>JPG ou PNG, será exibida no topo do PDF.</small>
                </label>
              </div>

              <div className="header-actions" style={{ marginTop: 16 }}>
                <button
                  type="button"
                  className="primary-button"
                  onClick={generatePdf}
                  disabled={isGeneratingPdf}
                >
                  {isGeneratingPdf ? 'Gerando PDF...' : 'Gerar orçamento em PDF'}
                </button>
              </div>
            </section>
          </aside>
        </section>

        {/* Prévia / container oculto para o PDF */}
        <div
          ref={pdfRef}
          className="pdf-preview pdf-export-only"
          aria-hidden="true"
        >
          <header className="pdf-header">
            <div className="pdf-brand">
              {uploadedLogo ? (
                <img src={uploadedLogo} alt="Logo da empresa" className="pdf-logo" />
              ) : (
                <div className="pdf-logo-placeholder">LOGO</div>
              )}
              <div>
                {values.companyName && (
                  <span className="pdf-company-name">{values.companyName}</span>
                )}
                <strong>Orçamento de impressão 3D</strong>
              </div>
            </div>
            <div className="pdf-meta">
              <span>Data: {currentDateFormatted}</span>
              <span>Validade: {formatDate(values.quoteExpiryDate)}</span>
              {values.clientName && <span>Cliente: {values.clientName}</span>}
            </div>
          </header>

          <section className="pdf-section">
            <h3>Descrição do produto</h3>
            <p>
              {values.productDescription ||
                'Descrição detalhada da peça, materiais, dimensões e acabamento a combinar.'}
            </p>
          </section>

          <section className="pdf-section">
            <h3>Resumo de custos</h3>
            <div className="pdf-summary pdf-summary-single">
              <div>
                <span>Custo total da peça</span>
                <strong>{formatCurrency(numericValues.totalCost || 0)}</strong>
              </div>
            </div>
          </section>

          <section className="pdf-section">
            <h3>Valor do orçamento</h3>
            <div className="pdf-summary">
              <div className="pdf-total">
                <span>Preço final sugerido</span>
                <strong>{formatCurrency(numericValues.salePrice || 0)}</strong>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}