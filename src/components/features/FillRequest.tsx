import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Lock, Check, Timer, ShieldCheck, ArrowRight, ChevronRight, Send, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { calculateExpirationDate } from '../../lib/utils';
import { useNotification } from '../shared/NotificationProvider';

interface FillRequestProps {
  key?: string;
  id: string | null;
  user: any;
  onSuccess: () => void;
}

export const FillRequest = ({ id, user, onSuccess }: FillRequestProps) => {
  const [loading, setLoading] = useState(true);
  const [request, setRequest] = useState<any>(null);
  const [response, setResponse] = useState('');
  const [expiration, setExpiration] = useState('24 horas');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showNotification } = useNotification();

  useEffect(() => {
    if (id) fetchRequest();
  }, [id, user]);

  const fetchRequest = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('requests')
      .select('*, profiles:user_id(full_name)')
      .eq('id', id)
      .single();

    if (error) {
      showNotification('Esta solicitação não existe mais.', 'error');
    } else {
      if (data.status === 'active' && data.expires_at && new Date(data.expires_at) < new Date()) {
        await supabase.from('requests').delete().eq('id', id);
        showNotification('Esta solicitação expirou e foi removida.', 'error');
        return;
      }
      setRequest(data);
    }
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!id) return;
    if (!response.trim()) {
      showNotification('Por favor, preencha os dados solicitados antes de enviar.', 'info');
      return;
    }

    setIsSubmitting(true);
    const isOneTime = expiration.includes('Acesso Único');
    const finalResponse = isOneTime ? `[ONE_TIME]${response}` : response;

    const { error } = await supabase
      .from('requests')
      .update({ 
        status: 'completed', 
        response: finalResponse,
        expires_at: isOneTime ? null : calculateExpirationDate(expiration)
      })
      .eq('id', id);

    setIsSubmitting(false);
    if (error) {
      showNotification('Erro ao enviar resposta: ' + error.message, 'error');
    } else {
      showNotification('Resposta enviada com sucesso!', 'success');
      onSuccess();
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 md:py-16">
      {loading ? (
        <div className="min-h-[40vh] flex flex-col items-center justify-center text-text-secondary font-bold gap-4 backdrop-blur-sm border border-border-base rounded-[2.5rem] bg-surface/50">
          <div className="size-12 border-4 border-accent border-t-transparent rounded-full animate-spin" />
          <p className="uppercase tracking-widest text-[10px] font-black">Validando Conexão Segura...</p>
        </div>
      ) : !request ? (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-20 text-center bg-red-500/10 border border-red-500/20 rounded-[2.5rem] text-red-500 font-black flex flex-col items-center gap-4 shadow-2xl"
        >
          <X size={48} strokeWidth={3} />
          <p className="uppercase tracking-widest text-sm">Esta solicitação expirou ou foi removida pelo proprietário.</p>
          <button 
            onClick={() => window.location.href = '/'}
            className="mt-4 px-8 py-3 bg-red-500 text-white rounded-2xl text-xs font-black uppercase tracking-widest"
          >
            Voltar ao Início
          </button>
        </motion.div>
      ) : (
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-surface border border-border-base rounded-[2.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)] overflow-hidden"
        >
          <div className="px-8 py-10 md:px-12 bg-accent text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10">
               <ShieldCheck size={180} />
            </div>
            <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-6">
              <div className="size-16 md:size-20 rounded-[1.5rem] bg-white/20 backdrop-blur-xl flex items-center justify-center text-white border border-white/30 shadow-2xl">
                <Lock size={32} />
              </div>
              <div className="space-y-1">
                <p className="text-[10px] md:text-xs font-black uppercase tracking-[0.2em] opacity-70">Ambiente de Transmissão Segura</p>
                <h2 className="text-3xl md:text-4xl font-black tracking-tight leading-none">Safe Room</h2>
                <p className="text-white/80 text-sm font-medium">Solicitado por: <span className="font-black text-white">{request.profiles?.full_name || 'Usuário Verificado'}</span></p>
              </div>
            </div>
          </div>

          <div className="p-8 md:p-12 space-y-10">
            <div className="space-y-4">
              <h3 className="text-2xl font-black tracking-tight text-text-primary px-1">{request.title}</h3>
              <div className="bg-bg-base/30 p-6 rounded-2xl border border-border-base/50">
                <p className="text-text-secondary text-sm md:text-base leading-relaxed font-medium">
                  {request.description || "O solicitante não forneceu instruções adicionais, mas aguarda seus dados com segurança."}
                </p>
              </div>
            </div>

            <div className="space-y-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] ml-2">Dados Confidenciais</label>
                <textarea 
                  value={response}
                  onChange={(e) => setResponse(e.target.value)}
                  placeholder="Escreva aqui senhas, tokens ou informações sensíveis..." 
                  className="w-full px-6 py-6 bg-bg-base/30 border border-border-base rounded-3xl focus:ring-4 focus:ring-accent/20 focus:border-accent outline-none text-text-primary transition-all min-h-[220px] resize-none text-lg font-medium placeholder:opacity-30"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] ml-2">Políticas de Retenção</label>
                  <div className="relative flex items-center group">
                    <Timer size={20} className="absolute left-4 text-text-secondary group-focus-within:text-accent transition-colors" />
                    <select 
                      value={expiration}
                      onChange={(e) => setExpiration(e.target.value)}
                      className="w-full pl-12 pr-10 py-4 bg-bg-base/30 border border-border-base rounded-2xl focus:ring-4 focus:ring-accent/20 focus:border-accent outline-none text-text-primary transition-all appearance-none cursor-pointer font-bold text-sm"
                    >
                      <option>1 hora</option>
                      <option>24 horas</option>
                      <option>7 dias</option>
                      <option>Acesso Único (Incinera após leitura)</option>
                    </select>
                    <div className="absolute right-4 pointer-events-none">
                       <ChevronRight size={18} className="rotate-90 text-text-secondary" />
                    </div>
                  </div>
                </div>

                <button 
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className={`w-full py-5 bg-accent hover:bg-accent/90 text-white font-black rounded-2xl shadow-2xl shadow-accent/20 transition-all flex items-center justify-center gap-3 group active:scale-[0.98] ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  {isSubmitting ? (
                    <div className="size-5 border-[3px] border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Send size={20} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                  )}
                  <span className="uppercase tracking-widest text-xs font-black">{isSubmitting ? 'Criptografando...' : 'Transmitir via Túnel Seguro'}</span>
                </button>
              </div>

              <div className="flex items-start gap-4 bg-bg-base/20 p-5 rounded-2xl border border-border-base">
                <div className="p-2 bg-success-base/10 text-success-base rounded-xl">
                  <ShieldCheck size={20} />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-black text-text-primary uppercase tracking-tight">Privacidade Grantida pelo Bold Share</p>
                  <p className="text-[11px] text-text-secondary leading-normal font-medium italic">
                    {expiration.includes('Acesso Único') 
                      ? 'Incineração Ativa: O conteúdo será destruído milissegundos após a primeira leitura, sem deixar rastros em logs ou backups.' 
                      : `Retenção Temporária: Seus dados serão mantidos em um cofre criptografado por ${expiration} e depois removidos permanentemente.`}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};
