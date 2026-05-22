import React, { useState, useMemo } from 'react';
import { useStore } from '../hooks/useStore';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Search, Filter, MessageCircle, Trash2, Edit3, Camera, X, Users, Store, ShoppingCart, Calendar, DollarSign, TrendingUp, ArrowRight, ExternalLink, ChevronDown } from 'lucide-react';
import { EstadoPedido, Pedido } from '../types';
import { fileToBase64, compressImage } from '../lib/imageUtils';
import { format } from 'date-fns';
import { auth } from '../lib/firebase';

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
    if (!cliente) return;

    const tiendaUser = auth.currentUser?.email 
      ? auth.currentUser.email.split('@')[0].toUpperCase()
      : 'la tienda';

    let message = data.configuracion.whatsappTemplate
      .replace('{cliente}', cliente.nombre)
      .replace('{producto}', pedido.descripcion)
      .replace('{tienda}', tiendaUser)
      .replace('{precio}', pedido.precioVenta.toString())
      .replace('{estado}', pedido.estado)
      .replace('{fecha_llegada}', pedido.fechaLlegada || 'pronto');

    // Limpiar número: solo dígitos
    let cleanedPhone = cliente.telefono.replace(/\D/g, '');
    
    // Si tiene 8 dígitos (formato HN), añadir 504 por defecto
    if (cleanedPhone.length === 8) {
      cleanedPhone = `504${cleanedPhone}`;
    }

    const url = `https://wa.me/${cleanedPhone}?text=${encodeURIComponent(message)}`;
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
            <div className="relative">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Estado</label>
              <div className="relative">
                <select 
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer text-sm font-bold text-slate-700 pr-10"
                  value={filterEstado}
                  onChange={(e) => setFilterEstado(e.target.value)}
                >
                  <option value="">Todos los estados</option>
                  {Object.values(EstadoPedido).map(e => (
                    <option key={e} value={e}>{e}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>
            <div className="relative">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Tienda</label>
              <div className="relative">
                <select 
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer text-sm font-bold text-slate-700 pr-10"
                  value={filterTienda}
                  onChange={(e) => setFilterTienda(e.target.value)}
                >
                  <option value="">Todas las tiendas</option>
                  {data.tiendas.map(t => (
                    <option key={t.id} value={t.id}>{t.nombre}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>
            <div className="relative">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Cliente</label>
              <div className="relative">
                <select 
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer text-sm font-bold text-slate-700 pr-10"
                  value={filterCliente}
                  onChange={(e) => setFilterCliente(e.target.value)}
                >
                  <option value="">Todos los clientes</option>
                  {data.clientes.map(c => (
                    <option key={c.id} value={c.id}>{c.nombre}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
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
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredPedidos.map((pedido, idx) => {
            const cliente = data.clientes.find(c => c.id === pedido.clienteId);
            const tienda = data.tiendas.find(t => t.id === pedido.tiendaId);
            
            return (
              <motion.div 
                key={pedido.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className={`group relative bg-white rounded-[32px] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-500 ${statusMenuPedidoId === pedido.id ? 'z-50' : 'z-0 overflow-hidden'}`}
              >
                <div className="p-2 h-full flex flex-col">
                  {/* Bento Header: Image & Main Info */}
                  <div className="grid grid-cols-12 gap-2 mb-2">
                    <div className="col-span-12 sm:col-span-5 h-48 sm:h-full min-h-[160px] relative overflow-hidden rounded-[24px] bg-slate-50">
                      {pedido.fotoBase64 ? (
                        <img 
                          src={pedido.fotoBase64} 
                          alt={pedido.descripcion} 
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-200">
                          <ShoppingCart className="w-12 h-12" />
                        </div>
                      )}
                      <div className="absolute top-3 left-3 flex flex-col gap-2">
                         <div className="px-3 py-1.5 bg-white/90 backdrop-blur shadow-sm rounded-full text-[10px] font-black text-slate-900 border border-white/20 flex items-center gap-1.5 uppercase tracking-tighter">
                            <Store className="w-3 h-3" /> {tienda?.nombre || 'General'}
                         </div>
                      </div>
                    </div>

                    <div className="col-span-12 sm:col-span-7 p-4 flex flex-col justify-between bg-slate-50/50 rounded-[24px]">
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-black text-slate-900 leading-tight line-clamp-2 text-lg">
                            {pedido.descripcion}
                          </h3>
                        </div>
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-[10px] font-black text-blue-600">
                            {cliente?.nombre.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-sm font-bold text-slate-600 truncate">{cliente?.nombre}</span>
                        </div>
                      </div>

                      <div className="relative">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setStatusMenuPedidoId(statusMenuPedidoId === pedido.id ? null : pedido.id);
                          }}
                          className={`w-full flex items-center justify-between px-4 py-2.5 rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-sm transition-all hover:brightness-110 active:scale-[0.98] ${
                            pedido.estado === EstadoPedido.ENTREGADO ? 'bg-emerald-500 text-white' :
                            pedido.estado === EstadoPedido.LISTO_PARA_ENTREGA ? 'bg-indigo-500 text-white' :
                            pedido.estado === EstadoPedido.CANCELADO ? 'bg-rose-500 text-white' :
                            pedido.estado === EstadoPedido.EN_TRANSITO ? 'bg-amber-500 text-white' :
                            pedido.estado === EstadoPedido.VENCIDO ? 'bg-slate-400 text-white' :
                            'bg-blue-600 text-white'
                          }`}
                        >
                          {pedido.estado}
                          <Filter className="w-3.5 h-3.5 opacity-60" />
                        </button>

                        <AnimatePresence>
                          {statusMenuPedidoId === pedido.id && (
                            <motion.div 
                              initial={{ opacity: 0, scale: 0.95, y: -10 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.95, y: -10 }}
                              className="absolute left-0 top-full mt-2 w-full bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 z-[70]"
                            >
                              <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 mb-1">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Cambiar Estatus</p>
                              </div>
                              {Object.values(EstadoPedido).map((estado) => (
                                <button
                                  key={estado}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleQuickStatusChange(pedido.id, estado);
                                  }}
                                  className={`w-full text-left px-4 py-2.5 text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-between border-l-4 ${
                                    pedido.estado === estado 
                                      ? 'bg-blue-50 text-blue-600 border-blue-600' 
                                      : 'text-slate-500 hover:bg-slate-50 border-transparent hover:border-slate-200'
                                  }`}
                                >
                                  {estado}
                                  {pedido.estado === estado && <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />}
                                </button>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </div>

                  {/* Bento Footer: Stats & Actions */}
                  <div className="grid grid-cols-2 gap-2 mt-auto">
                    <div className="p-4 bg-slate-900 rounded-[24px] flex flex-col justify-center">
                      <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1 flex items-center gap-1.5">
                        <TrendingUp className="w-3 h-3 text-emerald-400" /> Ganancia
                      </p>
                      <p className="text-xl font-black text-emerald-400 leading-none">L {pedido.ganancia.toLocaleString()}</p>
                    </div>

                    <div className="p-4 bg-white border border-slate-100 rounded-[24px] flex flex-col justify-center">
                      <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1 flex items-center gap-1.5">
                         <DollarSign className="w-3 h-3 text-blue-600" /> Precio Venta
                      </p>
                      <p className="text-xl font-black text-slate-900 leading-none">L {pedido.precioVenta.toLocaleString()}</p>
                    </div>

                    <div className="col-span-2 flex items-center gap-2 p-1 bg-slate-50 rounded-[24px]">
                      <button 
                        onClick={() => sendWhatsApp(pedido)}
                        className="flex-1 flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white p-3 rounded-[20px] text-xs font-black transition-all active:scale-[0.98] shadow-lg shadow-emerald-200/50"
                      >
                        <MessageCircle className="w-4 h-4" /> 
                        Notificar
                      </button>
                      <div className="flex gap-1 pr-2">
                        <button 
                          onClick={() => openModal(pedido)} 
                          className="p-3 text-slate-400 hover:text-blue-600 hover:bg-white rounded-[20px] transition-all"
                        >
                          <Edit3 className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={() => { if(confirm('¿Seguro que deseas eliminar este pedido?')) deletePedido(pedido.id) }} 
                          className="p-3 text-slate-400 hover:text-rose-600 hover:bg-white rounded-[20px] transition-all"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
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
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-2xl max-h-[92vh] rounded-[24px] sm:rounded-[32px] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
            <div className="px-5 py-3 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0">
              <h2 className="text-base font-black text-slate-800 tracking-tight">{editingPedido ? 'Editar' : 'Nuevo Pedido'}</h2>
              <button onClick={closeModal} className="p-1 hover:bg-slate-200 rounded-full transition-colors">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 pb-2 custom-scrollbar">
                <div className="grid grid-cols-2 gap-2 sm:gap-4">
                  <div className="col-span-full">
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Descripción</label>
                    <input 
                      required 
                      type="text" 
                      placeholder="¿Qué producto es?..."
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm font-medium"
                      value={formData.descripcion}
                      onChange={e => setFormData(p => ({ ...p, descripcion: e.target.value }))}
                    />
                  </div>

                  <div className="col-span-1">
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Cliente</label>
                    <select 
                      required
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm font-medium"
                      value={formData.clienteId}
                      onChange={e => setFormData(p => ({ ...p, clienteId: e.target.value }))}
                    >
                      <option value="">Cliente...</option>
                      {data.clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                    </select>
                  </div>

                  <div className="col-span-1">
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Tienda</label>
                    <select 
                      required
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm font-medium"
                      value={formData.tiendaId}
                      onChange={e => setFormData(p => ({ ...p, tiendaId: e.target.value }))}
                    >
                      <option value="">Tienda...</option>
                      {data.tiendas.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
                    </select>
                  </div>

                  <div className="col-span-1">
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Costo (L)</label>
                    <input 
                      required 
                      type="number" step="0.01"
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm font-medium"
                      value={formData.precioCompra}
                      onChange={e => setFormData(p => ({ ...p, precioCompra: parseFloat(e.target.value) }))}
                    />
                  </div>

                  <div className="col-span-1">
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Venta (L)</label>
                    <input 
                      required 
                      type="number" step="0.01"
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm font-medium"
                      value={formData.precioVenta}
                      onChange={e => setFormData(p => ({ ...p, precioVenta: parseFloat(e.target.value) }))}
                    />
                  </div>

                  <div className="col-span-1">
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Estado</label>
                    <select 
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm font-black text-blue-600"
                      value={formData.estado}
                      onChange={e => setFormData(p => ({ ...p, estado: e.target.value as EstadoPedido }))}
                    >
                      {Object.values(EstadoPedido).map(e => <option key={e} value={e}>{e}</option>)}
                    </select>
                  </div>

                  <div className="col-span-1">
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Foto</label>
                    <div className="flex gap-2 items-center h-[34px]">
                      {formData.fotoBase64 && (
                        <div className="relative w-7 h-7 rounded-lg overflow-hidden border border-slate-200 shrink-0">
                          <img src={formData.fotoBase64} className="w-full h-full object-cover" />
                          <button 
                            type="button" 
                            onClick={() => setFormData(p => ({ ...p, fotoBase64: '' }))}
                            className="absolute top-0 right-0 bg-rose-500 text-white p-0.5 rounded-bl-lg"
                          >
                            <X className="w-2 h-2" />
                          </button>
                        </div>
                      )}
                      <label className="flex-1 h-full cursor-pointer bg-slate-50 border border-dashed border-slate-300 rounded-xl flex items-center justify-center hover:bg-slate-100 transition-colors">
                        <Camera className="w-3.5 h-3.5 text-slate-400 mr-2" />
                        <span className="text-[9px] text-slate-500 font-black uppercase">Subir</span>
                        <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-5 py-2.5 bg-slate-50 border-t border-slate-200 flex gap-2 shrink-0">
                <button 
                  type="button"
                  onClick={closeModal}
                  className="flex-1 py-2 px-3 bg-white border border-slate-200 text-slate-600 font-bold text-[11px] rounded-xl hover:bg-slate-100 active:scale-95 transition-all"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="flex-[1.5] py-2 px-3 bg-blue-600 text-white font-black text-[11px] rounded-xl shadow-lg shadow-blue-100 uppercase tracking-widest active:scale-95 transition-all"
                >
                  {editingPedido ? 'Guardar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
