import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Settings, Upload, Plus, X, Lock, Dices, Timer, Link as LinkIcon, Info, Check, Code, ShieldCheck, Eye, EyeOff, Globe, FileText } from 'lucide-react';
import { Screen } from '../../types';

interface SecretCreatorProps { 
  user: any;
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
  isCreating?: boolean;
  restrictIp: boolean;
  setRestrictIp: (v: boolean) => void;
  requireEmail: boolean;
  setRequireEmail: (v: boolean) => void;
  allowedEmails: string[];
  setAllowedEmails: (v: string[]) => void;
  allowedDomain: string;
  setAllowedDomain: (v: string) => void;
  notifyAccess: boolean;
  setNotifyAccess: (v: boolean) => void;
  selectedFile: File | null;
  setSelectedFile: (f: File | null) => void;
  redirectUrl: string;
  setRedirectUrl: (r: string) => void;
  setScreen?: (s: Screen) => void;
}

export const SecretCreator = ({
  user,
  secretText, setSecretText,
  keyValuePairs, addPair, removePair, updatePair,
  handleFormat, expiration, setExpiration,
  limitViews, setLimitViews, maxViews, setMaxViews,
  password, setPassword, referenceName, setReferenceName,
  handleCreateSecret,
  isCreating = false,
  restrictIp, setRestrictIp,
  requireEmail, setRequireEmail,
  allowedEmails, setAllowedEmails,
  allowedDomain, setAllowedDomain,
  notifyAccess, setNotifyAccess,
  selectedFile, setSelectedFile,
  redirectUrl, setRedirectUrl,
  setScreen
}: SecretCreatorProps) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const addEmail = () => {
    if (!emailInput || !emailInput.includes('@')) return;
    if (!allowedEmails.includes(emailInput.trim().toLowerCase())) {
      setAllowedEmails([...allowedEmails, emailInput.trim().toLowerCase()]);
    }
    setEmailInput('');
  };

  const removeEmail = (email: string) => {
    setAllowedEmails(allowedEmails.filter(e => e !== email));
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto space-y-6 pb-20"
    >
      <div className="flex flex-col gap-8 items-center">
        <div className="w-full max-w-3xl space-y-6">
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-accent rounded-2xl blur opacity-10 group-focus-within:opacity-25 transition duration-500"></div>
            <div className="relative flex flex-col bg-surface border border-border-base rounded-[2rem] overflow-hidden shadow-2xl">
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

              <div className="relative">
                <div className="flex items-center justify-between px-8 py-3 bg-bg-base/20 border-b border-border-base">
                  <span className="text-[10px] font-black text-text-secondary uppercase tracking-widest">Conteúdo da Comunicação</span>
                  <div className="flex items-center gap-1">
                    <button type="button" onClick={() => handleFormat('bold')} className="p-2 hover:bg-accent/10 hover:text-accent rounded-lg transition-colors text-text-secondary" title="Negrito">
                      <span className="font-bold">B</span>
                    </button>
                    <button type="button" onClick={() => handleFormat('italic')} className="p-2 hover:bg-accent/10 hover:text-accent rounded-lg transition-colors text-text-secondary" title="Itálico">
                      <span className="italic font-serif text-lg">I</span>
                    </button>
                    <div className="w-px h-4 bg-border-base mx-1"></div>
                    <button type="button" onClick={() => handleFormat('code')} className="p-2 hover:bg-accent/10 hover:text-accent rounded-lg transition-colors text-text-secondary" title="Código">
                      <Code size={16} />
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

              <div className="px-8 py-6 border-t border-border-base bg-bg-base/10 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-text-secondary uppercase tracking-widest">Dados Estruturados (Opcional)</span>
                  <button 
                    type="button"
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

              <div className="px-8 py-8 border-t border-border-base space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest ml-1">{requireEmail ? 'Segunda Camada (Senha)' : 'Senha Obrigatória'}</label>
                    <div className="relative flex items-center">
                      <Lock size={20} className="absolute left-4 text-text-secondary" />
                      <input 
                        type={showPassword ? "text" : "password"} 
                        value={password} 
                        onChange={(e) => setPassword(e.target.value)} 
                        placeholder={requireEmail ? "Opcional (Token ativo)" : "Crie uma senha forte"} 
                        className={`w-full pl-12 pr-28 py-4 bg-bg-base/40 border transition-all text-text-primary font-bold rounded-[1.25rem] focus:ring-2 focus:ring-accent border-border-base`} 
                      />
                      <div className="absolute right-3 flex items-center gap-1">
                        <button 
                          onClick={() => setShowPassword(!showPassword)} 
                          className="p-2 bg-surface border border-border-base rounded-xl text-text-secondary hover:text-accent transition-all"
                        >
                          {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                        <button onClick={() => setPassword(Math.random().toString(36).slice(-8))} className="p-2 bg-surface border border-border-base rounded-xl text-text-secondary hover:text-accent transition-all shadow-sm">
                          <Dices size={20} />
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest ml-1">Nome de Referência (Opcional)</label>
                    <div className="relative flex items-center">
                      <FileText size={20} className="absolute left-4 text-text-secondary" />
                      <input type="text" value={referenceName} onChange={(e) => setReferenceName(e.target.value)} placeholder="ex: Credenciais do Servidor" className="w-full pl-12 py-4 bg-bg-base/40 border border-border-base rounded-[1.25rem] focus:ring-2 focus:ring-accent transition-all text-text-primary font-bold" />
                    </div>
                  </div>
                </div>

                <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-4">
                  <div className="flex flex-col gap-4 w-full md:w-auto">
                    <div className="flex items-center bg-bg-base/60 border border-border-base rounded-2xl px-4 py-3 shadow-sm">
                      <Timer size={24} className="text-text-secondary mr-3" />
                      <select 
                        value={expiration} 
                        onChange={(e) => setExpiration(e.target.value)} 
                        className="bg-transparent border-none focus:ring-0 text-sm font-black p-0 pr-10 text-text-primary cursor-pointer appearance-none"
                      >
                        <option>Expiração em 1 hora</option>
                        <option>Expiração em 24 horas</option>
                        <option>Expiração em 7 dias</option>
                        <option>Acesso único (Destruição imediata)</option>
                      </select>
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
                    <span>{isCreating ? 'Gerando...' : 'Gerar Compartilhamento Seguro'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {!showAdvanced && (
          <button 
            onClick={() => setShowAdvanced(true)}
            className="flex items-center gap-2 px-6 py-3 bg-surface border border-border-base text-[10px] font-black text-text-secondary hover:text-accent rounded-2xl transition-all uppercase tracking-[0.2em] mx-auto"
          >
            <Settings size={14} />
            Segurança Avançada
          </button>
        )}

        <AnimatePresence>
          {showAdvanced && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-surface border border-border-base rounded-[2rem] shadow-xl overflow-hidden"
            >
              <div className="flex items-center justify-between p-6 bg-bg-base/30 border-b border-border-base">
                <h3 className="text-sm font-black text-text-primary uppercase tracking-widest">Segurança Avançada</h3>
                <button onClick={() => setShowAdvanced(false)}><X size={20} /></button>
              </div>
              
              <div className="p-8 space-y-8 text-left">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest opacity-60">Controle de IP e Domínio</p>
                    <div className="space-y-4">
                      <label className="flex items-center gap-4 cursor-pointer group">
                        <div className="relative">
                          <input 
                            type="checkbox" 
                            checked={restrictIp} 
                            onChange={(e) => setRestrictIp(e.target.checked)} 
                            className="peer size-6 rounded-lg border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 appearance-none checked:bg-accent checked:border-accent transition-all cursor-pointer hover:border-border-base" 
                          />
                          <Check size={16} className="absolute top-1 left-1 text-white opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" strokeWidth={4} />
                        </div>
                        <span className="text-sm font-bold text-text-secondary group-hover:text-text-primary transition-colors">Restringir ao meu IP atual</span>
                      </label>
                      
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest block ml-1">Restringir por Domínio (ex: empresa.com)</label>
                        <div className="relative flex items-center">
                          <Globe size={18} className="absolute left-4 text-text-secondary" />
                          <input 
                            type="text" 
                            value={allowedDomain} 
                            onChange={(e) => setAllowedDomain(e.target.value)} 
                            placeholder="ex: boldsolution.com.br" 
                            className="w-full pl-12 py-3 bg-bg-base/40 border border-border-base rounded-2xl text-sm text-text-primary font-bold focus:ring-2 focus:ring-accent outline-none" 
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest opacity-60">Segurança de Acesso e Alertas</p>
                    <div className="space-y-4">
                      <label className="flex items-center gap-4 cursor-pointer group">
                        <div className="relative">
                          <input 
                            type="checkbox" 
                            checked={requireEmail} 
                            onChange={(e) => setRequireEmail(e.target.checked)} 
                            className="peer size-6 rounded-lg border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 appearance-none checked:bg-accent checked:border-accent transition-all cursor-pointer hover:border-border-base" 
                          />
                          <Check size={16} className="absolute top-1 left-1 text-white opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" strokeWidth={4} />
                        </div>
                        <span className="text-sm font-bold text-text-secondary group-hover:text-text-primary transition-colors">Exigir validação por e-mail (Token)</span>
                      </label>

                      <label className="flex items-center gap-4 cursor-pointer group">
                        <div className="relative">
                          <input 
                            type="checkbox" 
                            checked={notifyAccess} 
                            onChange={(e) => setNotifyAccess(e.target.checked)} 
                            className="peer size-6 rounded-lg border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 appearance-none checked:bg-accent checked:border-accent transition-all cursor-pointer hover:border-border-base" 
                          />
                          <Check size={16} className="absolute top-1 left-1 text-white opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" strokeWidth={4} />
                        </div>
                        <span className="text-sm font-bold text-text-secondary group-hover:text-text-primary transition-colors">Notificar acesso via e-mail</span>
                      </label>
                    </div>
                  </div>
                </div>

                {requireEmail && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-8 bg-accent/5 border-2 border-accent/10 rounded-[2rem] space-y-6"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="size-2 bg-accent rounded-full animate-pulse"></div>
                        <p className="text-[10px] font-black text-accent uppercase tracking-widest">Proteção Ativa: Lista Branca de E-mails (Opcional)</p>
                      </div>
                      <div className="flex gap-2">
                        <input 
                          type="email" 
                          value={emailInput} 
                          onChange={(e) => setEmailInput(e.target.value)} 
                          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addEmail())}
                          placeholder="Digite um e-mail e pressione Enter" 
                          className="flex-1 px-5 py-4 bg-surface border border-border-base rounded-2xl text-sm text-text-primary font-bold focus:ring-2 focus:ring-accent outline-none shadow-sm" 
                        />
                        <button 
                          onClick={addEmail}
                          className="px-8 bg-accent text-white font-black truncate rounded-2xl text-[10px] uppercase tracking-tighter shadow-lg shadow-accent/20 hover:scale-105 active:scale-95 transition-all"
                        >
                          Adicionar
                        </button>
                      </div>
                    </div>
                    {allowedEmails.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-2">
                        {allowedEmails.map((email) => (
                          <div key={email} className="px-4 py-2 bg-white border border-border-base text-text-primary text-[10px] font-black rounded-xl flex items-center gap-3 shadow-sm group">
                            {email}
                            <button onClick={() => removeEmail(email)} className="text-text-secondary hover:text-red-500 transition-colors"><X size={14} /></button>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="p-4 bg-white/50 border border-border-base rounded-xl">
                      <p className="text-[11px] text-text-secondary font-medium leading-relaxed italic">
                        <span className="font-bold text-text-primary not-italic">Como funciona:</span> Se a lista estiver vazia, qualquer pessoa com um e-mail válido poderá solicitar o token de acesso. Se preencher a lista, <span className="text-accent font-bold">apenas os e-mails autorizados</span> acima conseguirão abrir o link.
                      </p>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};
