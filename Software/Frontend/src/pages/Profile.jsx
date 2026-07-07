import { useState, useEffect, useRef } from 'react'
import useChatStore from '../store/useChatStore'
import { User, Camera, Save, CheckCircle } from 'lucide-react'

export default function Profile() {
  const { user, updateProfile, loadCurrentUser } = useChatStore()
  
  const [fullName, setFullName] = useState('')
  const [avatarBase64, setAvatarBase64] = useState(null)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  
  const fileInputRef = useRef(null)

  // Sincronizar datos del usuario actual
  useEffect(() => {
    if (user) {
      setFullName(user.full_name || '')
      setAvatarBase64(user.profile_picture_base64 || null)
    } else {
      loadCurrentUser()
    }
  }, [user])

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onloadend = () => {
      setAvatarBase64(reader.result)
    }
    reader.readAsDataURL(file)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setSuccess(false)

    try {
      await updateProfile(fullName, avatarBase64)
      setSuccess(true)
      // Ocultar mensaje de éxito tras 3 segundos
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      console.error('Error saving profile:', err)
    } finally {
      setSaving(false)
    }
  }

  const getInitials = (name) => {
    if (!name) return 'U'
    const parts = name.trim().split(' ')
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    }
    return parts[0][0].toUpperCase()
  }

  return (
    <div className="profile-container" style={{ 
      padding: '40px', 
      background: '#ffffff', 
      height: '100%', 
      width: '100%',
      boxSizing: 'border-box',
      overflowY: 'auto',
      borderRadius: '18px',
      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)'
    }}>
      <div className="profile-card" style={{ maxWidth: '580px', margin: '0 auto' }}>
        
        <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#1e293b', margin: '0 0 8px 0' }}>Mi Perfil</h1>
        <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 32px 0' }}>Administra tu información personal y foto de perfil en Elektra.</p>

        <form onSubmit={handleSave} style={{ display: 'flex', display: 'flex', flexDirection: 'column', gap: '28px' }}>
          
          {/* Zona de Avatar Interactivo */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
            <div 
              onClick={() => fileInputRef.current?.click()}
              style={{
                position: 'relative',
                width: '120px',
                height: '120px',
                borderRadius: '50%',
                cursor: 'pointer',
                overflow: 'hidden',
                boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                border: '3px solid #edf2f7',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#f8fafc'
              }}
            >
              {avatarBase64 ? (
                <img 
                  src={avatarBase64} 
                  alt="Perfil" 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                />
              ) : (
                <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#94a3b8' }}>
                  {getInitials(fullName || user?.email)}
                </div>
              )}
              {/* Overlay de cámara hover */}
              <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                background: 'rgba(30, 41, 59, 0.75)',
                color: 'white',
                padding: '6px 0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '11px',
                fontWeight: '600',
                gap: '4px'
              }}>
                <Camera size={12} />
                <span>Cambiar</span>
              </div>
            </div>

            <input 
              ref={fileInputRef}
              type="file" 
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
            
            <button 
              type="button"
              onClick={() => fileInputRef.current?.click()}
              style={{
                background: 'none',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                padding: '6px 14px',
                fontSize: '12px',
                fontWeight: '600',
                color: '#475569',
                cursor: 'pointer',
                transition: 'all 0.15s'
              }}
            >
              Seleccionar archivo
            </button>
          </div>

          {/* Formulario Inputs */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: '700', color: '#475569' }}>Nombre Completo</label>
              <input 
                type="text" 
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Ingresa tu nombre completo"
                required
                style={{
                  border: '1px solid #cbd5e1',
                  borderRadius: '10px',
                  padding: '10px 14px',
                  fontSize: '13px',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                  width: '100%',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: '700', color: '#475569' }}>Correo Electrónico (No editable)</label>
              <input 
                type="email" 
                value={user?.email || ''} 
                disabled
                style={{
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  padding: '10px 14px',
                  fontSize: '13px',
                  background: '#f8fafc',
                  color: '#94a3b8',
                  width: '100%',
                  boxSizing: 'border-box',
                  cursor: 'not-allowed'
                }}
              />
            </div>
          </div>

          {/* Botones de acción */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '16px', marginTop: '12px' }}>
            {success && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#16a34a', fontSize: '13px', fontWeight: '600' }}>
                <CheckCircle size={16} />
                <span>¡Perfil guardado con éxito!</span>
              </div>
            )}
            
            <button
              type="submit"
              disabled={saving}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: '#2563eb',
                border: 'none',
                borderRadius: '10px',
                padding: '10px 20px',
                fontSize: '13px',
                fontWeight: '700',
                color: 'white',
                cursor: 'pointer',
                transition: 'background 0.2s, transform 0.1s',
                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.2)'
              }}
            >
              <Save size={15} />
              <span>{saving ? 'Guardando...' : 'Guardar Cambios'}</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  )
}