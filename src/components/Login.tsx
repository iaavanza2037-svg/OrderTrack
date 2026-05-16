import React, { useState } from 'react';
import { signInWithGoogle } from '../lib/firebase';
import { LogIn, ShoppingBag, Globe, Zap, ShieldCheck, Loader2, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';

export const Login: React.FC = () => {
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    try {
      setIsLoggingIn(true);
      setError(null);
      await signInWithGoogle();
      // Si es redirect, la página se recargará. Si es popup, el observador en App.tsx lo captará.
    } catch (err: any) {
      console.error(err);
      setError("No se pudo iniciar sesión. Asegúrate de permitir las ventanas emergentes o de abrir el enlace en tu navegador directamente.");
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[32px] shadow-2xl shadow-slate-200 border border-white p-8 md:p-12 text-center"
        >
          <div className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-xl shadow-blue-200 rotate-3">
             <ShoppingBag className="w-10 h-10 text-white" />
          </div>
          
          <h1 className="text-4xl font-black text-slate-900 mb-2 tracking-tight">Kardex de Pedidos</h1>
          <p className="text-slate-500 font-medium mb-12">Gestiona tus compras internacionales en tiempo real desde cualquier lugar.</p>
          
          <div className="space-y-4 mb-10">
            <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
               <div className="p-2 bg-white rounded-xl shadow-sm"><Globe className="w-5 h-5 text-blue-600" /></div>
               <div className="text-left">
                 <p className="text-xs font-black text-slate-900 uppercase">Multi-Dispositivo</p>
                 <p className="text-[11px] text-slate-500">Acceso seguro desde móvil o PC.</p>
               </div>
            </div>
            <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
               <div className="p-2 bg-white rounded-xl shadow-sm"><Zap className="w-5 h-5 text-emerald-500" /></div>
               <div className="text-left">
                 <p className="text-xs font-black text-slate-900 uppercase">Tiempo Real</p>
                 <p className="text-[11px] text-slate-500">Sincronización en la nube instantánea.</p>
               </div>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-start gap-3 text-left">
              <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
              <p className="text-xs font-bold text-rose-600 leading-tight">{error}</p>
            </div>
          )}
          
          <button 
            onClick={handleLogin}
            disabled={isLoggingIn}
            className="w-full flex items-center justify-center gap-4 bg-slate-900 text-white py-4 px-6 rounded-2xl font-black text-lg hover:bg-slate-800 transition-all active:scale-95 shadow-xl shadow-slate-200 disabled:opacity-75 disabled:cursor-not-allowed"
          >
            {isLoggingIn ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin" />
                Conectando...
              </>
            ) : (
              <>
                <LogIn className="w-6 h-6" />
                Vincular mi Correo
              </>
            )}
          </button>
          
          <p className="mt-8 text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed">
            Se recomienda abrir la aplicación en <br/> el navegador externo de tu celular.
          </p>

          <div className="mt-4 pt-4 border-t border-slate-100">
            <button 
              onClick={() => alert("Si tienes problemas para iniciar sesión:\n1. Toca los 3 puntos (...) del navegador.\n2. Selecciona 'Abrir en el navegador' o 'Abrir en Chrome/Safari'.\n3. Una vez iniciada la sesión, podrás usar la App instalada normalmente.")}
              className="text-[10px] font-black text-blue-500 uppercase tracking-tighter hover:underline"
            >
              ¿Tienes problemas para entrar?
            </button>
          </div>
        </motion.div>
        
        <div className="mt-8 text-center">
           <p className="text-slate-400 font-medium text-sm">© 2026 Kardex de Pedidos Cloud</p>
        </div>
      </div>
    </div>
  );
};
