import React from 'react';
import { Download, ExternalLink, FileText, Book, Eye } from 'lucide-react';
import useLibraryStore from '../../store/useLibraryStore';

export default function MaterialCard({ material, onOpen }) {
  const downloadMaterialAsBlob = useLibraryStore(state => state.downloadMaterialAsBlob);

  const isPDF = material.file_path && material.file_path.toLowerCase().endsWith('.pdf');
  
  const handleDownload = (e) => {
    e.stopPropagation();
    downloadMaterialAsBlob(material.id, `${material.title}.pdf`);
  };

  return (
    <div className="material-card" style={{ cursor: 'pointer' }} onClick={onOpen}>
      <div className="material-card__cover">
        {material.cover_image_url ? (
          <img src={`${import.meta.env.VITE_BACKEND_URL ?? 'http://localhost:8000'}${material.cover_image_url}`} alt={material.title} />
        ) : (
          <div className="material-card__cover-placeholder">
            {material.category === 'Libros' ? <Book size={48} strokeWidth={1} /> : <FileText size={48} strokeWidth={1} />}
            <span style={{opacity: 0.5}}>{material.category.toUpperCase()}</span>
          </div>
        )}
      </div>
      
      <div className="material-card__content">
        <h3 className="material-card__title">{material.title}</h3>
        <p className="material-card__desc">
          {material.difficulty} • {material.category}
        </p>
      </div>

      <div className="material-card__footer">
        {material.progress > 0 ? (
          <>
            <span className="material-card__progress-text">Progreso</span>
            <span className="material-card__progress-val">{material.progress}%</span>
          </>
        ) : (
          <span className="material-card__progress-text" style={{color: '#6B7280'}}>Sin empezar</span>
        )}
        
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="material-card__action" onClick={handleDownload} title="Descargar PDF">
            <Download size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
