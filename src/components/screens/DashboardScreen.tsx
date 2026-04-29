import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link as LinkIcon, Eye, Copy, Check, Timer, ChevronLeft, ChevronRight, Mail, Trash2, Clock, Upload, ShieldCheck, Fingerprint, Info } from 'lucide-react';
import { SharedLink, DataRequest, Screen } from '../../types';
import { supabase } from '../../lib/supabase';
import { FileText, X } from 'lucide-react';

import { useNotification } from '../shared/NotificationProvider';

interface DashboardScreenProps {
  key?: string;
  userEmail: string;
  links: SharedLink[];
  requests: DataRequest[];
  forms: any[];
  dashboardTab: 'links' | 'requests' | 'forms' | 'security';
  setDashboardTab: (t: 'links' | 'requests' | 'forms' | 'security') => void;
  fetchLinks: () => void;
  fetchRequests: () => void;
  fetchForms: () => void;
  copied: boolean;
  setCopied: (c: boolean) => void;
  setScreen: (s: Screen) => void;
  handleCopy: (text: string) => void;
}

export const DashboardScreen = ({
  userEmail,
  links, requests, forms, dashboardTab, setDashboardTab,
  fetchLinks, fetchRequests, fetchForms, copied, setCopied, setScreen, handleCopy
}: DashboardScreenProps) => {
  const { showNotification } = useNotification();
  const [revealedRequests, setRevealedRequests] = React.useState<Set<string>>(new Set());
  const [requestToBurn, setRequestToBurn] = React.useState<string | null>(null);
  const [incineratedIds, setIncineratedIds] = React.useState<Set<string>>(new Set());
  const [tempMemory, setTempMemory] = React.useState<Record<string, string>>({});
  const [selectedLinkDetails, setSelectedLinkDetails] = React.useState<SharedLink | null>(null);

  const confirmRevealAndBurn = async () => {
    if (!requestToBurn) return;
    const id = requestToBurn;
    const req = requests.find(r => r.id === id);
    
    if (!req) {
      showNotification('Erro: Solicitação não encontrada.', 'error');
      setRequestToBurn(null);
      return;
    }
    
    try {
      // 1. Salva o conteúdo na memória volátil do componente ANTES de apagar
      const content = req.response || '';
      if (!content && req.status === 'completed') {
        throw new Error('O conteúdo desta mensagem está vazio ou já foi incinerado.');
      }
      
      setTempMemory(prev => ({ ...prev, [id]: content }));

      // 2. Apaga do banco imediatamente - Garantindo que a queima ocorra no servidor
      // Usamos 'completed' porque o banco não permite o status customizado 'burned' no momento
      const { error } = await supabase.from('requests')
        .update({ status: 'completed', response: '' })
        .eq('id', id);

      if (error) throw new Error(`Falha no servidor: ${error.message}`);

      // 3. Sucesso na queima do servidor -> Liberamos na UI
      setIncineratedIds(prev => new Set(prev).add(id));
      setRevealedRequests(prev => new Set(prev).add(id));
      showNotification('Privacidade Garantida: Dados incinerados do servidor.', 'success');
      
      // 4. Atualiza a lista global em background
      fetchRequests();
    } catch (err: any) {
      console.error('Erro crítico na incineração:', err);
      showNotification(err.message || 'Erro ao processar segurança.', 'error');
    } finally {
      setRequestToBurn(null);
    }
  };

  const handleRevealRequest = async (id: string) => {
    const request = requests.find(r => r.id === id);
    const isOneTime = request?.response?.startsWith('[ONE_TIME]');

    if (isOneTime) {
      setRequestToBurn(id);
      return;
    }

    setRevealedRequests(prev => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  };

  const getResponsesCount = (form: any) => {
    return form.form_responses?.length || 0;
  };

  const getLatestResponseDate = (form: any) => {
    if (!form.form_responses || form.form_responses.length === 0) return 'Nenhuma resposta';
    const dates = form.form_responses.map((r: any) => new Date(r.created_at).getTime());
    const latest = new Date(Math.max(...dates));
    return latest.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const renderValue = (val: any) => {
    let value = val;
    
    // Suporte para Acesso Único (Incineração)
    if (typeof value === 'string' && value.startsWith('[ONE_TIME]')) {
      value = value.replace('[ONE_TIME]', '');
    }

    // Tenta fazer o parse se for uma string que parece JSON
    if (typeof value === 'string' && (value.startsWith('[') || value.startsWith('{'))) {
      try {
        const parsed = JSON.parse(value);
        if (parsed && typeof parsed === 'object') {
          value = parsed;
        }
      } catch (e) {}
    }

    if (Array.isArray(value)) {
      return (
        <div className="flex flex-wrap gap-1">
          {value.map((v, i) => (
            <span key={i} className="px-2 py-0.5 bg-bg-base border border-border-base rounded text-[10px] font-bold">
              {String(v)}
            </span>
          ))}
        </div>
      );
    }

    if (typeof value === 'object' && value !== null) {
      return (
        <div className="space-y-1">
          {Object.entries(value).map(([k, v]) => (
            <div key={k} className="flex justify-between gap-1 border-b border-border-base/30 pb-1 last:border-0">
              <span className="text-[10px] text-text-secondary uppercase">{k}:</span>
              <span className="text-xs">{String(v)}</span>
            </div>
          ))}
        </div>
      );
    }

    const strValue = String(value);

    // Detecção de link de arquivo
    if (strValue.startsWith('http')) {
      return (
        <a href={strValue} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline flex items-center gap-1">
          <Upload size={12} />
          Ver arquivo
        </a>
      );
    }

    // Detecção de imagem ou assinatura base64
    if (strValue.startsWith('data:image') || strValue.includes('public/submissions')) {
      return (
        <img src={strValue} alt="Anexo" className="max-h-24 w-auto border border-border-base rounded-lg shadow-sm" />
      );
    }

    return strValue;
  };

  const deleteLink = async (id: string) => {
    // Para simplificar a experiência do usuário e remover o diálogo do navegador,
    // vamos excluir diretamente com uma notificação de feedback.
    
    const { error } = await supabase.from('secrets').delete().eq('id', id);
    if (error) {
      showNotification('Erro ao excluir: ' + error.message, 'error');
    } else {
      showNotification('Link e segredo excluídos permanentemente.', 'success');
      fetchLinks();
    }
  };

  const deleteRequest = async (id: string) => {
    const { error } = await supabase.from('requests').delete().eq('id', id);
    if (error) {
      showNotification('Erro ao excluir: ' + error.message, 'error');
    } else {
      showNotification('Solicitação removida com sucesso.', 'success');
      fetchRequests();
    }
  };

  const deleteForm = async (id: string) => {
    const { error } = await supabase.from('forms').delete().eq('id', id);
    if (error) {
      showNotification('Erro ao excluir: ' + error.message, 'error');
    } else {
      showNotification('Formulário excluído com sucesso.', 'success');
      fetchForms();
    }
  };

  const [selectedFormResponses, setSelectedFormResponses] = React.useState<any[] | null>(null);
  const [isViewingResponses, setIsViewingResponses] = React.useState(false);

  const fetchResponses = async (formId: string) => {
    const { data, error } = await supabase
      .from('form_responses')
      .select('*')
      .eq('form_id', formId)
      .order('created_at', { ascending: false });
    
    if (!error && data) {
      setSelectedFormResponses(data);
      setIsViewingResponses(true);
    }
  };

  const isExpired = (expiresAt?: string) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  return (
    <motion.div 
      key="dashboard"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex-1 overflow-y-auto p-6 md:p-8 bg-bg-base"
    >
      <div className="max-w-5xl mx-auto space-y-8">
        {/* User Profile Header */}
        <div className="flex items-center justify-between pb-4 border-b border-border-base/50">
          <div className="flex items-center gap-3">
            <div className="size-12 rounded-2xl bg-accent/10 flex items-center justify-center text-accent">
              <Mail size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest">Sessão Ativa</p>
              <h2 className="text-lg font-bold text-text-primary">{userEmail}</h2>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 bg-success-base/10 text-success-base rounded-full">
            <div className="size-2 bg-success-base rounded-full animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-wider">Conectado</span>
          </div>
        </div>

        {/* Header Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-surface p-6 rounded-panel border border-border-base shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold text-text-secondary uppercase tracking-wider">Meus Links</span>
              <div className="size-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
                <LinkIcon size={20} />
              </div>
            </div>
            <div className="text-4xl font-black text-text-primary">{links.length}</div>
            <p className="text-xs text-text-secondary mt-2">Segredos compartilhados</p>
          </div>
          <div className="bg-surface p-6 rounded-panel border border-border-base shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold text-text-secondary uppercase tracking-wider">Solicitações</span>
              <div className="size-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
                <Mail size={20} />
              </div>
            </div>
            <div className="text-4xl font-black text-text-primary">{requests.length}</div>
            <p className="text-xs text-text-secondary mt-2">Pedidos de informações</p>
          </div>
          <div className="bg-surface p-6 rounded-panel border border-border-base shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold text-text-secondary uppercase tracking-wider">Formulários</span>
              <div className="size-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
                <FileText size={20} />
              </div>
            </div>
            <div className="text-4xl font-black text-text-primary">{forms.length}</div>
            <p className="text-xs text-text-secondary mt-2">Formulários ativos</p>
          </div>
        </div>

        {/* Main Table/List Section */}
        <div className="bg-surface rounded-panel border border-border-base overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-border-base flex items-center justify-between bg-bg-base/50">
            <div className="flex bg-bg-base p-1 rounded-xl">
              <button 
                onClick={() => setDashboardTab('links')}
                className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${dashboardTab === 'links' ? 'bg-surface shadow-sm text-accent' : 'text-text-secondary hover:text-text-primary'}`}
              >
                Meus Links
              </button>
              <button 
                onClick={() => setDashboardTab('requests')}
                className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${dashboardTab === 'requests' ? 'bg-surface shadow-sm text-accent' : 'text-text-secondary hover:text-text-primary'}`}
              >
                Solicitações
              </button>
              <button 
                onClick={() => setDashboardTab('forms')}
                className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${dashboardTab === 'forms' ? 'bg-surface shadow-sm text-accent' : 'text-text-secondary hover:text-text-primary'}`}
              >
                Formulários
              </button>
              <button 
                onClick={() => setDashboardTab('security')}
                className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${dashboardTab === 'security' ? 'bg-surface shadow-sm text-accent' : 'text-text-secondary hover:text-text-primary'}`}
              >
                Segurança
              </button>
            </div>
          </div>

          <div className="p-0">
            {dashboardTab === 'links' ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="text-[10px] font-black text-text-secondary uppercase tracking-widest bg-bg-base/30">
                      <th className="px-6 py-4">Arquivo / Link</th>
                      <th className="px-6 py-4">Status / Expiração</th>
                      <th className="px-6 py-4">Último Acesso</th>
                      <th className="px-6 py-4 text-center">Acessos</th>
                      <th className="px-6 py-4 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-base">
                    {links.map((link) => {
                      const expired = isExpired(link.expires_at);
                      const reachedLimit = link.max_views !== null && link.views >= link.max_views;
                      const isIncinerated = link.status === 'completed' || reachedLimit || (!link.content && !link.key_values && !link.file_url);

                      let statusLabel = 'Ativo';
                      if (isIncinerated) {
                        statusLabel = (reachedLimit && link.max_views !== 1) ? 'Limite Atingido' : 'Incinerado';
                      }
                      else if (expired) statusLabel = 'Expirado';
                      else if (link.max_views === 1) statusLabel = 'Acesso Único';
                      
                      return (
                        <tr key={link.id} className={`hover:bg-bg-base/30 transition-colors ${expired || isIncinerated ? 'opacity-60' : ''}`}>
                          <td className="px-6 py-4">
                            <div className="flex flex-col">
                              <div className="flex items-center gap-2">
                                <span className={`text-sm font-bold ${expired ? 'text-text-secondary line-through' : 'text-text-primary'}`}>{link.name}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col gap-1">
                              <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider w-fit ${
                                isIncinerated
                                  ? 'text-amber-600 bg-amber-50'
                                  : expired 
                                    ? 'text-red-600 bg-red-50' 
                                    : statusLabel === 'Acesso Único'
                                      ? 'text-red-600 bg-red-50'
                                      : 'text-success-base bg-success-base/10'
                              }`}>
                                {statusLabel}
                              </span>
                              {link.max_views && !isIncinerated && (
                                <span className="text-[9px] text-text-secondary font-bold uppercase tracking-tighter bg-bg-base px-1.5 py-0.5 rounded border border-border-base w-fit">
                                  {link.views} / {link.max_views} visualizações
                                </span>
                              )}
                              {link.expires_at && !expired && !isIncinerated && (
                                <span className="text-[10px] text-text-secondary flex items-center gap-1">
                                  <Clock size={10} />
                                  Expira em {new Date(link.expires_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })} (Local)
                                </span>
                              )}
                              {link.allowed_email && (
                                <span className="text-[9px] text-accent font-bold truncate max-w-[150px]" title={link.allowed_email}>
                                  {link.allowed_email.includes(',') 
                                    ? `${link.allowed_email.split(',').length} e-mails autorizados`
                                    : `Exclusivo p/: ${link.allowed_email}`}
                                </span>
                              )}
                              {link.allowed_domain && (
                                <span className="text-[9px] text-purple-500 font-bold">
                                  Domínio: @{link.allowed_domain}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {link.views > 0 ? (
                              <button 
                                onClick={() => setSelectedLinkDetails(link)}
                                className="flex items-center gap-2 px-3 py-1.5 bg-accent/5 hover:bg-accent/10 text-accent rounded-lg text-[10px] font-bold transition-all border border-accent/10"
                              >
                                <Eye size={12} />
                                VER REGISTRO
                              </button>
                            ) : (
                              <span className="text-[10px] text-text-secondary italic">Sem acessos</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="text-sm font-bold text-text-primary">{link.views}</span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-3">
                              {!expired && !isIncinerated && (
                                <button 
                                  onClick={() => handleCopy(`${window.location.origin}/?id=${link.id}`)}
                                  className="p-2 text-text-secondary hover:text-accent transition-colors" 
                                  title="Copiar Link"
                                >
                                  <Copy size={16} />
                                </button>
                              )}
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteLink(link.id);
                                }}
                                className="p-2 text-red-400 hover:text-red-600 transition-colors bg-red-50/50 rounded-lg"
                                title="Cancelar e Excluir"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : dashboardTab === 'requests' ? (
              <div className="divide-y divide-border-base">
                {requests.map((req) => {
                  const expired = isExpired(req.expires_at);
                  const isIncinerated = (req.status === 'completed' && req.response === '') || (req.response === '' && req.title !== '' && req.status !== 'active');
                  
                  return (
                    <div key={req.id} className={`p-6 hover:bg-bg-base/30 transition-colors ${expired || isIncinerated ? 'opacity-60' : ''}`}>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className={`size-12 rounded-xl flex items-center justify-center ${expired ? 'bg-bg-base text-text-secondary' : isIncinerated ? 'bg-amber-600/10 text-amber-600' : req.status === 'completed' ? 'bg-success-base/10 text-success-base' : 'bg-accent/10 text-accent'}`}>
                            {expired ? <Clock size={24} /> : isIncinerated ? <Trash2 size={24} /> : req.status === 'completed' ? <Check size={24} /> : <Timer size={24} />}
                          </div>
                          <div>
                            <h5 className={`font-bold ${expired || isIncinerated ? 'text-text-secondary line-through' : 'text-text-primary'}`}>{req.title}</h5>
                            <div className="flex flex-col gap-1">
                              <p className="text-xs text-text-secondary">Criado em {new Date(req.created_at).toLocaleDateString()}</p>
                              {req.response?.startsWith('[ONE_TIME]') && !isIncinerated && (
                                <span className="w-fit px-1.5 py-0.5 bg-red-600 text-[8px] text-white font-black uppercase rounded tracking-tighter">Acesso Único</span>
                              )}
                              {req.expires_at && !expired && !isIncinerated && (
                                <p className="text-[10px] text-accent font-medium">Expira em {new Date(req.expires_at).toLocaleString('pt-BR')} (Local)</p>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            expired 
                              ? 'bg-bg-base text-text-secondary' 
                              : isIncinerated 
                                ? 'bg-amber-600 text-white shadow-lg shadow-amber-500/20' 
                                : req.status === 'completed' && req.response?.startsWith('[ONE_TIME]')
                                  ? 'bg-red-600 text-white shadow-lg shadow-red-500/20'
                                  : req.status === 'completed' 
                                    ? 'bg-success-base text-white' 
                                    : 'bg-blue-600 text-white'
                          }`}>
                            {expired 
                              ? 'Expirado' 
                              : isIncinerated 
                                ? 'Incinerado' 
                                : (req.status === 'completed' && req.response?.startsWith('[ONE_TIME]')) 
                                  ? 'Acesso Único' 
                                  : req.status === 'completed' 
                                    ? 'Respondido' 
                                    : 'Aguardando'}
                          </span>
                          <div className="flex items-center gap-2">
                            {req.status === 'active' && !expired && !isIncinerated && (
                              <button 
                                onClick={() => handleCopy(`${window.location.origin}/?request=${req.id}`)}
                                className="p-2 bg-bg-base rounded-lg text-text-secondary hover:text-accent transition-colors"
                                title="Copiar Link de Solicitação"
                              >
                                <Copy size={16} />
                              </button>
                            )}
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteRequest(req.id);
                              }}
                              className="p-2 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white rounded-lg transition-all"
                              title="Cancelar e Excluir"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                      
                      {req.status === 'completed' && ((req.response && !incineratedIds.has(req.id)) || tempMemory[req.id]) && !expired && (
                        revealedRequests.has(req.id) ? (
                          <div className="mt-4 bg-bg-base p-4 rounded-xl border border-border-base relative group">
                            <p className="text-[10px] font-black text-text-secondary uppercase mb-2">
                              Dados Recebidos: {(tempMemory[req.id] || req.response)?.startsWith('[ONE_TIME]') && <span className="text-red-500 ml-2 animate-pulse">⚠️ INCINERADO DO SERVIDOR</span>}
                            </p>
                            <div className="text-sm font-medium text-text-primary">
                              {renderValue(tempMemory[req.id] || req.response)}
                            </div>
                            <div className="flex items-center gap-2 mt-6 pt-4 border-t border-border-base/50">
                              <button 
                                onClick={() => handleCopy(tempMemory[req.id] || req.response || '')}
                                className="flex-1 py-2.5 bg-bg-base border border-border-base rounded-xl text-xs font-bold text-text-primary hover:text-accent transition-all flex items-center justify-center gap-2"
                              >
                                <Copy size={14} />
                                Copiar Dados
                              </button>
                              <button 
                                onClick={() => {
                                  // Limpa da memória temporária se for um item de acesso único para garantir a incineração completa na sessão
                                  if (tempMemory[req.id]) {
                                    setTempMemory(prev => {
                                      const next = { ...prev };
                                      delete next[req.id];
                                      return next;
                                    });
                                  }
                                  setRevealedRequests(prev => {
                                    const next = new Set(prev);
                                    next.delete(req.id);
                                    return next;
                                  });
                                }}
                                className="flex-1 py-2.5 bg-slate-50 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-100 transition-all flex items-center justify-center gap-2"
                              >
                                <Eye size={14} />
                                Fechar
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button 
                            onClick={() => handleRevealRequest(req.id)}
                            className="mt-4 w-full py-3 bg-accent/5 border border-dashed border-accent/20 rounded-xl flex items-center justify-center gap-2 text-accent font-bold hover:bg-accent/10 transition-all group"
                          >
                            <Eye size={18} className="transition-transform group-hover:scale-110" />
                            Ver Resposta Recebida
                          </button>
                        )
                      )}

                      {req.status === 'completed' && (!req.response || incineratedIds.has(req.id)) && !tempMemory[req.id] && (
                        <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-xl flex items-center gap-3 text-red-600 dark:text-red-400">
                          <Trash2 size={16} />
                          <p className="text-xs font-bold">Esta solicitação de dados foi incinerada permanentemente após a leitura.</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : dashboardTab === 'security' ? (
              <div className="p-8 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div className="size-12 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
                      <ShieldCheck size={24} />
                    </div>
                    <h4 className="text-xl font-bold text-text-primary">Criptografia de Ponta a Ponta (E2EE)</h4>
                    <p className="text-sm text-text-secondary leading-relaxed">
                      Seus segredos agora são protegidos com AES-GCM localmente. Isso significa que o texto é embaralhado no seu navegador antes de ser enviado. 
                      O Bold Share ou o banco de dados (Supabase) nunca recebem sua senha real ou o conteúdo legível.
                    </p>
                    <ul className="space-y-2">
                      <li className="flex items-center gap-2 text-xs text-text-primary">
                        <Check size={14} className="text-success-base" /> Privado: Nem nós podemos ler
                      </li>
                      <li className="flex items-center gap-2 text-xs text-text-primary">
                        <Check size={14} className="text-success-base" /> Seguro: Criptografia de nível militar
                      </li>
                      <li className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">
                        <Timer size={14} /> Fuso Horário: O banco de dados utiliza UTC (+00), mas a sua dashboard converte automaticamente para o seu horário local (UTC-3).
                      </li>
                    </ul>
                  </div>

                  <div className="space-y-4">
                    <div className="size-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                      <Fingerprint size={24} />
                    </div>
                    <h4 className="text-xl font-bold text-text-primary">Autenticação de Dois Fatores (2FA)</h4>
                    <p className="text-sm text-text-secondary leading-relaxed">
                      Adicione uma camada extra de proteção à sua conta exigindo um código do seu celular para fazer login.
                    </p>
                    <div className="p-4 bg-bg-base rounded-xl border border-border-base">
                      <p className="text-[10px] font-black text-text-secondary uppercase mb-2">Como habilitar:</p>
                      <p className="text-xs text-text-secondary">
                        Atualmente, o 2FA deve ser gerenciado através do seu provedor de identidade (Google Auth) ou configurado no painel administrativo do Supabase para total conformidade TOTP.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-border-base">
                  <div className="flex items-center gap-2 p-4 bg-bg-base rounded-2xl border border-border-base border-l-4 border-l-accent">
                    <Info size={20} className="text-accent shrink-0" />
                    <p className="text-xs text-text-secondary">
                      <strong>Importante:</strong> Como usamos Conhecimento Zero, se você esquecer a senha de um segredo criptografado, ele <u>não poderá ser recuperado</u> por ninguém.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-border-base">
                {forms.map((form) => (
                  <div key={form.id} className="p-6 hover:bg-bg-base/30 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="size-12 rounded-xl bg-accent/10 text-accent flex items-center justify-center">
                          <FileText size={24} />
                        </div>
                        <div className="flex flex-col">
                          <h5 className="font-bold text-text-primary">{form.title}</h5>
                          <div className="flex items-center gap-2 mt-0.5">
                            <p className="text-[10px] font-bold text-accent uppercase tracking-widest">{getResponsesCount(form)} respostas</p>
                            <span className="size-1 bg-border-base rounded-full" />
                            <p className="text-[10px] text-text-secondary">Última em: {getLatestResponseDate(form)}</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => fetchResponses(form.id)}
                          className="flex items-center gap-2 px-4 py-2 bg-accent/10 text-accent rounded-xl text-xs font-bold hover:bg-accent hover:text-white transition-all"
                        >
                          <Eye size={14} />
                          Ver Respostas
                        </button>
                        <button 
                          onClick={() => handleCopy(`${window.location.origin}/?form=${form.id}`)}
                          className="flex items-center gap-2 px-4 py-2 bg-bg-base rounded-xl text-xs font-bold text-text-primary hover:text-accent transition-colors border border-border-base"
                        >
                          <Copy size={14} />
                          Copiar Link
                        </button>
                        <button 
                          onClick={() => deleteForm(form.id)}
                          className="p-2 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white rounded-lg transition-all"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                {forms.length === 0 && (
                  <div className="p-12 text-center">
                    <p className="text-text-secondary font-medium">Nenhum formulário criado ainda.</p>
                  </div>
                )}
              </div>
            )}
          </div>
          {/* Footer Pagination/Info */}
          <div className="px-6 py-4 border-t border-border-base flex items-center justify-between">
            <span className="text-xs text-text-secondary font-medium">Mostrando {dashboardTab === 'links' ? links.length : requests.length} itens</span>
            <div className="flex items-center gap-1">
              <button className="p-1 rounded hover:bg-bg-base text-text-secondary disabled:opacity-30 transition-colors">
                <ChevronLeft size={18} />
              </button>
              <button className="size-8 rounded bg-accent text-white text-xs font-bold">1</button>
              <button className="p-1 rounded hover:bg-bg-base text-text-secondary transition-colors">
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Responses Modal */}
      <AnimatePresence>
        {isViewingResponses && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-bg-base/80 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-surface w-full max-w-4xl max-h-[80vh] rounded-[2rem] border border-border-base shadow-2xl flex flex-col overflow-hidden"
            >
              <div className="p-6 border-b border-border-base flex items-center justify-between bg-bg-base/30">
                <div>
                  <h3 className="text-xl font-black text-text-primary">Respostas Recebidas</h3>
                  <p className="text-xs text-text-secondary font-medium">Total de {selectedFormResponses?.length || 0} envios</p>
                </div>
                <button 
                  onClick={() => setIsViewingResponses(false)}
                  className="p-2 hover:bg-bg-base rounded-xl transition-colors text-text-secondary"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6">
                {selectedFormResponses && selectedFormResponses.length > 0 ? (
                  <div className="space-y-4">
                    {selectedFormResponses.map((sub, idx) => (
                      <div key={sub.id} className="p-4 bg-bg-base rounded-2xl border border-border-base space-y-3">
                        <div className="flex items-center justify-between border-b border-border-base pb-2 mb-2">
                          <span className="text-[10px] font-black text-text-secondary uppercase tracking-widest">Resposta #{selectedFormResponses.length - idx}</span>
                          <span className="text-[10px] text-text-secondary font-medium">{new Date(sub.created_at).toLocaleString()}</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {Object.entries(sub.data).map(([key, value]) => {
                            // Encontrar o label correto do campo clicando no formulário selecionado
                            const form = forms.find(f => f.id === sub.form_id);
                            const field = form?.fields?.find((f: any) => f.id === key);
                            const label = field?.label || key;
                            
                            return (
                              <div key={key} className="space-y-1">
                                <p className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">{label}</p>
                                <div className="text-sm text-text-primary font-medium bg-surface p-2 rounded-lg border border-border-base/50">
                                  {renderValue(value)}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="h-64 flex flex-col items-center justify-center text-center space-y-4">
                    <div className="size-16 bg-bg-base rounded-2xl flex items-center justify-center text-text-secondary">
                      <Mail size={32} />
                    </div>
                    <p className="text-text-secondary font-medium">Nenhuma resposta recebida ainda.</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {requestToBurn && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[2.5rem] p-8 border border-slate-200 dark:border-slate-800 shadow-2xl text-center"
            >
              <div className="size-20 bg-red-100 dark:bg-red-900/20 text-red-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <Trash2 size={32} />
              </div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-4">Acesso Único Detectado</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-8">
                ⚠️ Este dado foi marcado para <strong>Incineração Imediata</strong>. Ao clicar em visualizar, o conteúdo será apagado permanentemente do nosso servidor para garantir sua total privacidade.
              </p>
              <div className="flex flex-col gap-3">
                <button
                  onClick={confirmRevealAndBurn}
                  className="w-full py-4 bg-red-600 text-white font-bold rounded-2xl hover:bg-red-700 transition-all shadow-lg shadow-red-600/20"
                >
                  Confirmar e Abrir
                </button>
                <button
                  onClick={() => setRequestToBurn(null)}
                  className="w-full py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                >
                  Cancelar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Link Details Modal (Auditoria) */}
      <AnimatePresence>
        {selectedLinkDetails && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-bg-base/90 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-surface w-full max-w-lg rounded-[2.5rem] border border-border-base shadow-2xl overflow-hidden"
            >
              <div className="p-8 border-b border-border-base bg-bg-base/30 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="size-12 rounded-2xl bg-accent text-white flex items-center justify-center shadow-lg shadow-accent/20">
                    <ShieldCheck size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-text-primary">Auditoria de Acesso</h3>
                    <p className="text-xs text-text-secondary uppercase font-bold tracking-wider">{selectedLinkDetails.name}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedLinkDetails(null)}
                  className="p-2 hover:bg-bg-base rounded-xl transition-colors text-text-secondary"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-8 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-bg-base rounded-2xl border border-border-base">
                    <p className="text-[10px] font-black text-text-secondary uppercase mb-1">Total de Views</p>
                    <p className="text-2xl font-black text-text-primary">{selectedLinkDetails.views}</p>
                  </div>
                  <div className="p-4 bg-bg-base rounded-2xl border border-border-base">
                    <p className="text-[10px] font-black text-text-secondary uppercase mb-1">Status</p>
                    <p className={`text-xs font-bold uppercase ${selectedLinkDetails.status === 'completed' ? 'text-amber-600' : 'text-success-base'}`}>
                      {selectedLinkDetails.status === 'completed' ? 'Cumprido/Incin.' : 'Ativo'}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-text-secondary uppercase tracking-widest border-b border-border-base pb-2">Informações do Último Visualizador</h4>
                  
                  <div className="flex items-center justify-between p-4 bg-accent/5 rounded-2xl border border-accent/10">
                    <div className="flex items-center gap-3">
                      <div className="size-10 rounded-xl bg-accent text-white flex items-center justify-center">
                        <Mail size={18} />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-accent uppercase">E-mail Identificado</p>
                        <p className="text-sm font-bold text-text-primary">
                          {selectedLinkDetails.last_viewer_email || 'Acesso Anônimo (Sem login)'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-bg-base rounded-2xl border border-border-base">
                    <div className="flex items-center gap-3">
                      <div className="size-10 rounded-xl bg-text-secondary/10 text-text-secondary flex items-center justify-center">
                        <Upload size={18} />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-text-secondary uppercase">Config. Original</p>
                        <div className="flex items-center gap-2 mt-1">
                          {selectedLinkDetails.require_email && <span className="px-2 py-0.5 bg-success-base/10 text-success-base text-[8px] font-black rounded">LOGIN OBRIGATÓRIO</span>}
                          {selectedLinkDetails.restrict_ip && <span className="px-2 py-0.5 bg-blue-600/10 text-blue-600 text-[8px] font-black rounded">IP RESTRITO</span>}
                          {!selectedLinkDetails.require_email && !selectedLinkDetails.restrict_ip && <span className="text-[10px] text-text-secondary italic">Link Público</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => setSelectedLinkDetails(null)}
                  className="w-full py-4 bg-bg-base border border-border-base hover:bg-surface text-text-primary font-bold rounded-2xl transition-all"
                >
                  Fechar Registro
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
