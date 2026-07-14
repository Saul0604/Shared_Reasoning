import React, { useState } from 'react'
import { Search, TriangleAlert, Bot, X, Loader2, Info, Zap, Puzzle, Link2 } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { useTranslation } from '../utils/i18n'
import './Components.css'

export default function Components() {
  const { t, lang } = useTranslation()
  const [activeFilter, setActiveFilter] = useState('Todos')
  const [searchQuery, setSearchQuery] = useState('')
  
  // Tutorial Modal State
  const [selectedComponent, setSelectedComponent] = useState(null)
  const [tutorialData, setTutorialData] = useState(null)
  const [isLoadingTutorial, setIsLoadingTutorial] = useState(false)
  
  // Chat State
  const [chatMessages, setChatMessages] = useState([])
  const [chatInput, setChatInput] = useState('')
  const [isSendingChat, setIsSendingChat] = useState(false)

  const filters = [
    'Todos', 
    'Resistencias', 
    'Capacitores', 
    'LEDs & Displays', 
    'Semiconductores',
    'Microcontroladores', 
    'Sensores',
    'Switches',
    'ICs',
    'Fuentes',
    'Cables',
    'Salidas'
  ]

  // Mock data for 20 components
  const componentsList = [
    // --- PRINCIPIANTE (Basics) ---
    {
      id: 'resistor-std',
      category: 'RESISTENCIAS',
      tag: 'Basics', tagType: 'basics',
      title: 'Resistencia estándar',
      desc: 'Limita el flujo de corriente en el circuito.',
      warning: false, btnStyle: 'solid',
      svg: (<svg viewBox="0 0 24 24" fill="none" stroke="#b45309" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="comp-icon-svg"><path d="M2 12h4l2-5 4 10 4-10 2 5h4" /></svg>)
    },
    {
      id: 'led',
      category: 'LEDS & DISPLAYS',
      tag: 'Basics', tagType: 'basics',
      title: 'LED',
      desc: 'Diodo emisor de luz (rojo, verde, amarillo).',
      warning: true, btnStyle: 'solid',
      svg: (<svg viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="comp-icon-svg"><path d="M12 2v2" /><path d="M12 20v2" /><path d="M4.93 4.93l1.41 1.41" /><path d="M17.66 17.66l1.41 1.41" /><path d="M2 12h2" /><path d="M20 12h2" /><path d="M6.34 17.66l-1.41 1.41" /><path d="M19.07 4.93l-1.41 1.41" /><circle cx="12" cy="12" r="4" /></svg>)
    },
    {
      id: 'push-button',
      category: 'SWITCHES',
      tag: 'Basics', tagType: 'basics',
      title: 'Pulsador (Push button)',
      desc: 'Interruptor momentáneo para entradas digitales.',
      warning: false, btnStyle: 'outline',
      svg: (<svg viewBox="0 0 24 24" fill="none" stroke="#334155" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="comp-icon-svg"><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="3" /></svg>)
    },
    {
      id: 'battery',
      category: 'FUENTES',
      tag: 'Basics', tagType: 'basics',
      title: 'Batería / Fuente',
      desc: 'Suministra la energía al circuito.',
      warning: true, btnStyle: 'outline',
      svg: (<svg viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="comp-icon-svg"><rect x="6" y="6" width="12" height="12" rx="2" /><path d="M10 2v4" /><path d="M14 2v4" /><path d="M12 18v-4" /></svg>)
    },
    {
      id: 'jumpers',
      category: 'CABLES',
      tag: 'Basics', tagType: 'basics',
      title: 'Cables de conexión',
      desc: 'Jumpers macho-macho, macho-hembra para protoboard.',
      warning: false, btnStyle: 'outline',
      svg: (<svg viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="comp-icon-svg"><path d="M4 4c0 4 16 12 16 16" /><circle cx="4" cy="4" r="2" /><circle cx="20" cy="20" r="2" /></svg>)
    },
    {
      id: 'potentiometer',
      category: 'RESISTENCIAS',
      tag: 'Basics', tagType: 'basics',
      title: 'Potenciómetro',
      desc: 'Resistencia variable (ej. 10kΩ).',
      warning: false, btnStyle: 'outline',
      svg: (<svg viewBox="0 0 24 24" fill="none" stroke="#b45309" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="comp-icon-svg"><path d="M12 2v4" /><path d="M12 18v4" /><path d="M4.93 19.07l2.83-2.83" /><path d="M16.24 7.76l2.83-2.83" /><circle cx="12" cy="12" r="4" /></svg>)
    },
    
    // --- INTERMEDIO (Intermediate) ---
    {
      id: 'cap-ceramic',
      category: 'CAPACITORES',
      tag: 'Intermediate', tagType: 'intermediate',
      title: 'Capacitor cerámico',
      desc: 'No polarizado, ideal para filtrado.',
      warning: false, btnStyle: 'solid',
      svg: (<svg viewBox="0 0 24 24" fill="none" stroke="#1d4ed8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="comp-icon-svg"><path d="M9 18V6" /><path d="M15 18V6" /><path d="M2 12h7" /><path d="M15 12h7" /></svg>)
    },
    {
      id: 'cap-electro',
      category: 'CAPACITORES',
      tag: 'Intermediate', tagType: 'intermediate',
      title: 'Capacitor electrolítico',
      desc: 'Polarizado, alta capacitancia.',
      warning: true, btnStyle: 'solid',
      svg: (<svg viewBox="0 0 24 24" fill="none" stroke="#1d4ed8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="comp-icon-svg"><path d="M9 18V6" /><path d="M15 18a6 6 0 0 1 0-12" /><path d="M2 12h7" /><path d="M15 12h7" /><path d="M4 8h4" /><path d="M6 6v4" /></svg>)
    },
    {
      id: 'diode-rectifier',
      category: 'SEMICONDUCTORES',
      tag: 'Intermediate', tagType: 'intermediate',
      title: 'Diodo rectificador (1N4007)',
      desc: 'Permite el flujo de corriente en una sola dirección.',
      warning: true, btnStyle: 'solid',
      svg: (<svg viewBox="0 0 24 24" fill="none" stroke="#334155" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="comp-icon-svg"><path d="M2 12h8" /><path d="M14 12h8" /><path d="M10 6v12l8-6-8-6z" /><path d="M18 6v12" /></svg>)
    },
    {
      id: 'transistor-npn',
      category: 'SEMICONDUCTORES',
      tag: 'Intermediate', tagType: 'intermediate',
      title: 'Transistor NPN (2N2222)',
      desc: 'Interruptor o amplificador de corriente.',
      warning: false, btnStyle: 'solid',
      svg: (<svg viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="comp-icon-svg"><circle cx="12" cy="12" r="10" /><path d="M12 7v10" /><path d="M7 12h5" /><path d="M12 16l4 4" /><path d="M12 8l4-4" /><path d="M16 20v-4h-4" /></svg>)
    },
    {
      id: 'transistor-pnp',
      category: 'SEMICONDUCTORES',
      tag: 'Intermediate', tagType: 'intermediate',
      title: 'Transistor PNP',
      desc: 'Interruptor activado por nivel bajo (GND).',
      warning: false, btnStyle: 'solid',
      svg: (<svg viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="comp-icon-svg"><circle cx="12" cy="12" r="10" /><path d="M12 7v10" /><path d="M7 12h5" /><path d="M16 4l-4 4" /><path d="M12 8h4v-4" /><path d="M12 16l4 4" /></svg>)
    },
    {
      id: 'ldr',
      category: 'SENSORES',
      tag: 'Intermediate', tagType: 'intermediate',
      title: 'Fotoresistencia (LDR)',
      desc: 'Resistencia que varía con la cantidad de luz.',
      warning: false, btnStyle: 'outline',
      svg: (<svg viewBox="0 0 24 24" fill="none" stroke="#eab308" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="comp-icon-svg"><path d="M2 12h4l2-5 4 10 4-10 2 5h4" /><path d="M4 4l3 3" /><path d="M8 2l2 4" /></svg>)
    },
    {
      id: 'buzzer',
      category: 'SALIDAS',
      tag: 'Intermediate', tagType: 'intermediate',
      title: 'Buzzer',
      desc: 'Genera sonido a partir de una señal eléctrica.',
      warning: true, btnStyle: 'solid',
      svg: (<svg viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="comp-icon-svg"><path d="M11 5L6 9H2v6h4l5 4V5z" /><path d="M15.54 8.46a5 5 0 0 1 0 7.07" /><path d="M19.07 4.93a10 10 0 0 1 0 14.14" /></svg>)
    },

    // --- AVANZADO (Advanced) ---
    {
      id: 'timer-555',
      category: 'ICS',
      tag: 'Advanced', tagType: 'advanced',
      title: 'Timer 555',
      desc: 'Circuito integrado para generar pulsos y temporizaciones.',
      warning: false, btnStyle: 'solid',
      svg: (<svg viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="comp-icon-svg"><rect x="6" y="4" width="12" height="16" rx="2" /><path d="M2 8h4" /><path d="M2 12h4" /><path d="M2 16h4" /><path d="M18 8h4" /><path d="M18 12h4" /><path d="M18 16h4" /><circle cx="12" cy="7" r="1" /></svg>)
    },
    {
      id: 'opamp-358',
      category: 'ICS',
      tag: 'Advanced', tagType: 'advanced',
      title: 'Op-Amp LM358',
      desc: 'Amplificador operacional dual.',
      warning: false, btnStyle: 'solid',
      svg: (<svg viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="comp-icon-svg"><path d="M2 4v16l18-8L2 4z" /><path d="M6 10h4" /><path d="M8 8v4" /><path d="M6 14h4" /></svg>)
    },
    {
      id: 'reg-7805',
      category: 'SEMICONDUCTORES',
      tag: 'Advanced', tagType: 'advanced',
      title: 'Regulador de voltaje 7805',
      desc: 'Regulador lineal de 5V DC.',
      warning: true, btnStyle: 'solid',
      svg: (<svg viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="comp-icon-svg"><rect x="6" y="4" width="12" height="10" rx="1" /><circle cx="12" cy="9" r="2" /><path d="M8 14v8" /><path d="M12 14v8" /><path d="M16 14v8" /></svg>)
    },
    {
      id: 'display-7seg',
      category: 'LEDS & DISPLAYS',
      tag: 'Advanced', tagType: 'advanced',
      title: 'Display 7 segmentos',
      desc: 'Muestra números usando 7 LEDs individuales.',
      warning: false, btnStyle: 'solid',
      svg: (<svg viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="comp-icon-svg"><rect x="6" y="4" width="12" height="16" rx="2" /><path d="M9 8h6" /><path d="M9 12h6" /><path d="M9 16h6" /><path d="M9 8v4" /><path d="M15 8v4" /><path d="M9 12v4" /><path d="M15 12v4" /></svg>)
    },
    {
      id: 'sensor-ntc',
      category: 'SENSORES',
      tag: 'Advanced', tagType: 'advanced',
      title: 'Sensor de temperatura (NTC)',
      desc: 'Termistor cuya resistencia disminuye con el calor.',
      warning: false, btnStyle: 'outline',
      svg: (<svg viewBox="0 0 24 24" fill="none" stroke="#eab308" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="comp-icon-svg"><path d="M12 18a4 4 0 1 0 0-8V2a2 2 0 1 0-4 0v8a4 4 0 0 0 4 8z" /></svg>)
    },
    {
      id: 'mosfet-irf540',
      category: 'SEMICONDUCTORES',
      tag: 'Advanced', tagType: 'advanced',
      title: 'MOSFET (IRF540)',
      desc: 'Transistor de efecto de campo para altas corrientes.',
      warning: false, btnStyle: 'solid',
      svg: (<svg viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="comp-icon-svg"><circle cx="12" cy="12" r="10" /><path d="M8 8v8" /><path d="M12 8h3" /><path d="M12 12h3" /><path d="M12 16h3" /><path d="M15 8v8" /><path d="M15 12h3" /></svg>)
    },
    {
      id: 'arduino-uno',
      category: 'MICROCONTROLADORES',
      tag: 'Advanced', tagType: 'advanced',
      title: 'Arduino Nano / Uno',
      desc: 'Placa de desarrollo microcontrolada programable.',
      warning: false, btnStyle: 'solid',
      svg: (<svg viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="comp-icon-svg"><rect x="4" y="4" width="16" height="16" rx="2" ry="2" /><rect x="9" y="9" width="6" height="6" /><line x1="9" y1="1" x2="9" y2="4" /><line x1="15" y1="1" x2="15" y2="4" /><line x1="9" y1="20" x2="9" y2="23" /><line x1="15" y1="20" x2="15" y2="23" /><line x1="20" y1="9" x2="23" y2="9" /><line x1="20" y1="14" x2="23" y2="14" /><line x1="1" y1="9" x2="4" y2="9" /><line x1="1" y1="14" x2="4" y2="14" /></svg>)
    }
  ]

  // Apply filters and search
  const filteredComponents = componentsList.filter(comp => {
    const matchesFilter = activeFilter === 'Todos' || comp.category.includes(activeFilter.toUpperCase())
    const matchesSearch = comp.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          comp.desc.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesFilter && matchesSearch
  })

  const getMockTutorial = (comp) => ({
    summary: `Este es un componente llamado ${comp.title}. Es fundamental en la electrónica básica.`,
    how_it_works: `El ${comp.title} funciona alterando el flujo eléctrico en el circuito según sus características físicas.`,
    common_uses: [
      `Usado en circuitos con ${comp.title} para control.`,
      `Prototipado rápido en protoboard.`,
      `Proyectos académicos y DIY.`
    ],
    connection_tips: `Asegúrate de revisar la polaridad si aplica, y siempre verifica los voltajes máximos permitidos para el ${comp.title}.`
  })

  const handleOpenTutorial = (comp) => {
    setSelectedComponent(comp)
    setTutorialData(getMockTutorial(comp))
    setChatMessages([])
    setChatInput('')
  }

  const handleSendChat = async () => {
    if (!chatInput.trim()) return;
    const userMsg = { role: 'user', content: chatInput }
    const newHistory = [...chatMessages, userMsg]
    setChatMessages(newHistory)
    setChatInput('')
    setIsSendingChat(true)

    try {
      const token = localStorage.getItem('access_token')
      const API_URL = import.meta.env.VITE_BACKEND_URL ?? 'http://localhost:8000'
      const response = await fetch(`${API_URL}/library/tutorial-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          component_name: selectedComponent.title,
          message: userMsg.content,
          history: chatMessages
        })
      })
      if (response.ok) {
        const data = await response.json()
        setChatMessages([...newHistory, { role: 'assistant', content: data.reply }])
      }
    } catch (err) {
      console.error(err)
    } finally {
      setIsSendingChat(false)
    }
  }

  const closeModal = () => {
    setSelectedComponent(null)
    setTutorialData(null)
  }

  const filterTranslations = {
    Todos: lang === 'es' ? 'Todos' : 'All',
    Resistencias: lang === 'es' ? 'Resistencias' : 'Resistors',
    Capacitores: lang === 'es' ? 'Capacitores' : 'Capacitors',
    'LEDs & Displays': 'LEDs & Displays',
    Semiconductores: lang === 'es' ? 'Semiconductores' : 'Semiconductors',
    Microcontroladores: lang === 'es' ? 'Microcontroladores' : 'Microcontrollers',
    Sensores: lang === 'es' ? 'Sensores' : 'Sensors',
    Switches: lang === 'es' ? 'Interruptores' : 'Switches',
    ICs: 'ICs',
    Fuentes: lang === 'es' ? 'Fuentes' : 'Power Sources',
    Cables: lang === 'es' ? 'Cables' : 'Wires',
    Salidas: lang === 'es' ? 'Salidas' : 'Outputs'
  }

  return (
    <div className="components-page">
      <div className="components-header">
        <h1>{lang === 'es' ? 'Biblioteca de Componentes' : 'Components Library'}</h1>
        <div className="search-container">
          <Search size={16} className="search-icon" />
          <input 
            type="text" 
            placeholder={lang === 'es' ? 'Buscar componente...' : 'Search component...'} 
            className="search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="filter-chips">
        {filters.map(filter => (
          <div 
            key={filter} 
            className={`filter-chip ${activeFilter === filter ? 'active' : ''}`}
            onClick={() => setActiveFilter(filter)}
          >
            {filterTranslations[filter] || filter}
          </div>
        ))}
      </div>

      <div className="components-grid">
        {filteredComponents.map(comp => (
          <div key={comp.id} className="comp-card">
            
            <div className="comp-icon-wrapper">
              {comp.svg}
            </div>

            <div className="comp-category-row">
              <span className="comp-category">{comp.category}</span>
              {comp.tag && (
                <span className={`comp-tag ${comp.tagType}`}>
                  {comp.tag}
                </span>
              )}
              {comp.warning && (
                <TriangleAlert size={14} className="comp-warning" />
              )}
            </div>

            <h3 className="comp-title">{comp.title}</h3>
            <p className="comp-desc">{comp.desc}</p>

            <button 
              className={`comp-btn ${comp.btnStyle}`}
              onClick={() => handleOpenTutorial(comp)}
            >
              <Bot size={16} /> {lang === 'es' ? 'Tutorial IA' : 'AI Tutorial'}
            </button>

          </div>
        ))}
      </div>

      {/* Tutorial Modal */}
      {selectedComponent && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={closeModal}>
              <X size={18} />
            </button>

            <div className="modal-header">
              <div className="modal-icon-bg">
                {selectedComponent.svg}
              </div>
              <div>
                <h2>{selectedComponent.title}</h2>
                <p>{selectedComponent.category}</p>
              </div>
            </div>

            {isLoadingTutorial ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 0', color: '#64748b' }}>
                <Loader2 size={32} className="animate-spin" style={{ animation: 'spin 1s linear infinite', marginBottom: '16px' }} />
                <p>{lang === 'es' ? 'Generando tutorial con IA Elektra...' : 'Generating tutorial with Elektra AI...'}</p>
              </div>
            ) : tutorialData ? (
              <div className="modal-body">
                <div className="tutorial-section">
                  <h3><Info size={16} color="#3b82f6" /> {lang === 'es' ? '¿Qué es?' : 'What is it?'}</h3>
                  <p>{tutorialData.summary}</p>
                </div>
                <div className="tutorial-section">
                  <h3><Zap size={16} color="#f59e0b" /> {lang === 'es' ? '¿Cómo funciona?' : 'How does it work?'}</h3>
                  <p>{tutorialData.how_it_works}</p>
                </div>
                <div className="tutorial-section">
                  <h3><Puzzle size={16} color="#10b981" /> {lang === 'es' ? 'Usos comunes' : 'Common uses'}</h3>
                  <ul>
                    {tutorialData.common_uses.map((use, idx) => (
                      <li key={idx}>{use}</li>
                    ))}
                  </ul>
                </div>
                <div className="tutorial-section">
                  <h3><Link2 size={16} color="#8b5cf6" /> {lang === 'es' ? 'Consejos de conexión' : 'Connection tips'}</h3>
                  <p>{tutorialData.connection_tips}</p>
                </div>
                
                {/* Chat Section */}
                <div className="tutorial-chat-section" style={{ marginTop: '32px', borderTop: '1px solid #e2e8f0', paddingTop: '24px' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#1e293b', marginBottom: '16px' }}>
                    <Bot size={16} color="#3b82f6" style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                    {lang === 'es' ? '¿Tienes dudas? Pregúntale a Elektra' : 'Have questions? Ask Elektra'}
                  </h3>
                  
                  <div className="tutorial-chat-messages" style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px', maxHeight: '150px', overflowY: 'auto' }}>
                    {chatMessages.length === 0 && !isSendingChat && (
                      <p style={{ fontSize: '13px', color: '#94a3b8', fontStyle: 'italic', margin: 0 }}>
                        {lang === 'es' ? 'Escribe una pregunta sobre este componente...' : 'Type a question about this component...'}
                      </p>
                    )}
                    {chatMessages.map((msg, idx) => (
                      <div key={idx} className="chat-markdown-wrapper" style={{ alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start', background: msg.role === 'user' ? '#3b82f6' : '#f1f5f9', color: msg.role === 'user' ? 'white' : '#334155', padding: '8px 12px', borderRadius: '12px', maxWidth: '85%', fontSize: '13px' }}>
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    ))}
                    {isSendingChat && (
                       <div style={{ alignSelf: 'flex-start', background: '#f1f5f9', color: '#334155', padding: '8px 12px', borderRadius: '12px', fontSize: '13px' }}>
                         {lang === 'es' ? 'Elektra está escribiendo...' : 'Elektra is typing...'}
                       </div>
                    )}
                  </div>
                  
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input 
                      type="text" 
                      value={chatInput}
                      onChange={e => setChatInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleSendChat()}
                      placeholder={lang === 'es' ? 'Ej. ¿Cuántos voltios soporta?' : 'e.g. How many volts can it support?'}
                      style={{ flex: 1, padding: '10px 14px', border: '1px solid #cbd5e1', borderRadius: '20px', outline: 'none', fontSize: '13px' }}
                    />
                    <button 
                      onClick={handleSendChat}
                      disabled={isSendingChat || !chatInput.trim()}
                      style={{ background: '#f59e0b', color: 'white', border: 'none', borderRadius: '20px', padding: '0 16px', cursor: 'pointer', fontWeight: '600', fontSize: '13px', opacity: (isSendingChat || !chatInput.trim()) ? 0.6 : 1 }}
                    >
                      {lang === 'es' ? 'Enviar' : 'Send'}
                    </button>
                  </div>
                </div>

              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#ef4444' }}>
                <p>Ocurrió un error al cargar el tutorial. Intenta de nuevo.</p>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  )
}