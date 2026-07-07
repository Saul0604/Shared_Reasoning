import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import useChatStore from '../store/useChatStore'
import { Loader2, AlertCircle } from 'lucide-react'

export default function ShareResolver() {
  const { token } = useParams()
  const navigate = useNavigate()
  const { claimSharedProject, selectSession } = useChatStore()
  const [error, setError] = useState(null)

  useEffect(() => {
    async function resolve() {
      if (!token) return
      
      const project = await claimSharedProject(token)
      if (project) {
        // Cargar y seleccionar el proyecto agregado
        selectSession(project.id)
        navigate('/app/proyectos')
      } else {
        setError('El enlace de compartición es inválido, ha expirado o ya no está disponible.')
      }
    }
    
    resolve()
  }, [token])

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      width: '100%',
      background: '#F5F0EB',
      fontFamily: 'Inter, sans-serif',
      padding: '24px',
      boxSizing: 'border-box'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '20px',
        padding: '40px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
        textAlign: 'center',
        maxWidth: '420px',
        width: '100%'
      }}>
        {error ? (
          <>
            <AlertCircle size={44} style={{ color: '#ef4444', marginBottom: '16px' }} />
            <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#1e293b', margin: '0 0 10px 0' }}>Enlace Inválido</h3>
            <p style={{ fontSize: '14px', color: '#64748b', lineHeight: '1.5', margin: '0 0 24px 0' }}>{error}</p>
            <button 
              onClick={() => navigate('/app/proyectos')}
              style={{
                background: '#2563eb',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                padding: '10px 20px',
                fontSize: '14px',
                fontWeight: '700',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.2)'
              }}
            >
              Volver a Proyectos
            </button>
          </>
        ) : (
          <>
            <Loader2 size={44} className="animate-spin" style={{ color: '#2563eb', marginBottom: '16px', margin: '0 auto 16px auto' }} />
            <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#1e293b', margin: '0 0 10px 0' }}>Procesando enlace...</h3>
            <p style={{ fontSize: '14px', color: '#64748b', lineHeight: '1.5', margin: 0 }}>
              Estamos vinculando el circuito compartido a tu panel de proyectos. Un momento, por favor...
            </p>
          </>
        )}
      </div>
    </div>
  )
}
