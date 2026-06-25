import { useEffect, useState, useRef } from 'react'
import BreadboardCanvas from '../components/BreadboardCanvas'

const backendUrl = import.meta.env.VITE_BACKEND_URL ?? 'http://localhost:8000'

/* ── inline styles as objects ── */
const S = {
  page: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    minHeight: '100vh',
    background: '#f8f5f1',
    fontFamily: "'Inter', 'Segoe UI', sans-serif",
  },

  /* ── top header bar ── */
  topBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 28px',
    background: 'white',
    borderBottom: '1px solid #e5e1db',
    gap: '16px',
    flexShrink: 0,
  },
  topBarLeft: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  breadcrumb: {
    fontSize: '12px',
    color: '#9ca3af',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  pageTitle: {
    fontSize: '20px',
    fontWeight: 700,
    color: '#111827',
    margin: 0,
  },
  topBarRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  btnOutline: {
    padding: '8px 18px',
    borderRadius: '10px',
    border: '1.5px solid #d1d5db',
    background: 'white',
    color: '#374151',
    fontWeight: 600,
    fontSize: '13px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  btnPrimary: {
    padding: '8px 18px',
    borderRadius: '10px',
    border: 'none',
    background: '#f59e0b',
    color: 'white',
    fontWeight: 700,
    fontSize: '13px',
    cursor: 'pointer',
    transition: 'all 0.15s',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    boxShadow: '0 2px 8px rgba(245,158,11,0.3)',
  },

  /* ── 3-column grid ── */
  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1.6fr 1fr',
    gap: '0',
    flex: 1,
    overflow: 'hidden',
  },

  /* ── panel shared ── */
  panel: {
    display: 'flex',
    flexDirection: 'column',
    background: 'white',
    borderRight: '1px solid #e5e1db',
    overflow: 'hidden',
  },
  panelLast: {
    borderRight: 'none',
  },
  panelHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 18px',
    borderBottom: '1px solid #f0ece6',
    flexShrink: 0,
  },
  panelTitle: {
    fontSize: '14px',
    fontWeight: 700,
    color: '#111827',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  panelBody: {
    flex: 1,
    overflow: 'auto',
    padding: '0',
  },

  /* ── esquema (left panel) ── */
  schemaBody: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    gap: '16px',
    height: '100%',
  },
  schemaImg: {
    width: '100%',
    maxHeight: '100%',
    objectFit: 'contain',
    borderRadius: '12px',
    background: '#f9fafb',
    border: '1px solid #f0ece6',
  },
  schemaPlaceholder: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    color: '#9ca3af',
    gap: '12px',
    textAlign: 'center',
  },

  /* ── protoboard (center) ── */
  protoboardBody: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    overflow: 'hidden',
  },

  /* ── step list (right) ── */
  stepList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0',
    flex: 1,
    overflow: 'auto',
    padding: '0',
  },
  stepItem: (isActive) => ({
    display: 'flex',
    gap: '14px',
    padding: '16px 18px',
    cursor: 'pointer',
    borderBottom: '1px solid #f3f0eb',
    background: isActive ? '#fffbeb' : 'white',
    borderLeft: isActive ? '3px solid #f59e0b' : '3px solid transparent',
    transition: 'all 0.15s ease',
  }),
  stepNumber: (isActive) => ({
    minWidth: '28px',
    height: '28px',
    borderRadius: '50%',
    background: isActive ? '#f59e0b' : '#f3f4f6',
    color: isActive ? 'white' : '#6b7280',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 700,
    fontSize: '13px',
    flexShrink: 0,
  }),
  stepTitle: {
    fontWeight: 600,
    fontSize: '13px',
    color: '#111827',
    marginBottom: '4px',
    lineHeight: 1.3,
  },
  stepDesc: {
    fontSize: '12px',
    color: '#6b7280',
    lineHeight: 1.5,
  },
  stepNav: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '14px 18px',
    borderTop: '1px solid #f0ece6',
    flexShrink: 0,
  },

  /* ── toggle group ── */
  toggleGroup: {
    display: 'flex',
    background: '#f3f4f6',
    borderRadius: '8px',
    padding: '2px',
    gap: '2px',
  },
  toggleBtn: (isActive) => ({
    padding: '4px 12px',
    borderRadius: '6px',
    border: 'none',
    background: isActive ? 'white' : 'transparent',
    color: isActive ? '#111827' : '#9ca3af',
    fontWeight: 600,
    fontSize: '11px',
    cursor: 'pointer',
    boxShadow: isActive ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
    transition: 'all 0.15s',
  }),

  /* ── error bar ── */
  errorBar: {
    padding: '10px 18px',
    background: '#fef2f2',
    color: '#991b1b',
    fontSize: '13px',
    borderBottom: '1px solid #fecaca',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },

  /* ── hidden file input ── */
  hiddenInput: {
    display: 'none',
  },
}


