import React, { useState } from 'react';
import { useStore } from '../hooks/useStore';
import { Plus, Search, Store as StoreIcon, Globe, MapPin, Trash2, Edit3, X, ExternalLink } from 'lucide-react';
import { Tienda } from '../types';

export const TiendasPage: React.FC = () => {
  const { data, addTienda, updateTienda, deleteTienda } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTienda, setEditingTienda] = useState<Tienda | null>(null);

  const [formData, setFormData] = useState({
    nombre: '',
    pais: '',
    sitioWeb: '',
    notas: '',
  });

  const filteredTiendas = data.tiendas.filter(t => 
    t.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || 
    t.pais.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openModal = (tienda?: Tienda) => {
    if (tienda) {
      setEditingTienda(tienda);
      setFormData({
        nombre: tienda.nombre,
        pais: tienda.pais,
        sitioWeb: tienda.sitioWeb || '',
        notas: tienda.notas || '',
      });
    } else {
      setEditingTienda(null);
      setFormData({ nombre: '', pais: '', sitioWeb: '', notas: '' });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingTienda(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingTienda) {
      updateTienda(editingTienda.id, formData);
    } else {
      addTienda(formData);
    }
    closeModal();
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Tiendas</h1>
          <p className="text-slate-500">Configura tus fuentes de compra</p>
        </div>
        <button 
          onClick={() => openModal()}
          className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg shadow-blue-100 transition-all active:scale-95"
        >
          <Plus className="w-5 h-5" />
          Nueva Tienda
        </button>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input 
            type="text" 
            placeholder="Buscar por nombre o país..." 
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTiendas.map(tienda => (
          <div key={tienda.id} className="bento-card hover:shadow-md transition-all">
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center">
                <StoreIcon className="text-indigo-500 w-6 h-6" />
              </div>
              <div className="flex gap-1">
                <button onClick={() => openModal(tienda)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                  <Edit3 className="w-4 h-4" />
                </button>
                <button onClick={() => { if(confirm('¿Borrar tienda? Se borrarán sus pedidos vinculados.')) deleteTienda(tienda.id) }} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <h3 className="text-lg font-bold text-slate-800 mb-1">{tienda.nombre}</h3>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">{tienda.pais}</p>
            
            {tienda.sitioWeb && (
              <a 
                href={tienda.sitioWeb.startsWith('http') ? tienda.sitioWeb : `https://${tienda.sitioWeb}`} 
                target="_blank" rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:underline flex items-center gap-2 mb-4"
              >
                <Globe className="w-4 h-4" /> Sitio Web <ExternalLink className="w-3 h-3" />
              </a>
            )}

            <div className="mt-6 pt-4 border-t border-slate-50 flex justify-between items-center">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Actividad</span>
              <span className="bg-indigo-50 text-indigo-600 font-bold px-3 py-1 rounded-full text-xs">
                {data.pedidos.filter(p => p.tiendaId === tienda.id).length} pedidos
              </span>
            </div>
          </div>
        ))}
      </div>

      {filteredTiendas.length === 0 && (
        <div className="bg-white rounded-2xl p-12 text-center border border-dashed border-slate-200">
          <StoreIcon className="w-16 h-16 text-slate-200 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-600">No hay tiendas registradas</h3>
          <p className="text-slate-400">Registra las tiendas donde sueles comprar</p>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-xl font-bold text-slate-800">{editingTienda ? 'Editar Tienda' : 'Nueva Tienda'}</h2>
              <button onClick={closeModal} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                <X className="w-6 h-6 text-slate-500" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Nombre de la Tienda</label>
                  <input 
                    required 
                    type="text" 
                    placeholder="Ej: Amazon, Shein, eBay"
                    className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500"
                    value={formData.nombre}
                    onChange={e => setFormData(p => ({ ...p, nombre: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">País de la Tienda</label>
                  <input 
                    required 
                    type="text" 
                    placeholder="Ej: USA, China, Honduras"
                    className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500"
                    value={formData.pais}
                    onChange={e => setFormData(p => ({ ...p, pais: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Sitio Web (Opcional)</label>
                  <input 
                    type="text" 
                    placeholder="www.tienda.com"
                    className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500"
                    value={formData.sitioWeb}
                    onChange={e => setFormData(p => ({ ...p, sitioWeb: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Notas Rápidas</label>
                  <textarea 
                    rows={3}
                    placeholder="Ej: Tiempos de entrega, políticas de retorno..."
                    className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 resize-none"
                    value={formData.notas}
                    onChange={e => setFormData(p => ({ ...p, notas: e.target.value }))}
                  />
                </div>
              </div>

              <div className="mt-10 flex gap-4">
                <button 
                  type="button"
                  onClick={closeModal}
                  className="flex-1 py-3 px-6 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-2xl transition-all"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="flex-[2] py-3 px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-lg shadow-blue-200 transition-all active:scale-95"
                >
                  {editingTienda ? 'Guardar Cambios' : 'Registrar Tienda'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
