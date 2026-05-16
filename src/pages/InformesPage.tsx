import React, { useState } from 'react';
import { useStore } from '../hooks/useStore';
import { PieChart, TrendingUp, DollarSign, ShoppingBag, Wallet, Store, ArrowUpRight, Download, Calendar } from 'lucide-react';
import { EstadoPedido } from '../types';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export const InformesPage: React.FC = () => {
  const { data } = useStore();
  const { pedidos, tiendas, clientes } = data;

  const [dateDesde, setDateDesde] = useState('');
  const [dateHasta, setDateHasta] = useState('');
  const [filterType, setFilterType] = useState<'creacion' | 'entrega'>('creacion');

  // Filtrado de pedidos
  const filteredPedidos = pedidos.filter(p => {
    const fecha = filterType === 'creacion' ? new Date(p.fechaCreacion) : (p.fechaLlegada ? new Date(p.fechaLlegada) : null);
    if (!fecha && filterType === 'entrega') return false;
    
    if (dateDesde) {
      const d = new Date(dateDesde);
      if (fecha! < d) return false;
    }
    if (dateHasta) {
      const h = new Date(dateHasta);
      h.setHours(23, 59, 59, 999);
      if (fecha! > h) return false;
    }
    return true;
  });

  // Calculos Generales (sobre filtrados)
  const totalVentas = filteredPedidos.reduce((acc, p) => acc + p.precioVenta, 0);
  const totalCostos = filteredPedidos.reduce((acc, p) => acc + p.precioCompra, 0);
  const totalGananciaProyectada = filteredPedidos.reduce((acc, p) => acc + p.ganancia, 0);
  const gananciaReal = filteredPedidos.filter(p => p.estado === EstadoPedido.ENTREGADO).reduce((acc, p) => acc + p.ganancia, 0);
  const margenPromedio = totalVentas > 0 ? (totalGananciaProyectada / totalVentas) * 100 : 0;

  // Estadísticas por Tienda
  const statsPorTienda = tiendas.map(tienda => {
    const pedidosTienda = filteredPedidos.filter(p => p.tiendaId === tienda.id);
    const ventas = pedidosTienda.reduce((acc, p) => acc + p.precioVenta, 0);
    const costos = pedidosTienda.reduce((acc, p) => acc + p.precioCompra, 0);
    const ganancia = pedidosTienda.reduce((acc, p) => acc + p.ganancia, 0);
    
    return {
      id: tienda.id,
      nombre: tienda.nombre,
      pedidos: pedidosTienda,
      cantidad: pedidosTienda.length,
      ventas,
      costos,
      ganancia,
      margen: ventas > 0 ? (ganancia / ventas) * 100 : 0
    };
  }).filter(s => s.cantidad > 0).sort((a, b) => b.ventas - a.ventas);

  const porEstado = Object.values(EstadoPedido).map(estado => ({
    nombre: estado,
    cantidad: filteredPedidos.filter(p => p.estado === estado).length
  }));

  const handleExportPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;

    // Header
    doc.setFontSize(22);
    doc.setTextColor(15, 23, 42); // slate-900
    doc.text('INFORME COMERCIAL', pageWidth / 2, 20, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139); // slate-500
    const periodText = (dateDesde || dateHasta) 
      ? `Período: ${dateDesde || 'Inicio'} al ${dateHasta || 'Actual'}`
      : 'Período: Histórico General';
    doc.text(periodText, pageWidth / 2, 28, { align: 'center' });
    doc.text(`Generado el: ${new Date().toLocaleDateString()} a las ${new Date().toLocaleTimeString()}`, pageWidth / 2, 34, { align: 'center' });

    // Summary Boxes (Horizontal Line)
    doc.setDrawColor(241, 245, 249); // slate-100
    doc.line(15, 45, pageWidth - 15, 45);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('RESUMEN FINANCIERO', 15, 55);

    const summaryData = [
      ['Ventas Totales', `L ${totalVentas.toLocaleString()}`],
      ['Costos de Inversión', `L ${totalCostos.toLocaleString()}`],
      ['Ganancia Proyectada', `L ${totalGananciaProyectada.toLocaleString()}`],
      ['Ganancia Real (Caja)', `L ${gananciaReal.toLocaleString()}`],
      ['Margen Operativo', `${Math.round(margenPromedio)}%`]
    ];

    autoTable(doc, {
      startY: 60,
      head: [['Concepto', 'Valor']],
      body: summaryData,
      theme: 'striped',
      headStyles: { fillColor: [37, 99, 235], fontSize: 9 }, // blue-600
      styles: { fontSize: 8 },
      margin: { left: 15, right: 15 }
    });

    // Detail Table
    doc.setFontSize(9);
    doc.text('DETALLE DE OPERACIONES POR TIENDA', 15, (doc as any).lastAutoTable.finalY + 15);

    const tableData: any[] = [];
    statsPorTienda.forEach(tienda => {
      tienda.pedidos.forEach(p => {
        const cliente = clientes.find(c => c.id === p.clienteId)?.nombre || 'Particular';
        tableData.push([
          tienda.nombre,
          p.descripcion,
          cliente,
          p.estado,
          `L ${p.precioCompra.toLocaleString()}`,
          `L ${p.precioVenta.toLocaleString()}`,
          `L ${p.ganancia.toLocaleString()}`,
          new Date(p.fechaCreacion).toLocaleDateString()
        ]);
      });
    });

    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 20,
      head: [['Tienda', 'Producto', 'Cliente', 'Estado', 'P. Compra', 'P. Venta', 'Ganancia', 'Fecha']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [15, 23, 42], fontSize: 8 }, // slate-900
      styles: { fontSize: 7 },
      columnStyles: {
        0: { fontStyle: 'bold' },
        4: { halign: 'right' },
        5: { halign: 'right' },
        6: { halign: 'right', fontStyle: 'bold' }
      },
      margin: { left: 15, right: 15 }
    });

    doc.save(`informe_ventas_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <div className="animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Informes</h1>
          <p className="text-slate-500 font-medium">Análisis detallado de rentabilidad y operaciones</p>
        </div>
        
        <div className="flex flex-wrap items-end gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Filtrar por</label>
            <select 
              className="px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-700 focus:ring-2 focus:ring-blue-500"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
            >
              <option value="creacion">Fecha Creación</option>
              <option value="entrega">Fecha Entrega</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Desde</label>
            <input 
              type="date"
              className="px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-700 focus:ring-2 focus:ring-blue-500"
              value={dateDesde}
              onChange={(e) => setDateDesde(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Hasta</label>
            <input 
              type="date"
              className="px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-700 focus:ring-2 focus:ring-blue-500"
              value={dateHasta}
              onChange={(e) => setDateHasta(e.target.value)}
            />
          </div>
          <button 
            onClick={handleExportPDF}
            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold text-xs hover:bg-blue-700 transition-all active:scale-95 shadow-md shadow-blue-100"
          >
            <Download className="w-4 h-4" /> Exportar PDF
          </button>
        </div>
      </div>

      {/* Main KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bento-card">
          <div className="flex items-center gap-3 mb-4">
             <div className="p-2 bg-blue-50 rounded-lg"><DollarSign className="w-5 h-5 text-blue-600" /></div>
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ventas</span>
          </div>
          <div className="text-2xl font-black text-slate-900 leading-none">L {totalVentas.toLocaleString()}</div>
          <p className="mt-2 text-[10px] text-slate-400 font-bold uppercase tracking-tight">{filteredPedidos.length} pedidos totales</p>
        </div>

        <div className="bento-card">
          <div className="flex items-center gap-3 mb-4">
             <div className="p-2 bg-rose-50 rounded-lg"><Wallet className="w-5 h-5 text-rose-600" /></div>
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Costos</span>
          </div>
          <div className="text-2xl font-black text-slate-900 leading-none">L {totalCostos.toLocaleString()}</div>
          <p className="mt-2 text-[10px] text-slate-400 font-bold uppercase tracking-tight">Inversión en mercancía</p>
        </div>

        <div className="bento-card">
          <div className="flex items-center gap-3 mb-4">
             <div className="p-2 bg-indigo-50 rounded-lg"><TrendingUp className="w-5 h-5 text-indigo-600" /></div>
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ganancia Est.</span>
          </div>
          <div className="text-2xl font-black text-slate-900 leading-none">L {totalGananciaProyectada.toLocaleString()}</div>
          <div className="mt-4 flex items-center gap-1 text-[10px] font-bold text-blue-600 bg-blue-50 w-fit px-2 py-0.5 rounded-full">
            Margen: {Math.round(margenPromedio)}%
          </div>
        </div>

        <div className="bento-card border-emerald-100 bg-emerald-50/50">
          <div className="flex items-center gap-3 mb-4">
             <div className="p-2 bg-emerald-100 rounded-lg"><ShoppingBag className="w-5 h-5 text-emerald-700" /></div>
             <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Ganancia Real</span>
          </div>
          <div className="text-2xl font-black text-emerald-900 leading-none">L {gananciaReal.toLocaleString()}</div>
          <p className="mt-2 text-[10px] text-emerald-600 font-bold uppercase tracking-tight">Solo pedidos entregados</p>
        </div>
      </div>

      <div className="space-y-8">
        {/* Detailed Table Grouped by Store */}
        <div className="bento-card">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <Store className="w-5 h-5 text-blue-600" /> Detalle de Ventas por Tienda
            </h3>
            <div className="flex gap-4">
              <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase">
                <div className="w-2 h-2 rounded-full bg-emerald-500" /> Entregado
              </div>
              <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase">
                <div className="w-2 h-2 rounded-full bg-blue-500" /> En Proceso
              </div>
            </div>
          </div>

          <div className="space-y-12">
            {statsPorTienda.map((tiendaStat) => (
              <div key={tiendaStat.id} className="animate-in slide-in-from-bottom-2 duration-500">
                <div className="flex justify-between items-end mb-4 pb-2 border-b-2 border-slate-100">
                  <div>
                    <h4 className="text-lg font-black text-slate-800">{tiendaStat.nombre}</h4>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{tiendaStat.cantidad} productos vendidos</p>
                  </div>
                  <div className="flex gap-6 text-right">
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase leading-none mb-1">Ventas</p>
                      <p className="text-sm font-black text-slate-900">L {tiendaStat.ventas.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-rose-400 uppercase leading-none mb-1">Ganancia</p>
                      <p className="text-sm font-black text-emerald-600">L {tiendaStat.ganancia.toLocaleString()}</p>
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
                        <th className="pb-3 px-2">Producto</th>
                        <th className="pb-3 px-2">Cliente</th>
                        <th className="pb-3 px-2">P. Compra</th>
                        <th className="pb-3 px-2">P. Venta</th>
                        <th className="pb-3 px-2">Ganancia</th>
                        <th className="pb-3 px-2 text-right">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {tiendaStat.pedidos.map(p => {
                        const cliente = clientes.find(c => c.id === p.clienteId);
                        return (
                          <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                            <td className="py-3 px-2 text-sm font-bold text-slate-700">{p.descripcion}</td>
                            <td className="py-3 px-2 text-xs font-medium text-slate-500">{cliente?.nombre || 'N/A'}</td>
                            <td className="py-3 px-2 text-xs font-bold text-slate-400">L {p.precioCompra.toLocaleString()}</td>
                            <td className="py-3 px-2 text-xs font-black text-slate-800">L {p.precioVenta.toLocaleString()}</td>
                            <td className="py-3 px-2 text-xs font-black text-emerald-600">L {p.ganancia.toLocaleString()}</td>
                            <td className="py-3 px-2 text-right">
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter ${
                                p.estado === EstadoPedido.ENTREGADO ? 'bg-emerald-100 text-emerald-700' : 
                                p.estado === EstadoPedido.CANCELADO ? 'bg-rose-100 text-rose-700' :
                                'bg-blue-100 text-blue-700'
                              }`}>
                                {p.estado}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}

            {statsPorTienda.length === 0 && (
              <div className="py-20 text-center bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                <Calendar className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                <p className="text-slate-400 font-bold">No hay pedidos en el rango de fechas seleccionado</p>
              </div>
            )}
          </div>
        </div>

        {/* Global Distribution */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bento-card">
            <h3 className="font-bold text-slate-900 mb-6 flex items-center gap-2">
              <PieChart className="w-5 h-5 text-blue-600" /> Distribución por Estado
            </h3>
            <div className="space-y-6">
              {porEstado.map(e => {
                const percentage = filteredPedidos.length > 0 ? (e.cantidad / filteredPedidos.length) * 100 : 0;
                return (
                  <div key={e.nombre}>
                    <div className="flex justify-between text-xs font-bold text-slate-600 mb-1.5">
                      <span>{e.nombre}</span>
                      <span className="text-slate-400 font-medium">{e.cantidad} unid. ({Math.round(percentage)}%)</span>
                    </div>
                    <div className="w-full h-2 bg-slate-50 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-1000 ${
                          e.nombre === EstadoPedido.ENTREGADO ? 'bg-emerald-500' :
                          e.nombre === EstadoPedido.CANCELADO ? 'bg-rose-500' :
                          'bg-blue-500'
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          <div className="bento-card bg-slate-900 text-white border-none overflow-hidden relative">
            <div className="relative z-10">
              <h3 className="text-xl font-black mb-2">Resumen Operativo</h3>
              <p className="text-slate-400 text-xs mb-8">Métricas clave del periodo seleccionado</p>
              
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Eficiencia de Entrega</span>
                  <span className="text-xl font-black text-emerald-400">
                    {Math.round((filteredPedidos.filter(p => p.estado === EstadoPedido.ENTREGADO).length / (filteredPedidos.length || 1)) * 100)}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Promedio de Venta</span>
                  <span className="text-xl font-black text-white">L {Math.round(totalVentas / (filteredPedidos.length || 1)).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Margen Operativo</span>
                  <span className="text-xl font-black text-blue-400">{Math.round(margenPromedio)}%</span>
                </div>
              </div>
            </div>
            <div className="absolute -bottom-8 -right-8 opacity-10">
              <TrendingUp className="w-48 h-48" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


