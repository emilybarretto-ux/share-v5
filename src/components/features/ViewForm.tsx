import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, ShieldCheck } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { DynamicForm } from '../../types';
import { FormRenderer } from '../renderer/FormRenderer';
import { ScreenProtector } from '../shared/ScreenProtector';

interface ViewFormProps {
  id: string;
  user: any;
  onBack: () => void;
}

export const ViewForm = ({ id, user, onBack }: ViewFormProps) => {
  const [form, setForm] = useState<DynamicForm | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    const fetchForm = async () => {
      try {
        const { data, error } = await supabase
          .from('forms')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;
        setForm(data);
      } catch (err: any) {
        console.error('Erro ao carregar formulário:', err);
        setError('Formulário não encontrado ou indisponível.');
      } finally {
        setLoading(false);
      }
    };

    fetchForm();
  }, [id, user]);

const handleSubmit = async (formData: any) => {
  try {
    // 1. Log para ver se os dados estão chegando no clique do botão
    console.log("Dados capturados para envio:", formData); 

    const { error } = await supabase
      .from('form_responses')
      .insert([
        {
          form_id: id,
          data: formData
        }
      ]);

    if (error) {
      // 2. Se o Supabase der erro (como RLS ou erro de coluna), aparecerá aqui
      console.error("Erro do Supabase:", error.message);
      throw error;
    }

    // 3. Sucesso! Defina um estado para mostrar uma mensagem de "Obrigado"
    setIsSubmitted(true); 
    
  } catch (err: any) {
    console.error('Erro completo:', err);
    alert('Erro ao enviar: ' + (err.message || 'Verifique o console.'));
  }
};

  return (
    <div className="min-h-screen bg-bg-base/50 backdrop-blur-sm select-none" onContextMenu={(e) => e.preventDefault()}>
      <ScreenProtector active={!loading && !error && !isSubmitted}>
        <div className="min-h-screen flex items-center justify-center p-6">
          {loading ? (
            <div className="size-12 border-4 border-accent/30 border-t-accent rounded-full animate-spin" />
          ) : error || !form ? (
            <div className="max-w-md w-full bg-surface p-8 rounded-[2rem] border border-border-base text-center space-y-6 shadow-xl">
              <div className="size-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto">
                <ShieldCheck size={32} />
              </div>
              <h2 className="text-2xl font-bold text-text-primary">Ops!</h2>
              <p className="text-text-secondary">{error || 'Formulário não encontrado'}</p>
              <button 
                onClick={onBack} 
                className="w-full py-3 bg-bg-base rounded-xl font-bold text-text-primary hover:opacity-80 transition-all border border-border-base"
              >
                Voltar
              </button>
            </div>
          ) : isSubmitted ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-md w-full bg-surface p-8 rounded-[2rem] border border-border-base text-center space-y-6 shadow-xl"
            >
              <div className="size-16 bg-accent/10 text-accent rounded-2xl flex items-center justify-center mx-auto">
                <ShieldCheck size={32} />
              </div>
              <h2 className="text-2xl font-bold text-text-primary">Resposta Enviada!</h2>
              <p className="text-text-secondary">Seu formulário foi enviado com sucesso e segurança.</p>
              <button 
                onClick={onBack} 
                className="w-full py-3 bg-accent text-white rounded-xl font-bold shadow-lg hover:opacity-90 transition-all"
              >
                Ok, entendi
              </button>
            </motion.div>
          ) : (
            <div className="w-full max-w-4xl">
              <FormRenderer 
                form={form} 
                onBack={onBack} 
                onSubmit={handleSubmit} 
              />
            </div>
          )}
        </div>
      </ScreenProtector>
      
      {/* Footer Branding - Apenas se não estiver carregando e não deu erro */}
      {!loading && !error && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 bg-surface/80 backdrop-blur-md border border-border-base rounded-full shadow-lg z-10 pointer-events-none">
          <div className="size-6 bg-accent rounded flex items-center justify-center text-white">
            <ShieldCheck size={14} />
          </div>
          <span className="text-[10px] font-black text-text-secondary uppercase tracking-widest">Powered by Bold Share</span>
        </div>
      )}
    </div>
  );
};
