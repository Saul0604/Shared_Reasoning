import React from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Clock, BarChart, Star, Award, Calendar, CheckCircle2, 
  MessageSquare, Lock, BookOpen, Zap, Lightbulb, Trophy, Brain
} from 'lucide-react'
import useChatStore from '../store/useChatStore'
import { useTranslation } from '../utils/i18n'
import './Retos.css'

export default function Retos() {
  const { user } = useChatStore()
  const navigate = useNavigate()
  const { lang } = useTranslation()
  
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
          <span className="tag-nuevo">{lang === 'es' ? '🔥 Nuevo' : '🔥 New'}</span>
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
          <button className="btn-primary-orange" onClick={() => navigate('/app/retos/diario')}>
            {lang === 'es' ? 'Comenzar reto' : 'Start challenge'}
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
            <div className="racha-circle-wrapper">
              <span className="num">6</span>
              <span className="text">{lang === 'es' ? 'DÍAS' : 'DAYS'}</span>
            </div>
            <div className="racha-stats">
              <div className="racha-stat-row">
                <div className="racha-stat-left">
                  <div className="icon-container blue"><Calendar size={14} /></div>
                  {lang === 'es' ? 'Días de uso consecutivo' : 'Consecutive active days'}
                </div>
                <span className="racha-stat-val">6</span>
              </div>
              <div className="racha-stat-row">
                <div className="racha-stat-left">
                  <div className="icon-container green"><CheckCircle2 size={14} /></div>
                  {lang === 'es' ? 'Retos completados' : 'Completed challenges'}
                </div>
                <span className="racha-stat-val">4</span>
              </div>
              <div className="racha-stat-row">
                <div className="racha-stat-left">
                  <div className="icon-container purple"><MessageSquare size={14} /></div>
                  {lang === 'es' ? 'Interacciones Chat Elektra' : 'Elektra Chat Interactions'}
                </div>
                <span className="racha-stat-val">6</span>
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
            <div className="recompensa-icon-wrapper">
              <Brain size={32} />
            </div>
            <h4 className="recompensa-title">{lang === 'es' ? 'Ingeniero en Formación' : 'Engineer in Training'}</h4>
            <p className="recompensa-desc">
              {lang === 'es' 
                ? 'Completa 2 retos más para desbloquear esta insignia.' 
                : 'Complete 2 more challenges to unlock this badge.'}
            </p>
            <span className="xp-pill">+300 XP</span>
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
            <div className="insignia-item">
              <div className="insignia-icon" style={{ background: '#fef3c7', color: '#d97706' }}>
                <Lightbulb size={24} />
              </div>
              <span className="insignia-label">{lang === 'es' ? 'Primer Circuito' : 'First Circuit'}</span>
            </div>
            <div className="insignia-item">
              <div className="insignia-icon" style={{ background: '#dbeafe', color: '#2563eb' }}>
                <Zap size={24} />
              </div>
              <span className="insignia-label">{lang === 'es' ? 'Maestro del LED' : 'LED Master'}</span>
            </div>
            <div className="insignia-item locked">
              <Lock size={14} className="lock-icon" />
              <div className="insignia-icon">
                <Trophy size={24} />
              </div>
              <span className="insignia-label">{lang === 'es' ? 'Experto en Resistencias' : 'Resistor Expert'}</span>
            </div>
            <div className="insignia-item locked">
              <Lock size={14} className="lock-icon" />
              <div className="insignia-icon">
                <BookOpen size={24} />
              </div>
              <span className="insignia-label">{lang === 'es' ? 'Energía Constante' : 'Constant Power'}</span>
            </div>
            <div className="insignia-item locked">
              <Lock size={14} className="lock-icon" />
              <div className="insignia-icon">
                <Award size={24} />
              </div>
              <span className="insignia-label">{lang === 'es' ? 'Constructor' : 'Builder'}</span>
            </div>
            <div className="insignia-item locked">
              <Lock size={14} className="lock-icon" />
              <div className="insignia-icon">
                <BookOpen size={24} />
              </div>
              <span className="insignia-label">{lang === 'es' ? 'Lector Dedicado' : 'Dedicated Reader'}</span>
            </div>
          </div>
        </div>

        {/* Progreso Semanal */}
        <div className="retos-card">
          <h3 className="retos-card-title">{lang === 'es' ? 'Progreso semanal' : 'Weekly Progress'}</h3>
          <div className="progreso-list">
            
            <div className="progreso-item">
              <div className="progreso-header">
                <span className="label"><Trophy size={14} color="#f59e0b" /> {lang === 'es' ? 'Retos' : 'Challenges'}</span>
                <span className="pct">80%</span>
              </div>
              <div className="progreso-bar-bg">
                <div className="progreso-bar-fill" style={{ width: '80%', background: '#f59e0b' }} />
              </div>
            </div>

            <div className="progreso-item">
              <div className="progreso-header">
                <span className="label"><Clock size={14} color="#3b82f6" /> {lang === 'es' ? 'Tiempo' : 'Time'}</span>
                <span className="pct">60%</span>
              </div>
              <div className="progreso-bar-bg">
                <div className="progreso-bar-fill" style={{ width: '60%', background: '#3b82f6' }} />
              </div>
            </div>

            <div className="progreso-item">
              <div className="progreso-header">
                <span className="label"><Zap size={14} color="#10b981" /> {lang === 'es' ? 'Laboratorios' : 'Labs'}</span>
                <span className="pct">90%</span>
              </div>
              <div className="progreso-bar-bg">
                <div className="progreso-bar-fill" style={{ width: '90%', background: '#10b981' }} />
              </div>
            </div>

            <div className="progreso-item">
              <div className="progreso-header">
                <span className="label"><BookOpen size={14} color="#8b5cf6" /> {lang === 'es' ? 'Lectura' : 'Reading'}</span>
                <span className="pct">30%</span>
              </div>
              <div className="progreso-bar-bg">
                <div className="progreso-bar-fill" style={{ width: '30%', background: '#8b5cf6' }} />
              </div>
            </div>

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