import React from 'react';
import { motion } from 'motion/react';
import { Check, Copy, Link as LinkIcon, ArrowRight } from 'lucide-react';
import { Screen } from '../../types';

interface RequestSuccessScreenProps {
  key?: string;
  generatedLinkId: string;
  copied: boolean;
  handleCopy: (text: string) => void;
  setScreen: (s: Screen) => void;
}

export const RequestSuccessScreen = ({
  generatedLinkId, copied, handleCopy, setScreen
}: RequestSuccessScreenProps) => {
  const link = `${window.location.origin}/?request=${generatedLinkId}`;

  return (
    <motion.div 
      key="request-success"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      className="min-h-full flex flex-col items-center justify-center px-4 py-12"
    >
      <div className="mb-8 flex items-center justify-center w-24 h-24 rounded-full bg-green-500/10 text-green-500 border-4 border-green-500/20">
        <Check size={48} strokeWidth={3} />
      </div>
      <h1 className="text-4xl lg:text-5xl font-black text-slate-900 dark:text-white text-center mb-4 tracking-tight">
        Pedido Criado com Sucesso!
      </h1>
      <p className="text-slate-500 dark:text-slate-400 text-lg font-medium text-center max-w-md mb-12 leading-relaxed">
        Agora é só enviar este link seguro para quem você deseja solicitar os dados.
      </p>

      <div className="w-full max-w-[500px] bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-8 shadow-2xl space-y-6">
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <LinkIcon size={20} className="text-slate-400" />
          </div>
          <input 
            type="text" 
            readOnly 
            value={link}
            className="block w-full pl-12 pr-4 py-5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-mono text-slate-600 dark:text-slate-300 outline-none" 
          />
        </div>

        <button 
          onClick={() => handleCopy(link)}
          className={`w-full flex items-center justify-center gap-3 h-16 px-8 rounded-2xl text-lg font-bold transition-all transform active:scale-[0.98] shadow-lg ${copied ? 'bg-green-600 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/20'}`}
        >
          {copied ? <Check size={24} /> : <Copy size={24} />}
          <span>{copied ? 'Link Copiado!' : 'Copiar Link de Solicitação'}</span>
        </button>
      </div>

      <div className="mt-12 flex flex-col items-center gap-6">
        <button 
          onClick={() => setScreen('dashboard')}
          className="flex items-center gap-2 text-blue-600 font-bold hover:underline group"
        >
          Ver minhas solicitações no Dashboard
          <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </motion.div>
  );
};
