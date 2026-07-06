import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Lock, X } from 'lucide-react';
import useAppStore from '../store/useAppStore';


const backendUrl = import.meta.env.VITE_BACKEND_URL ?? 'http://localhost:8000';

const S = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    width: '100vw',
    backgroundColor: '#F8F6F2',
    fontFamily: "'Inter', sans-serif",
    padding: '24px',
  },
  header: {
    position: 'absolute',
    top: '24px',
    left: '24px',
    fontSize: '14px',
    color: '#9CA3AF',
    textTransform: 'lowercase',
  },
  card: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    maxWidth: '540px',
    width: '100%',
    textAlign: 'center',
    gap: '24px',
  },
  logoContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '96px',
    height: '96px',
    borderRadius: '24px',
    background: 'transparent',
  },
  logoSvg: {
    width: '80px',
    height: '80px',
  },
  title: {
    fontSize: '28px',
    fontWeight: '750',
    color: '#111827',
    lineHeight: '1.25',
    margin: '0',
  },
  subtitle: {
    fontSize: '15px',
    color: '#6B7280',
    margin: '0',
    fontWeight: '400',
    lineHeight: '1.5',
  },
  btnRow: {
    display: 'flex',
    gap: '12px',
    marginTop: '12px',
    justifyContent: 'center',
    width: '100%',
  },
  btnOutline: {
    padding: '12px 36px',
    borderRadius: '9999px',
    border: '1px solid #2563EB',
    background: 'white',
    color: '#2563EB',
    fontWeight: '700',
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    minWidth: '180px',
    outline: 'none',
  },
  btnPrimary: {
    padding: '12px 36px',
    borderRadius: '9999px',
    border: 'none',
    background: '#F59E0B',
    color: 'white',
    fontWeight: '700',
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    minWidth: '180px',
    justifyContent: 'center',
    outline: 'none',
  },
  // Modal de inicio de sesión
  // Panel de Inicio de Sesión Moderno con la paleta de colores de Elektra
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    background: 'rgba(0, 0, 0, 0.4)', // Oscurece el fondo original de forma sutil
    backdropFilter: 'blur(4px)', // Desenfoque suave para mantener visible la landing original
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modalCard: {
    width: '100%',
    maxWidth: '440px',
    background: '#FFFFFF',
    borderRadius: '24px',
    padding: '48px 40px',
    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.08)',
    display: 'flex',
    flexDirection: 'column',
    gap: '28px',
    position: 'relative',
    overflow: 'hidden',
  },
  // Blobs de colores en las esquinas internas de la tarjeta para replicar el diseño de la imagen
  decorBlob1: {
    position: 'absolute',
    top: '-30px',
    right: '-30px',
    width: '100px',
    height: '100px',
    borderRadius: '50%',
    background: '#F59E0B', // Rojo coral
    opacity: 0.85,
    // filter: 'blur(5px)',
  },
  decorBlob2: {
    position: 'absolute',
    bottom: '-30px',
    left: '-30px',
    width: '120px',
    height: '120px',
    borderRadius: '50%',
    background: '#2563EB', // Azul Elektra
    opacity: 0.9,
    // filter: 'blur(5px)',
  },
  modalTitle: {
    fontSize: '26px',
    fontWeight: '800',
    color: '#1E293B',
    margin: 0,
    textAlign: 'center',
    letterSpacing: '-0.5px',
    position: 'relative',
    zIndex: 2,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    position: 'relative',
    zIndex: 2,
  },
  inputWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  inputIcon: {
    position: 'absolute',
    left: '16px',
    color: '#64748B',
    pointerEvents: 'none',
  },
  input: {
    padding: '14px 16px 14px 44px', // Espacio izquierdo para el icono
    borderRadius: '9999px', // Inputs tipo píldora
    border: '1.5px solid #1E293B', // Borde oscuro definido como la imagen
    background: '#FFFFFF',
    fontSize: '14px',
    outline: 'none',
    width: '100%',
    fontWeight: '500',
    color: '#1E293B',
    transition: 'all 0.2s',
  },
  errorText: {
    fontSize: '13px',
    color: '#EF4444',
    margin: 0,
    textAlign: 'center',
  },
  modalActions: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px',
    marginTop: '8px',
  },
  btnSubmit: {
    padding: '12px 32px',
    borderRadius: '9999px',
    border: 'none',
    background: '#2563EB', // Botón SIGN IN azul
    color: 'white',
    fontWeight: '700',
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    minWidth: '160px',
    boxShadow: '0 4px 12px rgba(37,99,235,0.2)',
  },
  btnCancel: {
    background: 'none',
    border: 'none',
    color: '#64748B',
    textDecoration: 'underline', // Link de cancelar en vez de botón rígido
    fontWeight: '500',
    fontSize: '13px',
    cursor: 'pointer',
    padding: '4px 8px',
  },
  closeBtn: {
    position: 'absolute',
    top: '16px',
    right: '16px',
    background: 'none',
    border: 'none',
    color: '#64748B',
    cursor: 'pointer',
    padding: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '50%',
    transition: 'background 0.2s',
    zIndex: 10,
  }
};

