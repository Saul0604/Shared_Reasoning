import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Clock, BarChart, Star, Award, Calendar, CheckCircle2, 
  MessageSquare, Lock, BookOpen, Zap, Lightbulb, Trophy, Brain
} from 'lucide-react'
import useChatStore from '../store/useChatStore'
import useStreakStore from '../store/useStreakStore'
import { useTranslation } from '../utils/i18n'
import './Retos.css'

export default function Retos() {
  const { user } = useChatStore()
  const navigate = useNavigate()
  const { lang } = useTranslation()
  
  // Load streak data from backend
  const { streak, streakLoading, loadStreak, weeklyProgress, weeklyLoading, loadWeeklyProgress } = useStreakStore()
  
  useEffect(() => {
    loadStreak()
    loadWeeklyProgress()
  }, [])
  
  // Icon and color config for each weekly progress category
  const progressConfig = {
    retos: { icon: <Trophy size={14} color="#f59e0b" />, color: '#f59e0b' },
    interacciones: { icon: <MessageSquare size={14} color="#3b82f6" />, color: '#3b82f6' },
    laboratorios: { icon: <Zap size={14} color="#10b981" />, color: '#10b981' },
  }
  
  const getLevelLabel = (level) => {
    if (!level) return lang === 'es' ? 'Principiante' : 'Beginner';
    const lvlLower = level.toLowerCase();
    if (lvlLower === 'principiante' || lvlLower === 'beginner') {
      return lang === 'es' ? 'Principiante' : 'Beginner';
    }
    if (lvlLower === 'intermedio' || lvlLower === 'intermediate') {
      return lang === 'es' ? 'Intermedio' : 'Intermediate';
    }
    if (lvlLower === 'avanzado' || lvlLower === 'advanced') {
      return lang === 'es' ? 'Avanzado' : 'Advanced';
    }
    return level;
  }

  // Define the progression badges and required XP
  const BADGES = [
    { id: 1, reqXp: 150, titleEs: 'Primer Circuito', titleEn: 'First Circuit', icon: Lightbulb, color: '#d97706', bg: '#fef3c7' },
    { id: 2, reqXp: 500, titleEs: 'Maestro del LED', titleEn: 'LED Master', icon: Zap, color: '#2563eb', bg: '#dbeafe' },
    { id: 3, reqXp: 1000, titleEs: 'Experto en Resistencias', titleEn: 'Resistor Expert', icon: Trophy, color: '#059669', bg: '#d1fae5' },
    { id: 4, reqXp: 2000, titleEs: 'Energía Constante', titleEn: 'Constant Power', icon: BookOpen, color: '#7c3aed', bg: '#ede9fe' },
    { id: 5, reqXp: 3500, titleEs: 'Constructor', titleEn: 'Builder', icon: Award, color: '#ea580c', bg: '#ffedd5' },
    { id: 6, reqXp: 5000, titleEs: 'Ingeniero Maestro', titleEn: 'Master Engineer', icon: Brain, color: '#be185d', bg: '#fce7f3' }
  ]

  // Calculate next reward based on total_xp
  const totalXp = streak.total_xp || 0
  const nextBadge = BADGES.find(b => totalXp < b.reqXp)
  const xpNeeded = nextBadge ? nextBadge.reqXp - totalXp : 0

  return (
    <div className="retos-page">
      <div className="retos-header">
        <h1>{lang === 'es' ? 'Retos' : 'Challenges'}</h1>
        <p>
          {lang === 'es' 
            ? 'Aprende todos los días completando desafíos, desbloqueando insignias y manteniendo tu progreso.' 
            : 'Learn every day by completing challenges, unlocking badges, and keeping your progress.'}
        </p>
      </div>

      {/* Reto del Dia */}
      <div className="retos-card reto-dia-section">
        <div className="reto-dia-header">
          <h2>{lang === 'es' ? 'Reto del día' : 'Challenge of the Day'}</h2>
          {streak.completed_today 
            ? <span className="tag-completado">✅ {lang === 'es' ? 'Completado' : 'Completed'}</span>
            : <span className="tag-nuevo">{lang === 'es' ? '🔥 Nuevo' : '🔥 New'}</span>
          }
        </div>
        <p className="reto-dia-desc">
          {lang === 'es' 
            ? 'Construye un circuito en serie con dos resistencias y un LED utilizando el simulador de Elektra. Identifica el voltaje en cada componente y responde el cuestionario final.' 
            : 'Build a series circuit with two resistors and an LED using the Elektra simulator. Identify the voltage in each component and answer the final quiz.'}
        </p>
        <div className="reto-tags">
          <div className="reto-tag time"><Clock size={14} /> {lang === 'es' ? '15 minutos' : '15 minutes'}</div>
          <div className="reto-tag level"><BarChart size={14} /> {getLevelLabel(user?.skill_level)}</div>
          <div className="reto-tag xp"><Star size={14} /> +150 XP</div>
          <div className="reto-tag badge"><Award size={14} /> {lang === 'es' ? 'Insignia exclusiva' : 'Exclusive Badge'}</div>
        </div>
        <div className="reto-actions">
          <button 
            className="btn-primary-orange" 
            onClick={() => navigate('/app/retos/diario')}
            disabled={streak.completed_today}
            style={streak.completed_today ? { opacity: 0.6, cursor: 'not-allowed' } : {}}
          >
            {streak.completed_today 
              ? (lang === 'es' ? 'Ya completado hoy' : 'Already completed today')
              : (lang === 'es' ? 'Comenzar reto' : 'Start challenge')
            }
          </button>
          <button className="btn-outline">
            {lang === 'es' ? 'Ver instrucciones' : 'View instructions'}
          </button>
        </div>
      </div>

      {/* Middle Row: Racha + Recompensa */}
      <div className="retos-grid-2-col">
        {/* Tu Racha */}
        <div className="retos-card">
          <h3 className="retos-card-title">{lang === 'es' ? '🔥 Tu racha' : '🔥 Your Streak'}</h3>
          <div className="racha-content">
            <div className={`racha-circle-wrapper ${streak.current_streak > 0 ? 'active' : 'inactive'}`}>
              <span className="num">{streakLoading ? '…' : streak.current_streak}</span>
              <span className="text">{lang === 'es' ? 'DÍAS' : 'DAYS'}</span>
            </div>
            <div className="racha-stats">
              <div className="racha-stat-row">
                <div className="racha-stat-left">
                  <div className="icon-container blue"><Calendar size={14} /></div>
                  {lang === 'es' ? 'Días de uso consecutivo' : 'Consecutive active days'}
                </div>
                <span className="racha-stat-val">{streakLoading ? '…' : streak.current_streak}</span>
              </div>
              <div className="racha-stat-row">
                <div className="racha-stat-left">
                  <div className="icon-container green"><CheckCircle2 size={14} /></div>
                  {lang === 'es' ? 'Retos completados' : 'Completed challenges'}
                </div>
                <span className="racha-stat-val">{streakLoading ? '…' : streak.total_completed}</span>
              </div>
              <div className="racha-stat-row">
                <div className="racha-stat-left">
                  <div className="icon-container purple"><CheckCircle2 size={14} /></div>
                  {lang === 'es' ? 'Completado hoy' : 'Completed today'}
                </div>
                <span className="racha-stat-val">
                  {streakLoading ? '…' : (streak.completed_today 
                    ? (lang === 'es' ? 'Sí ✅' : 'Yes ✅') 
                    : (lang === 'es' ? 'No' : 'No'))}
                </span>
              </div>
              <div className="racha-stat-row">
                <div className="racha-stat-left">
                  <div className="icon-container" style={{ background: '#fef3c7', color: '#d97706' }}>
                    <Star size={14} />
                  </div>
                  {lang === 'es' ? 'XP Total' : 'Total XP'}
                </div>
                <span className="racha-stat-val" style={{ color: '#d97706' }}>{streakLoading ? '…' : totalXp}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Proxima recompensa */}
        <div className="retos-card">
          <h3 className="retos-card-title" style={{ justifyContent: 'center' }}>
            <Star size={16} color="#d97706" /> {lang === 'es' ? 'Próxima recompensa' : 'Next Reward'}
          </h3>
          <div className="recompensa-card">
            {nextBadge ? (
              <>
                <div className="recompensa-icon-wrapper" style={{ background: `linear-gradient(135deg, ${nextBadge.bg} 0%, #fde68a 100%)`, color: nextBadge.color }}>
                  <nextBadge.icon size={32} />
                </div>
                <h4 className="recompensa-title">{lang === 'es' ? nextBadge.titleEs : nextBadge.titleEn}</h4>
                <p className="recompensa-desc">
                  {lang === 'es' 
                    ? `Consigue ${xpNeeded} XP más para desbloquear esta insignia.`
                    : `Earn ${xpNeeded} more XP to unlock this badge.`}
                </p>
                <span className="xp-pill">{totalXp} / {nextBadge.reqXp} XP</span>
              </>
            ) : (
              <>
                <div className="recompensa-icon-wrapper" style={{ background: 'linear-gradient(135deg, #fce7f3 0%, #fde68a 100%)', color: '#be185d' }}>
                  <Brain size={32} />
                </div>
                <h4 className="recompensa-title">{lang === 'es' ? '¡Todo Desbloqueado!' : 'All Unlocked!'}</h4>
                <p className="recompensa-desc">
                  {lang === 'es' ? 'Has obtenido todas las insignias posibles.' : 'You have earned all possible badges.'}
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Row: Insignias + Progreso */}
      <div className="retos-grid-2-col">
        {/* Tus Insignias */}
        <div className="retos-card">
          <div className="insignias-header">
            <h3>{lang === 'es' ? 'Tus Insignias' : 'Your Badges'}</h3>
            <span className="link-ver-todas">{lang === 'es' ? 'Ver todas' : 'View all'}</span>
          </div>
          <div className="insignias-grid">
            {BADGES.map((badge) => {
              const isUnlocked = totalXp >= badge.reqXp
              const Icon = badge.icon
              return (
                <div key={badge.id} className={`insignia-item ${!isUnlocked ? 'locked' : ''}`}>
                  {!isUnlocked && <Lock size={14} className="lock-icon" />}
                  <div 
                    className="insignia-icon" 
                    style={isUnlocked ? { background: badge.bg, color: badge.color } : {}}
                  >
                    <Icon size={24} />
                  </div>
                  <span className="insignia-label">{lang === 'es' ? badge.titleEs : badge.titleEn}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Progreso Semanal */}
        <div className="retos-card">
          <h3 className="retos-card-title">{lang === 'es' ? 'Progreso semanal' : 'Weekly Progress'}</h3>
          {weeklyProgress.week_start && (
            <p className="progreso-week-range">
              {lang === 'es' ? 'Semana:' : 'Week:'} {weeklyProgress.week_start} → {weeklyProgress.week_end}
            </p>
          )}
          <div className="progreso-list">
            {weeklyLoading ? (
              <p style={{ color: '#94a3b8', fontSize: '13px' }}>{lang === 'es' ? 'Cargando...' : 'Loading...'}</p>
            ) : weeklyProgress.items.length > 0 ? (
              weeklyProgress.items.map((item) => {
                const config = progressConfig[item.key] || { icon: <Star size={14} />, color: '#94a3b8' }
                return (
                  <div className="progreso-item" key={item.key}>
                    <div className="progreso-header">
                      <span className="label">
                        {config.icon} {lang === 'es' ? item.label_es : item.label_en}
                      </span>
                      <span className="pct">{item.percentage}%</span>
                    </div>
                    <div className="progreso-bar-bg">
                      <div className="progreso-bar-fill" style={{ width: `${item.percentage}%`, background: config.color }} />
                    </div>
                    <span className="progreso-detail">
                      {item.current}/{item.goal}
                    </span>
                  </div>
                )
              })
            ) : (
              <p style={{ color: '#94a3b8', fontSize: '13px' }}>
                {lang === 'es' ? 'Sin actividad esta semana' : 'No activity this week'}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Sigue asi banner */}
      <div className="banner-sigue-asi">
        <div className="banner-content">
          <h2>{lang === 'es' ? '¡Sigue así!' : 'Keep it up!'}</h2>
          <p>
            {lang === 'es' 
              ? 'Cada reto completado fortalece tus habilidades en electrónica. Sigue aprendiendo y alcanza nuevos niveles.' 
              : 'Each completed challenge strengthens your electronics skills. Keep learning and reach new levels.'}
          </p>
        </div>
        <div className="banner-icon">
          <Brain size={40} />
          <div className="banner-icon-badge">
            <Zap size={12} />
          </div>
        </div>
      </div>

    </div>
  )
}