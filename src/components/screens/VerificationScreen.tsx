import React from 'react';
import { motion } from 'motion/react';
import { Fingerprint, Rocket, Lock, HelpCircle, ShieldCheck, ArrowRight } from 'lucide-react';
import { Screen } from '../../types';

interface VerificationScreenProps {
  key?: string;
  setScreen: (s: Screen) => void;
}

export const VerificationScreen = ({ setScreen }: VerificationScreenProps) => (
  <motion.div 
    key="verification"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="min-h-full flex flex-col items-center justify-center px-4 py-12"
  >
    <div className="max-w-[800px] w-full flex flex-col items-center">
      <div className="w-full mb-12">
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-blue-400 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
          <div className="relative w-full bg-white dark:bg-slate-900 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 min-h-[280px] flex items-center justify-center">
            <div className="absolute inset-0 opacity-10 dark:opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #135bec 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
            <div className="relative flex flex-col items-center gap-6 p-8 text-center">
              <div className="size-20 rounded-full bg-blue-600/10 flex items-center justify-center border-2 border-blue-600/20 animate-pulse">
                <Fingerprint size={48} className="text-blue-600" />
              </div>
              <div className="space-y-2">
                <h1 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white leading-tight tracking-tight">Acesso Seguro e Verificado</h1>
                <p className="text-slate-500 dark:text-slate-400 text-lg max-w-xl mx-auto">
                  Para garantir a integridade e o sigilo da informação, solicitamos uma breve confirmação de acesso para evitar interações automatizadas.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center gap-6 w-full max-w-md">
        <button 
          onClick={() => setScreen('password-gate')}
          className="group relative w-full flex items-center justify-center gap-3 overflow-hidden rounded-xl h-16 px-8 bg-blue-600 text-white text-lg font-bold shadow-xl shadow-blue-600/20 hover:shadow-blue-600/40 hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          <Rocket size={24} className="group-hover:rotate-12 transition-transform" />
          <span>Visualizar Informação Segura</span>
          <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
        </button>
        <p className="text-slate-400 dark:text-slate-500 text-sm flex items-center gap-2">
          <Lock size={16} />
          Sessão com Proteção de Sigilo Ativa
        </p>
      </div>

      <div className="mt-16 w-full">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 p-6 backdrop-blur-sm">
            <div className="flex items-center gap-3 text-blue-600">
              <HelpCircle size={20} />
              <p className="text-slate-900 dark:text-white font-bold">Por que estou vendo isso?</p>
            </div>
            <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
              Este link é protegido por uma camada inteligente anti-bot. Ao interagir com esta página, você verifica que não é um script de raspagem ou um rastreador malicioso.
            </p>
          </div>
          <div className="flex flex-col gap-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 p-6 backdrop-blur-sm">
            <div className="flex items-center gap-3 text-blue-600">
              <ShieldCheck size={20} />
              <p className="text-slate-900 dark:text-white font-bold">Padrões de Proteção</p>
            </div>
            <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
              Sua privacidade é nossa prioridade absoluta. Este processo de verificação garante a integridade e o sigilo total da informação compartilhada.
            </p>
          </div>
        </div>
        <div className="mt-8 flex justify-center">
          <button className="text-sm font-semibold text-blue-600 hover:underline flex items-center gap-2 transition-all">
            Saiba mais sobre segurança de links
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  </motion.div>
);
