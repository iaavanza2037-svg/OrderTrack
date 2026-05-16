import React, { useState } from 'react';
import { useStore } from '../hooks/useStore';
import { LayoutDashboard, ShoppingCart, Users, Store, Settings, TrendingUp, Package, CheckCircle2, Clock, AlertTriangle, XCircle, List } from 'lucide-react';
import { format } from 'date-fns';
import { EstadoPedido } from '../types';

export const Dashboard: React.FC = () => {
  const { data } = useStore();
  const { pedidos, clientes, tiendas } = data;
  const [recentCount, setRecentCount] = useState(5);

  const stats = {
    total: pedidos.length,
    pendientes: pedidos.filter(p => p.estado === EstadoPedido.PENDIENTE).length,
    llegaron: pedidos.filter(p => p.estado === EstadoPedido.PRODUCTO_LLEGO).length,
    entregados: pedidos.filter(p => p.estado === EstadoPedido.ENTREGADO).length,
    vencidos: pedidos.filter(p => p.estado === EstadoPedido.VENCIDO).length,
    cancelados: pedidos.filter(p => p.estado === EstadoPedido.CANCELADO).length,
    gananciaEsperada: pedidos.reduce((acc, p) => acc + p.ganancia, 0),
    gananciaRealizada: pedidos.filter(p => p.estado === EstadoPedido.ENTREGADO).reduce((acc, p) => acc + p.ganancia, 0),
    clientesCount: clientes.length,
    tiendasCount: tiendas.length,
  };

  const metaGoal = 10000; // Meta de ganancia mensual (podría ser configurable)
  const metaProgress = Math.min(Math.round((stats.gananciaRealizada / metaGoal) * 100), 100);

  const StatCard = ({ title, value, icon: Icon, color, trend }: any) => (
    <div className="bento-card">
      <div className="flex justify-between items-start mb-3">
        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{title}</span>
        <div className={`p-1.5 rounded-lg ${color} bg-opacity-10`}>
          <Icon className={`w-4 h-4 ${color.replace('bg-', 'text-')}`} />
        </div>
      </div>
      <div className="flex items-end gap-2">
        <span className="text-3xl font-extrabold text-slate-900 leading-none">
          {typeof value === 'number' && title.includes('Ganancia') ? `L ${value.toLocaleString()}` : value}
        </span>
        {trend && <span className="text-[11px] font-bold text-slate-400 mb-1">{trend}</span>}
      </div>
    </div>
  );

  return (
    <div className="animate-in fade-in duration-500 max-w-7xl mx-auto py-2">
      <header className="mb-8 px-1">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Dashboard</h1>
        <p className="text-sm font-medium text-slate-500">Resumen integral de tu negocio</p>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        <StatCard title="Total Pedidos" value={stats.total} icon={ShoppingCart} color="bg-blue-600" />
        <StatCard title="Pendientes" value={stats.pendientes} icon={Clock} color="bg-amber-500" />
        <StatCard title="Llegaron" value={stats.llegaron} icon={Package} color="bg-indigo-500" />
        <StatCard title="Entregados" value={stats.entregados} icon={CheckCircle2} color="bg-emerald-500" />
        <StatCard title="Vencidos" value={stats.vencidos} icon={AlertTriangle} color="bg-rose-500" />
        <StatCard title="Cancelados" value={stats.cancelados} icon={XCircle} color="bg-slate-500" />
        <StatCard title="Ganancia Esp." value={stats.gananciaEsperada} icon={TrendingUp} color="bg-purple-600" />
        <StatCard title="Ganancia Real" value={stats.gananciaRealizada} icon={TrendingUp} color="bg-emerald-600" />
        <StatCard title="Clientes" value={stats.clientesCount} icon={Users} color="bg-sky-500" />
        <StatCard title="Tiendas" value={stats.tiendasCount} icon={Store} color="bg-orange-500" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        <div className="md:col-span-12 text-left">
           <div className="bento-card">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2">
                <List className="w-5 h-5 text-blue-600" /> Pedidos Recientes
              </h3>
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-slate-400 uppercase">Mostrar:</span>
                <select 
                  className="text-xs font-bold bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  value={recentCount}
                  onChange={(e) => setRecentCount(Number(e.target.value))}
                >
                  <option value={5}>Últimos 5</option>
                  <option value={10}>Últimos 10</option>
                  <option value={20}>Últimos 20</option>
                  <option value={50}>Ver más</option>
                </select>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[11px] uppercase font-bold text-slate-400 tracking-widest border-b border-slate-50">
                    <th className="pb-4 pt-1">Producto</th>
                    <th className="pb-4 pt-1">Cliente</th>
                    <th className="pb-4 pt-1">Estado</th>
                    <th className="pb-4 pt-1 text-right">Monto</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {pedidos.slice(-recentCount).reverse().map((pedido) => {
                    const cliente = data.clientes.find(c => c.id === pedido.clienteId);
                    return (
                      <tr key={pedido.id} className="group hover:bg-slate-50/50 transition-colors">
                        <td className="py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center overflow-hidden border border-slate-200 shrink-0">
                              {pedido.fotoBase64 ? <img src={pedido.fotoBase64} className="w-full h-full object-cover" /> : <Package className="w-5 h-5 text-slate-300" />}
                            </div>
                            <div>
                              <div className="font-bold text-sm text-slate-800 line-clamp-1">{pedido.descripcion}</div>
                              <div className="text-[10px] text-slate-400 font-bold uppercase">{format(new Date(pedido.fechaCreacion), 'MMM dd')}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4">
                          <div className="text-sm font-semibold text-slate-700">{cliente?.nombre || 'N/A'}</div>
                          <div className="text-[11px] text-slate-400">{cliente?.telefono}</div>
                        </td>
                        <td className="py-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-tight ${
                            pedido.estado === EstadoPedido.ENTREGADO ? 'bg-emerald-100 text-emerald-700' :
                            pedido.estado === EstadoPedido.CANCELADO ? 'bg-rose-100 text-rose-700' :
                            'bg-blue-100 text-blue-700'
                          }`}>
                            {pedido.estado}
                          </span>
                        </td>
                        <td className="py-4 text-right">
                          <div className="font-black text-slate-900 text-sm">L {pedido.precioVenta.toLocaleString()}</div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
