import React from 'react';
// Version: 1.0.5 - Force redeploy
import { motion } from 'motion/react';
import { Settings, FileText, Upload, Plus, X, Lock, Dices, Timer, Link as LinkIcon, Info, Check, Globe } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Screen } from '../../types';

interface HomeScreenProps { 
  key?: string;
  secretText: string;
  setSecretText: (t: string) => void;
  keyValuePairs: Array<{ id: number, key: string, value: string }>;
  addPair: () => void;
  removePair: (id: number) => void;
  updatePair: (id: number, field: 'key' | 'value', value: string) => void;
  handleFormat: (type: 'bold' | 'italic' | 'code') => void;
  expiration: string;
  setExpiration: (e: string) => void;
  limitViews: boolean;
  setLimitViews: (l: boolean) => void;
  maxViews: number;
  setMaxViews: (m: number) => void;
  password: string;
  setPassword: (p: string) => void;
  referenceName: string;
  setReferenceName: (r: string) => void;
  handleCreateSecret: () => void;
  setScreen: (s: Screen) => void;
  isCreating?: boolean;
}

export const HomeScreen = ({
  secretText, setSecretText,
  keyValuePairs, addPair, removePair, updatePair,
  handleFormat, expiration, setExpiration,
  limitViews, setLimitViews, maxViews, setMaxViews,
  password, setPassword, referenceName, setReferenceName,
  handleCreateSecret, setScreen,
  isCreating = false
}: HomeScreenProps) => (
  <motion.div 
    key="home"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    className="max-w-4xl mx-auto px-4 py-8 md:py-12 space-y-8"
  >
    <div className="flex flex-col gap-8 items-center">
      <div className="w-full max-w-3xl space-y-8">
        <div className="text-center space-y-3">
          <h1 className="text-text-primary tracking-tight text-4xl md:text-5xl font-extrabold">
            Privacidade e Sigilo em <span className="text-accent">Cada Compartilhamento</span>.
          </h1>
          <p className="text-text-secondary text-lg max-w-lg mx-auto">
            Sua informação protegida com os mais altos padrões de segurança. Sigilo absoluto e destruição automática garantidos.
          </p>
        </div>

        <div className="space-y-4">
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-accent rounded-xl blur opacity-10 group-focus-within:opacity-25 transition duration-500"></div>
            <div className="relative flex flex-col bg-surface border border-border-base rounded-panel overflow-hidden shadow-2xl">
              <div className="flex items-center justify-between p-3 bg-bg-base/50 border-b border-border-base">
                <div className="flex items-center gap-1">
                  <button onClick={() => handleFormat('bold')} className="p-2 hover:bg-surface rounded-lg transition-colors text-text-secondary" title="Negrito">
                    <span className="font-bold">B</span>
                  </button>
                  <button onClick={() => handleFormat('italic')} className="p-2 hover:bg-surface rounded-lg transition-colors text-text-secondary" title="Itálico">
                    <span className="italic font-serif">I</span>
                  </button>
                  <div className="w-px h-4 bg-border-base mx-1"></div>
                  <button onClick={() => handleFormat('code')} className="p-2 hover:bg-surface rounded-lg transition-colors text-text-secondary" title="Código">
                    <FileText size={16} />
                  </button>
                </div>
              </div>
              <textarea 
                id="secret-textarea"
                value={secretText}
                onChange={(e) => setSecretText(e.target.value)}
                className="w-full min-h-[200px] p-6 text-lg bg-transparent border-none focus:ring-0 text-text-primary placeholder:text-text-secondary/50 resize-none"
                placeholder="Cole suas informações sensíveis aqui... (chaves de API, senhas, notas privadas)"
              ></textarea>
              
              <div className="px-6 py-3 border-t border-border-base bg-bg-base/30">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-text-secondary uppercase tracking-widest">Anexo de Arquivo</span>
                </div>
                <div className="mt-2">
                  <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-border-base rounded-card cursor-pointer hover:bg-bg-base/50 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-2 pb-2">
                      <Upload size={24} className="text-text-secondary mb-1" />
                      <p className="text-xs text-text-secondary"><span className="font-semibold text-accent">Clique para enviar</span> ou arraste e solte</p>
                      <p className="text-[10px] text-text-secondary">Tamanho máx. 50MB (Criptografado)</p>
                    </div>
                    <input type="file" className="hidden" />
                  </label>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-border-base space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-text-secondary uppercase tracking-widest">Dados Estruturados (Opcional)</span>
                  <button 
                    type="button"
                    id="add-pair-action-button"
                    onClick={(e) => { 
                      e.preventDefault(); 
                      e.stopPropagation(); 
                      addPair(); 
                    }} 
                    className="flex items-center gap-2 px-6 py-2 bg-blue-600 dark:bg-blue-500 text-white hover:bg-blue-700 text-[10px] font-black rounded-full transition-all relative z-[999] active:scale-95 shadow-lg uppercase tracking-tighter"
                  >
                    <Plus size={16} strokeWidth={4} />
                    <span>Novo Par de Dados</span>
                  </button>
                </div>
                {keyValuePairs.map((pair) => (
                  <div key={pair.id} className="flex items-center gap-2">
                    <div className="flex-1 grid grid-cols-2 gap-2">
                      <input 
                        type="text" 
                        value={pair.key} 
                        onChange={(e) => updatePair(pair.id, 'key', e.target.value)} 
                        placeholder="Chave (ex: API_KEY)" 
                        className="bg-bg-base/50 border border-border-base rounded-card px-3 py-1.5 text-sm focus:ring-1 focus:ring-accent outline-none text-text-primary" 
                      />
                      <input 
                        type="text" 
                        value={pair.value} 
                        onChange={(e) => updatePair(pair.id, 'value', e.target.value)} 
                        placeholder="Valor" 
                        className="bg-bg-base/50 border border-border-base rounded-card px-3 py-1.5 text-sm focus:ring-1 focus:ring-accent outline-none text-text-primary" 
                      />
                    </div>
                    <button 
                      type="button"
                      onClick={(e) => { e.preventDefault(); removePair(pair.id); }} 
                      className="text-text-secondary hover:text-red-500 transition-colors p-1"
                    >
                      <X size={18} />
                    </button>
                  </div>
                ))}
              </div>

              <div className="px-6 py-4 border-t border-border-base">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col space-y-2">
                    <label className="text-sm font-semibold text-text-secondary ml-1">Senha Obrigatória <span className="text-red-500">*</span></label>
                    <div className="relative flex items-center">
                      <Lock size={18} className="absolute left-3 text-text-secondary" />
                      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Proteja seu link (obrigatório)" className="w-full pl-10 pr-12 py-3 bg-surface border border-border-base rounded-card focus:ring-2 focus:ring-accent focus:border-transparent transition-all text-text-primary" />
                      <button onClick={() => setPassword(Math.random().toString(36).slice(-8))} className="absolute right-2 p-1.5 text-text-secondary hover:text-accent transition-colors" title="Gerar Senha">
                        <Dices size={18} />
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-col space-y-2">
                    <label className="text-sm font-semibold text-text-secondary ml-1">Nome de Referência (Opcional)</label>
                    <div className="relative flex items-center">
                      <FileText size={18} className="absolute left-3 text-text-secondary" />
                      <input type="text" value={referenceName} onChange={(e) => setReferenceName(e.target.value)} placeholder="ex: Credenciais do Servidor" className="w-full pl-10 py-3 bg-surface border border-border-base rounded-card focus:ring-2 focus:ring-accent focus:border-transparent transition-all text-text-primary" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between p-4 bg-bg-base/30 gap-4 pb-6 px-6">
                <div className="flex flex-col gap-3 w-full sm:w-auto">
                  <div className="flex items-center bg-surface border border-border-base rounded-card px-3 py-2">
                    <Timer size={20} className="text-text-secondary mr-2" />
                    <select value={expiration} onChange={(e) => setExpiration(e.target.value)} className="bg-transparent border-none focus:ring-0 text-sm font-medium p-0 pr-8 text-text-primary cursor-pointer">
                      <option>Expiração em 1 hora</option>
                      <option>Expiração em 24 horas</option>
                      <option>Expiração em 7 dias</option>
                      <option>Acesso único (Destruição imediata)</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-8 px-1">
                    <label className="flex items-center gap-3 cursor-pointer group/item">
                      <input type="checkbox" checked={limitViews} onChange={(e) => setLimitViews(e.target.checked)} className="rounded text-accent focus:ring-accent dark:bg-bg-base dark:border-border-base" />
                      <span className="text-sm text-text-secondary group-hover/item:text-accent transition-colors">Limitar total de visualizações</span>
                    </label>
                    <input type="number" value={maxViews} onChange={(e) => setMaxViews(parseInt(e.target.value))} placeholder="1" className="w-16 bg-surface border border-border-base rounded-md px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-accent text-text-primary" />
                  </div>
                </div>
                <button 
                  onClick={handleCreateSecret} 
                  disabled={isCreating}
                  className={`w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3 bg-accent text-white font-bold rounded-lg transition-all shadow-lg shadow-accent/30 ${isCreating ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90 active:scale-95'}`}
                >
                  {isCreating ? (
                    <div className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <LinkIcon size={18} />
                  )}
                  <span>{isCreating ? 'Gerando...' : 'Gerar Comunicação Segura'}</span>
                </button>
              </div>
            </div>
          </div>

          <div className="border border-border-base rounded-panel overflow-hidden bg-surface/50">
            <details className="group">
              <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-bg-base/50 transition-colors list-none">
                <div className="flex items-center gap-3">
                  <Settings size={20} className="text-accent" />
                  <span className="text-sm font-bold text-text-primary">Configurações Avançadas de Segurança</span>
                </div>
                <Plus size={20} className="transition-transform duration-300 group-open:rotate-45 text-text-secondary" />
              </summary>
              <div className="p-6 border-t border-border-base bg-bg-base/80 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <p className="text-xs font-bold text-text-secondary uppercase tracking-widest">Controle de Acesso</p>
                    <div className="flex flex-col gap-3">
                      <label className="flex items-center gap-3 cursor-pointer group/item">
                        <input type="checkbox" className="rounded text-accent focus:ring-accent dark:bg-bg-base dark:border-border-base" />
                        <span className="text-sm text-text-secondary group-hover/item:text-accent transition-colors">Restrição por endereço IP</span>
                      </label>
                      <label className="flex items-center gap-3 cursor-pointer group/item">
                        <input type="checkbox" className="rounded text-accent focus:ring-accent dark:bg-bg-base dark:border-border-base" />
                        <span className="text-sm text-text-secondary group-hover/item:text-accent transition-colors">Exigir verificação por e-mail</span>
                      </label>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <p className="text-xs font-bold text-text-secondary uppercase tracking-widest">Uso e Limites</p>
                    <div className="flex flex-col gap-3">
                      <label className="flex items-center gap-3 cursor-pointer group/item">
                        <input type="checkbox" className="rounded text-accent focus:ring-accent dark:bg-bg-base dark:border-border-base" />
                        <span className="text-sm text-text-secondary group-hover/item:text-accent transition-colors">Notificação por e-mail ao acessar</span>
                      </label>
                    </div>
                  </div>
                </div>
                <div className="pt-4 border-t border-border-base">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-text-secondary">
                    <div className="flex items-center gap-2">
                      <Info size={14} className="text-accent" />
                      <span>Os dados serão excluídos permanentemente após a expiração do link.</span>
                    </div>
                    <button className="text-accent hover:underline font-medium">Leia a Política de Privacidade</button>
                  </div>
                </div>
              </div>
            </details>
          </div>
        </div>
      </div>
    </div>

    <footer className="pt-10 border-t border-border-base flex flex-col items-center gap-6">
      <div className="text-sm text-text-secondary text-center">
        © 2024 Bold Share. Excelência em segurança e privacidade de dados.
      </div>
      <div className="flex flex-wrap justify-center items-center gap-4">
        <div className="flex items-center gap-1 text-xs text-text-secondary bg-surface px-3 py-1 rounded-full border border-border-base">
          <Check size={12} className="text-success-base" />
          Proteção de Dados Enterprise
        </div>
        <div className="flex items-center gap-1 text-xs text-text-secondary bg-surface px-3 py-1 rounded-full border border-border-base">
          <Globe size={12} className="text-accent" />
          Conformidade com Padrões de Privacidade
        </div>
      </div>
    </footer>
  </motion.div>
);
