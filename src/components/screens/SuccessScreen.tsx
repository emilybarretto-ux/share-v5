import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, Copy, QrCode, Lock, Mail, Settings } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Screen } from '../../types';

interface SuccessScreenProps {
  key?: string;
  generatedLinkId: string;
  qrVisible: boolean;
  setQrVisible: (v: boolean) => void;
  copied: boolean;
  handleCopy: () => void;
  setScreen: (s: Screen) => void;
}

export const SuccessScreen = ({
  generatedLinkId, qrVisible, setQrVisible, copied, handleCopy, setScreen
}: SuccessScreenProps) => (
  <motion.div 
    key="success"
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 1.05 }}
    className="min-h-full flex flex-col items-center justify-center px-4 py-8"
  >
    <div className="mb-6 flex items-center justify-center w-16 h-16 rounded-full bg-green-500/10 text-green-500">
      <Check size={36} strokeWidth={3} />
    </div>
    <h1 className="text-slate-900 dark:text-white tracking-tight text-4xl lg:text-5xl font-extrabold leading-tight text-center mb-4">
      Compartilhamento Preparado
    </h1>
    <p className="text-slate-600 dark:text-slate-400 text-lg font-medium leading-normal text-center max-w-md mb-8">
      A informação foi processada e está pronta para o envio seguro. O acesso será concedido apenas via credenciais autorizadas.
    </p>

    <div className="w-full max-w-[440px] bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-8 shadow-2xl backdrop-blur-sm">
      <AnimatePresence>
        {qrVisible && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden mb-6"
          >
            <div className="flex flex-col items-center gap-4">
              <div className="w-full max-w-[280px] aspect-square rounded-2xl border-4 border-white bg-white shadow-xl overflow-hidden flex items-center justify-center p-4 mx-auto">
                 <div className="w-full h-full flex items-center justify-center">
                   <QRCodeSVG 
                     value={`${window.location.origin}/?id=${generatedLinkId}`} 
                     size={240}
                     level="H"
                     includeMargin={false}
                     className="w-full h-full"
                   />
                 </div>
               </div>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold tracking-[0.2em] uppercase">Escaneie para visualizar</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-4">
        <button 
          onClick={handleCopy}
          className={`w-full flex items-center justify-center gap-3 h-14 px-8 rounded-2xl text-lg font-bold transition-all transform active:scale-[0.98] shadow-lg ${copied ? 'bg-green-600 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/20'}`}
        >
          {copied ? <Check size={20} /> : <Copy size={20} />}
          <span>{copied ? 'Link Copiado!' : 'Copiar Link'}</span>
        </button>

        <button 
          onClick={() => setQrVisible(!qrVisible)}
          className="w-full flex items-center justify-center gap-2 text-slate-600 dark:text-slate-400 h-12 px-6 rounded-xl text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all border border-slate-200 dark:border-slate-800"
        >
          <QrCode size={18} />
          <span>{qrVisible ? 'Ocultar QR Code' : 'Mostrar QR Code'}</span>
        </button>

        <div className="relative flex items-center bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl h-12 px-4 overflow-hidden">
          <span className="text-slate-500 dark:text-slate-400 text-xs truncate pr-10 font-mono">
            {window.location.origin}/?id={generatedLinkId || '...'}
          </span>
          <div className="absolute right-4 flex items-center text-slate-400">
            <Lock size={14} />
          </div>
        </div>
      </div>
    </div>

    <div className="mt-8 flex flex-wrap justify-center gap-3">
      <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-200/50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 text-sm font-bold hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors border border-transparent dark:border-slate-700">
        <Mail size={18} />
        Enviar por E-mail
      </button>
      <button 
        onClick={() => setScreen('login')}
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-200/50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 text-sm font-bold hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors border border-transparent dark:border-slate-700"
      >
        <Settings size={18} />
        Gerenciar Acesso
      </button>
    </div>

    <footer className="mt-12 text-center">
      <p className="text-slate-500 dark:text-slate-600 text-xs font-medium tracking-wide">
        Expiração em 7 dias • Proteção por Credencial • Sigilo Absoluto
      </p>
    </footer>
  </motion.div>
);
