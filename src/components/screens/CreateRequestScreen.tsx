import React from 'react';
import { motion } from 'motion/react';
import { Mail, FileText, ArrowRight, ShieldCheck, Timer } from 'lucide-react';

interface CreateRequestScreenProps {
  key?: string;
  title: string;
  setTitle: (t: string) => void;
  description: string;
  setDescription: (d: string) => void;
  expiration: string;
  setExpiration: (e: string) => void;
  isOneTime: boolean;
  setIsOneTime: (o: boolean) => void;
  isCreating: boolean;
  handleCreateRequest: () => void;
  setScreen: (s: Screen) => void;
}

export const CreateRequestScreen = ({
  title, setTitle, description, setDescription, 
  expiration, setExpiration, isOneTime, setIsOneTime,
  isCreating, handleCreateRequest
}: CreateRequestScreenProps) => (
  <motion.div 
    key="create-request"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    className="max-w-2xl mx-auto px-4 py-12"
  >
    <div className="text-center space-y-4 mb-12">
      <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-accent text-white shadow-xl shadow-accent/20 mb-2">
        <Mail size={40} />
      </div>
      <h1 className="text-4xl font-extrabold text-text-primary">Solicitar Dados com Segurança</h1>
      <p className="text-lg text-text-secondary max-w-lg mx-auto">
        Crie um link seguro para que qualquer pessoa possa te enviar informações sensíveis de forma criptografada.
      </p>
    </div>

    <div className="bg-surface rounded-panel border border-border-base shadow-2xl p-8 space-y-8">
      <div className="space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-bold text-text-secondary ml-1">Título da Solicitação</label>
          <div className="relative">
            <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary" />
            <input 
              type="text" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Credenciais de acesso ao servidor" 
              className="w-full pl-12 pr-4 py-4 bg-bg-base/50 border border-border-base rounded-card focus:ring-2 focus:ring-accent outline-none text-text-primary transition-all shadow-sm"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-bold text-text-secondary ml-1">Instruções para o Remetente (Opcional)</label>
          <div className="relative">
            <FileText size={18} className="absolute left-4 top-4 text-text-secondary" />
            <textarea 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Explique o que você precisa que a pessoa te envie..." 
              className="w-full pl-12 pr-4 py-4 bg-bg-base/50 border border-border-base rounded-card focus:ring-2 focus:ring-accent outline-none text-text-primary transition-all min-h-[150px] resize-none shadow-sm"
            />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 p-4 bg-accent/5 rounded-card border border-accent/10">
        <ShieldCheck size={20} className="text-accent shrink-0" />
        <p className="text-xs text-text-secondary leading-relaxed font-medium">
          O remetente poderá enviar os dados com segurança. Por motivos de privacidade, é quem compartilha os dados que definirá por quanto tempo eles ficarão disponíveis para você.
        </p>
      </div>

      <button 
        onClick={handleCreateRequest}
        disabled={isCreating}
        className={`w-full py-5 bg-accent hover:opacity-90 text-white font-bold rounded-lg shadow-xl shadow-accent/30 transition-all flex items-center justify-center gap-2 transform active:scale-[0.98] ${isCreating ? 'opacity-70 cursor-not-allowed' : ''}`}
      >
        {isCreating ? (
          <div className="size-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          <>
            Gerar Link de Solicitação
            <ArrowRight size={20} />
          </>
        )}
      </button>
    </div>
  </motion.div>
);
