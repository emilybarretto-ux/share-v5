import React from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, Mail, Lock, Eye, EyeOff, ArrowRight, Globe } from 'lucide-react';
import { Screen } from '../../types';
import { supabase } from '../../lib/supabase';

interface LoginScreenProps {
  key?: string;
  loginEmail: string;
  setLoginEmail: (e: string) => void;
  loginPassword: string;
  setLoginPassword: (p: string) => void;
  handleLogin: () => void;
  isLoggingIn: boolean;
  setScreen: (s: Screen) => void;
}

export const LoginScreen = ({
  loginEmail, setLoginEmail,
  loginPassword, setLoginPassword,
  handleLogin, isLoggingIn, setScreen
}: LoginScreenProps) => {
  const [showPassword, setShowPassword] = React.useState(false);

  return (
    <motion.div 
      key="login"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="min-h-full flex flex-col items-center justify-center px-4 py-12"
    >
      <div className="w-full max-w-[400px] space-y-8">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-accent text-white shadow-xl shadow-accent/20 mb-4">
            <ShieldCheck size={32} />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-text-primary">Acesso à Plataforma</h1>
          <p className="text-text-secondary">Gerencie suas comunicações seguras com total controle e privacidade corporativa.</p>
        </div>

        <div className="bg-surface p-8 rounded-panel border border-border-base shadow-xl space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-text-secondary ml-1">E-mail</label>
              <div className="relative">
                <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
                <input 
                  type="email" 
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="seu@email.com" 
                  className="w-full pl-10 pr-4 py-3 bg-bg-base/50 border border-border-base rounded-card focus:ring-2 focus:ring-accent outline-none text-text-primary transition-all"
                />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between ml-1">
                <label className="text-sm font-semibold text-text-secondary">Senha</label>
                <button 
                  type="button"
                  onClick={() => setScreen('forgot-password')}
                  className="text-xs font-bold text-accent hover:underline"
                >
                  Esqueceu a senha?
                </button>
              </div>
              <div className="relative">
                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
                <input 
                  type={showPassword ? "text" : "password"} 
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••" 
                  className="w-full pl-10 pr-12 py-3 bg-bg-base/50 border border-border-base rounded-card focus:ring-2 focus:ring-accent outline-none text-text-primary transition-all"
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-accent transition-colors p-1"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          </div>

          <button 
            onClick={handleLogin}
            disabled={isLoggingIn}
            className={`w-full py-4 bg-accent hover:opacity-90 text-white font-bold rounded-lg shadow-lg shadow-accent/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 ${isLoggingIn ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {isLoggingIn ? (
              <div className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                Entrar na Conta
                <ArrowRight size={18} />
              </>
            )}
          </button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border-base"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-surface px-2 text-text-secondary font-bold tracking-widest">Ou continue com</span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <button 
            onClick={async () => {
              await supabase.auth.signInWithOAuth({
                provider: 'google',
              });
            }}
            className="flex items-center justify-center gap-2 py-3 border border-border-base rounded-xl hover:bg-bg-base transition-colors text-sm font-bold text-text-primary"
          >
            <Globe size={18} />
            Google
          </button>
        </div>
      </div>

      <p className="text-center text-sm text-text-secondary">
        Não tem uma conta? <button onClick={() => setScreen('register')} className="font-bold text-accent hover:underline">Criar agora</button>
      </p>
    </div>
  </motion.div>
  );
};
