import { useTranslation } from '../utils/i18n'

export default function Classes() {
  const { t, lang } = useTranslation()
  return (
    <div className="classes-page" style={{ padding: '32px' }}>
      <h1 className="settings-title">{t('navClases')}</h1>
      <p className="settings-subtitle">
        {lang === 'es' 
          ? 'Explora cursos, lecciones interactivas y material de estudio sobre electrónica básica y circuitos.' 
          : 'Explore courses, interactive lessons, and study materials on basic electronics and circuits.'}
      </p>
      
      <div style={{ marginTop: '24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
        {[
          {
            title: lang === 'es' ? 'Introducción a la Electrónica' : 'Introduction to Electronics',
            desc: lang === 'es' ? 'Aprende los conceptos básicos de voltaje, corriente, resistencia y la Ley de Ohm.' : 'Learn the basics of voltage, current, resistance, and Ohm\'s Law.',
            duration: lang === 'es' ? '4 horas' : '4 hours',
            level: lang === 'es' ? 'Principiante' : 'Beginner'
          },
          {
            title: lang === 'es' ? 'Uso de la Protoboard' : 'Breadboard Assembly Guide',
            desc: lang === 'es' ? 'Guía paso a paso para montar circuitos simples en una protoboard física y digital.' : 'Step-by-step guide to assembling simple circuits on physical and digital breadboards.',
            duration: lang === 'es' ? '2 horas' : '2 hours',
            level: lang === 'es' ? 'Principiante' : 'Beginner'
          },
          {
            title: lang === 'es' ? 'Componentes Activos y Pasivos' : 'Active and Passive Components',
            desc: lang === 'es' ? 'Diferencias clave entre resistencias, condensadores, diodos y transistores.' : 'Key differences between resistors, capacitors, diodes, and transistors.',
            duration: lang === 'es' ? '6 horas' : '6 hours',
            level: lang === 'es' ? 'Intermedio' : 'Intermediate'
          }
        ].map((course, idx) => (
          <div key={idx} className="settings-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
            <div>
              <span className="settings-badge-info" style={{ marginBottom: '8px', display: 'inline-block' }}>{course.level}</span>
              <h3 className="provider-name" style={{ fontSize: '16px', margin: '4px 0 8px 0' }}>{course.title}</h3>
              <p className="provider-desc" style={{ fontSize: '13px', lineHeight: 1.4 }}>{course.desc}</p>
            </div>
            <div style={{ marginTop: '16px', fontSize: '12px', color: '#64748b', borderTop: '1px solid #f1f5f9', paddingTop: '12px', display: 'flex', justifyContent: 'space-between' }}>
              <span>⏱ {course.duration}</span>
              <span style={{ color: '#2563eb', fontWeight: 600, cursor: 'pointer' }}>{lang === 'es' ? 'Empezar →' : 'Start →'}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}