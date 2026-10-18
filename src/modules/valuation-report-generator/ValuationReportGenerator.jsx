import { Component, useCallback, useEffect, useRef, useState } from 'react'
import { Loading } from '../../components/common/States'
import ModuleSwitcher from '../ModuleSwitcher'
import { valuationReportMeta } from './meta'
import { parseOliveArrayBuffer } from './parser/parseOliveWorkbook'
import { rejectUpload } from './validation/uploadRules'
import { money, number, sqft } from './utils/formatters'
import { buildPdfFilename, buildPptxFilename } from './utils/filename'
import './styles/module.css'

const ACCEPT = '.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

class ReportModuleBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { failed: false }
  }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error) {
    if (import.meta.env.DEV) {
      console.warn('[valuation-report] module render failed', error?.name || 'Error')
    }
  }

  render() {
    if (this.state.failed) {
      return (
        <div className="app vrg-app">
          <main className="app-main vrg-main">
            <div className="vrg-shell">
              <div className="vrg-status vrg-status--error" role="alert">
                <h3>Generation error</h3>
                <p>Unable to generate the report. Please review the workbook and try again.</p>
                <button type="button" className="btn btn--primary" onClick={() => this.setState({ failed: false })}>
                  Try again
                </button>
              </div>
            </div>
          </main>
        </div>
      )
    }
    return this.props.children
  }
}

export default function ValuationReportGenerator(props) {
  return (
    <ReportModuleBoundary>
      <ValuationReportGeneratorInner {...props} />
    </ReportModuleBoundary>
  )
}

