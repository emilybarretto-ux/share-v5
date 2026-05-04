import React from 'react';
import { motion } from 'motion/react';
import { Lock, Eye, EyeOff, Check, ShieldCheck, ArrowRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useNotification } from '../shared/NotificationProvider';

interface ResetPasswordScreenProps {
  onSuccess: () => void;
}

export const ResetPasswordScreen = ({ onSuccess }: ResetPasswordScreenProps) => {
  const [newPassword, setNewPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const { showNotification } = useNotification();

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword.length < 6) {
      showNotification('A senha deve ter pelo menos 6 caracteres.', 'error');
      return;
    }

    if (newPassword !== confirmPassword) {
      showNotification('As senhas não coincidem.', 'error');
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      sessionStorage.removeItem('supabase_recovery_mode');
      // Forçamos o logout para que o usuário tenha que fazer login com a nova senha
      await supabase.auth.signOut();
      showNotification('Senha alterada com sucesso! Entre agora com sua nova senha.', 'success');
      onSuccess();
    } catch (error: any) {
      showNotification(error.message || 'Erro ao redefinir senha.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-[80vh] flex flex-col items-center justify-center p-4"
    >
      <div className="w-full max-w-[400px] space-y-8">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-accent text-white shadow-xl shadow-accent/20 mb-2">
            <Lock size={32} />
          </div>
          <h1 className="text-3xl font-black text-text-primary italic uppercase tracking-tight">Nova Senha</h1>
          <p className="text-text-secondary text-sm px-4">Defina sua nova credencial de acesso. Use uma combinação forte para sua segurança.</p>
        </div>

        <div className="bg-surface p-8 rounded-[2.5rem] border border-border-base shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-accent" />
          
          <form onSubmit={handleUpdatePassword} className="space-y-6">
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] ml-1">Nova Senha</label>
                <div className="relative">
                  <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary" />
                  <input 
                    type={showPassword ? "text" : "password"} 
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres" 
                    className="w-full pl-12 pr-12 py-4 bg-bg-base border border-border-base rounded-2xl focus:ring-2 focus:ring-accent outline-none text-text-primary transition-all font-medium text-sm"
                    required
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary hover:text-accent transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] ml-1">Confirmar Senha</label>
                <div className="relative">
                  <ShieldCheck size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary" />
                  <input 
                    type="password" 
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repita a nova senha" 
                    className="w-full pl-12 pr-4 py-4 bg-bg-base border border-border-base rounded-2xl focus:ring-2 focus:ring-accent outline-none text-text-primary transition-all font-medium text-sm"
                    required
                  />
                </div>
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
                  Redefinir e Entrar
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </motion.div>
  );
};
