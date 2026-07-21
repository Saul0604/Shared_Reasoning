import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Star, Lightbulb, Loader2, Flame } from 'lucide-react'
import useChatStore from '../store/useChatStore'
import useStreakStore from '../store/useStreakStore'
import { useTranslation } from '../utils/i18n'
import { apiFetch } from '../utils/apiFetch'
import './RetoDiario.css'

export default function RetoDiario() {
  const navigate = useNavigate()
  const { user } = useChatStore()
  const { lang } = useTranslation()
  const nivel = user?.skill_level || 'Principiante'

  const [challenge, setChallenge] = useState(null)
  const [loading, setLoading] = useState(true)
  
  // Progress state
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState({}) // stepIndex -> answer
  
  // Results state
  const [showResults, setShowResults] = useState(false)
  const [score, setScore] = useState(0)
  const [streakResult, setStreakResult] = useState(null)
  
  const { streak, completeChallenge } = useStreakStore()
  
  useEffect(() => {
    async function loadChallenge() {
      try {
        setLoading(true)
        const token = localStorage.getItem('access_token')
        const API_URL = import.meta.env.VITE_BACKEND_URL || (window.location.hostname === 'localhost' ? 'http://localhost:8000' : '/api')
        
        const response = await apiFetch(`${API_URL}/challenges/daily?lang=${lang}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        
        const data = await response.json()
        setChallenge(data)
      } catch (err) {
        console.error("Error cargando reto:", err)
      } finally {
        setLoading(false)
      }
    }
    
    // Only load if they haven't completed it today
    if (streak && streak.completed_today) {
      navigate('/app/retos')
    } else {
      loadChallenge()
    }
  }, [lang, streak, navigate])

  if (loading) {
    const displayLevel = nivel.toLowerCase() === 'principiante' 
      ? (lang === 'es' ? 'principiante' : 'beginner') 
      : nivel.toLowerCase() === 'intermedio'
      ? (lang === 'es' ? 'intermedio' : 'intermediate')
      : (lang === 'es' ? 'avanzado' : 'advanced');

    return (
      <div className="reto-diario-page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', color: '#64748b' }}>
          <Loader2 size={32} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
          <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
          <h2>{lang === 'es' ? 'Generando tu reto diario con IA...' : 'Generating your daily challenge with AI...'}</h2>
          <p>{lang === 'es' ? `Adaptando las preguntas para el nivel ${displayLevel}` : `Adapting questions for level: ${displayLevel}`}</p>
        </div>
      </div>
    )
  }

  if (!challenge) {
    return (
      <div className="reto-diario-page">
        <div className="reto-diario-container">
          <h2>{lang === 'es' ? 'Error al cargar el reto.' : 'Error loading the challenge.'}</h2>
          <button className="btn-atras" onClick={() => navigate('/app/retos')}>
            {lang === 'es' ? 'Volver' : 'Back'}
          </button>
        </div>
      </div>
    )
  }

  const question = challenge.questions[step]
  const totalQuestions = challenge.questions.length

  const handleNext = async () => {
    if (step < totalQuestions - 1) {
      setStep(step + 1)
    } else {
      // Calculate score and show results
      if (totalQuestions === 0) {
        navigate('/app/retos')
        return
      }

      let newScore = 0
      challenge.questions.forEach((q, i) => {
        const userAns = answers[i]
        if (q.type === 'multiple_choice') {
          if (userAns !== undefined && userAns === q.correct_answer) newScore += 1
        } else if (q.type === 'matching') {
          // Check if all pairs are matched correctly
          let allCorrect = true
          if (userAns === undefined || userAns === null) {
            allCorrect = false
          } else {
            q.pairs.forEach((pair, pairIdx) => {
              if (userAns[pairIdx] !== pair.term) allCorrect = false
            })
          }
          if (allCorrect) newScore += 1
        }
      })
      setScore(newScore)
      setShowResults(true)
      
      // If all answers correct, register completion in backend
      const passed = newScore === totalQuestions && totalQuestions > 0
      if (passed) {
        const result = await completeChallenge(newScore, totalQuestions, challenge.xp_reward)
        if (result) {
          setStreakResult(result)
        }
      }
    }
  }

  const handlePrev = () => {
    if (step > 0) {
      setStep(step - 1)
    } else {
      navigate('/app/retos')
    }
  }

  // Answer handlers
  const handleMcqSelect = (optIndex) => {
    setAnswers({ ...answers, [step]: optIndex })
  }

  const handleMatchSelect = (pairIndex, selectedTerm) => {
    const currentMatches = answers[step] || {}
    setAnswers({ 
      ...answers, 
      [step]: { ...currentMatches, [pairIndex]: selectedTerm }
    })
  }

  if (showResults) {
    const passed = score === totalQuestions
    return (
      <div className="reto-diario-page">
        <div className="reto-diario-container" style={{ textAlign: 'center', padding: '60px 40px' }}>
          <div style={{ marginBottom: '24px' }}>
            {passed 
              ? <Star size={64} color="#f59e0b" fill="#f59e0b" style={{ margin: '0 auto' }} /> 
              : <Lightbulb size={64} color="#64748b" style={{ margin: '0 auto' }} />
            }
          </div>
          <h1 style={{ fontSize: '32px', fontWeight: '800', marginBottom: '16px' }}>
            {passed 
              ? (lang === 'es' ? '¡Reto Completado!' : 'Challenge Completed!') 
              : (lang === 'es' ? '¡Buen intento!' : 'Good attempt!')}
          </h1>
          <p style={{ fontSize: '18px', color: '#475569', marginBottom: '32px' }}>
            {lang === 'es' 
              ? `Obtuviste ${score} de ${totalQuestions} respuestas correctas.` 
              : `You got ${score} out of ${totalQuestions} correct answers.`}
          </p>
          
          {passed && (
            <div className="xp-pill" style={{ display: 'inline-block', fontSize: '18px', padding: '8px 24px', marginBottom: '16px' }}>
              +{challenge.xp_reward} XP
            </div>
          )}

          {/* Streak display after successful completion */}
          {passed && streakResult && (
            <div className="streak-result-banner">
              <Flame size={24} color="#f59e0b" />
              <span className="streak-result-text">
                {lang === 'es' 
                  ? `🔥 Racha: ${streakResult.current_streak} ${streakResult.current_streak === 1 ? 'día' : 'días'}` 
                  : `🔥 Streak: ${streakResult.current_streak} ${streakResult.current_streak === 1 ? 'day' : 'days'}`}
              </span>
            </div>
          )}

          <div style={{ marginTop: '24px' }}>
            <button className="btn-primary-orange" onClick={() => navigate('/app/retos')}>
              {lang === 'es' ? 'Volver a Retos' : 'Back to Challenges'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  const displayLevel = nivel.toLowerCase() === 'principiante' 
    ? (lang === 'es' ? 'principiante' : 'beginner') 
    : nivel.toLowerCase() === 'intermedio'
    ? (lang === 'es' ? 'intermedio' : 'intermediate')
    : (lang === 'es' ? 'avanzado' : 'advanced');

  return (
    <div className="reto-diario-page">
      <div className="reto-diario-container">
        
        {/* Header Section */}
        <div className="reto-diario-header">
          <span className="pill-nivel">
            {lang === 'es' ? `Nivel ${displayLevel}` : `Level: ${displayLevel}`}
          </span>
          
          <div className="reto-diario-title-row">
            <div>
              <h1>{challenge.title}</h1>
              <p className="reto-diario-subtitle">{challenge.description}</p>
            </div>
            
            <div className="reto-progress-wrapper">
              <div className="reto-progress-labels">
                <span className="label">{lang === 'es' ? 'PROGRESO' : 'PROGRESS'}</span>
                <span className="val">
                  {lang === 'es' 
                    ? `Pregunta ${step + 1} de ${totalQuestions}` 
                    : `Question ${step + 1} of ${totalQuestions}`}
                </span>
              </div>
              <div className="reto-progress-bar-bg">
                <div className="reto-progress-bar-fill" style={{ width: `${((step + 1) / totalQuestions) * 100}%` }} />
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
            <span>
              {lang === 'es' ? 'XP a ganar:' : 'XP to earn:'} <span style={{ color: '#d97706' }}>{challenge.xp_reward}</span>
            </span>
          </div>
          <div className="xp-right">
            <span>{lang === 'es' ? '⚑ Reto generado por IA Elektra' : '⚑ Challenge generated by Elektra AI'}</span>
          </div>
        </div>

        {/* Question Render */}
        {question && (
          <div className="question-card">
            <h3 className="question-title">{question.question}</h3>
            
            {question.hint && (
              <div className="link-pista" style={{ justifyContent: 'flex-start', marginBottom: '16px' }}>
                <Lightbulb size={14} /> {lang === 'es' ? 'Pista:' : 'Hint:'} {question.hint}
              </div>
            )}

            {/* Multiple Choice */}
            {question.type === 'multiple_choice' && question.options && (
              <div className="mcq-options">
                {question.options.map((opt, i) => (
                  <div 
                    key={i} 
                    className={`mcq-option ${answers[step] === i ? 'selected' : ''}`}
                    onClick={() => handleMcqSelect(i)}
                  >
                    {opt}
                  </div>
                ))}
              </div>
            )}

            {/* Matching */}
            {question.type === 'matching' && question.pairs && (
              <div>
                <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px' }}>
                  {lang === 'es' 
                    ? 'Selecciona el concepto correspondiente para cada definición.' 
                    : 'Select the corresponding concept for each definition.'}
                </p>
                {question.pairs.map((pair, i) => (
                  <div key={i} className="matching-row" style={{ marginBottom: '12px', background: 'var(--matching-bg, #f8fafc)', padding: '16px', borderRadius: '12px' }}>
                    <div style={{ flex: 1, fontSize: '14px', color: 'var(--matching-text, #334155)', fontWeight: '500' }}>
                      {pair.definition}
                    </div>
                    <div style={{ flex: 1 }}>
                      <select 
                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', background: 'var(--matching-select-bg, #ffffff)', color: 'var(--matching-select-text, #334155)' }}
                        value={(answers[step] && answers[step][i]) || ""}
                        onChange={(e) => handleMatchSelect(i, e.target.value)}
                      >
                        <option value="" disabled>{lang === 'es' ? 'Selecciona un concepto...' : 'Select a concept...'}</option>
                        {[...question.pairs].sort((a,b) => a.term.localeCompare(b.term)).map((p, termIdx) => (
                          <option key={termIdx} value={p.term}>{p.term}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Actions */}
            <div className="question-actions">
              <button className="btn-atras" onClick={handlePrev}>
                {lang === 'es' ? 'Atrás' : 'Back'}
              </button>
              <button className="btn-siguiente" onClick={handleNext}>
                {step === totalQuestions - 1 
                  ? (lang === 'es' ? 'Finalizar' : 'Finish') 
                  : (lang === 'es' ? 'Siguiente' : 'Next')}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
