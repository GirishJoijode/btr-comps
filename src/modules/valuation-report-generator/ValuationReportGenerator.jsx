import { useCallback, useEffect, useRef, useState } from 'react'
import { Loading } from '../../components/common/States'
import ModuleSwitcher from '../ModuleSwitcher'
import { valuationReportMeta } from './meta'
import { parseOliveArrayBuffer } from './parser/parseOliveWorkbook'
import { money, number, sqft } from './utils/formatters'
import { buildPdfFilename } from './utils/filename'
import './styles/module.css'

const ACCEPT = '.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

export default function ValuationReportGenerator({
  activeModuleId,
  onModuleChange,
  logoutControl,
}) {
  const inputRef = useRef(null)
  const objectUrlRef = useRef(null)
  const [dragOver, setDragOver] = useState(false)
  const [phase, setPhase] = useState('idle')
  const [message, setMessage] = useState('')
  const [warnings, setWarnings] = useState([])
  const [model, setModel] = useState(null)
  const [sheets, setSheets] = useState([])
  const [checks, setChecks] = useState([])
  const [download, setDownload] = useState(null)

  const clearObjectUrl = () => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current)
      objectUrlRef.current = null
    }
  }

  useEffect(() => () => clearObjectUrl(), [])

  const handleFile = useCallback(async (file) => {
    if (!file) return
    clearObjectUrl()
    setDownload(null)
    setModel(null)
    setSheets([])
    setChecks([])
    setWarnings([])
    setMessage('')

    const name = (file.name || '').toLowerCase()
    if (!name.endsWith('.xlsx')) {
      setPhase('invalid')
      setMessage('Please upload an .xlsx OLIVE valuation export.')
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
        return
      }
      setModel(nextModel)
      setSheets(parsed.sheets || [])
      setChecks(validation.checksPassed || [])
      setWarnings(validation.warnings || [])
      setPhase('ready')
    } catch {
      setPhase('invalid')
      setMessage(
        'Invalid OLIVE valuation export. The workbook structure does not match the expected report template.'
      )
    }
  }, [])

  const generate = async () => {
    if (!model) return
    try {
      setPhase('generating')
      setMessage('')
      const { generateValuationPdfBlob } = await import('./pdf/generatePdf.js')
      const blob = await generateValuationPdfBlob(model)
      clearObjectUrl()
      const url = URL.createObjectURL(blob)
      objectUrlRef.current = url
      setDownload({ url, name: buildPdfFilename(model) })
      setPhase('generated')
    } catch {
      setPhase('error')
      setMessage('The report could not be generated from this workbook. Please try again or check the export.')
    }
  }

  const onDrop = (event) => {
    event.preventDefault()
    setDragOver(false)
    const file = event.dataTransfer.files?.[0]
    handleFile(file)
  }

  const busy = phase === 'reading' || phase === 'validating' || phase === 'generating'
  const showSummary = model && (phase === 'ready' || phase === 'generating' || phase === 'generated' || phase === 'error')

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
              Generate valuation summary reports from OLIVE exports. The workbook is read and
              converted to PDF entirely in your browser — nothing is uploaded.
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
                    ? 'Generating report...'
                    : phase === 'validating'
                      ? 'Validating workbook…'
                      : 'Reading workbook…'
                }
              />
            </div>
          ) : null}

          {(phase === 'invalid' || phase === 'error') && message ? (
            <div className="vrg-status vrg-status--error" role="alert">
              <h3>{phase === 'invalid' ? 'Invalid workbook' : 'Generation error'}</h3>
              <p>{message}</p>
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
              <div className="vrg-actions">
                <button
                  type="button"
                  className="btn btn--primary"
                  onClick={generate}
                  disabled={phase === 'generating'}
                >
                  {phase === 'generated' ? 'Regenerate PDF' : 'Generate PDF'}
                </button>
                {download && (
                  <a className="btn btn--ghost" href={download.url} download={download.name}>
                    Download PDF
                  </a>
                )}
                <button type="button" className="btn btn--ghost" onClick={() => inputRef.current?.click()}>
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
