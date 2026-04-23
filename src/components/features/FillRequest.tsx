import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Lock, Check, Timer, ShieldCheck, ArrowRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { calculateExpirationDate } from '../../lib/utils';

import { useNotification } from '../shared/NotificationProvider';

interface FillRequestProps {
  key?: string;
  id: string | null;
  onSuccess: () => void;
}

export const FillRequest = ({ id, onSuccess }: FillRequestProps) => {
  const [loading, setLoading] = useState(true);
  const [request, setRequest] = useState<any>(null);
  const [response, setResponse] = useState('');
  const [expiration, setExpiration] = useState('24 horas');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showNotification } = useNotification();

  useEffect(() => {
    if (id) fetchRequest();
  }, [id]);

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
      // Verificar Expiração do Link de Solicitação
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
      // Pequeno delay para a notificação ser vista antes do redirecionamento opcional por clique
      // ou apenas deixar o componente renderizar o estado de sucesso que agora tem auto-redirecionamento
      onSuccess();
    }
  };

  // Removido timer de redirecionamento automático por window.location para não quebrar o estado SPA

  if (loading) return (
    <div className="p-20 text-center text-slate-500 font-bold">
      <div className="size-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
      Carregando solicitação segura...
    </div>
  );

  if (!request) return (
    <div className="p-20 text-center text-red-500 font-bold">
      Esta solicitação é inválida ou já foi removida.
    </div>
  );

  // Removida a tela de sucesso estática para permitir redirecionamento direto via App.tsx

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
        <div className="p-8 border-b border-slate-100 dark:border-slate-800 bg-blue-600 text-white">
          <div className="flex items-center gap-4 mb-4">
            <div className="size-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white">
              <Lock size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Solicitação de Dados Segura</h2>
              <p className="text-blue-100 text-sm">Enviado por {request.profiles?.full_name || 'Usuário Bold Share'}</p>
            </div>
          </div>
        </div>

        <div className="p-8 space-y-8">
          <div className="bg-blue-50 dark:bg-blue-900/10 p-6 rounded-2xl border border-blue-100 dark:border-blue-900/30">
            <h3 className="font-bold text-blue-900 dark:text-blue-300 mb-2">Assunto: {request.title}</h3>
            <p className="text-blue-700 dark:text-blue-400 text-sm leading-relaxed">
              {request.description}
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Sua Resposta Segura</label>
              <textarea 
                value={response}
                onChange={(e) => setResponse(e.target.value)}
                placeholder="Insira aqui os dados solicitados (senhas, chaves, etc)..." 
                className="w-full px-4 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none dark:text-white transition-all min-h-[150px] resize-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Manter dados por:</label>
              <div className="relative flex items-center">
                <Timer size={18} className="absolute left-3 text-slate-400" />
                <select 
                  value={expiration}
                  onChange={(e) => setExpiration(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none dark:text-white transition-all appearance-none cursor-pointer"
                >
                  <option>1 hora</option>
                  <option>24 horas</option>
                  <option>7 dias</option>
                  <option>Acesso Único (Incinera após leitura)</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2 text-[10px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg">
              <ShieldCheck size={14} className="text-blue-500" />
              {expiration.includes('Acesso Único') 
                ? 'Os dados serão incinerados permanentemente assim que o solicitante visualizar uma única vez.' 
                : `Os dados ficarão disponíveis para o solicitante por até ${expiration} e depois serão destruídos permanentemente.`}
            </div>

            <button 
              onClick={handleSubmit}
              disabled={isSubmitting}
              className={`w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-2 ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {isSubmitting ? (
                <div className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <ArrowRight size={20} />
              )}
              {isSubmitting ? 'Enviando...' : 'Enviar Dados com Segurança'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
