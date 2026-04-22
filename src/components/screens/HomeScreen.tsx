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
  restrictIp: boolean;
  setRestrictIp: (v: boolean) => void;
  requireEmail: boolean;
  setRequireEmail: (v: boolean) => void;
  notifyAccess: boolean;
  setNotifyAccess: (v: boolean) => void;
  selectedFile: File | null;
  setSelectedFile: (f: File | null) => void;
}

export const HomeScreen = ({
  secretText, setSecretText,
  keyValuePairs, addPair, removePair, updatePair,
  handleFormat, expiration, setExpiration,
  limitViews, setLimitViews, maxViews, setMaxViews,
  password, setPassword, referenceName, setReferenceName,
  handleCreateSecret, setScreen,
  isCreating = false,
  restrictIp, setRestrictIp,
  requireEmail, setRequireEmail,
  notifyAccess, setNotifyAccess,
  selectedFile, setSelectedFile
}: HomeScreenProps) => (
  <motion.div 
    key="home"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    className="max-w-4xl mx-auto px-4 py-8 md:py-12 space-y-6"
  >
    <div className="flex flex-col gap-8 items-center">
      <div className="w-full max-w-3xl space-y-6">
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-accent rounded-2xl blur opacity-10 group-focus-within:opacity-25 transition duration-500"></div>
          <div className="relative flex flex-col bg-surface border border-border-base rounded-[2rem] overflow-hidden shadow-2xl">
            {/* INÍCIO: Upload de Arquivo no topo */}
            <div className="px-8 py-8 border-b border-border-base bg-bg-base/30">
              <label className="flex flex-col items-center justify-center w-full min-h-[140px] border-2 border-dashed border-border-base rounded-3xl cursor-pointer hover:bg-bg-base/50 transition-all group/upload bg-surface/50">
                <div className="flex flex-col items-center justify-center py-4">
                  <div className="p-4 bg-accent/10 text-accent rounded-2xl mb-3 group-hover/upload:scale-110 transition-transform">
                    <Upload size={32} />
                  </div>
                  {selectedFile ? (
                    <div className="text-center">
                      <p className="text-sm font-bold text-text-primary mb-1">{selectedFile.name}</p>
                      <button 
                        onClick={(e) => { e.preventDefault(); setSelectedFile(null); }}
                        className="text-[10px] uppercase font-black text-red-500 hover:underline"
                      >
                        Remover Arquivo
                      </button>
                    </div>
                  ) : (
                    <>
                      <p className="text-sm text-text-secondary"><span className="font-black text-accent uppercase tracking-tighter">Clique para enviar</span> ou arraste e solte</p>
                      <p className="text-[10px] text-text-secondary mt-1 font-medium italic opacity-70">Tamanho máx. 50MB (Criptografado ponta-a-ponta)</p>
                    </>
                  )}
                </div>
                <input type="file" className="hidden" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} />
              </label>
            </div>

            {/* Texto do Segredo */}
            <div className="relative">
              <div className="flex items-center justify-between px-8 py-3 bg-bg-base/20 border-b border-border-base">
                <span className="text-[10px] font-black text-text-secondary uppercase tracking-widest">Conteúdo da Comunicação</span>
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
                className="w-full min-h-[160px] p-8 text-lg bg-transparent border-none focus:ring-0 text-text-primary placeholder:text-text-secondary/30 resize-none font-medium"
                placeholder="Escreva ou cole aqui as informações que deseja proteger..."
              ></textarea>
            </div>

            {/* Dados Estruturados */}
            <div className="px-8 py-6 border-t border-border-base bg-bg-base/10 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-text-secondary uppercase tracking-widest">Dados Estruturados (Opcional)</span>
                <button 
                  type="button"
                  id="add-pair-action-button"
                  onClick={(e) => { e.preventDefault(); addPair(); }} 
                  className="flex items-center gap-2 px-6 py-2.5 bg-accent text-white hover:bg-accent/90 text-[10px] font-black rounded-full transition-all shadow-lg shadow-accent/20 uppercase tracking-tighter"
                >
                  <Plus size={16} strokeWidth={4} />
                  <span>Novo Par de Dados</span>
                </button>
              </div>
              {keyValuePairs.length > 0 && (
                <div className="grid grid-cols-1 gap-3">
                  {keyValuePairs.map((pair) => (
                    <div key={pair.id} className="flex items-center gap-3">
                      <div className="flex-1 grid grid-cols-2 gap-3">
                        <input 
                          type="text" 
                          value={pair.key} 
                          onChange={(e) => updatePair(pair.id, 'key', e.target.value)} 
                          placeholder="Chave (ex: Senha)" 
                          className="bg-surface border border-border-base rounded-2xl px-5 py-3 text-sm focus:ring-2 focus:ring-accent outline-none text-text-primary font-bold shadow-sm" 
                        />
                        <input 
                          type="text" 
                          value={pair.value} 
                          onChange={(e) => updatePair(pair.id, 'value', e.target.value)} 
                          placeholder="Valor" 
                          className="bg-surface border border-border-base rounded-2xl px-5 py-3 text-sm focus:ring-2 focus:ring-accent outline-none text-text-primary font-bold shadow-sm" 
                        />
                      </div>
                      <button 
                        type="button"
                        onClick={(e) => { e.preventDefault(); removePair(pair.id); }} 
                        className="text-text-secondary hover:text-red-500 transition-colors p-2 bg-bg-base rounded-xl"
                      >
                        <X size={20} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Senha e Referência */}
            <div className="px-8 py-8 border-t border-border-base space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest ml-1">Senha Obrigatória <span className="text-red-500">*</span></label>
                  <div className="relative flex items-center">
                    <Lock size={20} className="absolute left-4 text-text-secondary" />
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Proteja seu link (obrigatório)" className="w-full pl-12 pr-14 py-4 bg-bg-base/40 border border-border-base rounded-[1.25rem] focus:ring-2 focus:ring-accent focus:border-transparent transition-all text-text-primary font-bold" />
                    <button onClick={() => setPassword(Math.random().toString(36).slice(-8))} className="absolute right-3 p-2 bg-surface border border-border-base rounded-xl text-text-secondary hover:text-accent transition-all shadow-sm" title="Gerar Senha">
                      <Dices size={20} />
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest ml-1">Nome de Referência (Opcional)</label>
                  <div className="relative flex items-center">
                    <FileText size={20} className="absolute left-4 text-text-secondary" />
                    <input type="text" value={referenceName} onChange={(e) => setReferenceName(e.target.value)} placeholder="ex: Credenciais do Servidor" className="w-full pl-12 py-4 bg-bg-base/40 border border-border-base rounded-[1.25rem] focus:ring-2 focus:ring-accent focus:border-transparent transition-all text-text-primary font-bold" />
                  </div>
                </div>
              </div>

              {/* Expiração e Botão Gerar */}
              <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-4">
                <div className="flex flex-col gap-4 w-full md:w-auto">
                  <div className="flex items-center bg-bg-base/60 border border-border-base rounded-2xl px-4 py-3 shadow-sm">
                    <Timer size={24} className="text-text-secondary mr-3" />
                    <select value={expiration} onChange={(e) => setExpiration(e.target.value)} className="bg-transparent border-none focus:ring-0 text-sm font-black p-0 pr-10 text-text-primary cursor-pointer appearance-none">
                      <option>Expiração em 1 hora</option>
                      <option>Expiração em 24 horas</option>
                      <option>Expiração em 7 dias</option>
                      <option>Acesso único (Destruição imediata)</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-6 px-1">
                    <label className="flex items-center gap-3 cursor-pointer group/item">
                      <div className={`size-5 rounded-md border-2 flex items-center justify-center transition-all ${limitViews ? 'bg-accent border-accent' : 'border-border-base'}`}>
                        {limitViews && <Check size={12} className="text-white" strokeWidth={4} />}
                        <input type="checkbox" checked={limitViews} onChange={(e) => setLimitViews(e.target.checked)} className="hidden" />
                      </div>
                      <span className="text-xs font-bold text-text-secondary uppercase tracking-tight">Limitar total de visualizações</span>
                    </label>
                    <input type="number" value={maxViews} onChange={(e) => setMaxViews(parseInt(e.target.value))} className="w-20 bg-bg-base border border-border-base rounded-xl px-4 py-2 text-sm font-black outline-none focus:ring-2 focus:ring-accent text-text-primary text-center" />
                  </div>
                </div>
                <button 
                  onClick={handleCreateSecret} 
                  disabled={isCreating}
                  className={`w-full md:w-auto flex items-center justify-center gap-3 px-8 py-3.5 bg-accent text-white font-black rounded-2xl transition-all shadow-xl shadow-accent/30 text-sm uppercase tracking-wider ${isCreating ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.02] active:scale-95'}`}
                >
                  {isCreating ? (
                    <div className="size-5 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <LinkIcon size={20} strokeWidth={3} />
                  )}
                  <span>{isCreating ? 'Gerando...' : 'Gerar Comunicação Segura'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Configurações Avançadas como um Card Distinto */}
        <div className="bg-surface border border-border-base rounded-[2rem] shadow-xl overflow-hidden group/advanced">
          <div className="flex items-center justify-between p-6 bg-bg-base/30 border-b border-border-base">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-accent/10 text-accent rounded-xl">
                <Settings size={22} />
              </div>
              <h3 className="text-sm font-black text-text-primary uppercase tracking-widest">Configurações Avançadas de Segurança</h3>
            </div>
            <button className="text-text-secondary hover:text-accent transition-colors">
              <X size={20} />
            </button>
          </div>
          
          <div className="p-8 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <p className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] opacity-60">Controle de Acesso</p>
                <div className="space-y-4">
                  <label className="flex items-center gap-4 cursor-pointer group/opt">
                    <div className={`size-6 rounded-lg border-2 flex items-center justify-center transition-all ${restrictIp ? 'bg-accent border-accent' : 'border-border-base bg-bg-base'}`}>
                      {restrictIp && <Check size={14} className="text-white" strokeWidth={4} />}
                      <input type="checkbox" checked={restrictIp} onChange={(e) => setRestrictIp(e.target.checked)} className="hidden" />
                    </div>
                    <span className="text-sm font-bold text-text-secondary group-hover/opt:text-text-primary transition-colors">Restrição por endereço IP</span>
                  </label>
                  <label className="flex items-center gap-4 cursor-pointer group/opt">
                    <div className={`size-6 rounded-lg border-2 flex items-center justify-center transition-all ${requireEmail ? 'bg-accent border-accent' : 'border-border-base bg-bg-base'}`}>
                      {requireEmail && <Check size={14} className="text-white" strokeWidth={4} />}
                      <input type="checkbox" checked={requireEmail} onChange={(e) => setRequireEmail(e.target.checked)} className="hidden" />
                    </div>
                    <span className="text-sm font-bold text-text-secondary group-hover/opt:text-text-primary transition-colors">Exigir verificação por e-mail</span>
                  </label>
                </div>
              </div>
              <div className="space-y-4">
                <p className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] opacity-60">Uso e Limites</p>
                <div className="space-y-4">
                  <label className="flex items-center gap-4 cursor-pointer group/opt">
                    <div className={`size-6 rounded-lg border-2 flex items-center justify-center transition-all ${notifyAccess ? 'bg-accent border-accent' : 'border-border-base bg-bg-base'}`}>
                      {notifyAccess && <Check size={14} className="text-white" strokeWidth={4} />}
                      <input type="checkbox" checked={notifyAccess} onChange={(e) => setNotifyAccess(e.target.checked)} className="hidden" />
                    </div>
                    <span className="text-sm font-bold text-text-secondary group-hover/opt:text-text-primary transition-colors">Notificação por e-mail ao acessar</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-border-base flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3 text-xs font-medium text-text-secondary bg-bg-base px-4 py-2 rounded-full border border-border-base">
                <Info size={16} className="text-accent" />
                <span>Dados criptografados em repouso e em trânsito.</span>
              </div>
              <button className="text-accent hover:underline text-xs font-black uppercase tracking-widest">Política de Segurança</button>
            </div>
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
