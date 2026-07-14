import useChatStore from '../../store/useChatStore'
import BreadboardCanvas from '../BreadboardCanvas'
import { Share2, MoreHorizontal, MessageSquare, Cpu, MapPin, ClipboardList, Copy, Loader2, RefreshCw, Maximize2 } from 'lucide-react'
import { useTranslation } from '../../utils/i18n'

export default function VisualPanel() {
  const {
    extractResult,
    currentStep,
    setCurrentStep,
    extractLoading,
    chatPanelCollapsed,
    toggleChatPanel,
  } = useChatStore()

  const { t, lang } = useTranslation()

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

      {/* Body */}
      <div className="visual-panel__body">
        {/* Group header and protoboard canvas to control gap independently from parent's 32px gap */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          {/* Protoboard View */}
          <div className="visual-section">
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
          </div>

          {/* Actual protoboard or placeholder (separated) */}
          {circuit ? (
            <div style={{ height: '400px', overflow: 'hidden' }}>
              <BreadboardCanvas
                circuit={circuit}
                activeComponentId={activeComponentId}
              />
            </div>
          ) : (
            <div className="visual-section">
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
                  navigator.clipboard.writeText(text)
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

        {/* Assembly Steps */}
        {totalSteps > 0 && (
          <div className="visual-section">
            <div className="visual-section__header">
              <div>
                <div className="visual-section__title">
                  <ClipboardList size={18} style={{ color: '#2563eb' }} />
                  {t('assemblyStepsTitle')}
                </div>
                <span className="visual-section__subtitle">
                  {t('assemblyStepOf', { curr: currentStep + 1, total: totalSteps })}
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
                    background: currentStep === index ? 'rgba(245, 158, 11, 0.08)' : 'white',
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
                {t('stepPrev')}
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
                {t('stepNext')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
