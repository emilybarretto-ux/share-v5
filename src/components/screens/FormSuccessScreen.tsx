import React from 'react';
import { motion } from 'motion/react';
import { Check, Copy, Share2, Globe, ShieldIcon, ArrowRight } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

interface FormSuccessScreenProps {
  formId: string;
  onBack: () => void;
  title: string;
}

export const FormSuccessScreen = ({ formId, onBack, title }: FormSuccessScreenProps) => {
  const [copied, setCopied] = React.useState(false);
  const shareUrl = `${window.location.origin}/form/${formId}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto p-8 space-y-10 text-center"
    >
      <div className="space-y-4">
        <div className="size-20 bg-success-base/10 text-success-base rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl shadow-success-base/5">
          <Check size={40} strokeWidth={3} />
        </div>
        <h1 className="text-4xl font-black text-text-primary tracking-tighter">
          Formulário Publicado!
        </h1>
        <p className="text-text-secondary text-lg max-w-md mx-auto">
          O formulário <span className="text-text-primary font-bold">"{title}"</span> está pronto e disponível para coleta segura de dados.
        </p>
      </div>

      <div className="bg-surface border border-border-base rounded-[3rem] p-8 shadow-2xl space-y-8 relative overflow-hidden group">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-accent via-indigo-500 to-accent" />
        
        <div className="space-y-6">
          <div className="flex flex-col items-center gap-4">
            <div className="p-4 bg-white rounded-3xl shadow-lg border border-slate-100">
              <QRCodeSVG value={shareUrl} size={160} />
            </div>
            <p className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em]">Escaneie para testar o formulário</p>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-black text-text-secondary uppercase tracking-widest text-left ml-4">Link Público do Formulário</p>
            <div className="relative group/link">
              <div className="w-full bg-bg-base border-2 border-border-base rounded-2xl p-5 text-left font-mono text-sm text-text-secondary break-all pr-20 group-hover/link:border-accent/30 transition-colors">
                {shareUrl}
              </div>
              <button 
                onClick={handleCopy}
                className={`absolute right-3 top-1/2 -translate-y-1/2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 ${
                  copied ? 'bg-success-base text-white' : 'bg-accent text-white hover:scale-105 active:scale-95 shadow-lg shadow-accent/20'
                }`}
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? 'Copiado' : 'Copiar'}
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-bg-base/50 rounded-2xl border border-border-base flex items-center gap-3 text-left">
            <Globe size={20} className="text-accent" />
            <div>
              <p className="text-[10px] font-black text-text-secondary uppercase">Disponibilidade</p>
              <p className="text-xs font-bold text-text-primary">Acesso Global</p>
            </div>
          </div>
          <div className="p-4 bg-bg-base/50 rounded-2xl border border-border-base flex items-center gap-3 text-left">
            <ShieldIcon size={20} className="text-accent" />
            <div>
              <p className="text-[10px] font-black text-text-secondary uppercase">Segurança</p>
              <p className="text-xs font-bold text-text-primary">E2EE Ativado</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        <button 
          onClick={onBack}
          className="w-full sm:w-auto px-8 py-4 bg-surface border border-border-base rounded-2xl font-black text-text-primary hover:bg-bg-base transition-all flex items-center justify-center gap-2"
        >
          Ir para Dashboard
          <ArrowRight size={18} />
        </button>
        <button 
          className="w-full sm:w-auto px-8 py-4 bg-accent/10 border border-accent/20 rounded-2xl font-black text-accent hover:bg-accent/20 transition-all flex items-center justify-center gap-2"
          onClick={() => window.open(shareUrl, '_blank')}
        >
          <Share2 size={18} />
          Abrir Agora
        </button>
      </div>
    </motion.div>
  );
};