function ValuationReportGeneratorInner({
  activeModuleId,
  onModuleChange,
  logoutControl,
}) {
  const inputRef = useRef(null)
  const pptxUrlRef = useRef(null)
  const pdfUrlRef = useRef(null)
  const failedOutputRef = useRef('pptx')
  const [dragOver, setDragOver] = useState(false)
  const [phase, setPhase] = useState('idle')
  const [outputKind, setOutputKind] = useState('pptx')
  const [message, setMessage] = useState('')
  const [exportError, setExportError] = useState('')
  const [warnings, setWarnings] = useState([])
  const [model, setModel] = useState(null)
  const [sheets, setSheets] = useState([])
  const [checks, setChecks] = useState([])
  const [details, setDetails] = useState([])
  const [pptxFile, setPptxFile] = useState(null)
  const [pdfFile, setPdfFile] = useState(null)

  const releaseUrl = (ref) => {
    if (ref.current) {
      URL.revokeObjectURL(ref.current)
      ref.current = null
    }
  }

  const resetSession = () => {
    releaseUrl(pptxUrlRef)
    releaseUrl(pdfUrlRef)
    setPptxFile(null)
    setPdfFile(null)
    setModel(null)
    setSheets([])
    setChecks([])
    setWarnings([])
    setDetails([])
    setMessage('')
    setExportError('')
    setPhase('idle')
  }

  useEffect(
    () => () => {
      releaseUrl(pptxUrlRef)
      releaseUrl(pdfUrlRef)
    },
    [],
  )

  const handleFile = useCallback(async (file) => {
    if (!file) return
    resetSession()

    const rejected = rejectUpload(file)
    if (rejected) {
      setPhase('invalid')
      setMessage(rejected)
      return
    }

    try {
      setPhase('reading')
      const buffer = await file.arrayBuffer()
      setPhase('validating')
      const parsed = parseOliveArrayBuffer(buffer)
      const { validation, model: nextModel } = parsed
      if (!validation.valid) {
        setPhase('invalid')
        setMessage(
          validation.userMessage ||
            'Invalid OLIVE valuation export. The workbook structure does not match the expected report template.'
        )
        setDetails((validation.errors || []).slice(1))
        setWarnings(validation.warnings || [])
        return
      }
      setModel(nextModel)
      setSheets(parsed.sheets || [])
      setChecks(validation.checksPassed || [])
      setWarnings(validation.warnings || [])
      setPhase('ready')
    } catch (error) {
      if (import.meta.env.DEV) {
        console.warn('[valuation-report] upload failed', error?.name || 'Error')
      }
      setPhase('invalid')
      setMessage('Unable to read this workbook. Please upload a valid OLIVE Excel export.')
    }
  }, [])

  const startDownload = (url, name) => {
    const link = document.createElement('a')
    link.href = url
    link.download = name
    document.body.appendChild(link)
    link.click()
    link.remove()
  }

  const generatePptx = async () => {
    if (!model) return
    failedOutputRef.current = 'pptx'
    try {
      setOutputKind('pptx')
      setPhase('generating')
      setExportError('')
      await new Promise((resolve) => setTimeout(resolve, 0))
      const { generateValuationPptxBlob } = await import('./pptx/generatePptx.js')
      const blob = await generateValuationPptxBlob(model)
      releaseUrl(pptxUrlRef)
      const url = URL.createObjectURL(blob)
      pptxUrlRef.current = url
      const file = { url, name: buildPptxFilename(model) }
      setPptxFile(file)
      setPhase('ready')
      startDownload(url, file.name)
    } catch (error) {
      if (import.meta.env.DEV) {
        console.warn('[valuation-report] powerpoint generation failed', error?.name || 'Error')
      }
      setPhase('ready')
      setExportError('Unable to generate the PowerPoint. Please review the workbook and try again.')
    }
  }

  const generatePdf = async () => {
    if (!model) return
    failedOutputRef.current = 'pdf'
    try {
      setOutputKind('pdf')
      setPhase('generating')
      setExportError('')
      await new Promise((resolve) => setTimeout(resolve, 0))
      const { generateValuationPdfBlob } = await import('./pdf/generatePdf.js')
      const blob = await generateValuationPdfBlob(model)
      releaseUrl(pdfUrlRef)
      const url = URL.createObjectURL(blob)
      pdfUrlRef.current = url
      const file = { url, name: buildPdfFilename(model) }
      setPdfFile(file)
      setPhase('ready')
      startDownload(url, file.name)
    } catch (error) {
      if (import.meta.env.DEV) {
        console.warn('[valuation-report] pdf generation failed', error?.name || 'Error')
      }
      setPhase('ready')
      setExportError('Unable to generate the PDF. Please review the workbook and try again.')
    }
  }

  const retryExport = () => {
    if (failedOutputRef.current === 'pdf') generatePdf()
    else generatePptx()
  }

  const onDrop = (event) => {
    event.preventDefault()
    setDragOver(false)
    const file = event.dataTransfer.files?.[0]
    handleFile(file)
  }

  const busy = phase === 'reading' || phase === 'validating' || phase === 'generating'
  const showSummary = model && (phase === 'ready' || phase === 'generating')

  return (
    <div className="app vrg-app">
      <header className="app-header">
        <ModuleSwitcher
          activeModuleId={activeModuleId}
          onModuleChange={onModuleChange}
          title={valuationReportMeta.title}
          subtitle={valuationReportMeta.subtitle}
        />
        <div className="vrg-header-spacer" />
        <div className="app-header__status">
          <span className="status-dot" aria-hidden="true" />
          Client-side OLIVE export
          {logoutControl}
        </div>
      </header>

      <main className="app-main vrg-main">
        <div className="vrg-shell">
          <div className="vrg-intro">
            <h2>BTR Valuation Report Generator</h2>
            <p>
              Generate an editable PowerPoint valuation summary from an OLIVE export. The workbook
              is read in your browser and nothing is uploaded. A PDF of the same report is available
              as an optional download.
            </p>
          </div>

          <div
            className={`vrg-drop${dragOver ? ' is-over' : ''}`}
            onDragOver={(e) => {
              e.preventDefault()
              setDragOver(true)
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            onClick={() => inputRef.current?.click()}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click()
            }}
          >
            <div className="vrg-drop__title">Drag and drop OLIVE EXPORT.xlsx</div>
            <div className="vrg-drop__hint">or click to choose an Excel file (.xlsx)</div>
            <input
              ref={inputRef}
              className="vrg-file"
              type="file"
              accept={ACCEPT}
              onChange={(e) => {
                handleFile(e.target.files?.[0])
                e.target.value = ''
              }}
            />
          </div>

          {busy ? (
            <div className="vrg-status">
              <Loading
                message={
                  phase === 'generating'
                    ? outputKind === 'pdf'
                      ? 'Preparing PDF...'
                      : 'Preparing PowerPoint...'
                    : phase === 'validating'
                      ? 'Validating workbook…'
                      : 'Reading workbook…'
                }
              />
            </div>
          ) : null}

          {phase === 'invalid' && message ? (
            <div className="vrg-status vrg-status--error" role="alert">
              <h3>Invalid workbook</h3>
              <p>{message}</p>
              {details.length > 0 ? (
                <ul>
                  {details.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}

          {exportError ? (
            <div className="vrg-status vrg-status--error" role="alert">
              <h3>Generation error</h3>
              <p>{exportError}</p>
              <button type="button" className="btn btn--primary" onClick={retryExport}>
                Try again
              </button>
            </div>
          ) : null}

          {showSummary ? (
            <>
              <div className="vrg-status vrg-status--ok">
                <h3>Workbook validated successfully</h3>
                <p>The OLIVE export matches the expected valuation report structure.</p>
                {warnings.length > 0 && (
                  <ul>
                    {warnings.map((w) => (
                      <li key={w}>{w}</li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="vrg-summary">
                <SummaryCard label="Property" value={model.meta.propertyName} />
                <SummaryCard label="Location" value={model.meta.location} />
                <SummaryCard label="Valuation date" value={model.meta.valuationDate} />
                <SummaryCard label="Units" value={number(model.property.units)} />
                <SummaryCard label="Area" value={sqft(model.property.areaSqFt)} />
                <SummaryCard label="Market value" value={money(model.valuation.marketValue)} />
              </div>
              <p className="vrg-output__label">Primary output · PowerPoint (.pptx)</p>
              <div className="vrg-actions">
                <button
                  type="button"
                  className="btn btn--primary vrg-btn-pptx"
                  onClick={generatePptx}
                  disabled={busy}
                >
                  {pptxFile ? 'Regenerate PowerPoint' : 'Generate PowerPoint'}
                </button>
                {pptxFile ? (
                  <a className="btn btn--primary vrg-btn-pptx" href={pptxFile.url} download={pptxFile.name}>
                    Download PowerPoint
                  </a>
                ) : null}
                {pdfFile ? (
                  <a className="btn btn--ghost vrg-btn-pdf" href={pdfFile.url} download={pdfFile.name}>
                    Download PDF
                  </a>
                ) : (
                  <button type="button" className="btn btn--ghost vrg-btn-pdf" onClick={generatePdf} disabled={busy}>
                    Download PDF
                  </button>
                )}
                {pdfFile ? (
                  <button type="button" className="btn btn--ghost vrg-btn-pdf" onClick={generatePdf} disabled={busy}>
                    Regenerate PDF
                  </button>
                ) : null}
                <button type="button" className="btn btn--ghost" onClick={() => inputRef.current?.click()} disabled={busy}>
                  Replace workbook
                </button>
              </div>
              <details className="vrg-debug">
                <summary>Mapping / validation details</summary>
                <ul>
                  {checks.map((check) => (
                    <li key={check}>{check}</li>
                  ))}
                  <li>Sheets: {sheets.join(', ') || '—'}</li>
                  <li>{model.investment?.reason}</li>
                  <li>Property image: {model.images.propertyImage ? 'extracted' : 'not found'}</li>
                  <li>Rental schemes mapped: {model.rentalBenchmarks?.schemeCount ?? 0}</li>
                </ul>
              </details>
            </>
          ) : null}
        </div>
      </main>
    </div>
  )
}

function SummaryCard({ label, value }) {
  return (
    <div className="vrg-summary__card">
      <span className="vrg-summary__label">{label}</span>
      <span className="vrg-summary__value">{value || '—'}</span>
    </div>
  )
}
