import React from 'react';
import { motion } from 'motion/react';
import { Shield, Lock, EyeOff, Globe, ShieldCheck } from 'lucide-react';
import { Screen } from '../../types';

interface SecurityScreenProps {
  key?: string;
  setScreen: (s: Screen) => void;
}

export const SecurityScreen = ({ setScreen }: SecurityScreenProps) => {
  return (
    <motion.div 
      key="security"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-full bg-bg-base text-text-primary"
    >
      <div className="max-w-4xl mx-auto px-4 py-20 space-y-16">
        {/* Header */}
        <div className="text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-success-base/10 border border-success-base/20 rounded-full text-success-base text-xs font-bold">
            <Shield size={14} />
            Proteção de Dados Avançada
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-text-primary">
            Sua Privacidade é nossa Prioridade
          </h1>
          <p className="text-text-secondary text-lg max-w-2xl mx-auto leading-relaxed">
            Entenda as tecnologias e processos que garantem que seus dados permaneçam apenas seus.
          </p>
        </div>

        {/* Feature Cards */}
        <div className="space-y-4">
          {[
            {
              icon: <Lock className="text-accent" />,
              title: "Criptografia de Ponta a Ponta",
              desc: "Utilizamos o algoritmo AES-256 para cifrar seus dados. A chave de criptografia nunca toca nossos servidores em formato legível."
            },
            {
              icon: <EyeOff className="text-accent" />,
              title: "Política de Zero Knowledge",
              desc: "Não sabemos o que você compartilha. Como os dados são criptografados no seu navegador, nem mesmo nossa equipe pode ler suas mensagens."
            },
            {
              icon: <Globe className="text-accent" />,
              title: "Infraestrutura Imutável",
              desc: "Nossos servidores rodam em ambientes isolados e são resetados periodicamente para garantir que nenhum resíduo de dado permaneça."
            },
            {
              icon: <ShieldCheck className="text-accent" />,
              title: "Auditoria e Conformidade",
              desc: "Seguimos rigorosamente as diretrizes da LGPD e GDPR, garantindo que você tenha total direito sobre o esquecimento dos seus dados."
            }
          ].map((item, i) => (
            <div key={i} className="bg-surface p-8 rounded-panel border border-border-base flex gap-6 items-start hover:bg-bg-base/50 transition-colors group">
              <div className="size-12 rounded-xl bg-accent/10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                {item.icon}
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-text-primary">{item.title}</h3>
                <p className="text-text-secondary leading-relaxed text-sm">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Stats Footer */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 pt-12 text-center">
          <div className="space-y-2">
            <div className="text-4xl font-black text-accent">100%</div>
            <div className="text-text-secondary font-bold text-sm">Criptografado</div>
          </div>
          <div className="space-y-2">
            <div className="text-4xl font-black text-accent">Zero</div>
            <div className="text-text-secondary font-bold text-sm">Logs de Conteúdo</div>
          </div>
          <div className="space-y-2">
            <div className="text-4xl font-black text-accent">Instantânea</div>
            <div className="text-text-secondary font-bold text-sm">Destruição de Dados</div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
