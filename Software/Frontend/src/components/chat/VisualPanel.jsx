import { useEffect, useRef } from 'react'
import useChatStore from '../../store/useChatStore'
import BreadboardCanvas from '../BreadboardCanvas'
import { Share2, MoreHorizontal, MessageSquare, Cpu, MapPin, ClipboardList, Copy, Loader2, RefreshCw, Maximize2, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { copyToClipboard } from '../../utils/copyToClipboard'
import { useTranslation } from '../../utils/i18n'

export default function VisualPanel() {
  const {
    extractResult,
    currentStep,
    setCurrentStep,
    extractLoading,
    chatPanelCollapsed,
    toggleChatPanel,
    stepsPanelCollapsed,
    toggleStepsPanel,
  } = useChatStore()

  const { t, lang } = useTranslation()

  const circuit = extractResult?.project?.circuit
  const steps = extractResult?.project?.assembly_steps ?? []
  const totalSteps = steps.length
  const components = circuit?.components ?? []
  const connections = circuit?.connections ?? []

  const activeComponentId = steps[currentStep]?.component_id ?? null
  const currentStepData = steps[currentStep] ?? null

  const activeStepRef = useRef(null)

  // Auto-scroll active step in sidebar into view
  useEffect(() => {
    if (activeStepRef.current) {
      activeStepRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }, [currentStep])

  return (
    <div className="visual-panel">
      {/* Header */}
      <div className="visual-panel__header">
        <div className="visual-panel__header-left">
          <h2 className="visual-panel__title">
            {lang === 'es' ? 'Conversión a Protoboard' : 'Breadboard Conversion'}
          </h2>
          <p className="visual-panel__subtitle">
            {extractLoading
              ? (lang === 'es' ? '⏳ Analizando tu esquema y generando el montaje...' : '⏳ Analyzing your schematic and generating assembly...')
              : circuit
                ? (lang === 'es' ? `${components.length} componentes · ${connections.length} conexiones` : `${components.length} components · ${connections.length} connections`)
                : (lang === 'es' ? 'El asistente está interpretando tu esquema.' : 'Assistant is interpreting your schematic.')}
          </p>
        </div>
        <div className="visual-panel__header-actions">
          {totalSteps > 0 && (
            <button
              className={`visual-panel__action-btn ${!stepsPanelCollapsed ? 'visual-panel__action-btn--active' : ''}`}
              onClick={toggleStepsPanel}
              title={!stepsPanelCollapsed ? (lang === 'es' ? 'Ocultar pasos' : 'Hide steps') : (lang === 'es' ? 'Ver pasos' : 'Show steps')}
              style={{
                background: !stepsPanelCollapsed ? '#2563EB' : 'white',
                color: !stepsPanelCollapsed ? 'white' : '#374151',
                borderColor: !stepsPanelCollapsed ? '#2563EB' : '#E5E7EB',
                fontWeight: 600,
              }}
            >
              <ClipboardList size={16} />
              <span>{lang === 'es' ? 'Pasos' : 'Steps'}</span>
            </button>
          )}
          <button className="visual-panel__action-btn">
            <Share2 size={16} />
            {lang === 'es' ? 'Compartir' : 'Share'}
          </button>
          <button className="visual-panel__more-btn" title={lang === 'es' ? 'Más opciones' : 'More options'}>
            <MoreHorizontal size={18} />
          </button>
          <button
            className={`visual-panel__chat-toggle ${chatPanelCollapsed ? 'visual-panel__chat-toggle--active' : ''}`}
            onClick={toggleChatPanel}
            title={chatPanelCollapsed ? (lang === 'es' ? 'Abrir chat' : 'Open chat') : (lang === 'es' ? 'Cerrar chat' : 'Close chat')}
          >
            <MessageSquare size={18} />
          </button>
        </div>
      </div>

      {/* Body Layout */}
      <div className="visual-panel__body">
        <div className="visual-panel__layout">
          {/* Main Area: Protoboard + Coordenadas */}
          <div className="visual-panel__main">
            {/* Protoboard View Card */}
            <div className="visual-section" style={{ display: 'flex', flexDirection: 'column' }}>
              <div className="visual-section__header">
                <div>
                  <div className="visual-section__title">
                    <Cpu size={18} style={{ color: '#2563eb' }} />
                    {t('protoView')}
                  </div>
                  <span className="visual-section__subtitle">
                    {circuit
                      ? t('protoSubtitleCircuit')
                      : t('protoSubtitleNoCircuit')}
                  </span>
                </div>
                <div className="visual-section__actions">
                  <button className="visual-section__icon-btn" title={lang === 'es' ? 'Actualizar' : 'Refresh'}>
                    <RefreshCw size={14} />
                  </button>
                  <button className="visual-section__icon-btn" title={lang === 'es' ? 'Expandir' : 'Expand'}>
                    <Maximize2 size={14} />
                  </button>
                </div>
              </div>

              {/* Canvas or Loading Placeholder */}
              {circuit ? (
                <div style={{ height: '400px', overflow: 'hidden' }}>
                  <BreadboardCanvas
                    circuit={circuit}
                    activeComponentId={activeComponentId}
                  />
                </div>
              ) : (
                <div className="visual-protoboard" style={{ padding: '40px 0' }}>
                  {extractLoading ? (
                    <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <Loader2 className="premium-spinner" size={32} style={{ color: '#2563eb', marginBottom: '12px' }} />
                      <span style={{ fontSize: '14px', color: '#6B7280' }}>{t('protoLoading')}</span>
                    </div>
                  ) : (
                    <Cpu size={48} style={{ color: '#94a3b8', opacity: 0.5 }} />
                  )}
                </div>
              )}

              {/* Quick Step Navigator under Protoboard Canvas */}
              {totalSteps > 0 && currentStepData && (
                <div className="visual-panel__step-bar">
                  <button
                    onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                    disabled={currentStep === 0}
                    className="visual-panel__action-btn"
                    style={{ opacity: currentStep === 0 ? 0.3 : 1, padding: '6px 12px' }}
                  >
                    <ChevronLeft size={16} />
                    <span>{t('stepPrev')}</span>
                  </button>

                  <div style={{ textAlign: 'center', flex: 1, padding: '0 12px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#F59E0B', textTransform: 'uppercase', tracking: '0.05em' }}>
                      {lang === 'es' ? `Paso ${currentStep + 1} de ${totalSteps}` : `Step ${currentStep + 1} of ${totalSteps}`}
                    </span>
                    <h4 style={{ margin: '2px 0 0 0', fontSize: '14px', fontWeight: 700, color: '#111827' }}>
                      {currentStepData.title}
                    </h4>
                    <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#6B7280', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {currentStepData.description}
                    </p>
                  </div>

                  <button
                    onClick={() => setCurrentStep(Math.min(totalSteps - 1, currentStep + 1))}
                    disabled={currentStep === totalSteps - 1}
                    className="visual-panel__action-btn"
                    style={{
                      opacity: currentStep === totalSteps - 1 ? 0.3 : 1,
                      background: '#F59E0B',
                      color: 'white',
                      border: 'none',
                      padding: '6px 14px',
                      fontWeight: 600,
                    }}
                  >
                    <span>{t('stepNext')}</span>
                    <ChevronRight size={16} />
                  </button>
                </div>
              )}
            </div>

            {/* Coordinates Table */}
            {components.length > 0 && (
              <div className="visual-section">
                <div className="visual-coords">
                  <div className="visual-coords__header">
                    <div className="visual-coords__title">
                      <MapPin size={18} style={{ color: '#2563eb' }} />
                      {t('coordsTitle')}
                    </div>
                    <button className="visual-coords__copy-btn" onClick={() => {
                      const text = components.map(c => {
                        const pos = c.pins ? c.pins.map(p => p.position).filter(Boolean).join(' → ') : '';
                        return `${c.type || c.id}: ${pos}`
                      }).join('\n')
                      copyToClipboard(text)
                    }}>
                      <Copy size={13} style={{ marginRight: '6px' }} />
                      {t('coordsCopyBtn')}
                    </button>
                  </div>

                  <table className="visual-coords__table">
                    <thead>
                      <tr>
                        <th>{t('coordsColComponent')}</th>
                        <th>{t('coordsColPosition')}</th>
                        <th>{t('coordsColDesc')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {components.map((comp, i) => {
                        const posText = comp.pins && comp.pins.length > 0 
                          ? comp.pins.map(p => p.position).filter(Boolean).join(' → ') || '—'
                          : '—';
                        return (
                          <tr key={i}>
                            <td>
                              <div className="visual-coords__component">
                                <span className={`visual-coords__dot visual-coords__dot--${comp.color || 'blue'}`} />
                                {comp.id || comp.type}
                              </div>
                            </td>
                            <td>{posText}</td>
                            <td>{comp.type || '—'}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Assembly Steps Side Panel */}
          {totalSteps > 0 && !stepsPanelCollapsed && (
            <div className="visual-panel__sidebar">
              {/* Sidebar Header */}
              <div style={{
                padding: '16px 20px',
                borderBottom: '1px solid #E5E7EB',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: '#FAFAFA',
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px', fontWeight: 700, color: '#111827' }}>
                    <ClipboardList size={18} style={{ color: '#2563eb' }} />
                    {t('assemblyStepsTitle')}
                  </div>
                  <span style={{ fontSize: '12px', color: '#6B7280' }}>
                    {t('assemblyStepOf', { curr: currentStep + 1, total: totalSteps })}
                  </span>
                </div>
                <button
                  onClick={toggleStepsPanel}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    color: '#6B7280',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '4px',
                    borderRadius: '6px',
                  }}
                  title={lang === 'es' ? 'Cerrar panel de pasos' : 'Close steps panel'}
                >
                  <X size={18} />
                </button>
              </div>

              {/* Progress Bar */}
              <div style={{ height: '3px', background: '#E5E7EB', width: '100%' }}>
                <div style={{
                  height: '100%',
                  background: '#F59E0B',
                  width: `${((currentStep + 1) / totalSteps) * 100}%`,
                  transition: 'width 0.3s ease',
                }} />
              </div>

              {/* Scrollable Step List */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
                {steps.map((step, index) => {
                  const isActive = currentStep === index
                  return (
                    <div
                      key={step.step_number}
                      ref={isActive ? activeStepRef : null}
                      onClick={() => setCurrentStep(index)}
                      style={{
                        display: 'flex',
                        gap: '12px',
                        padding: '12px 16px',
                        cursor: 'pointer',
                        borderBottom: '1px solid #F3F4F6',
                        background: isActive ? 'rgba(245, 158, 11, 0.08)' : 'transparent',
                        borderLeft: isActive ? '3px solid #F59E0B' : '3px solid transparent',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div style={{
                        minWidth: '26px',
                        height: '26px',
                        borderRadius: '50%',
                        background: isActive ? '#F59E0B' : '#F3F4F6',
                        color: isActive ? 'white' : '#6B7280',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '12px',
                        flexShrink: 0,
                      }}>
                        {step.step_number}
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontWeight: isActive ? 700 : 600, fontSize: '13px', color: isActive ? '#92400E' : '#111827', margin: '0 0 2px 0' }}>
                          {step.title}
                        </p>
                        <p style={{ fontSize: '12px', color: isActive ? '#78350F' : '#6B7280', lineHeight: 1.4, margin: 0 }}>
                          {step.description}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Sticky Step Navigation Footer */}
              <div style={{
                display: 'flex',
                gap: '10px',
                padding: '14px 16px',
                borderTop: '1px solid #E5E7EB',
                background: '#FAFAFA',
              }}>
                <button
                  onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                  disabled={currentStep === 0}
                  className="visual-panel__action-btn"
                  style={{ flex: 1, justifyContent: 'center', opacity: currentStep === 0 ? 0.4 : 1 }}
                >
                  <ChevronLeft size={16} />
                  {t('stepPrev')}
                </button>
                <button
                  onClick={() => setCurrentStep(Math.min(totalSteps - 1, currentStep + 1))}
                  disabled={currentStep === totalSteps - 1}
                  className="visual-panel__action-btn"
                  style={{
                    flex: 1,
                    justifyContent: 'center',
                    opacity: currentStep === totalSteps - 1 ? 0.4 : 1,
                    background: '#F59E0B',
                    color: 'white',
                    border: 'none',
                    fontWeight: 600,
                  }}
                >
                  {t('stepNext')}
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
