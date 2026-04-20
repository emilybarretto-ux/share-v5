import React from 'react';
import { motion } from 'motion/react';
import { Lock, Eye, ShieldCheck, Check } from 'lucide-react';
import { Screen } from '../../types';

interface PasswordGateScreenProps {
  key?: string;
  setScreen: (s: Screen) => void;
}

export const PasswordGateScreen = ({ setScreen }: PasswordGateScreenProps) => (
  <motion.div 
    key="password-gate"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="min-h-full flex flex-col items-center justify-center px-4 relative"
  >
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-600/5 dark:bg-blue-600/5 rounded-full blur-[120px] pointer-events-none"></div>
    <div className="w-full max-w-[440px] z-10">
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-blue-600/10 mb-6 border border-blue-600/20">
          <Lock size={40} className="text-blue-600" />
        </div>
        <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white mb-3">
          Conteúdo Protegido por Camada de Segurança
        </h2>
        <p className="text-slate-500 dark:text-slate-400 text-lg">
          Por favor, insira a credencial de acesso para visualizar a informação.
        </p>
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300 ml-1">Senha de Acesso</label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Lock size={18} className="text-slate-400 group-focus-within:text-blue-600 transition-colors" />
            </div>
            <input 
              type="password" 
              className="block w-full pl-11 pr-12 py-4 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500" 
              placeholder="Digite a senha aqui" 
            />
            <button className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-blue-600 transition-colors">
              <Eye size={18} />
            </button>
          </div>
        </div>
        <button 
          onClick={() => setScreen('success')}
          className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
        >
          <ShieldCheck size={20} />
          Desbloquear Segredo
        </button>
      </div>

      <div className="mt-12 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-500 dark:text-slate-400 shadow-sm">
          <Check size={14} className="text-green-500" />
          Proteção de Sigilo Ativa
        </div>
      </div>
    </div>
  </motion.div>
);
