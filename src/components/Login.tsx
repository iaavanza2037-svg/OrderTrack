import React from 'react';
import { signInWithGoogle } from '../lib/firebase';
import { LogIn, ShoppingBag, Globe, Zap, ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';

export const Login: React.FC = () => {
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
          
          <div className="space-y-4 mb-12">
            <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
               <div className="p-2 bg-white rounded-xl shadow-sm"><Globe className="w-5 h-5 text-blue-600" /></div>
               <div className="text-left">
                 <p className="text-xs font-black text-slate-900 uppercase">Multi-Dispositivo</p>
                 <p className="text-[11px] text-slate-500">Sincronización instantánea en todos tus dispositivos.</p>
               </div>
            </div>
            <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
               <div className="p-2 bg-white rounded-xl shadow-sm"><Zap className="w-5 h-5 text-emerald-500" /></div>
               <div className="text-left">
                 <p className="text-xs font-black text-slate-900 uppercase">Tiempo Real</p>
                 <p className="text-[11px] text-slate-500">Actualizaciones en vivo para tu equipo de ventas.</p>
               </div>
            </div>
            <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
               <div className="p-2 bg-white rounded-xl shadow-sm"><ShieldCheck className="w-5 h-5 text-indigo-500" /></div>
               <div className="text-left">
                 <p className="text-xs font-black text-slate-900 uppercase">Seguridad Total</p>
                 <p className="text-[11px] text-slate-500">Tu información está protegida y cifrada.</p>
               </div>
            </div>
          </div>
          
          <button 
            onClick={signInWithGoogle}
            className="w-full flex items-center justify-center gap-4 bg-slate-900 text-white py-4 px-6 rounded-2xl font-black text-lg hover:bg-slate-800 transition-all active:scale-95 shadow-xl shadow-slate-200"
          >
            <LogIn className="w-6 h-6" />
            Vincular mi Correo
          </button>
          
          <p className="mt-8 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
            Al iniciar sesión, aceptas nuestra política de nube privada.
          </p>
        </motion.div>
        
        <div className="mt-8 text-center">
           <p className="text-slate-400 font-medium text-sm">© 2026 Kardex de Pedidos Cloud</p>
        </div>
      </div>
    </div>
  );
};
