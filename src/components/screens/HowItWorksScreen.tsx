import React from 'react';
import { motion } from 'motion/react';
import { FileText, Lock, Link as LinkIcon, Trash2, HelpCircle } from 'lucide-react';
import { Screen } from '../../types';

interface HowItWorksScreenProps {
  key?: string;
  setScreen: (s: Screen) => void;
}

export const HowItWorksScreen = ({ setScreen }: HowItWorksScreenProps) => (
  <motion.div 
    key="how-it-works"
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -20 }}
    className="max-w-4xl mx-auto px-4 py-12 space-y-12"
  >
    <div className="text-center space-y-4">
      <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white">Como o Bold Share funciona?</h1>
      <p className="text-lg text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
        Nossa plataforma foi desenhada para ser simples, rápida e, acima de tudo, extremamente segura.
      </p>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {[
        {
          icon: <FileText className="text-blue-600" size={32} />,
          title: "1. Escreva sua mensagem",
          desc: "Digite textos, cole senhas ou chaves de API. Você tem total controle sobre o que deseja compartilhar."
        },
        {
          icon: <Lock className="text-purple-600" size={32} />,
          title: "2. Defina a proteção",
          desc: "Escolha uma senha forte ou defina um limite de visualizações. Você decide quem e como acessam."
        },
        {
          icon: <LinkIcon className="text-green-600" size={32} />,
          title: "3. Gere o link seguro",
          desc: "Criamos um link único e criptografado. Envie para o destinatário através de qualquer canal."
        },
        {
          icon: <Trash2 className="text-red-600" size={32} />,
          title: "4. Autodestruição",
          desc: "Assim que as condições forem atendidas (tempo ou leitura), os dados são apagados permanentemente."
        }
      ].map((step, i) => (
        <div key={i} className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="w-16 h-16 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center">
            {step.icon}
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">{step.title}</h3>
          <p className="text-slate-500 dark:text-slate-400 leading-relaxed">{step.desc}</p>
        </div>
      ))}
    </div>

    <div className="bg-blue-600 rounded-3xl p-8 md:p-12 text-white flex flex-col md:flex-row items-center gap-8">
      <div className="flex-1 space-y-4 text-center md:text-left">
        <h2 className="text-3xl font-bold">Pronto para começar?</h2>
        <p className="text-blue-100">Experimente agora mesmo o compartilhamento mais seguro do mercado.</p>
      </div>
      <button 
        onClick={() => setScreen('home')}
        className="px-8 py-4 bg-white text-blue-600 font-bold rounded-xl shadow-xl hover:scale-105 transition-transform"
      >
        Criar meu primeiro link
      </button>
    </div>
  </motion.div>
);