export default function Labs() {
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [currentStep, setCurrentStep] = useState(0)
  const [viewMode, setViewMode] = useState('flat') // 'flat' | 'json'
  const fileInputRef = useRef(null)

  useEffect(() => {
    if (!file) {
      setPreviewUrl('')
      return undefined
    }
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  const handleFileChange = (event) => {
    const selectedFile = event.target.files?.[0]
    setFile(selectedFile ?? null)
    setError('')
    setResult(null)
  }

  const handleSubmit = async () => {
    if (!file) {
      setError('Selecciona una imagen antes de analizar.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const formData = new FormData()
      formData.append('file', file)
      const response = await fetch(`${backendUrl}/extract`, {
        method: 'POST',
        body: formData,
      })
      if (!response.ok) {
        const message = await response.text()
        throw new Error(message || 'No se pudo generar el JSON.')
      }
      const data = await response.json()
      setResult(data)
      setCurrentStep(0)
    } catch (requestError) {
      setError(requestError.message || 'Error al conectar con el backend.')
    } finally {
      setLoading(false)
    }
  }

  const activeComponentId =
    result?.project?.assembly_steps?.[currentStep]?.component_id ?? null

  const steps = result?.project?.assembly_steps ?? []
  const totalSteps = steps.length

  const circuitTitle = result
    ? 'Intérprete del circuito'
    : 'Laboratorio de circuitos'

  return (
    <div style={S.page}>
      {/* ═══════ TOP HEADER BAR ═══════ */}
      <div style={S.topBar}>
        <div style={S.topBarLeft}>
          <div style={S.breadcrumb}>
            <span>◇</span>
            <span>Laboratorios</span>
            <span>›</span>
            <span style={{ color: '#6b7280' }}>Análisis</span>
          </div>
          <h1 style={S.pageTitle}>{circuitTitle}</h1>
        </div>

        <div style={S.topBarRight}>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            style={S.hiddenInput}
          />
          <button
            style={S.btnOutline}
            onClick={() => fileInputRef.current?.click()}
          >
            📎 Subir esquema
          </button>
          <button
            style={{
              ...S.btnPrimary,
              opacity: loading ? 0.7 : 1,
              cursor: loading ? 'wait' : 'pointer',
            }}
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? '⏳ Analizando...' : '⚡ Analiza y genera'}
          </button>
        </div>
      </div>

      {/* Error bar */}
      {error && (
        <div style={S.errorBar}>
          <span>⚠️</span> {error}
        </div>
      )}

      {/* File selected indicator */}
      {file && !result && !loading && (
        <div style={{ padding: '8px 18px', background: '#eff6ff', color: '#1e40af', fontSize: '12px', borderBottom: '1px solid #bfdbfe', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span>📄</span> Archivo seleccionado: <strong>{file.name}</strong> — Presiona "Analiza y genera" para continuar.
        </div>
      )}

      {/* ═══════ 3-COLUMN GRID ═══════ */}
      <div style={S.grid}>

        {/* ───── LEFT: Esquema ───── */}
        <div style={S.panel}>
          <div style={S.panelHeader}>
            <span style={S.panelTitle}>
              <span style={{ fontSize: '16px' }}>📐</span> Esquema
            </span>
            {previewUrl && (
              <div style={S.toggleGroup}>
                <button style={S.toggleBtn(true)}>🔍</button>
              </div>
            )}
          </div>
          <div style={{ ...S.panelBody, ...S.schemaBody }}>
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Esquema del circuito"
                style={S.schemaImg}
              />
            ) : (
              <div style={S.schemaPlaceholder}>
                <div style={{ fontSize: '48px', opacity: 0.3 }}>📐</div>
                <p style={{ fontSize: '14px', fontWeight: 500 }}>Sin esquema cargado</p>
                <p style={{ fontSize: '12px', color: '#b0aaa0' }}>
                  Sube una imagen del circuito para comenzar
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ───── CENTER: Protoboard ───── */}
        <div style={S.panel}>
          <div style={S.panelHeader}>
            <span style={S.panelTitle}>
              <span style={{ fontSize: '16px' }}>🔌</span> Protoboard
            </span>
            <div style={S.toggleGroup}>
              <button
                style={S.toggleBtn(viewMode === 'flat')}
                onClick={() => setViewMode('flat')}
              >
                ◎ Flat
              </button>
              <button
                style={S.toggleBtn(viewMode === 'json')}
                onClick={() => setViewMode('json')}
              >
                {'{ } JSON'}
              </button>
            </div>
          </div>
          <div style={S.protoboardBody}>
            {viewMode === 'flat' ? (
              result?.project?.circuit ? (
                <BreadboardCanvas
                  circuit={result.project.circuit}
                  activeComponentId={activeComponentId}
                />
              ) : (
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flex: 1, background: '#faf8f5', color: '#b0aaa0',
                }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '48px', marginBottom: '12px', opacity: 0.3 }}>🔌</div>
                    <p style={{ fontSize: '14px', fontWeight: 500, color: '#9ca3af' }}>
                      La protoboard aparecerá aquí
                    </p>
                    <p style={{ fontSize: '12px', color: '#c0b8ac' }}>
                      Sube un esquema y presiona "Analiza y genera"
                    </p>
                  </div>
                </div>
              )
            ) : (
              <pre style={{
                margin: 0, padding: '20px', background: '#0f172a', color: '#e2e8f0',
                overflow: 'auto', flex: 1, fontSize: '12px', lineHeight: 1.6,
              }}>
                {result ? JSON.stringify(result, null, 2) : 'El JSON aparecerá aquí.'}
              </pre>
            )}

            {/* Bottom info bar */}
            {result?.project?.circuit && viewMode === 'flat' && (
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 18px', borderTop: '1px solid #f0ece6', fontSize: '12px', color: '#6b7280',
                flexShrink: 0, background: 'white',
              }}>
                <span>
                  <strong>Componentes:</strong> {result.project.circuit.components?.length ?? 0}
                  {' · '}
                  <strong>Conexiones:</strong> {result.project.circuit.connections?.length ?? 0}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  📋 Bill of Materials
                </span>
              </div>
            )}
          </div>
        </div>

        {/* ───── RIGHT: Paso a paso ───── */}
        <div style={{ ...S.panel, ...S.panelLast }}>
          <div style={S.panelHeader}>
            <span style={S.panelTitle}>
              <span style={{ fontSize: '16px' }}>📝</span> Paso a paso
            </span>
            {totalSteps > 0 && (
              <span style={{ fontSize: '11px', color: '#9ca3af', fontWeight: 600 }}>
                {currentStep + 1} / {totalSteps}
              </span>
            )}
          </div>

          {totalSteps > 0 ? (
            <>
              <div style={S.stepList}>
                {steps.map((step, index) => (
                  <div
                    key={step.step_number}
                    style={S.stepItem(currentStep === index)}
                    onClick={() => setCurrentStep(index)}
                  >
                    <div style={S.stepNumber(currentStep === index)}>
                      {step.step_number}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={S.stepTitle}>{step.title}</p>
                      <p style={S.stepDesc}>{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Navigation */}
              <div style={S.stepNav}>
                <button
                  onClick={() => setCurrentStep((s) => Math.max(0, s - 1))}
                  disabled={currentStep === 0}
                  style={{
                    ...S.btnOutline,
                    opacity: currentStep === 0 ? 0.4 : 1,
                    cursor: currentStep === 0 ? 'not-allowed' : 'pointer',
                  }}
                >
                  Anterior
                </button>
                <button
                  onClick={() => setCurrentStep((s) => Math.min(totalSteps - 1, s + 1))}
                  disabled={currentStep === totalSteps - 1}
                  style={{
                    ...S.btnPrimary,
                    opacity: currentStep === totalSteps - 1 ? 0.5 : 1,
                    cursor: currentStep === totalSteps - 1 ? 'not-allowed' : 'pointer',
                  }}
                >
                  Siguiente
                </button>
              </div>
            </>
          ) : (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flex: 1, color: '#b0aaa0', padding: '20px',
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '48px', marginBottom: '12px', opacity: 0.3 }}>📝</div>
                <p style={{ fontSize: '14px', fontWeight: 500, color: '#9ca3af' }}>
                  Sin instrucciones
                </p>
                <p style={{ fontSize: '12px', color: '#c0b8ac' }}>
                  Los pasos de ensamblaje aparecerán aquí
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}