export default function Landing() {
  const [showLogin, setShowLogin] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const setUser = useAppStore((state) => state.setUser);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      // API de autenticación espera OAuth2 form-data
      const formData = new URLSearchParams();
      formData.append('username', email);
      formData.append('password', password);

      const response = await fetch(`${backendUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Error al iniciar sesión');
      }

      const tokenData = await response.json();
      localStorage.setItem('access_token', tokenData.access_token);

      // Obtener detalles del usuario actual
      const userRes = await fetch(`${backendUrl}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`,
        },
      });

      if (userRes.ok) {
        const userData = await userRes.json();
        setUser(userData);
      }

      setShowLogin(false);
      navigate('/app'); // Redirigir a la app
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={S.container}>
      <div style={S.card}>
        {/* Logo Sol Elektra en SVG */}
        <div style={S.logoContainer}>
          <img src="/logo.svg" alt="Logo Sol Elektra" />
        </div>

        <h1 style={S.title}>Aprende electrónica con inteligencia artificial</h1>
        <p style={S.subtitle}>Tu tutor personal para dominar circuitos y sistemas.</p>

        <div style={S.btnRow}>
          <button
            style={S.btnOutline}
            onClick={() => setShowLogin(true)}
          >
            Iniciar sesión
          </button>
          <button
            style={S.btnPrimary}
            onClick={() => navigate('/survey')}
          >
            Crear cuenta ➔
          </button>
        </div>
      </div>

      {/* Modal de Login */}
      {showLogin && (
        <div style={S.modalOverlay}>
          <div style={S.modalCard}>
            {/* Blobs decorativos de color */}
            <div style={S.decorBlob1} />
            <div style={S.decorBlob2} />

            {/* Botón X para cerrar modal */}
            <button
              type="button"
              style={S.closeBtn}
              onClick={() => {
                setShowLogin(false);
                setErrorMsg('');
              }}
              title="Cerrar"
            >
              <X size={20} />
            </button>

            <h2 style={S.modalTitle}>Hi, Welcome Back!</h2>

            <form onSubmit={handleLoginSubmit} style={S.form}>
              <div style={S.inputWrapper}>
                <User size={18} style={S.inputIcon} />
                <input
                  type="email"
                  style={S.input}
                  placeholder="username/email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div style={S.inputWrapper}>
                <Lock size={18} style={S.inputIcon} />
                <input
                  type="password"
                  style={S.input}
                  placeholder="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              {errorMsg && <p style={S.errorText}>⚠️ {errorMsg}</p>}

              <div style={S.modalActions}>
                <button
                  type="submit"
                  style={S.btnSubmit}
                  disabled={loading}
                >
                  {loading ? 'INGRESANDO...' : 'SIGN IN'}
                </button>

                <button
                  type="button"
                  style={S.btnCancel}
                  onClick={() => {
                    setShowLogin(false);
                    setErrorMsg('');
                  }}
                  disabled={loading}
                >
                  Forgot my password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}