import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Check, User, Lock, Mail } from 'lucide-react'
import { useTranslation } from '../utils/i18n'
import { apiFetch } from '../utils/apiFetch'
import useAppStore from '../store/useAppStore'
import './Survey.css'

const backendUrl = import.meta.env.VITE_BACKEND_URL || (window.location.hostname === 'localhost' ? 'http://localhost:8000' : '/api')

// ============================================================
//  Question Data
// ============================================================
const QUESTIONS = [
  {
    id: 1,
    type: 'single',
    question: '¿Cuál es tu experiencia con la electrónica?',
    options: [
      'Nunca he estudiado electrónica.',
      'He visto algunos conceptos en el colegio o la universidad.',
      'He realizado algunos montajes básicos.',
      'Tengo experiencia construyendo circuitos.',
    ],
    scores: [0, 1, 2, 3],
    diagnostic: false,
  },
  {
    id: 2,
    type: 'single',
    question: '¿Has utilizado una protoboard anteriormente?',
    options: [
      'No, nunca la he utilizado.',
      'Solo sé qué es.',
      'Sí, algunas veces.',
      'Sí, la uso con frecuencia.',
    ],
    scores: [0, 1, 2, 3],
    diagnostic: false,
  },
  {
    id: 3,
    type: 'multiple',
    question: '¿Qué te gustaría aprender con Elektra?',
    hint: 'Selecciona todas las que apliquen.',
    options: [
      'Comprender conceptos básicos.',
      'Aprender a leer diagramas electrónicos.',
      'Construir circuitos en protoboard.',
      'Resolver problemas de electrónica.',
      'Programar Arduino.',
      'Prepararme para una materia.',
      'Aprender por curiosidad.',
      'Mejorar mis habilidades profesionales.',
    ],
    diagnostic: false,
  },
  {
    id: 4,
    type: 'single',
    question: '¿Conoces la Ley de Ohm?',
    options: [
      'No la conozco.',
      'He escuchado hablar de ella.',
      'La conozco, pero necesito repasarla.',
      'Sí, puedo aplicarla para resolver ejercicios.',
    ],
    scores: [0, 1, 2, 3],
    diagnostic: true,
  },
  {
    id: 5,
    type: 'single',
    question: '¿Cuál es la función principal de la resistencia?',
    subtitle: 'Observa el siguiente circuito.',
    image: '/circuit_question.png',
    options: [
      'Limitar la corriente.',
      'Almacenar energía.',
      'Encender el LED.',
      'Generar voltaje.',
    ],
    correctAnswer: 0,
    scores: [3, 0, 0, 0],
    diagnostic: true,
  },
  {
    id: 6,
    type: 'single',
    question: '¿Qué problema presenta este montaje?',
    subtitle: 'Observa esta protoboard.',
    image: '/protoboard_error.png',
    options: [
      'El LED está invertido.',
      'Falta una resistencia.',
      'Todo está correctamente conectado.',
      'La fuente tiene demasiado voltaje.',
    ],
    correctAnswer: 0,
    scores: [3, 0, 0, 0],
    diagnostic: true,
  },
  {
    id: 7,
    type: 'single',
    question: 'Si un LED no enciende, ¿qué harías primero?',
    options: [
      'Revisar las conexiones.',
      'Cambiar inmediatamente todos los componentes.',
      'Aumentar el voltaje.',
      'No sabría qué hacer.',
    ],
    scores: [3, 1, 0, 0],
    diagnostic: true,
  },
  {
    id: 8,
    type: 'scale',
    question: '¿Qué tanto te sientes cómodo interpretando diagramas electrónicos?',
    options: [
      { emoji: '😟', label: 'Nunca los entiendo.' },
      { emoji: '🙁', label: 'Me cuesta bastante.' },
      { emoji: '😐', label: 'Entiendo algunos.' },
      { emoji: '🙂', label: 'Los interpreto con facilidad.' },
      { emoji: '😎', label: 'Podría construir un circuito a partir de uno.' },
    ],
    scores: [1, 2, 3, 4, 5],
    diagnostic: true,
  },
  {
    id: 9,
    type: 'multiple',
    question: '¿Cómo prefieres aprender?',
    hint: 'Selecciona máximo dos opciones.',
    maxSelections: 2,
    options: [
      'Retos cortos.',
      'Videos.',
      'Explicaciones paso a paso.',
      'Simulaciones.',
      'Construyendo circuitos.',
      'Resolviendo problemas.',
      'Proyectos completos.',
    ],
    diagnostic: false,
  },
  {
    id: 10,
    type: 'single',
    question: '¿Cuánto tiempo piensas dedicarle a Elektra?',
    options: [
      'Menos de 15 minutos por sesión.',
      'Entre 15 y 30 minutos.',
      'Entre 30 y 60 minutos.',
      'Más de una hora.',
    ],
    scores: [0, 1, 2, 3],
    diagnostic: false,
  },
]

