import React from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Clock, BarChart, Star, Award, Calendar, CheckCircle2, 
  MessageSquare, Lock, BookOpen, Zap, Lightbulb, Trophy, Brain
} from 'lucide-react'
import useChatStore from '../store/useChatStore'
import './Retos.css'

export default function Retos() {
  const { user } = useChatStore()
  const navigate = useNavigate()
  
  return (
    <div className="retos-page">
      <div className="retos-header">
        <h1>Retos</h1>
        <p>Aprende todos los días completando desafíos, desbloqueando insignias y manteniendo tu progreso.</p>
      </div>

      {/* Reto del Dia */}
      <div className="retos-card reto-dia-section">
        <div className="reto-dia-header">
          <h2>Reto del día</h2>
          <span className="tag-nuevo">🔥 Nuevo</span>
        </div>
        <p className="reto-dia-desc">
          Construye un circuito en serie con dos resistencias y un LED utilizando el simulador de Elektra.
          Identifica el voltaje en cada componente y responde el cuestionario final.
        </p>
        <div className="reto-tags">
          <div className="reto-tag time"><Clock size={14} /> 15 minutos</div>
          <div className="reto-tag level"><BarChart size={14} /> {user?.skill_level || 'Principiante'}</div>
          <div className="reto-tag xp"><Star size={14} /> +150 XP</div>
          <div className="reto-tag badge"><Award size={14} /> Insignia exclusiva</div>
        </div>
        <div className="reto-actions">
          <button className="btn-primary-orange" onClick={() => navigate('/app/retos/diario')}>Comenzar reto</button>
          <button className="btn-outline">Ver instrucciones</button>
        </div>
      </div>

      {/* Middle Row: Racha + Recompensa */}
      <div className="retos-grid-2-col">
        {/* Tu Racha */}
        <div className="retos-card">
          <h3 className="retos-card-title">🔥 Tu racha</h3>
          <div className="racha-content">
            <div className="racha-circle-wrapper">
              <span className="num">6</span>
              <span className="text">DÍAS</span>
            </div>
            <div className="racha-stats">
              <div className="racha-stat-row">
                <div className="racha-stat-left">
                  <div className="icon-container blue"><Calendar size={14} /></div>
                  Días de uso consecutivo
                </div>
                <span className="racha-stat-val">6</span>
              </div>
              <div className="racha-stat-row">
                <div className="racha-stat-left">
                  <div className="icon-container green"><CheckCircle2 size={14} /></div>
                  Retos completados
                </div>
                <span className="racha-stat-val">4</span>
              </div>
              <div className="racha-stat-row">
                <div className="racha-stat-left">
                  <div className="icon-container purple"><MessageSquare size={14} /></div>
                  Interacciones Chat Elektra
                </div>
                <span className="racha-stat-val">6</span>
              </div>
            </div>
          </div>
        </div>

        {/* Proxima recompensa */}
        <div className="retos-card">
          <h3 className="retos-card-title" style={{ justifyContent: 'center' }}><Star size={16} color="#d97706" /> Próxima recompensa</h3>
          <div className="recompensa-card">
            <div className="recompensa-icon-wrapper">
              <Brain size={32} />
            </div>
            <h4 className="recompensa-title">Ingeniero en Formación</h4>
            <p className="recompensa-desc">Completa 2 retos más para desbloquear esta insignia.</p>
            <span className="xp-pill">+300 XP</span>
          </div>
        </div>
      </div>

      {/* Bottom Row: Insignias + Progreso */}
      <div className="retos-grid-2-col">
        {/* Tus Insignias */}
        <div className="retos-card">
          <div className="insignias-header">
            <h3>Tus Insignias</h3>
            <span className="link-ver-todas">Ver todas</span>
          </div>
          <div className="insignias-grid">
            <div className="insignia-item">
              <div className="insignia-icon" style={{ background: '#fef3c7', color: '#d97706' }}>
                <Lightbulb size={24} />
              </div>
              <span className="insignia-label">Primer Circuito</span>
            </div>
            <div className="insignia-item">
              <div className="insignia-icon" style={{ background: '#dbeafe', color: '#2563eb' }}>
                <Zap size={24} />
              </div>
              <span className="insignia-label">Maestro del LED</span>
            </div>
            <div className="insignia-item locked">
              <Lock size={14} className="lock-icon" />
              <div className="insignia-icon">
                <Trophy size={24} />
              </div>
              <span className="insignia-label">Experto en Resistencias</span>
            </div>
            <div className="insignia-item locked">
              <Lock size={14} className="lock-icon" />
              <div className="insignia-icon">
                <BookOpen size={24} />
              </div>
              <span className="insignia-label">Energía Constante</span>
            </div>
            <div className="insignia-item locked">
              <Lock size={14} className="lock-icon" />
              <div className="insignia-icon">
                <Award size={24} />
              </div>
              <span className="insignia-label">Constructor</span>
            </div>
            <div className="insignia-item locked">
              <Lock size={14} className="lock-icon" />
              <div className="insignia-icon">
                <BookOpen size={24} />
              </div>
              <span className="insignia-label">Lector Dedicado</span>
            </div>
          </div>
        </div>

        {/* Progreso Semanal */}
        <div className="retos-card">
          <h3 className="retos-card-title">Progreso semanal</h3>
          <div className="progreso-list">
            
            <div className="progreso-item">
              <div className="progreso-header">
                <span className="label"><Trophy size={14} color="#f59e0b" /> Retos</span>
                <span className="pct">80%</span>
              </div>
              <div className="progreso-bar-bg">
                <div className="progreso-bar-fill" style={{ width: '80%', background: '#f59e0b' }} />
              </div>
            </div>

            <div className="progreso-item">
              <div className="progreso-header">
                <span className="label"><Clock size={14} color="#3b82f6" /> Tiempo</span>
                <span className="pct">60%</span>
              </div>
              <div className="progreso-bar-bg">
                <div className="progreso-bar-fill" style={{ width: '60%', background: '#3b82f6' }} />
              </div>
            </div>

            <div className="progreso-item">
              <div className="progreso-header">
                <span className="label"><Zap size={14} color="#10b981" /> Laboratorios</span>
                <span className="pct">90%</span>
              </div>
              <div className="progreso-bar-bg">
                <div className="progreso-bar-fill" style={{ width: '90%', background: '#10b981' }} />
              </div>
            </div>

            <div className="progreso-item">
              <div className="progreso-header">
                <span className="label"><BookOpen size={14} color="#8b5cf6" /> Lectura</span>
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
          <h2>¡Sigue así!</h2>
          <p>Cada reto completado fortalece tus habilidades en electrónica. Sigue aprendiendo y alcanza nuevos niveles.</p>
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