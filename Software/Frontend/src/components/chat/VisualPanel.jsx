import useChatStore from '../../store/useChatStore'
import BreadboardCanvas from '../BreadboardCanvas'
import { Share2, MoreHorizontal, MessageSquare } from 'lucide-react'

export default function VisualPanel() {
  const {
    extractResult,
    currentStep,
    setCurrentStep,
    schemaPreviewUrl,
    extractLoading,
    chatPanelCollapsed,
    toggleChatPanel,
  } = useChatStore()

  const circuit = extractResult?.project?.circuit
  const steps = extractResult?.project?.assembly_steps ?? []
  const totalSteps = steps.length
  const components = circuit?.components ?? []
  const connections = circuit?.connections ?? []

  const activeComponentId = steps[currentStep]?.component_id ?? null

  return (
    <div className="visual-panel">
      {/* Header */}
      <div className="visual-panel__header">
        <div className="visual-panel__header-left">
          <h2 className="visual-panel__title">Conversión a Protoboard</h2>
          <p className="visual-panel__subtitle">
            {extractLoading
              ? '⏳ Analizando tu esquema y generando el montaje...'
              : circuit
                ? `${components.length} componentes · ${connections.length} conexiones`
                : 'El asistente está interpretando tu esquema.'}
          </p>
        </div>
        <div className="visual-panel__header-actions">
          <button className="visual-panel__action-btn">
            <Share2 size={16} />
            Compartir
          </button>
          <button className="visual-panel__more-btn" title="Más opciones">
            <MoreHorizontal size={18} />
          </button>
          <button
            className={`visual-panel__chat-toggle ${chatPanelCollapsed ? 'visual-panel__chat-toggle--active' : ''}`}
            onClick={toggleChatPanel}
            title={chatPanelCollapsed ? 'Abrir chat' : 'Cerrar chat'}
          >
            <MessageSquare size={18} />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="visual-panel__body">
        {/* Protoboard View */}
        <div className="visual-section">
          <div className="visual-section__header">
            <div>
              <div className="visual-section__title">
                <span className="visual-section__title-icon">🔌</span>
                Vista Protoboard
              </div>
              <span className="visual-section__subtitle">
                {circuit
                  ? 'Imagen generada por IA a partir de las coordenadas calculadas.'
                  : 'La protoboard aparecerá aquí al analizar un esquema.'}
              </span>
            </div>
            <div className="visual-section__actions">
              <button className="visual-section__icon-btn" title="Actualizar">🔄</button>
              <button className="visual-section__icon-btn" title="Expandir">↗</button>
            </div>
          </div>

          {/* Actual protoboard or placeholder */}
          {circuit ? (
            <div style={{ height: '400px', borderTop: '1px solid #E5E7EB' }}>
              <BreadboardCanvas
                circuit={circuit}
                activeComponentId={activeComponentId}
              />
            </div>
          ) : (
            <div className="visual-protoboard">
              {extractLoading ? (
                <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>⏳</div>
                  <span style={{ fontSize: '14px', color: '#6B7280' }}>Generando protoboard...</span>
                </div>
              ) : (
                <span style={{ position: 'relative', zIndex: 1 }}>🔌</span>
              )}
            </div>
          )}
        </div>

        {/* Coordinates Table */}
        {components.length > 0 && (
          <div className="visual-section">
            <div className="visual-coords">
              <div className="visual-coords__header">
                <div className="visual-coords__title">
                  <span>📍</span>
                  Coordenadas utilizadas
                </div>
                <button className="visual-coords__copy-btn" onClick={() => {
                  const text = components.map(c =>
                    `${c.type || c.id}: ${c.start_hole || ''} → ${c.end_hole || ''}`
                  ).join('\n')
                  navigator.clipboard.writeText(text)
                }}>
                  📋 Copiar todo
                </button>
              </div>

              <table className="visual-coords__table">
                <thead>
                  <tr>
                    <th>Componente</th>
                    <th>Conexión / Posición</th>
                    <th>Descripción</th>
                  </tr>
                </thead>
                <tbody>
                  {components.map((comp, i) => (
                    <tr key={i}>
                      <td>
                        <div className="visual-coords__component">
                          <span className={`visual-coords__dot visual-coords__dot--${comp.color || 'blue'}`} />
                          {comp.id || comp.type}
                        </div>
                      </td>
                      <td>{comp.start_hole || '—'} → {comp.end_hole || '—'}</td>
                      <td>{comp.type || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Assembly Steps */}
        {totalSteps > 0 && (
          <div className="visual-section">
            <div className="visual-section__header">
              <div>
                <div className="visual-section__title">
                  <span className="visual-section__title-icon">📝</span>
                  Pasos de ensamblaje
                </div>
                <span className="visual-section__subtitle">
                  Paso {currentStep + 1} de {totalSteps}
                </span>
              </div>
            </div>
            <div style={{ padding: '0' }}>
              {steps.map((step, index) => (
                <div
                  key={step.step_number}
                  onClick={() => setCurrentStep(index)}
                  style={{
                    display: 'flex',
                    gap: '14px',
                    padding: '14px 20px',
                    cursor: 'pointer',
                    borderBottom: '1px solid #F3F4F6',
                    background: currentStep === index ? '#FFFBEB' : 'white',
                    borderLeft: currentStep === index ? '3px solid #F59E0B' : '3px solid transparent',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{
                    minWidth: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    background: currentStep === index ? '#F59E0B' : '#F3F4F6',
                    color: currentStep === index ? 'white' : '#6B7280',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '13px',
                    flexShrink: 0,
                  }}>
                    {step.step_number}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 600, fontSize: '13px', color: '#111827', marginBottom: '4px' }}>
                      {step.title}
                    </p>
                    <p style={{ fontSize: '12px', color: '#6B7280', lineHeight: 1.5 }}>
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Step navigation */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '12px 20px',
              borderTop: '1px solid #E5E7EB',
            }}>
              <button
                onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                disabled={currentStep === 0}
                className="visual-panel__action-btn"
                style={{ opacity: currentStep === 0 ? 0.4 : 1 }}
              >
                ← Anterior
              </button>
              <button
                onClick={() => setCurrentStep(Math.min(totalSteps - 1, currentStep + 1))}
                disabled={currentStep === totalSteps - 1}
                className="visual-panel__action-btn"
                style={{
                  opacity: currentStep === totalSteps - 1 ? 0.4 : 1,
                  background: '#F59E0B',
                  color: 'white',
                  border: 'none',
                }}
              >
                Siguiente →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
