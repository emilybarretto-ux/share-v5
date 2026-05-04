import React from 'react';
import { motion } from 'motion/react';
import { Mail, ArrowRight, ChevronLeft, ShieldCheck, Check } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useNotification } from '../shared/NotificationProvider';

interface ForgotPasswordScreenProps {
  onBack: () => void;
}

export const ForgotPasswordScreen = ({ onBack }: ForgotPasswordScreenProps) => {
  const [email, setEmail] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [isSent, setIsSent] = React.useState(false);
  const { showNotification } = useNotification();

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      showNotification('Por favor, insira seu e-mail.', 'error');
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/`,
      });

      if (error) throw error;
      
      setIsSent(true);
      showNotification('E-mail de recuperação enviado!', 'success');
    } catch (error: any) {
      showNotification(error.message || 'Erro ao enviar e-mail de recuperação.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="min-h-[80vh] flex flex-col items-center justify-center p-4"
    >
      <div className="w-full max-w-[400px] space-y-8">
        <button 
          onClick={onBack}
          className="group flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors font-bold text-xs uppercase tracking-widest"
        >
          <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          Voltar para Login
        </button>

        <div className="bg-surface p-8 rounded-[2.5rem] border border-border-base shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-accent" />
          
          <div className="text-center space-y-4 mb-8">
            <div className="size-16 bg-accent/10 text-accent rounded-3xl flex items-center justify-center mx-auto">
              <ShieldCheck size={32} />
            </div>
            <h2 className="text-2xl font-black text-text-primary tracking-tight italic uppercase">Recuperar Senha</h2>
            <p className="text-text-secondary text-sm">
              Enviaremos um link de acesso seguro para que você possa redefinir sua credencial.
            </p>
          </div>

          {!isSent ? (
            <form onSubmit={handleReset} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] ml-1">E-mail Corporativo</label>
                <div className="relative">
                  <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary" />
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ex: voce@empresa.com" 
                    className="w-full pl-12 pr-4 py-4 bg-bg-base border border-border-base rounded-2xl focus:ring-2 focus:ring-accent outline-none text-text-primary transition-all font-medium text-sm"
                    required
                  />
                </div>
              </div>

              <button 
                type="submit"
                disabled={isLoading}
                className="w-full py-4 bg-accent text-white font-black rounded-2xl uppercase tracking-widest text-xs shadow-lg shadow-accent/20 hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <div className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    Enviar Link de Recuperação
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>
          ) : (
            <div className="text-center space-y-6">
              <div className="size-16 bg-success-base/10 text-success-base rounded-full flex items-center justify-center mx-auto animate-bounce">
                <Check size={32} strokeWidth={3} />
              </div>
              <div className="space-y-2">
                <p className="text-sm font-bold text-text-primary">E-mail enviado para:</p>
                <p className="text-xs font-mono bg-bg-base p-2 rounded-lg text-accent break-all">{email}</p>
              </div>
              <p className="text-xs text-text-secondary">Verifique sua caixa de entrada e spam. O link expira em 30 minutos.</p>
              <button 
                onClick={onBack}
                className="w-full py-4 bg-bg-base text-text-primary font-black rounded-2xl uppercase tracking-widest text-xs border border-border-base hover:bg-bg-base/80 transition-all"
              >
                Voltar para o Login
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};
