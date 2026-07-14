import React, { useEffect, useState, useMemo } from 'react';
import { Search, Plus } from 'lucide-react';
import MaterialCard from '../components/library/MaterialCard';
import UploadMaterialModal from '../components/library/UploadMaterialModal';
import PdfViewerModal from '../components/library/PdfViewerModal';
import useLibraryStore from '../store/useLibraryStore';
import { useTranslation } from '../utils/i18n';
import './Library.css';

export default function Library() {
  const { materials, fetchMaterials, isLoading } = useLibraryStore();
  const { t } = useTranslation();
  
  const [activeTab, setActiveTab] = useState('Todos'); // 'Todos', 'Libros', 'PDFs', 'Guías', 'Datasheets'
  const [activeFilter, setActiveFilter] = useState('Todos'); // 'Todos', 'Principiante', 'Intermedio', 'Avanzado'
  const [searchQuery, setSearchQuery] = useState('');
  
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedMaterialForView, setSelectedMaterialForView] = useState(null);

  // Fetch materials whenever category or difficulty changes
  useEffect(() => {
    fetchMaterials(
      activeTab === 'Todos' ? null : activeTab,
      activeFilter === 'Todos' ? null : activeFilter
    );
  }, [activeTab, activeFilter, fetchMaterials]);

  // Local search filtering
  const filteredMaterials = useMemo(() => {
    if (!searchQuery) return materials;
    return materials.filter(m => 
      m.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [materials, searchQuery]);

  const tabLabels = {
    Todos: t('libTabTodo'),
    Libros: t('libTabLibros'),
    PDFs: t('libTabPdfs'),
    Guías: t('libTabGuias'),
    Datasheets: t('libTabDatasheets')
  };

  const filterLabels = {
    Todos: t('libAll'),
    Principiante: t('libBeginner'),
    Intermedio: t('libIntermediate'),
    Avanzado: t('libAdvanced')
  };

  return (
    <div className="library-page">
      {/* Top Header */}
      <div className="library-header">
        <div className="library-header__left">
          <h1 className="library-title">{t('libTitle')}</h1>
          <div className="library-tabs">
            {['Todos', 'Libros', 'PDFs', 'Guías', 'Datasheets'].map(tab => (
              <button 
                key={tab}
                className={`library-tab ${activeTab === tab ? 'active' : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                {tabLabels[tab]}
              </button>
            ))}
          </div>
        </div>
        
        <div className="library-header__right">
          <button className="btn-upload" onClick={() => setShowUploadModal(true)}>
            <Plus size={16} /> {t('libUploadBtn')}
          </button>
          <div className="library-search">
            <Search size={16} className="library-search-icon" />
            <input 
              type="text" 
              placeholder={t('libSearchPlaceholder')} 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="library-filters">
        {['Todos', 'Principiante', 'Intermedio', 'Avanzado'].map(filter => (
          <button 
            key={filter}
            className={`library-chip ${activeFilter === filter ? 'active' : ''}`}
            onClick={() => setActiveFilter(filter)}
          >
            {filterLabels[filter]}
          </button>
        ))}
      </div>

      {/* Grid */}
      {isLoading ? (
        <div style={{textAlign: 'center', marginTop: '40px', color: '#6B7280'}}>
          {t('libLoading')}
        </div>
      ) : filteredMaterials.length > 0 ? (
        <div className="material-grid">
          {filteredMaterials.map(material => (
            <MaterialCard 
              key={material.id} 
              material={material} 
              onOpen={() => setSelectedMaterialForView(material)}
            />
          ))}
        </div>
      ) : (
        <div style={{textAlign: 'center', marginTop: '40px', color: '#6B7280'}}>
          {t('libEmpty')}
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <UploadMaterialModal onClose={() => setShowUploadModal(false)} />
      )}

      {/* PDF Viewer Modal */}
      {selectedMaterialForView && (
        <PdfViewerModal 
          material={selectedMaterialForView} 
          onClose={() => setSelectedMaterialForView(null)} 
        />
      )}
    </div>
  );
}