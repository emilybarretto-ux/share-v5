import React from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, Lock, Globe, Zap, ArrowRight, CheckCircle2, Shield, Layout, Database } from 'lucide-react';
import { Screen } from '../../types';

interface HomeScreenProps { 
  setScreen: (s: Screen) => void;
  user: any;
}

export const HomeScreen = ({ setScreen, user }: HomeScreenProps) => {
  return (
    <div className="flex flex-col w-full">
      {/* Hero Section */}
      <section className="relative pt-20 pb-20 md:pt-32 md:pb-40 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full -z-10 opacity-20">
          <div className="absolute top-0 right-0 size-[500px] bg-accent/30 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/4 animate-pulse"></div>
          <div className="absolute bottom-0 left-0 size-[500px] bg-indigo-500/20 rounded-full blur-[120px] translate-y-1/2 -translate-x-1/4"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 text-center space-y-8">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl sm:text-5xl md:text-8xl font-black text-text-primary leading-[0.9] tracking-tighter"
          >
            SUA INFORMAÇÃO, <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-indigo-400">SOB CONTROLE TOTAL.</span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="max-w-2xl mx-auto text-lg text-text-secondary font-medium leading-relaxed"
          >
            A infraestrutura inteligente para compartilhamento de ativos críticos. Combine criptografia de ponta, autenticação multifatorial e governança de dados em uma única ferramenta.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8"
          >
            <button 
              onClick={() => setScreen('create-secret')}
              className="group px-10 py-5 bg-accent text-white font-black rounded-2xl flex items-center gap-3 shadow-2xl shadow-accent/40 hover:scale-[1.02] active:scale-95 transition-all text-lg uppercase tracking-tighter"
            >
              Criar Link Seguro
              <ArrowRight size={24} className="group-hover:translate-x-1 transition-transform" />
            </button>
            <button 
              onClick={() => setScreen('how-it-works')}
              className="px-10 py-5 bg-bg-base/50 border border-border-base text-text-primary font-black rounded-2xl hover:bg-surface transition-all text-lg uppercase tracking-tighter"
            >
              Como Funciona
            </button>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 bg-surface/30 backdrop-blur-sm border-y border-border-base">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-accent">O que oferecemos</h2>
            <h3 className="text-3xl sm:text-4xl font-black text-text-primary tracking-tighter">FERRAMENTAS SIMPLES PARA SEGURANÇA MÁXIMA.</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: <Layout className="text-accent" size={32} />,
                title: "Formulários Dinâmicos",
                desc: "Colete dados estruturados com lógica condicional avançada que adapta o fluxo de preenchimento ao perfil do usuário."
              },
              {
                icon: <Shield className="text-accent" size={32} />,
                title: "Criptografia Efêmera",
                desc: "Compartilhamento de ativos críticos com chaves de criptografia únicas, expiração temporal e destruição pós-leitura."
              },
              {
                icon: <Database className="text-accent" size={32} />,
                title: "Protocolo de Solicitação",
                desc: "Substitua o trâmite de documentos inseguros por portas de entrada exclusivas, protegidas por criptografia de ponta."
              }
            ].map((item, idx) => (
              <motion.div 
                key={idx}
                whileHover={{ y: -5 }}
                className="p-8 bg-bg-base border border-border-base rounded-[2.5rem] space-y-6 hover:shadow-2xl hover:shadow-accent/5 transition-all"
              >
                <div className="size-16 bg-accent/10 rounded-2xl flex items-center justify-center">
                  {item.icon}
                </div>
                <h4 className="text-xl font-black text-text-primary tracking-tight">{item.title}</h4>
                <p className="text-text-secondary leading-relaxed font-medium">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Security Section (Dark) */}
      <section className="py-24 max-w-7xl mx-auto px-4 w-full">
        <div className="bg-accent rounded-[3rem] p-12 md:p-20 text-white overflow-hidden relative">
          <div className="absolute top-0 right-0 opacity-10 -translate-y-1/4 translate-x-1/4">
            <ShieldCheck size={400} strokeWidth={1} />
          </div>
          
          <div className="relative z-10 max-w-3xl">
            <h2 className="text-3xl sm:text-4xl md:text-6xl font-black leading-tight tracking-tighter mb-8 italic uppercase text-white break-words">
              Confidencialidade. <br /> Integridade. Disponibilidade.
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                "Logs de auditoria em tempo real",
                "Conformidade com LGPD/GDPR",
                "Tokenização de acesso multifatorial",
                "Criptografia de repouso (At-Rest)",
                "Controle granular de visualizações",
                "Sanitização automática de buffers"
              ].map((text, i) => (
                <div key={i} className="flex items-center gap-3 bg-white/10 px-6 py-4 rounded-2xl backdrop-blur-md">
                  <CheckCircle2 size={24} className="text-indigo-200" />
                  <span className="font-black uppercase tracking-tighter text-sm">{text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <footer className="py-24 text-center space-y-8 px-4">
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-text-primary tracking-tighter uppercase italic">Reduza riscos operacionais hoje</h2>
        <p className="max-w-xl mx-auto text-text-secondary font-medium">Implemente governança no compartilhamento de dados e proteja os ativos mais valiosos da sua operação.</p>
        <button 
          onClick={() => setScreen('register')}
          className="w-full max-w-xs px-12 py-6 bg-accent text-white font-black rounded-2xl uppercase tracking-tighter text-xl shadow-2xl shadow-accent/30 hover:scale-105 active:scale-95 transition-all mx-auto sm:w-auto"
        >
          Criar minha conta
        </button>
      </footer>
    </div>
  );
};