const QUESTIONS_PER_PAGE = 2
const TOTAL_SURVEY_PAGES = Math.ceil(QUESTIONS.length / QUESTIONS_PER_PAGE)
// Total pages = 1 (registration) + survey pages
const TOTAL_PAGES = 1 + TOTAL_SURVEY_PAGES

// ============================================================
//  Level Calculation
// ============================================================
function calculateLevel(answers) {
  let diagnosticScore = 0
  let maxDiagnostic = 0

  QUESTIONS.forEach((q) => {
    if (!q.diagnostic) return
    const answer = answers[q.id]
    if (answer == null) return

    if (q.type === 'scale') {
      diagnosticScore += q.scores[answer]
      maxDiagnostic += 5
    } else {
      diagnosticScore += q.scores[answer] || 0
      maxDiagnostic += 3
    }
  })

  const percentage = maxDiagnostic > 0 ? diagnosticScore / maxDiagnostic : 0

  if (percentage >= 0.7) return 'Avanzado'
  if (percentage >= 0.35) return 'Intermedio'
  return 'Principiante'
}

// ============================================================
//  Component
// ============================================================
export default function Survey() {
  const navigate = useNavigate()
  const setUser = useAppStore((state) => state.setUser)

  // Page 0 = registration, pages 1+ = survey questions
  const [currentPage, setCurrentPage] = useState(0)
  const [answers, setAnswers] = useState({})
  const [result, setResult] = useState(null)
  const [saving, setSaving] = useState(false)

  // Registration state
  const [regEmail, setRegEmail] = useState('')
  const [regPassword, setRegPassword] = useState('')
  const [regConfirmPassword, setRegConfirmPassword] = useState('')
  const [regName, setRegName] = useState('')
  const [regError, setRegError] = useState('')
  const [regLoading, setRegLoading] = useState(false)

  const progress = ((currentPage + 1) / TOTAL_PAGES) * 100

  // Survey page index (0-based, offset by 1 because page 0 is registration)
  const surveyPageIndex = currentPage - 1
  const startIdx = surveyPageIndex * QUESTIONS_PER_PAGE
  const pageQuestions = currentPage > 0
    ? QUESTIONS.slice(startIdx, startIdx + QUESTIONS_PER_PAGE)
    : []

  // Check if current page's questions are answered
  const canProceedSurvey = currentPage === 0 || pageQuestions.every((q) => {
    const a = answers[q.id]
    if (q.type === 'multiple') return a && a.length > 0
    return a != null
  })

  // Registration validation
  const canRegister = regEmail && regPassword && regPassword.length >= 4 && regPassword === regConfirmPassword

  const handleSingleSelect = (questionId, optionIndex) => {
    setAnswers((prev) => ({ ...prev, [questionId]: optionIndex }))
  }

  const handleMultipleSelect = (questionId, optionIndex, maxSelections) => {
    setAnswers((prev) => {
      const current = prev[questionId] || []
      if (current.includes(optionIndex)) {
        return { ...prev, [questionId]: current.filter((i) => i !== optionIndex) }
      }
      if (maxSelections && current.length >= maxSelections) return prev
      return { ...prev, [questionId]: [...current, optionIndex] }
    })
  }

  // Handle registration
  const handleRegister = async () => {
    setRegError('')
    setRegLoading(true)

    try {
      // 1. Register user
      const registerRes = await apiFetch(`${backendUrl}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: regEmail,
          password: regPassword,
          full_name: regName || null,
        }),
      })

      // 2. Auto-login
      const loginForm = new URLSearchParams()
      loginForm.append('username', regEmail)
      loginForm.append('password', regPassword)

      const loginRes = await apiFetch(`${backendUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: loginForm,
      })

      const tokenData = await loginRes.json()
      localStorage.setItem('access_token', tokenData.access_token)

      // 3. Get user profile
      const userRes = await apiFetch(`${backendUrl}/auth/me`, {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      })

      const userData = await userRes.json()
      setUser(userData)

      // 4. Proceed to questions
      setCurrentPage(1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err) {
      setRegError(err.message)
    } finally {
      setRegLoading(false)
    }
  }

  const handleNext = async () => {
    if (currentPage === 0) {
      // Registration page -> register first
      await handleRegister()
      return
    }

    if (surveyPageIndex < TOTAL_SURVEY_PAGES - 1) {
      setCurrentPage((p) => p + 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      // Calculate and save
      const level = calculateLevel(answers)
      setSaving(true)

      try {
        const token = localStorage.getItem('access_token')
        if (token) {
          await apiFetch(`${backendUrl}/auth/profile`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ skill_level: level }),
          })
        }
      } catch (err) {
        console.error('Error guardando nivel:', err)
      }

      setSaving(false)
      setResult(level)
    }
  }

  const handleBack = () => {
    if (currentPage > 1) {
      // Don't go back to registration once registered
      setCurrentPage((p) => p - 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  // ============================================================
  //  Result Screen
  // ============================================================
  if (result) {
    const descriptions = {
      Principiante:
        'Estás comenzando tu camino en la electrónica. Elektra te guiará paso a paso con conceptos básicos y ejercicios sencillos.',
      Intermedio:
        'Ya tienes una buena base. Te presentaremos retos más desafiantes y proyectos que ampliarán tus habilidades.',
      Avanzado:
        '¡Impresionante! Tienes conocimientos sólidos. Te propondremos proyectos complejos y problemas de ingeniería.',
    }
    const icons = { Principiante: '🌱', Intermedio: '⚡', Avanzado: '🚀' }

    return (
      <div className="survey-page">
        <div className="survey-progress">
          <div className="survey-progress__bar" style={{ width: '100%' }} />
        </div>
        <div className="survey-container">
          <div className="survey-header">
            <img src="/logo.svg" alt="Elektra" className="survey-header__logo" onError={(e) => { e.target.style.display = 'none' }} />
          </div>
          <div className="survey-result">
            <div className="survey-result__icon">{icons[result]}</div>
            <h2 className="survey-result__title">¡Listo! Ya te conocemos</h2>
            <span className={`survey-result__level survey-result__level--${result.toLowerCase()}`}>
              Nivel: {result}
            </span>
            <p className="survey-result__desc">{descriptions[result]}</p>
            <button className="survey-result__btn" onClick={() => navigate('/app')}>
              Comenzar a usar Elektra →
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ============================================================
  //  Registration + Questions Screen
  // ============================================================
  return (
    <div className="survey-page">
      {/* Progress */}
      <div className="survey-progress">
        <div className="survey-progress__bar" style={{ width: `${progress}%` }} />
      </div>

      <div className="survey-container">
        {/* Header */}
        <div className="survey-header">
          <img src="/logo.svg" alt="Elektra" className="survey-header__logo" onError={(e) => { e.target.style.display = 'none' }} />
          <h1 className="survey-header__title">
            {currentPage === 0 ? 'Crea tu cuenta' : 'Cuéntanos sobre tu experiencia'}
          </h1>
          <p className="survey-header__subtitle">
            {currentPage === 0
              ? 'Regístrate para personalizar tu experiencia de aprendizaje.'
              : 'La IA personalizará tu aprendizaje basado en tus respuestas.'}
          </p>
        </div>

        {/* ==================== PAGE 0: Registration Form ==================== */}
        {currentPage === 0 && (
          <div className="survey-question" style={{ animationDelay: '0s' }}>
            <div className="survey-options" style={{ gap: '16px' }}>
              {/* Name */}
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <User size={18} style={{ position: 'absolute', left: '16px', color: '#9CA3AF', pointerEvents: 'none' }} />
                <input
                  type="text"
                  placeholder="Nombre completo (opcional)"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '14px 16px 14px 44px',
                    borderRadius: '12px',
                    border: '2px solid #E5E7EB',
                    fontSize: '15px',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                    background: '#F9FAFB',
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#3B82F6'}
                  onBlur={(e) => e.target.style.borderColor = '#E5E7EB'}
                />
              </div>

              {/* Email */}
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Mail size={18} style={{ position: 'absolute', left: '16px', color: '#9CA3AF', pointerEvents: 'none' }} />
                <input
                  type="email"
                  placeholder="Correo electrónico"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '14px 16px 14px 44px',
                    borderRadius: '12px',
                    border: '2px solid #E5E7EB',
                    fontSize: '15px',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                    background: '#F9FAFB',
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#3B82F6'}
                  onBlur={(e) => e.target.style.borderColor = '#E5E7EB'}
                />
              </div>

              {/* Password */}
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Lock size={18} style={{ position: 'absolute', left: '16px', color: '#9CA3AF', pointerEvents: 'none' }} />
                <input
                  type="password"
                  placeholder="Contraseña (mínimo 4 caracteres)"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '14px 16px 14px 44px',
                    borderRadius: '12px',
                    border: '2px solid #E5E7EB',
                    fontSize: '15px',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                    background: '#F9FAFB',
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#3B82F6'}
                  onBlur={(e) => e.target.style.borderColor = '#E5E7EB'}
                />
              </div>

              {/* Confirm Password */}
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Lock size={18} style={{ position: 'absolute', left: '16px', color: '#9CA3AF', pointerEvents: 'none' }} />
                <input
                  type="password"
                  placeholder="Confirmar contraseña"
                  value={regConfirmPassword}
                  onChange={(e) => setRegConfirmPassword(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '14px 16px 14px 44px',
                    borderRadius: '12px',
                    border: regConfirmPassword && regPassword !== regConfirmPassword ? '2px solid #EF4444' : '2px solid #E5E7EB',
                    fontSize: '15px',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                    background: '#F9FAFB',
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#3B82F6'}
                  onBlur={(e) => e.target.style.borderColor = regConfirmPassword && regPassword !== regConfirmPassword ? '#EF4444' : '#E5E7EB'}
                />
              </div>

              {regConfirmPassword && regPassword !== regConfirmPassword && (
                <p style={{ fontSize: '13px', color: '#EF4444', margin: '0 0 0 4px' }}>
                  Las contraseñas no coinciden.
                </p>
              )}

              {regError && (
                <p style={{ fontSize: '13px', color: '#EF4444', margin: '0 0 0 4px', textAlign: 'center' }}>
                  ⚠️ {regError}
                </p>
              )}
            </div>

            <p style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '16px', textAlign: 'center' }}>
              ¿Ya tienes una cuenta?{' '}
              <span
                style={{ color: '#2563EB', cursor: 'pointer', fontWeight: 600 }}
                onClick={() => navigate('/')}
              >
                Iniciar sesión
              </span>
            </p>
          </div>
        )}

        {/* ==================== PAGES 1+: Survey Questions ==================== */}
        {currentPage > 0 && pageQuestions.map((q, qi) => (
          <div className="survey-question" key={q.id} style={{ animationDelay: `${qi * 0.1}s` }}>
            {/* Number + Title */}
            <div>
              <span className="survey-question__number">
                {String(q.id).padStart(2, '0')}
              </span>
              <span className="survey-question__text">{q.question}</span>
            </div>
            {q.hint && <p className="survey-question__hint">{q.hint}</p>}
            {q.subtitle && (
              <p style={{ fontSize: '14px', color: '#6B7280', marginTop: '8px', marginLeft: '50px' }}>
                {q.subtitle}
              </p>
            )}
            {q.image && <img src={q.image} alt="Diagrama" className="survey-question__image" />}

            {/* Single-select options */}
            {q.type === 'single' && (
              <div className="survey-options">
                {q.options.map((opt, oi) => (
                  <div
                    key={oi}
                    className={`survey-option ${answers[q.id] === oi ? 'selected' : ''}`}
                    onClick={() => handleSingleSelect(q.id, oi)}
                  >
                    <div className="survey-option__radio">
                      <div className="survey-option__radio-dot" />
                    </div>
                    <span className="survey-option__label">{opt}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Multiple-select options */}
            {q.type === 'multiple' && (
              <div className="survey-options">
                {q.options.map((opt, oi) => {
                  const selected = (answers[q.id] || []).includes(oi)
                  return (
                    <div
                      key={oi}
                      className={`survey-option ${selected ? 'selected' : ''}`}
                      onClick={() => handleMultipleSelect(q.id, oi, q.maxSelections)}
                    >
                      <div className="survey-option__checkbox">
                        {selected && <Check size={14} />}
                      </div>
                      <span className="survey-option__label">{opt}</span>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Scale options */}
            {q.type === 'scale' && (
              <div className="survey-scale">
                {q.options.map((opt, oi) => (
                  <div
                    key={oi}
                    className={`survey-scale__item ${answers[q.id] === oi ? 'selected' : ''}`}
                    onClick={() => handleSingleSelect(q.id, oi)}
                  >
                    <span className="survey-scale__emoji">{opt.emoji}</span>
                    <span className="survey-scale__label">{opt.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Bottom Navigation */}
      <div className="survey-nav">
        <div className="survey-nav__inner">
          <button
            className="survey-nav__btn-back"
            onClick={currentPage === 0 ? () => navigate('/') : handleBack}
            disabled={currentPage === 1}
          >
            {currentPage === 0 ? '← Volver' : 'Atrás'}
          </button>
          <span className="survey-nav__page">
            {currentPage + 1} / {TOTAL_PAGES}
          </span>
          <button
            className="survey-nav__btn-next"
            onClick={handleNext}
            disabled={
              currentPage === 0
                ? (!canRegister || regLoading)
                : (!canProceedSurvey || saving)
            }
          >
            {currentPage === 0
              ? (regLoading ? 'Creando cuenta...' : 'Crear cuenta')
              : saving
                ? 'Guardando...'
                : currentPage === TOTAL_PAGES - 1
                  ? 'Finalizar'
                  : 'Siguiente'}
            {!saving && !regLoading && <ArrowRight size={16} />}
          </button>
        </div>
      </div>
    </div>
  )
}