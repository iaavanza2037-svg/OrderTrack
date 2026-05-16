import React, { useState } from 'react';
import { useStore } from '../hooks/useStore';
import { Plus, Search, UserPlus, Phone, MapPin, Trash2, Edit3, X, User, Users } from 'lucide-react';
import { Cliente } from '../types';

export const ClientesPage: React.FC = () => {
  const { data, addCliente, updateCliente, deleteCliente } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null);

  const [formData, setFormData] = useState({
    nombre: '',
    codigoPais: '+504',
    telefono: '',
    direccion: '',
    observaciones: '',
  });

  const filteredClientes = data.clientes.filter(c => 
    c.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.telefono.includes(searchTerm)
  );

  const openModal = (cliente?: Cliente) => {
    if (cliente) {
      setEditingCliente(cliente);
      // Extraer código de país (si existe, asumiendo formato +XXX...)
      const telParts = cliente.telefono.split(' ');
      const hasCode = cliente.telefono.startsWith('+');
      
      setFormData({
        nombre: cliente.nombre,
        codigoPais: hasCode ? telParts[0] : '+504',
        telefono: hasCode ? telParts.slice(1).join(' ') : cliente.telefono,
        direccion: cliente.direccion || '',
        observaciones: cliente.observaciones || '',
      });
    } else {
      setEditingCliente(null);
      setFormData({ nombre: '', codigoPais: '+504', telefono: '', direccion: '', observaciones: '' });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingCliente(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalData = {
      ...formData,
      telefono: `${formData.codigoPais.trim()} ${formData.telefono.trim()}`.trim()
    };
    
    // Quitar codigoPais del objeto final si no está en el tipo Cliente (está en formData localmente)
    const { codigoPais, ...clienteData } = finalData;

    if (editingCliente) {
      updateCliente(editingCliente.id, clienteData);
    } else {
      addCliente(clienteData);
    }
    closeModal();
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Clientes</h1>
          <p className="text-slate-500">Agenda de clientes y contactos</p>
        </div>
        <button 
          onClick={() => openModal()}
          className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg shadow-blue-100 transition-all active:scale-95"
        >
          <UserPlus className="w-5 h-5" />
          Nuevo Cliente
        </button>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input 
            type="text" 
            placeholder="Buscar por nombre o teléfono..." 
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredClientes.map(cliente => (
          <div key={cliente.id} className="bento-card hover:shadow-md transition-all">
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center">
                <User className="text-blue-500 w-6 h-6" />
              </div>
              <div className="flex gap-1">
                <button onClick={() => openModal(cliente)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                  <Edit3 className="w-4 h-4" />
                </button>
                <button onClick={() => { if(confirm('¿Borrar cliente? Se borrarán sus pedidos.')) deleteCliente(cliente.id) }} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <h3 className="text-lg font-bold text-slate-800 mb-4">{cliente.nombre}</h3>
            
            <div className="space-y-3">
              <p className="text-sm text-slate-600 flex items-start gap-3">
                <Phone className="w-4 h-4 text-slate-400 mt-0.5" />
                <span>{cliente.telefono}</span>
              </p>
              {cliente.direccion && (
                <p className="text-sm text-slate-600 flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-slate-400 mt-0.5" />
                  <span>{cliente.direccion}</span>
                </p>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-slate-50 flex justify-between items-center">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Pedidos</span>
              <span className="bg-blue-50 text-blue-600 font-bold px-3 py-1 rounded-full text-xs">
                {data.pedidos.filter(p => p.clienteId === cliente.id).length}
              </span>
            </div>
          </div>
        ))}
      </div>

      {filteredClientes.length === 0 && (
        <div className="bg-white rounded-2xl p-12 text-center border border-dashed border-slate-200">
          <Users className="w-16 h-16 text-slate-200 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-600">No hay clientes registrados</h3>
          <p className="text-slate-400">Añade tu primer cliente para empezar a recibir pedidos</p>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-xl font-bold text-slate-800">{editingCliente ? 'Editar Cliente' : 'Nuevo Cliente'}</h2>
              <button onClick={closeModal} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                <X className="w-6 h-6 text-slate-500" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Nombre Completo</label>
                  <input 
                    required 
                    type="text" 
                    className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500"
                    value={formData.nombre}
                    onChange={e => setFormData(p => ({ ...p, nombre: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Teléfono / WhatsApp</label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="+504"
                      className="w-24 px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 font-bold text-center"
                      value={formData.codigoPais}
                      onChange={e => setFormData(p => ({ ...p, codigoPais: e.target.value }))}
                    />
                    <input 
                      required 
                      type="tel" 
                      placeholder="Número de celular"
                      className="flex-1 px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500"
                      value={formData.telefono}
                      onChange={e => setFormData(p => ({ ...p, telefono: e.target.value }))}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Dirección (Opcional)</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500"
                    value={formData.direccion}
                    onChange={e => setFormData(p => ({ ...p, direccion: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Observaciones</label>
                  <textarea 
                    rows={3}
                    className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 resize-none"
                    value={formData.observaciones}
                    onChange={e => setFormData(p => ({ ...p, observaciones: e.target.value }))}
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
                  {editingCliente ? 'Guardar Cambios' : 'Registrar Cliente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
