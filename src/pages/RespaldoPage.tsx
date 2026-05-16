import React from 'react';
import { useStore } from '../hooks/useStore';
import { Download, Upload, CloudCheck, AlertCircle, RefreshCw } from 'lucide-react';

export const RespaldoPage: React.FC = () => {
  const { data, importData } = useStore();

  const handleExport = () => {
    const dataStr = JSON.stringify(data, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `respaldo_cloud_ordertrack_${new Date().toISOString().split('T')[0]}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const importedData = JSON.parse(event.target?.result as string);
        if (confirm('¿Deseas restaurar este respaldo en la NUBE? Se combinarán o sobrescribirán los datos actuales.')) {
          await importData(importedData);
          alert('Datos sincronizados con éxito en la nube.');
        }
      } catch (err) {
        alert('Error al importar el archivo. Asegúrate de que sea un JSON válido.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="animate-in fade-in duration-500">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Sincronización y Respaldo</h1>
        <p className="text-slate-500 font-medium">Gestiona tu información en la nube y mantén copias locales</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bento-card border-none bg-blue-600 relative overflow-hidden">
          <div className="relative z-10">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-6">
              <Download className="text-white w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Exportar Copia Local</h2>
            <p className="text-blue-100 text-sm mb-8">Descarga una copia física de tus datos actuales de la nube a tu computadora.</p>
            <button 
              onClick={handleExport}
              className="w-full py-4 bg-white text-blue-600 font-black rounded-2xl hover:bg-blue-50 transition-all active:scale-95 shadow-xl shadow-blue-900/20"
            >
              Descargar JSON
            </button>
          </div>
          <RefreshCw className="absolute -bottom-10 -right-10 w-48 h-48 text-white/5 rotate-12" />
        </div>

        <div className="bento-card bg-white">
          <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mb-6">
            <Upload className="text-slate-600 w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Importar a la Nube</h2>
          <p className="text-slate-500 text-sm mb-8">Sube un archivo de respaldo previo para migrar o restaurar datos a tu cuenta actual.</p>
          <label className="w-full cursor-pointer py-4 bg-slate-900 text-white flex justify-center items-center font-black rounded-2xl hover:bg-slate-800 transition-all active:scale-95 shadow-lg">
            Seleccionar Archivo
            <input type="file" accept=".json" onChange={handleImport} className="hidden" />
          </label>
        </div>

        <div className="md:col-span-2 bento-card border-emerald-100 bg-emerald-50/50">
          <div className="flex gap-5">
            <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center shrink-0">
               <CloudCheck className="text-emerald-600 w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-emerald-900">Seguridad Multi-Dispositivo</h3>
              <p className="text-sm text-emerald-700/80 leading-relaxed font-medium mt-1">
                Tus datos ahora están vinculados a tu correo electrónico. Puedes iniciar sesión desde cualquier teléfono, tablet o computadora y verás tu información actualizada en tiempo real. Los respaldos manuales ya no son obligatorios, pero siguen siendo una buena práctica de seguridad extra.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

