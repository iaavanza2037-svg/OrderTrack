import React, { useState, useMemo } from 'react';
import { useStore } from '../hooks/useStore';
import { Plus, Search, Filter, MessageCircle, ExternalLink, Trash2, Edit3, Camera, X, Users, Store, ShoppingCart, Package } from 'lucide-react';
import { EstadoPedido, Pedido } from '../types';
import { fileToBase64, compressImage } from '../lib/imageUtils';
import { format } from 'date-fns';

export const PedidosPage: React.FC = () => {
  const { data, addPedido, updatePedido, deletePedido } = useStore();
  const [activeTab, setActiveTab] = useState<'pedidos' | 'whatsapp'>('pedidos');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState<string>('');
  const [filterTienda, setFilterTienda] = useState<string>('');
  const [filterCliente, setFilterCliente] = useState<string>('');
  const [filterFechaDesde, setFilterFechaDesde] = useState<string>('');
  const [filterFechaHasta, setFilterFechaHasta] = useState<string>('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [statusMenuPedidoId, setStatusMenuPedidoId] = useState<string | null>(null);
  const [editingPedido, setEditingPedido] = useState<Pedido | null>(null);
  
  // WhatsApp bulk selection state
  const [selectedPedidoIds, setSelectedPedidoIds] = useState<string[]>([]);

  // Form State
  const [formData, setFormData] = useState({
    clienteId: '',
    tiendaId: '',
    descripcion: '',
    precioCompra: 0,
    precioVenta: 0,
    estado: EstadoPedido.PENDIENTE,
    fotoBase64: '',
    observaciones: '',
    fechaPedido: new Date().toISOString().split('T')[0],
  });

  const filteredPedidos = useMemo(() => {
    return data.pedidos.filter(p => {
      const cliente = data.clientes.find(c => c.id === p.clienteId);
      const matchesSearch = p.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          cliente?.nombre.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesEstado = filterEstado ? p.estado === filterEstado : true;
      const matchesTienda = filterTienda ? p.tiendaId === filterTienda : true;
      const matchesCliente = filterCliente ? p.clienteId === filterCliente : true;
      
      let matchesFecha = true;
      if (filterFechaDesde || filterFechaHasta) {
        const pedidoDate = new Date(p.fechaCreacion);
        if (filterFechaDesde) {
          const fromDate = new Date(filterFechaDesde);
          if (pedidoDate < fromDate) matchesFecha = false;
        }
        if (filterFechaHasta) {
          const toDate = new Date(filterFechaHasta);
          toDate.setHours(23, 59, 59, 999);
          if (pedidoDate > toDate) matchesFecha = false;
        }
      }

      return matchesSearch && matchesEstado && matchesTienda && matchesCliente && matchesFecha;
    }).reverse();
  }, [data.pedidos, data.clientes, searchTerm, filterEstado, filterTienda, filterCliente, filterFechaDesde, filterFechaHasta]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingPedido) {
      updatePedido(editingPedido.id, formData);
    } else {
      addPedido({
        ...formData,
        entregado: formData.estado === EstadoPedido.ENTREGADO,
      });
    }
    closeModal();
  };

  const openModal = (pedido?: Pedido) => {
    if (pedido) {
      setEditingPedido(pedido);
      setFormData({
        clienteId: pedido.clienteId,
        tiendaId: pedido.tiendaId,
        descripcion: pedido.descripcion,
        precioCompra: pedido.precioCompra,
        precioVenta: pedido.precioVenta,
        estado: pedido.estado,
        fotoBase64: pedido.fotoBase64 || '',
        observaciones: pedido.observaciones || '',
        fechaPedido: pedido.fechaPedido,
      });
    } else {
      setEditingPedido(null);
      setFormData({
        clienteId: data.clientes[0]?.id || '',
        tiendaId: data.tiendas[0]?.id || '',
        descripcion: '',
        precioCompra: 0,
        precioVenta: 0,
        estado: EstadoPedido.PENDIENTE,
        fotoBase64: '',
        observaciones: '',
        fechaPedido: new Date().toISOString().split('T')[0],
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingPedido(null);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const base64 = await fileToBase64(file);
      const compressed = await compressImage(base64);
      setFormData(prev => ({ ...prev, fotoBase64: compressed }));
    }
  };

  const sendWhatsApp = (pedido: Pedido) => {
    const cliente = data.clientes.find(c => c.id === pedido.clienteId);
    const tienda = data.tiendas.find(t => t.id === pedido.tiendaId);
    if (!cliente) return;

    let message = data.configuracion.whatsappTemplate
      .replace('{cliente}', cliente.nombre)
      .replace('{producto}', pedido.descripcion)
      .replace('{tienda}', tienda?.nombre || 'la tienda')
      .replace('{precio}', pedido.precioVenta.toString())
      .replace('{estado}', pedido.estado)
      .replace('{fecha_llegada}', pedido.fechaLlegada || 'pronto');

    const url = `https://wa.me/${cliente.telefono.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const handleBulkWhatsApp = () => {
    const selected = data.pedidos.filter(p => selectedPedidoIds.includes(p.id));
    selected.forEach((pedido, index) => {
      // Small delay to avoid popup blockers if many tabs are opened
      setTimeout(() => sendWhatsApp(pedido), index * 1000);
    });
  };

  const togglePedidoSelection = (id: string) => {
    setSelectedPedidoIds(prev => 
      prev.includes(id) ? prev.filter(pId => pId !== id) : [...prev, id]
    );
  };

  const toggleAllSelection = () => {
    if (selectedPedidoIds.length === filteredPedidos.length) {
      setSelectedPedidoIds([]);
    } else {
      setSelectedPedidoIds(filteredPedidos.map(p => p.id));
    }
  };

  const handleQuickStatusChange = (pedidoId: string, newEstado: EstadoPedido) => {
    updatePedido(pedidoId, { estado: newEstado, entregado: newEstado === EstadoPedido.ENTREGADO });
    setStatusMenuPedidoId(null);
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Pedidos</h1>
          <p className="text-slate-500">Gestiona y rastrea todos tus encargos</p>
        </div>
        <button 
          onClick={() => openModal()}
          className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg shadow-blue-100 transition-all active:scale-95"
        >
          <Plus className="w-5 h-5" />
          Nuevo Pedido
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl mb-6 w-fit">
        <button 
          onClick={() => setActiveTab('pedidos')}
          className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'pedidos' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Pedidos
        </button>
        <button 
          onClick={() => setActiveTab('whatsapp')}
          className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'whatsapp' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          WhatsApp
        </button>
      </div>

      {/* Filters (Used in both tabs but logic differs slightly for WhatsApp tab display) */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 mb-6 space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar por producto o cliente..." 
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 transition-all font-medium"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all ${showAdvancedFilters ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
          >
            <Filter className="w-4 h-4" />
            Filtros {showAdvancedFilters ? 'Ocultar' : 'Avanzados'}
          </button>
        </div>

        {showAdvancedFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 pt-4 border-t border-slate-50 animate-in slide-in-from-top-2 duration-300">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Estado</label>
              <select 
                className="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer text-sm font-bold text-slate-700"
                value={filterEstado}
                onChange={(e) => setFilterEstado(e.target.value)}
              >
                <option value="">Todos los estados</option>
                {Object.values(EstadoPedido).map(e => (
                  <option key={e} value={e}>{e}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Tienda</label>
              <select 
                className="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer text-sm font-bold text-slate-700"
                value={filterTienda}
                onChange={(e) => setFilterTienda(e.target.value)}
              >
                <option value="">Todas las tiendas</option>
                {data.tiendas.map(t => (
                  <option key={t.id} value={t.id}>{t.nombre}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Cliente</label>
              <select 
                className="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer text-sm font-bold text-slate-700"
                value={filterCliente}
                onChange={(e) => setFilterCliente(e.target.value)}
              >
                <option value="">Todos los clientes</option>
                {data.clientes.map(c => (
                  <option key={c.id} value={c.id}>{c.nombre}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Desde</label>
              <input 
                type="date"
                className="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm font-bold text-slate-700"
                value={filterFechaDesde}
                onChange={(e) => setFilterFechaDesde(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Hasta</label>
              <input 
                type="date"
                className="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm font-bold text-slate-700"
                value={filterFechaHasta}
                onChange={(e) => setFilterFechaHasta(e.target.value)}
              />
            </div>
            <div className="sm:col-span-2 lg:col-span-5 flex justify-end">
              <button 
                onClick={() => {
                  setFilterEstado('');
                  setFilterTienda('');
                  setFilterCliente('');
                  setFilterFechaDesde('');
                  setFilterFechaHasta('');
                  setSearchTerm('');
                }}
                className="text-[10px] font-black text-rose-500 uppercase tracking-widest hover:text-rose-600 transition-colors"
              >
                Limpiar Filtros
              </button>
            </div>
          </div>
        )}
      </div>

      {activeTab === 'pedidos' ? (
        /* Orders Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPedidos.map(pedido => {
            const cliente = data.clientes.find(c => c.id === pedido.clienteId);
            const tienda = data.tiendas.find(t => t.id === pedido.tiendaId);
            
            return (
              <div key={pedido.id} className={`bento-card !p-0 hover:shadow-md transition-all group relative ${statusMenuPedidoId === pedido.id ? 'z-50' : 'z-0'}`}>
                <div className="aspect-video relative overflow-hidden bg-slate-100 rounded-t-[16px]">
                  {pedido.fotoBase64 ? (
                    <img src={pedido.fotoBase64} alt={pedido.descripcion} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                      <Camera className="w-12 h-12" />
                    </div>
                  )}
                </div>
                
                <div className="p-5">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h3 className="font-bold text-slate-800 line-clamp-1">{pedido.descripcion}</h3>
                      <div className="relative mt-2">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setStatusMenuPedidoId(statusMenuPedidoId === pedido.id ? null : pedido.id);
                          }}
                          className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter shadow-sm transition-all hover:scale-105 active:scale-95 flex items-center gap-1 ${
                            pedido.estado === EstadoPedido.ENTREGADO ? 'bg-emerald-500 text-white' :
                            pedido.estado === EstadoPedido.CANCELADO ? 'bg-rose-500 text-white' :
                            'bg-blue-600 text-white'
                          }`}
                        >
                          {pedido.estado}
                          <Filter className="w-3 h-3 opacity-50" />
                        </button>

                        {statusMenuPedidoId === pedido.id && (
                          <div className="absolute left-0 top-full mt-2 w-48 bg-white rounded-xl shadow-2xl border border-slate-100 py-2 z-[60] animate-in zoom-in-95 duration-200">
                            <div className="px-4 py-1 border-b border-slate-50 mb-1">
                              <p className="text-[9px] font-black text-slate-400 uppercase">Cambiar Estado</p>
                            </div>
                            {Object.values(EstadoPedido).map((estado) => (
                              <button
                                key={estado}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleQuickStatusChange(pedido.id, estado);
                                }}
                                className={`w-full text-left px-4 py-2.5 text-xs font-bold transition-colors flex items-center justify-between ${
                                  pedido.estado === estado ? 'bg-blue-50 text-blue-600 font-black' : 'text-slate-600 hover:bg-slate-50'
                                }`}
                              >
                                {estado}
                                {pedido.estado === estado && <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => openModal(pedido)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button onClick={() => { if(confirm('¿Seguro?')) deletePedido(pedido.id) }} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <p className="text-sm text-slate-500 flex items-center gap-2">
                      <Users className="w-4 h-4" /> {cliente?.nombre || 'Cliente borrado'}
                    </p>
                    <p className="text-sm text-slate-500 flex items-center gap-2">
                      <Store className="w-4 h-4" /> {tienda?.nombre || 'Tienda borrada'}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Precio Venta</p>
                      <p className="text-lg font-bold text-slate-900">L {pedido.precioVenta.toFixed(2)}</p>
                    </div>
                    <button 
                      onClick={() => sendWhatsApp(pedido)}
                      className="flex items-center gap-2 bg-emerald-50 text-emerald-600 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                    >
                      <MessageCircle className="w-4 h-4" /> Avísar
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* WhatsApp Tab content */
        <div className="space-y-6">
          {/* Template Preview */}
          <div className="bento-card">
            <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-emerald-500" /> Plantilla Actual
            </h3>
            <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 italic text-slate-600 text-sm whitespace-pre-wrap">
              {data.configuracion.whatsappTemplate}
            </div>
            <p className="mt-4 text-[11px] text-slate-400 leading-relaxed font-medium">
              Puedes editar esta plantilla en el menú de <strong>Configuración</strong>. Usa variables como <code>{'{cliente}'}</code>, <code>{'{producto}'}</code> para personalizar el mensaje.
            </p>
          </div>

          {/* Bulk Action Bar */}
          <div className="flex items-center justify-between bg-white px-6 py-4 rounded-2xl border border-slate-100 shadow-sm sticky top-0 z-10">
            <div className="flex items-center gap-4">
              <input 
                type="checkbox" 
                className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                checked={selectedPedidoIds.length === filteredPedidos.length && filteredPedidos.length > 0}
                onChange={toggleAllSelection}
              />
              <span className="text-sm font-bold text-slate-600">
                {selectedPedidoIds.length} seleccionados
              </span>
            </div>
            <button 
              disabled={selectedPedidoIds.length === 0}
              onClick={handleBulkWhatsApp}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all shadow-md ${
                selectedPedidoIds.length > 0 
                  ? 'bg-emerald-600 text-white hover:bg-emerald-700 active:scale-95' 
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none'
              }`}
            >
              <MessageCircle className="w-4 h-4" /> Enviar WhatsApp
            </button>
          </div>

          {/* Table for Selection */}
          <div className="bento-card">
            <div className="overflow-x-visible">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[11px] uppercase font-bold text-slate-400 tracking-widest border-b border-slate-50">
                    <th className="pb-4 pt-1 w-12"></th>
                    <th className="pb-4 pt-1">Pedido</th>
                    <th className="pb-4 pt-1">Cliente</th>
                    <th className="pb-4 pt-1">Estado</th>
                    <th className="pb-4 pt-1 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredPedidos.map(pedido => {
                    const cliente = data.clientes.find(c => c.id === pedido.clienteId);
                    return (
                      <tr key={pedido.id} className="group hover:bg-slate-50/50 transition-colors">
                        <td className="py-4">
                          <input 
                            type="checkbox" 
                            className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                            checked={selectedPedidoIds.includes(pedido.id)}
                            onChange={() => togglePedidoSelection(pedido.id)}
                          />
                        </td>
                        <td className="py-4 font-bold text-sm text-slate-800">
                          {pedido.descripcion}
                        </td>
                        <td className="py-4">
                          <div className="text-sm font-bold text-slate-700">{cliente?.nombre}</div>
                          <div className="text-[11px] text-slate-400">{cliente?.telefono}</div>
                        </td>
                        <td className="py-4 relative">
                          <div className="relative">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setStatusMenuPedidoId(statusMenuPedidoId === pedido.id ? null : pedido.id);
                              }}
                              className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter shadow-sm transition-all hover:scale-105 active:scale-95 flex items-center gap-1 ${
                                pedido.estado === EstadoPedido.ENTREGADO ? 'bg-emerald-500 text-white' :
                                pedido.estado === EstadoPedido.CANCELADO ? 'bg-rose-500 text-white' :
                                'bg-blue-600 text-white'
                              }`}
                            >
                              {pedido.estado}
                              <Filter className="w-3 h-3 opacity-50" />
                            </button>

                            {statusMenuPedidoId === pedido.id && (
                              <div className="absolute left-0 mt-2 w-48 bg-white rounded-xl shadow-2xl border border-slate-100 py-2 z-[70] animate-in zoom-in-95 duration-200">
                                {Object.values(EstadoPedido).map((estado) => (
                                  <button
                                    key={estado}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleQuickStatusChange(pedido.id, estado);
                                    }}
                                    className={`w-full text-left px-4 py-2 text-xs font-bold transition-colors ${
                                      pedido.estado === estado ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50'
                                    }`}
                                  >
                                    {estado}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-4 text-right">
                          <button 
                            onClick={() => sendWhatsApp(pedido)}
                            className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {filteredPedidos.length === 0 && (
        <div className="bg-white rounded-2xl p-12 text-center border border-dashed border-slate-200">
          <ShoppingCart className="w-16 h-16 text-slate-200 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-600">No se encontraron pedidos</h3>
          <p className="text-slate-400">Intenta con otros filtros o crea uno nuevo</p>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-xl font-bold text-slate-800">{editingPedido ? 'Editar Pedido' : 'Nuevo Pedido'}</h2>
              <button onClick={closeModal} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                <X className="w-6 h-6 text-slate-500" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="col-span-full">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Descripción del Producto</label>
                  <input 
                    required 
                    type="text" 
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 border-none"
                    value={formData.descripcion}
                    onChange={e => setFormData(p => ({ ...p, descripcion: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Cliente</label>
                  <select 
                    required
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 border-none"
                    value={formData.clienteId}
                    onChange={e => setFormData(p => ({ ...p, clienteId: e.target.value }))}
                  >
                    <option value="">Selecciona un cliente</option>
                    {data.clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Tienda</label>
                  <select 
                    required
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 border-none"
                    value={formData.tiendaId}
                    onChange={e => setFormData(p => ({ ...p, tiendaId: e.target.value }))}
                  >
                    <option value="">Selecciona una tienda</option>
                    {data.tiendas.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Precio Compra (L)</label>
                  <input 
                    required 
                    type="number" step="0.01"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 border-none"
                    value={formData.precioCompra}
                    onChange={e => setFormData(p => ({ ...p, precioCompra: parseFloat(e.target.value) }))}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Precio Venta (L)</label>
                  <input 
                    required 
                    type="number" step="0.01"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 border-none"
                    value={formData.precioVenta}
                    onChange={e => setFormData(p => ({ ...p, precioVenta: parseFloat(e.target.value) }))}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Estado</label>
                  <select 
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 border-none font-bold"
                    value={formData.estado}
                    onChange={e => setFormData(p => ({ ...p, estado: e.target.value as EstadoPedido }))}
                  >
                    {Object.values(EstadoPedido).map(e => <option key={e} value={e}>{e}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Foto del Producto</label>
                  <div className="flex gap-4 items-center">
                    {formData.fotoBase64 && (
                      <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-slate-200">
                        <img src={formData.fotoBase64} className="w-full h-full object-cover" />
                        <button 
                          type="button" 
                          onClick={() => setFormData(p => ({ ...p, fotoBase64: '' }))}
                          className="absolute top-0 right-0 bg-rose-500 text-white p-0.5 rounded-bl-lg"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                    <label className="flex-1 cursor-pointer bg-slate-50 border border-dashed border-slate-300 rounded-xl py-3 flex flex-col items-center justify-center hover:bg-slate-100 transition-colors">
                      <Camera className="w-5 h-5 text-slate-400 mb-1" />
                      <span className="text-xs text-slate-500">Subir imagen</span>
                      <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                    </label>
                  </div>
                </div>

                <div className="col-span-full">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Observaciones</label>
                  <textarea 
                    rows={2}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 border-none resize-none"
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
                  {editingPedido ? 'Actualizar Cambios' : 'Registrar Pedido'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
