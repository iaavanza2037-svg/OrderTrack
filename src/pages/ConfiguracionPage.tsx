import React, { useState } from 'react';
import { useStore } from '../hooks/useStore';
import { Trash2, MessageSquare, Info, Sliders, Smartphone } from 'lucide-react';

export const ConfiguracionPage: React.FC = () => {
  const { data, updateConfig } = useStore();
  const [template, setTemplate] = useState(data.configuracion.whatsappTemplate);

  const handleSaveConfig = () => {
    updateConfig({ whatsappTemplate: template });
    alert('Configuración guardada correctamente');
  };

  const clearAll = () => {
    const firstConfirm = confirm('¡ADVERTENCIA! Se borrarán todos tus datos de forma permanente. ¿Estás seguro?');
    if (firstConfirm) {
      const secondConfirm = confirm('ESTA ACCIÓN ES IRREVERSIBLE. ¿Realmente deseas eliminar toda tu información ahora mismo?');
      if (secondConfirm) {
        localStorage.clear();
        window.location.reload();
      }
    }
  };

  return (
    <div className="animate-in fade-in duration-500">
      <div className="mb-8 px-1">
        <h1 className="text-3xl font-bold text-slate-900">Configuración</h1>
        <p className="text-slate-500">Personaliza el funcionamiento de tu sistema</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* WhatsApp Config */}
        <div className="bento-card">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-emerald-50 rounded-lg">
              <MessageSquare className="w-5 h-5 text-emerald-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-800">Mensajería WhatsApp</h2>
          </div>
          
          <p className="text-sm text-slate-500 mb-6">
            Edita el mensaje predeterminado que se enviará a tus clientes. Puedes usar variables dinámicas:
          </p>
          
          <div className="flex flex-wrap gap-2 mb-6">
            {['{cliente}', '{producto}', '{tienda}', '{precio}', '{estado}', '{fecha_llegada}'].map(tag => (
              <code key={tag} className="bg-slate-50 border border-slate-200 px-2 py-1 rounded text-[10px] text-blue-600 font-black">{tag}</code>
            ))}
          </div>

          <textarea 
            rows={8}
            className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none resize-none font-medium text-slate-700 mb-6"
            value={template}
            onChange={e => setTemplate(e.target.value)}
          />
          
          <button 
            onClick={handleSaveConfig}
            className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl shadow-lg shadow-blue-100 transition-all active:scale-95"
          >
            Actualizar Plantilla
          </button>
        </div>

        {/* System Settings */}
        <div className="space-y-6">
          <div className="bento-card">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Sliders className="w-5 h-5 text-blue-600" />
              </div>
              <h2 className="text-xl font-bold text-slate-800">Preferencias del Sistema</h2>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                 <div>
                    <p className="font-bold text-slate-800 text-sm">Moneda Principal</p>
                    <p className="text-xs text-slate-500">Lempiras (L)</p>
                 </div>
                 <span className="text-xs font-black text-blue-600 bg-white px-3 py-1 rounded-lg border border-slate-200">DEFAULT</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                 <div>
                    <p className="font-bold text-slate-800 text-sm">Idioma</p>
                    <p className="text-xs text-slate-500">Español (HN)</p>
                 </div>
                 <span className="text-xs font-black text-blue-600 bg-white px-3 py-1 rounded-lg border border-slate-200">DEFAULT</span>
              </div>
            </div>
          </div>

          <div className="bento-card border-rose-100">
             <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-rose-50 rounded-lg">
                <Trash2 className="w-5 h-5 text-rose-600" />
              </div>
              <h2 className="text-xl font-bold text-slate-800">Zona de Peligro</h2>
            </div>
            <p className="text-xs text-slate-500 mb-6">Al realizar esta acción, se eliminarán todos los pedidos, clientes, tiendas y configuraciones.</p>
            <button 
              onClick={clearAll}
              className="w-full py-4 border-2 border-rose-100 text-rose-500 font-black rounded-2xl hover:bg-rose-500 hover:text-white transition-all active:scale-95"
            >
              Borrar Base de Datos
            </button>
          </div>

          <div className="bg-blue-600 rounded-3xl p-8 text-white flex gap-6 items-center shadow-xl shadow-blue-100">
            <div className="p-4 bg-white/20 backdrop-blur rounded-2xl">
              <Smartphone className="w-8 h-8" />
            </div>
            <div>
              <h3 className="font-bold text-lg leading-tight">Instalar App</h3>
              <p className="text-blue-100 text-sm">Agrega OrderTrack a tu pantalla de inicio para usarla como App Nativa.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
