import React, { useState, useEffect, ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, Lock } from 'lucide-react';

interface ScreenProtectorProps {
  children: ReactNode;
  active?: boolean;
}

/**
 * ScreenProtector Wrapper
 * Executa múltiplas estratégias para mitigar capturas de tela e vazamento de dados.
 */
export const ScreenProtector: React.FC<ScreenProtectorProps> = ({ children, active = true }) => {
  const [isProtected, setIsProtected] = useState(false);

  useEffect(() => {
    if (!active) {
      setIsProtected(false);
      return;
    }

    // 1. Monitoramento de Foco: Detecta quando ferramentas de terceiros (Lightshot, Recorte) são ativadas
    const handleBlur = () => {
      setIsProtected(true);
      document.body.classList.add('privacy-active');
    };

    const handleFocus = () => {
      setIsProtected(false);
      document.body.classList.remove('privacy-active');
    };

    // 2. Monitoramento de Visibilidade: Quando o usuário troca de aba ou minimiza
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        setIsProtected(true);
        document.body.classList.add('privacy-active');
      }
    };

    const handleMouseLeave = () => {
      setIsProtected(true);
      document.body.classList.add('privacy-active');
    };

    // 3. Interceptação de Teclado: Ativa proteção em atalhos de sistema e PrintScreen
    const handleKeyDown = (e: KeyboardEvent) => {
      const isPrint = e.key === 'PrintScreen' || e.keyCode === 44;
      const isSave = (e.metaKey || e.ctrlKey) && e.key === 's';
      const isPrintCmd = (e.metaKey || e.ctrlKey) && e.key === 'p';
      const isDevTools = (e.metaKey || e.ctrlKey) && e.shiftKey && (e.key === 'I' || e.key === 'C' || e.key === 'J');
      const isSystemScreenshot = e.shiftKey && (e.metaKey || e.ctrlKey) && (e.key === '4' || e.key === '5' || e.key === 'S');

      if (isPrint || isSave || isPrintCmd || isDevTools || isSystemScreenshot) {
        if (isSave || isPrintCmd) e.preventDefault();
        
        setIsProtected(true);
        document.body.classList.add('privacy-active');
      }
    };

    // 4. Bloqueio de Menu de Contexto (Botão Direito)
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    // Adiciona os Listeners
    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('contextmenu', handleContextMenu);

    // Limpeza ao desmontar
    return () => {
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [active]);

  return (
    <div className="relative w-full h-full">
      {/* Conteúdo protegido com CSS Anti-Seleção */}
      <div 
        className={`w-full h-full transition-all duration-300 ${isProtected ? 'blur-[80px] grayscale opacity-0' : 'blur-0 opacity-100'} select-none privacy-screen-content`}
        style={{ 
          userSelect: 'none', 
          WebkitUserSelect: 'none', 
          WebkitTouchCallout: 'none' 
        }}
      >
        {children}
      </div>

      {/* Interface de Bloqueio (Overlay Absoluto) */}
      {isProtected && (
        <div
          onClick={() => {
            setIsProtected(false);
            document.body.classList.remove('privacy-active');
          }}
          className="fixed inset-0 z-[99999] bg-slate-950 flex flex-col items-center justify-center text-white p-6 text-center cursor-pointer"
        >
          <div className="relative mb-8">
            <div className="absolute inset-0 bg-accent/20 blur-3xl rounded-full scale-150 animate-pulse" />
            <div className="relative size-24 bg-accent/10 border border-accent/20 rounded-[2rem] flex items-center justify-center text-accent">
              <Lock size={48} className="animate-bounce" />
            </div>
          </div>
          
          <h2 className="text-3xl font-black uppercase tracking-tighter mb-4 italic">
            CONTEÚDO <span className="text-accent">PROTEGIDO</span>
          </h2>
          
          <div className="flex flex-col items-center gap-2 max-w-sm">
            <div className="flex items-center gap-2 px-4 py-1 bg-green-500/10 text-green-500 rounded-full border border-green-500/20 mb-2">
              <ShieldCheck size={16} />
              <span className="text-[10px] font-bold uppercase tracking-widest">Segurança de Camada 4 Ativada</span>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed">
              Por motivos de segurança e privacidade, este conteúdo não pode ser capturado ou visualizado fora do foco da aplicação.
            </p>
            <p className="text-accent text-[10px] font-bold uppercase mt-4 animate-pulse">
              Clique na janela para retomar o acesso
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
