import React, { useState, useRef } from 'react';
import { X, UploadCloud, FileText, ChevronDown } from 'lucide-react';
import useLibraryStore from '../../store/useLibraryStore';

export default function UploadMaterialModal({ onClose, onSuccess }) {
  const uploadMaterial = useLibraryStore(state => state.uploadMaterial);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    category: 'Libros',
    difficulty: 'Principiante',
    file: null
  });

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'file') {
      setFormData(prev => ({ ...prev, file: files[0] }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.file) return;

    setLoading(true);
    try {
      const data = new FormData();
      data.append('title', formData.title);
      data.append('category', formData.category);
      data.append('difficulty', formData.difficulty);
      data.append('file', formData.file);

      await uploadMaterial(data);
      if (onSuccess) {
        onSuccess();
      } else {
        onClose(); // Fallback if onSuccess is not provided
      }
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3>Subir Nuevo Material</h3>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Título del Material</label>
            <input 
              type="text" 
              name="title" 
              value={formData.title} 
              onChange={handleChange} 
              placeholder="Ej: Fundamentos de Circuitos" 
              required 
              className="premium-input"
            />
          </div>
          
          <div className="form-group">
            <label>Categoría</label>
            <div className="select-wrapper">
              <select className="premium-select" name="category" value={formData.category} onChange={handleChange}>
                <option value="Libros">Libros</option>
                <option value="PDFs">PDFs</option>
                <option value="Guías">Guías</option>
                <option value="Datasheets">Datasheets</option>
              </select>
              <ChevronDown className="select-icon" size={16} />
            </div>
          </div>
          
          <div className="form-group">
            <label>Dificultad</label>
            <div className="select-wrapper">
              <select className="premium-select" name="difficulty" value={formData.difficulty} onChange={handleChange}>
                <option value="Principiante">Principiante</option>
                <option value="Intermedio">Intermedio</option>
                <option value="Avanzado">Avanzado</option>
                <option value="Referencia">Referencia</option>
              </select>
              <ChevronDown className="select-icon" size={16} />
            </div>
          </div>
          
          <div className="form-group">
            <label>Archivo (PDF)</label>
            <div className="file-upload-wrapper">
              <label className="file-upload-box">
                <input 
                  type="file" 
                  name="file" 
                  accept=".pdf" 
                  onChange={handleChange} 
                  required 
                  className="file-input-hidden"
                />
                <div className="file-upload-content">
                  <UploadCloud size={32} className="upload-icon" />
                  <span className="upload-text">
                    {formData.file ? (
                      <span style={{ color: '#2563EB', fontWeight: '600' }}>{formData.file.name}</span>
                    ) : (
                      'Haz clic para seleccionar el PDF'
                    )}
                  </span>
                  <span className="upload-subtext">PDF hasta 10MB</span>
                </div>
              </label>
            </div>
          </div>
          
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={loading}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary" disabled={loading || !formData.title || !formData.file}>
              {loading ? 'Subiendo...' : 'Subir'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
