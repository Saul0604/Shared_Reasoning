import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Star, GripVertical, Lightbulb } from 'lucide-react'
import useChatStore from '../store/useChatStore'
import './RetoDiario.css'

export default function RetoDiario() {
  const navigate = useNavigate()
  const { user } = useChatStore()
  const nivel = user?.skill_level || 'Principiante'

  // Para el mock de las 3 preguntas
  const [step, setStep] = useState(1)

  // Respuestas (mock)
  const [q1, setQ1] = useState(3) // 3 = Limitar flujo
  const [q3, setQ3] = useState(2) // 2 = circuito abierto

  return (
    <div className="reto-diario-page">
      <div className="reto-diario-container">
        
        {/* Header Section */}
        <div className="reto-diario-header">
          <span className="pill-nivel">Nivel {nivel.toLowerCase()}</span>
          
          <div className="reto-diario-title-row">
            <div>
              <h1>Reto diario</h1>
              <p className="reto-diario-subtitle">Aplica tus conocimientos para resolver problemas reales de electrónica.</p>
            </div>
            
            <div className="reto-progress-wrapper">
              <div className="reto-progress-labels">
                <span className="label">PROGRESO</span>
                <span className="val">Pregunta {step + 7} de 10</span>
              </div>
              <div className="reto-progress-bar-bg">
                {/* Visual mock: 80%, 90%, 100% */}
                <div className="reto-progress-bar-fill" style={{ width: `${(step + 7) * 10}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* XP Banner */}
        <div className="xp-banner">
          <div className="xp-left">
            <div className="xp-icon-circle">
              <Star size={16} fill="currentColor" />
            </div>
            <span>XP ganado: <span style={{ color: '#d97706' }}>250</span></span>
          </div>
          <div className="xp-right">
            <span>⚑ Solo faltan dos retos.</span>
          </div>
        </div>

        {/* --- STEP 1: Multiple Choice --- */}
        {step === 1 && (
          <div className="question-card">
            <h3 className="question-title">¿Qué función cumple una resistencia?</h3>
            <div className="mcq-options">
              {[
                'Almacenar energía eléctrica',
                'Aumentar el voltaje del circuito',
                'Crear un campo magnético',
                'Limitar el flujo de corriente'
              ].map((opt, i) => (
                <div 
                  key={i} 
                  className={`mcq-option ${q1 === i ? 'selected' : ''}`}
                  onClick={() => setQ1(i)}
                >
                  {opt}
                </div>
              ))}
            </div>

            <div className="question-actions">
              <button className="btn-atras" onClick={() => navigate('/app/retos')}>Atrás</button>
              <button className="btn-siguiente" onClick={() => setStep(2)}>Siguiente</button>
            </div>
          </div>
        )}

        {/* --- STEP 2: Matching --- */}
        {step === 2 && (
          <div className="question-card">
            <h3 className="question-title" style={{ marginBottom: '4px' }}>Relaciona los conceptos</h3>
            <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '24px' }}>Arrastra el concepto correcto de modo que quede junto a su definición</p>
            
            <div className="matching-row">
              <div className="matching-item"><GripVertical className="drag-handle" size={16} /> Voltaje</div>
              <div className="matching-item">Diferencia de potencial eléctrico</div>
            </div>
            <div className="matching-row">
              <div className="matching-item"><GripVertical className="drag-handle" size={16} /> Corriente</div>
              <div className="matching-item">Flujo de electrones a través de un conductor</div>
            </div>
            <div className="matching-row">
              <div className="matching-item"><GripVertical className="drag-handle" size={16} /> Transistor</div>
              <div className="matching-item">Amplificador de señales eléctricas</div>
            </div>
            <div className="matching-row">
              <div className="matching-item"><GripVertical className="drag-handle" size={16} /> Resistencia</div>
              <div className="matching-item">Oposición frente a la corriente eléctrica</div>
            </div>

            <div className="question-actions">
              <button className="btn-atras" onClick={() => setStep(1)}>Atrás</button>
              <button className="btn-siguiente" onClick={() => setStep(3)}>Siguiente</button>
            </div>
          </div>
        )}

        {/* --- STEP 3: Image Question --- */}
        {step === 3 && (
          <div className="question-card">
            <div className="image-q-layout">
              <img src="/protoboard_error.png" alt="Protoboard" className="image-q-img" />
              
              <div className="image-q-right">
                <div className="link-pista"><Lightbulb size={14} /> Ver pista</div>
                <h3 className="question-title">¿Qué problema presenta el montaje?</h3>
                
                <div className="grid-options-2x2">
                  {[
                    'El LED está conectado al revés',
                    'Falta la resistencia de protección',
                    'El circuito está abierto (cable desconectado).',
                    'El montaje es correcto'
                  ].map((opt, i) => (
                    <div 
                      key={i} 
                      className={`mcq-option ${q3 === i ? 'selected' : ''}`}
                      onClick={() => setQ3(i)}
                    >
                      {opt}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="question-actions">
              <button className="btn-atras" onClick={() => setStep(2)}>Atrás</button>
              <button className="btn-siguiente" onClick={() => navigate('/app/retos')}>Finalizar</button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
