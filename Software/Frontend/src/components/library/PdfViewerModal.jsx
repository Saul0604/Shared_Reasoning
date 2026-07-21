import React, { useEffect, useState } from 'react';
import { X, Download } from 'lucide-react';
import useLibraryStore from '../../store/useLibraryStore';
import { apiFetch } from '../../utils/apiFetch';

export default function PdfViewerModal({ material, onClose }) {
  const [blobUrl, setBlobUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const downloadMaterialAsBlob = useLibraryStore(state => state.downloadMaterialAsBlob);

  useEffect(() => {
    const API_URL = import.meta.env.VITE_BACKEND_URL || (window.location.hostname === 'localhost' ? 'http://localhost:8000' : '/api');
    setBlobUrl(`${API_URL}/library/download/${material.id}`);
    setLoading(false);
  }, [material.id]);

  const handleDownload = () => {
    downloadMaterialAsBlob(material.id, `${material.title}.pdf`);
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 9999 }}>
      <div className="modal-content" style={{ width: '90vw', height: '90vh', maxWidth: '1200px', display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderBottom: '1px solid #E5E7EB', background: '#F9FAFB' }}>
          <h3 style={{ margin: 0, fontSize: '18px', color: '#111827', fontWeight: 600 }}>{material.title}</h3>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }} onClick={handleDownload} title="Descargar">
              <Download size={16} /> Descargar
            </button>
            <button className="modal-close" onClick={onClose} style={{ padding: '8px', background: '#E5E7EB', borderRadius: '50%' }}>
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Viewer */}
        <div style={{ flex: 1, position: 'relative', background: '#E5E7EB' }}>
          {loading && (
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: '#6B7280' }}>
              Cargando documento...
            </div>
          )}
          {error && (
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: '#EF4444' }}>
              {error}
            </div>
          )}
          {blobUrl && (
            <iframe
              src={`${blobUrl}#toolbar=0`}
              title={material.title}
              style={{ width: '100%', height: '100%', border: 'none' }}
            />
          )}
        </div>

      </div>
    </div>
  );
}
