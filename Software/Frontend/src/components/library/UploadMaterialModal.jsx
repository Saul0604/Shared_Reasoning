import React, { useState } from 'react';
import { X } from 'lucide-react';
import useLibraryStore from '../../store/useLibraryStore';

export default function UploadMaterialModal({ onClose }) {
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
      onClose(); // Cerrar modal si fue exitoso
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
            />
          </div>
          
          <div className="form-group">
            <label>Categoría</label>
            <select name="category" value={formData.category} onChange={handleChange}>
              <option value="Libros">Libros</option>
              <option value="PDFs">PDFs</option>
              <option value="Guías">Guías</option>
              <option value="Datasheets">Datasheets</option>
            </select>
          </div>
          
          <div className="form-group">
            <label>Dificultad</label>
            <select name="difficulty" value={formData.difficulty} onChange={handleChange}>
              <option value="Principiante">Principiante</option>
              <option value="Intermedio">Intermedio</option>
              <option value="Avanzado">Avanzado</option>
              <option value="Referencia">Referencia</option>
            </select>
          </div>
          
          <div className="form-group">
            <label>Archivo (PDF)</label>
            <input 
              type="file" 
              name="file" 
              accept=".pdf" 
              onChange={handleChange} 
              required 
            />
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
