import React from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, FileText, Mail, Lock, ArrowRight, Globe } from 'lucide-react';
import { Screen } from '../../types';
import { supabase } from '../../lib/supabase';

interface RegisterScreenProps {
  key?: string;
  registerName: string;
  setRegisterName: (n: string) => void;
  registerEmail: string;
  setRegisterEmail: (e: string) => void;
  registerPassword: string;
  setRegisterPassword: (p: string) => void;
  handleRegister: () => void;
  isRegistering: boolean;
  setScreen: (s: Screen) => void;
}

export const RegisterScreen = ({
  registerName, setRegisterName,
  registerEmail, setRegisterEmail,
  registerPassword, setRegisterPassword,
  handleRegister, isRegistering, setScreen
}: RegisterScreenProps) => (
  <motion.div 
    key="register"
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
        <h1 className="text-3xl font-extrabold tracking-tight text-text-primary">Registro de Usuário</h1>
        <p className="text-text-secondary">Adira aos mais altos padrões de sigilo e proteção de dados em suas comunicações.</p>
      </div>

      <div className="bg-surface p-8 rounded-panel border border-border-base shadow-xl space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-text-secondary ml-1">Nome Completo</label>
            <div className="relative">
              <FileText size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
              <input 
                type="text" 
                value={registerName}
                onChange={(e) => setRegisterName(e.target.value)}
                placeholder="Seu nome" 
                className="w-full pl-10 pr-4 py-3 bg-bg-base/50 border border-border-base rounded-card focus:ring-2 focus:ring-accent outline-none text-text-primary transition-all"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-text-secondary ml-1">E-mail</label>
            <div className="relative">
              <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
              <input 
                type="email" 
                value={registerEmail}
                onChange={(e) => setRegisterEmail(e.target.value)}
                placeholder="seu@email.com" 
                className="w-full pl-10 pr-4 py-3 bg-bg-base/50 border border-border-base rounded-card focus:ring-2 focus:ring-accent outline-none text-text-primary transition-all"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-text-secondary ml-1">Senha</label>
            <div className="relative">
              <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
              <input 
                type="password" 
                value={registerPassword}
                onChange={(e) => setRegisterPassword(e.target.value)}
                placeholder="••••••••" 
                className="w-full pl-10 pr-12 py-3 bg-bg-base/50 border border-border-base rounded-card focus:ring-2 focus:ring-accent outline-none text-text-primary transition-all"
              />
            </div>
          </div>
        </div>

        <button 
          onClick={handleRegister}
          disabled={isRegistering}
          className={`w-full py-4 bg-accent hover:opacity-90 text-white font-bold rounded-lg shadow-lg shadow-accent/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 ${isRegistering ? 'opacity-70 cursor-not-allowed' : ''}`}
        >
          {isRegistering ? (
            <div className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              Criar Conta
              <ArrowRight size={18} />
            </>
          )}
        </button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border-base"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-surface px-2 text-text-secondary font-bold tracking-widest">Ou registre-se com</span>
          </div>
        </div>

        <button 
          onClick={async () => {
            await supabase.auth.signInWithOAuth({
              provider: 'google',
            });
          }}
          className="w-full flex items-center justify-center gap-2 py-3 border border-border-base rounded-xl hover:bg-bg-base transition-colors text-sm font-bold text-text-primary"
        >
          <Globe size={18} />
          Google
        </button>
      </div>

      <p className="text-center text-sm text-text-secondary">
        Já tem uma conta? <button onClick={() => setScreen('login')} className="font-bold text-accent hover:underline">Fazer login</button>
      </p>
    </div>
  </motion.div>
);
