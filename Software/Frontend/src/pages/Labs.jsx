import { useEffect, useState } from 'react'

const backendUrl = import.meta.env.VITE_BACKEND_URL ?? 'http://localhost:8000'

export default function Labs() {
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [currentStep, setCurrentStep] = useState(0)

  useEffect(() => {
    if (!file) {
      setPreviewUrl('')
      return undefined
    }

    const url = URL.createObjectURL(file)
    setPreviewUrl(url)

    return () => URL.revokeObjectURL(url)
  }, [file])

  const handleFileChange = (event) => {
    const selectedFile = event.target.files?.[0]
    setFile(selectedFile ?? null)
    setError('')
    setResult(null)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!file) {
      setError('Selecciona una imagen antes de enviar.')
      return
    }

    setLoading(true)
    setError('')

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch(`${backendUrl}/extract`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const message = await response.text()
        throw new Error(message || 'No se pudo generar el JSON.')
      }

      const data = await response.json()
      setResult(data)
    } catch (requestError) {
      setError(requestError.message || 'Error al conectar con el backend.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        padding: '32px',
        minHeight: '100%',
        background: 'linear-gradient(180deg, #F5F0EB 0%, #EFE7DD 100%)',
      }}
    >
      <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gap: '24px' }}>
        <header>
          <p
            style={{
              marginBottom: '8px',
              color: '#2563EB',
              fontWeight: 700,
              letterSpacing: '0.04em',
            }}
          >
            LABS
          </p>
          <h1 style={{ fontSize: '40px', marginBottom: '12px', color: '#111827' }}>
            Generador de JSON del circuito
          </h1>
          <p style={{ maxWidth: '720px', color: '#4B5563', lineHeight: 1.6 }}>
            Sube una imagen del circuito y consulta directamente el JSON que
            devuelve la IA para validar la extracción.
          </p>
        </header>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(320px, 420px) 1fr',
            gap: '24px',
            alignItems: 'start',
          }}
        >
          <section
            style={{
              background: 'white',
              borderRadius: '24px',
              padding: '24px',
              boxShadow: '0 18px 50px rgba(15, 23, 42, 0.08)',
            }}
          >
            <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '16px' }}>
              <label
                style={{
                  display: 'grid',
                  gap: '10px',
                  fontWeight: 600,
                  color: '#111827',
                }}
              >
                Imagen del circuito
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  style={{
                    padding: '12px',
                    borderRadius: '14px',
                    border: '1px solid #D1D5DB',
                    background: '#F9FAFB',
                  }}
                />
              </label>

              <button
                type="submit"
                disabled={loading}
                style={{
                  border: 'none',
                  borderRadius: '14px',
                  padding: '14px 18px',
                  background: loading ? '#93C5FD' : '#2563EB',
                  color: 'white',
                  fontWeight: 700,
                  cursor: loading ? 'wait' : 'pointer',
                }}
              >
                {loading ? 'Generando JSON...' : 'Enviar al backend'}
              </button>

              {error ? (
                <div
                  style={{
                    padding: '12px 14px',
                    borderRadius: '12px',
                    background: '#FEE2E2',
                    color: '#991B1B',
                  }}
                >
                  {error}
                </div>
              ) : null}
            </form>

            <div style={{ marginTop: '20px', color: '#6B7280', fontSize: '14px' }}>
              <p>
                <strong>Backend:</strong> {backendUrl}
              </p>
              <p>
                <strong>Estado:</strong> {file ? file.name : 'Sin archivo seleccionado'}
              </p>
            </div>
          </section>

          <section
            style={{
              background: 'white',
              borderRadius: '24px',
              padding: '24px',
              boxShadow: '0 18px 50px rgba(15, 23, 42, 0.08)',
              minHeight: '520px',
              display: 'grid',
              gap: '16px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
              }}
            >
              <h2 style={{ fontSize: '22px', color: '#111827' }}>Respuesta JSON</h2>
              <span style={{ fontSize: '13px', color: '#6B7280' }}>
                {result ? 'Resultado recibido' : 'Esperando generación'}
              </span>
            </div>

            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Preview del circuito"
                style={{
                  width: '100%',
                  maxHeight: '280px',
                  objectFit: 'contain',
                  borderRadius: '18px',
                  background: '#F3F4F6',
                }}
              />
            ) : (
              <div
                style={{
                  padding: '24px',
                  borderRadius: '18px',
                  background: '#F9FAFB',
                  color: '#6B7280',
                }}
              >
                Selecciona una imagen para ver una vista previa.
              </div>
            )}

            <pre
              style={{
                margin: 0,
                padding: '20px',
                borderRadius: '18px',
                background: '#0F172A',
                color: '#E2E8F0',
                overflow: 'auto',
                minHeight: '220px',
                fontSize: '13px',
                lineHeight: 1.6,
              }}
            >
              {result ? JSON.stringify(result, null, 2) : 'El JSON generado por la IA aparecerá aquí.'}
            </pre>
            {result?.project?.assembly_steps ? (
              <section
                style={{
                  background: 'white',
                  borderRadius: '24px',
                  padding: '24px',
                  boxShadow: '0 18px 50px rgba(15, 23, 42, 0.08)',
                }}
              >
                <h2 style={{ fontSize: '22px', color: '#111827', marginBottom: '20px' }}>
                  Instrucciones de armado
                </h2>

                <div style={{ display: 'grid', gap: '12px', marginBottom: '24px' }}>
                  {result.project.assembly_steps.map((step, index) => (
                    <div
                      key={step.step_number}
                      onClick={() => setCurrentStep(index)}
                      style={{
                        display: 'flex',
                        gap: '16px',
                        padding: '16px',
                        borderRadius: '14px',
                        cursor: 'pointer',
                        border: `2px solid ${currentStep === index ? '#2563EB' : '#E5E7EB'}`,
                        background: currentStep === index ? '#EFF6FF' : 'white',
                      }}
                    >
                      <div
                        style={{
                          minWidth: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          background: currentStep === index ? '#2563EB' : '#F3F4F6',
                          color: currentStep === index ? 'white' : '#6B7280',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: '14px',
                        }}
                      >
                        {step.step_number}
                      </div>

                      <div>
                        <p style={{ fontWeight: 600, color: '#111827', marginBottom: '4px' }}>
                          {step.title}
                        </p>
                        {currentStep === index ? (
                          <p style={{ color: '#4B5563', fontSize: '14px', lineHeight: 1.6 }}>
                            {step.description}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <button
                    onClick={() => setCurrentStep((stepIndex) => Math.max(0, stepIndex - 1))}
                    disabled={currentStep === 0}
                    style={{
                      padding: '10px 24px',
                      borderRadius: '10px',
                      border: '1px solid #E5E7EB',
                      background: 'white',
                      cursor: currentStep === 0 ? 'not-allowed' : 'pointer',
                      color: currentStep === 0 ? '#9CA3AF' : '#111827',
                      fontWeight: 600,
                    }}
                  >
                    Anterior
                  </button>

                  <button
                    onClick={() =>
                      setCurrentStep((stepIndex) =>
                        Math.min(result.project.assembly_steps.length - 1, stepIndex + 1)
                      )
                    }
                    disabled={currentStep === result.project.assembly_steps.length - 1}
                    style={{
                      padding: '10px 24px',
                      borderRadius: '10px',
                      border: 'none',
                      background:
                        currentStep === result.project.assembly_steps.length - 1
                          ? '#93C5FD'
                          : '#F59E0B',
                      color: 'white',
                      cursor:
                        currentStep === result.project.assembly_steps.length - 1
                          ? 'not-allowed'
                          : 'pointer',
                      fontWeight: 700,
                    }}
                  >
                    Siguiente
                  </button>
                </div>
              </section>
            ) : null}
          </section>
        </div>
      </div>
    </div>
  )
}