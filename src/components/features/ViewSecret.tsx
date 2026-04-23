import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, Lock, Eye, EyeOff, Copy, X, Timer, Fingerprint, Trash2, ExternalLink, Download, FileIcon, ImageIcon } from 'lucide-react';
import Markdown from 'react-markdown';
import { supabase } from '../../lib/supabase';
import { decryptData, hashPassword } from '../../lib/crypto';
import { useNotification } from '../shared/NotificationProvider';
import { ScreenProtector } from '../shared/ScreenProtector';

interface ViewSecretProps {
  key?: string;
  id: string;
  onBack: () => void;
  setScreen: (s: any) => void;
}


export const ViewSecret = ({ id, onBack, setScreen }: ViewSecretProps) => {
  const [loading, setLoading] = useState(true);
  const [secret, setSecret] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [unlockError, setUnlockError] = useState<string | null>(null);
  const [showConfirmBurn, setShowConfirmBurn] = useState(false);
  const [userIp, setUserIp] = useState<string>('');
  const [isVerifyingSecurity, setIsVerifyingSecurity] = useState(true);
  const hasIncrementedOnce = React.useRef(false); // Previne duplo incremento no mesmo mount
  const { showNotification } = useNotification();

  const [showRawSecret, setShowRawSecret] = useState(false);

  useEffect(() => {
    const init = async () => {
      let currentIp = '';
      try {
        const res = await fetch('https://api.ipify.org?format=json');
        const data = await res.json();
        currentIp = data.ip;
        setUserIp(currentIp);
      } catch (e) {
        console.error('Erro ao obter IP:', e);
      }
      fetchSecret(currentIp);
    };
    init();
  }, [id]);

  const fetchSecret = async (currentIp: string) => {
    setLoading(true);
    setError(null);
    try {
      console.log('🔍 Verificação de segurança iniciada para:', id);
      const { data, error: fetchError } = await supabase
        .from('secrets')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError || !data) {
        setError('Este link não existe mais ou foi removido permanentemente.');
        setLoading(false);
        return;
      }

      // --- TRAVA ZERO: ACESSO JÁ ENCERRADO (Incinerado ou Limite atingido) ---
      const maxViews = data.max_views !== null ? Number(data.max_views) : null;
      const currentViews = Number(data.views || 0);
      
      // Se não tem conteúdo nem dados estruturados ou o limite foi atingido/status é completed
      const isActuallyCompleted = 
        data.status === 'completed' || 
        (maxViews !== null && currentViews >= maxViews) ||
        (!data.content && !data.key_values && !data.file_url); // Se TUDO sumiu, o link está morto

      console.log('🔍 [ViewSecret] Estado do Segredo:', {
        status: data.status,
        views: currentViews,
        max: maxViews,
        hasContent: !!data.content,
        hasKV: !!data.key_values,
        hasFile: !!data.file_url,
        isActuallyCompleted
      });

      if (isActuallyCompleted) {
          console.warn('🚫 [ViewSecret] Link já incinerado detectado.');
          setError('Este segredo já foi incinerado permanentemente por limite de acessos ou ação do criador.');
          
          // Limpeza redundante se ainda houver algo (segurança extra)
          if (data.content || data.key_values || data.file_url) {
            supabase.from('secrets').update({ 
              status: 'completed', 
              content: '', 
              password: '', 
              key_values: null,
              file_url: null 
            }).eq('id', id).then(() => {});
          }
          setLoading(false);
          return;
      }

      // --- TRAVA ZERO.1: EXPIRAÇÃO POR TEMPO ---
      if (data.expires_at) {
        const expiresDate = new Date(data.expires_at);
        if (expiresDate < new Date()) {
          console.warn('🚫 [ViewSecret] Link expirado por tempo.');
          setError('Este link expirou devido ao prazo de validade definido pelo criador.');
          
          if (data.status !== 'completed') {
            supabase.from('secrets').update({ 
              status: 'completed', 
              content: '', 
              password: '', 
              key_values: null,
              file_url: null 
            }).eq('id', id).then(() => {});
          }
          setLoading(false);
          return;
        }
      }

      setSecret(data);

      // 1. Log de Auditoria
      console.log('🔍 [ViewSecret] Próximas travas:', {
        require_email: data.require_email,
        restrict_ip: data.restrict_ip
      });

      // Conversão robusta de booleano (aceita true, 'true', 1, '1')
      const isIpRestricted = data.restrict_ip === true || data.restrict_ip === 'true' || data.restrict_ip === 1;
      const isEmailRequired = data.require_email === true || data.require_email === 'true' || data.require_email === 1;

      // --- TRAVA 1: RESTRIÇÃO DE IP (Antes de qualquer coisa) ---
      if (isIpRestricted && data.creator_ip) {
          if (data.creator_ip.trim() !== currentIp.trim()) {
              console.warn('🚫 [ViewSecret] Bloqueio por IP detectado.');
              setError('Acesso negado: Este link está restrito a um endereço IP específico.');
              setLoading(false);
              return;
          }
      }

      // --- TRAVA 2: EXIGIR E-MAIL (Antes de pedir senha) ---
      if (isEmailRequired) {
          console.log('🔐 [ViewSecret] Este segredo exige identificação. Verificando sessão...');
          const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
          
          if (authError || !authUser) {
              console.warn('🚫 [ViewSecret] Bloqueio por E-mail: Usuário NÃO autenticado.');
              setError('AUTH_REQUIRED');
              setLoading(false);
              return;
          }
          console.log('✅ [ViewSecret] Usuário autenticado:', authUser.email);
      }

      // Se passou pelas travas, agora verificamos o acesso/desbloqueio
      if (data.password) {
        console.log('🔑 [ViewSecret] Link protegido por senha. Aguardando entrada do usuário...');
      } else {
        const maxViews = data.max_views !== null ? Number(data.max_views) : null;
        const currentViews = Number(data.views || 0);
        const isLimited = maxViews !== null && maxViews > 0;
        const isOneTime = maxViews === 1;
        
        // Se for um link de acesso ÚNICO, sempre mostramos o modal de confirmação.
        // Se for um link LIMITADO (ex: 5 acessos) e o usuário estiver logando agora (pós-redirect),
        // evitamos o incremento automático para não queimar um acesso sem intenção.
        if (isOneTime) {
          setShowConfirmBurn(true);
        } else if (isLimited && currentViews === 0) {
          // Para o primeiro acesso de links limitados, também pedimos confirmação
          // Isso resolve o problema de "incinerar de vez" por causa de re-mounts/login redirect
          setShowConfirmBurn(true);
        } else {
          setIsUnlocked(true);
          // Só incrementa se ainda não o fez neste ciclo de renderização
          if (!hasIncrementedOnce.current) {
            hasIncrementedOnce.current = true;
            incrementViews();
          }
        }
      }
    } catch (err) {
      console.error('Erro ao buscar segredo:', err);
      setError('Erro ao carregar os dados. Tente novamente.');
    }
    setLoading(false);
  };

  const [hasBurned, setHasBurned] = useState(false);

  useEffect(() => {
    // Timer de incineração automática (5 minutos)
    let burnTimer: any;
    if (isUnlocked && secret?.max_views === 1 && !hasBurned) {
      console.log('⏰ Timer de autodestruição iniciado: 5 minutos.');
      burnTimer = setTimeout(() => {
        handleFinalBurn();
      }, 5 * 60 * 1000); // 5 minutos
    }
    return () => clearTimeout(burnTimer);
  }, [isUnlocked, secret, hasBurned]);

  const handleFinalBurn = async () => {
    if (hasBurned) return;
    try {
      console.log('🔥 [ViewSecret] Executando incineração final...');
      await fetch('/api/view-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action: 'burn' })
      });
      setHasBurned(true);
    } catch (e) {
      console.error('Erro na incineração tardia:', e);
    }
  };

  const incrementViews = async () => {
    // Se já incrementamos ou se já está desbloqueado e foi um mount redundante, evitamos
    // Isso é crucial para lidar com o redirecionamento do Login/2FA sem queimar visualizações
    if (hasIncrementedOnce.current && isUnlocked) {
      console.log('⏭️ [ViewSecret] Incremento ignorado: já processado nesta sessão.');
      return;
    }

    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      const viewerEmail = authUser?.email || null;

      console.log('🔥 [ViewSecret] Registrando acesso no servidor...');
      
      const resp = await fetch('/api/view-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          viewerEmail,
          viewerIp: userIp,
          action: 'increment'
        })
      });

      const resData = await resp.json();

      if (!resp.ok) {
        throw new Error(resData.error || `Erro do servidor: ${resp.status}`);
      }
      
      console.log('✅ [ViewSecret] Acesso registrado e link bloqueado para novos usuários.');
      return resData;

    } catch (e: any) {
      console.error('❌ [ViewSecret] FALHA NO REGISTRO DE ACESSO:', e.message);
      throw e; 
    }
  };

  const handleUnlock = async () => {
    setUnlockError(null);
    try {
      const cleanPassword = password.trim();
      if (!cleanPassword) {
        setUnlockError('Por favor, digite a senha de proteção.');
        return;
      }

      const isEncrypted = secret.is_encrypted || (secret.password && secret.password.length === 64);
      
      const maxViews = secret.max_views !== null ? Number(secret.max_views) : null;
      const nextViews = secret.views + 1;
      const isOneTime = maxViews === 1;

      if (isEncrypted) {
        const inputHash = hashPassword(cleanPassword);
        
        if (inputHash === secret.password) {
          const decryptedText = decryptData(secret.content, cleanPassword);
          
          if (!decryptedText && secret.content) {
            setUnlockError('Falha na descriptografia. Verifique se a senha está correta.');
            return;
          }

          if (isOneTime) {
            setShowConfirmBurn(true);
            return;
          }

          let decryptedKeyValues = null;
          if (secret.key_values) {
            try {
              const cipherText = (typeof secret.key_values === 'object') 
                ? (secret.key_values.payload || secret.key_values.encrypted || null)
                : (typeof secret.key_values === 'string' ? secret.key_values : null);

              if (cipherText) {
                const kvText = decryptData(cipherText, cleanPassword);
                if (kvText) {
                  decryptedKeyValues = JSON.parse(kvText);
                }
              }
            } catch (e) {
              console.error('Erro nos dados estruturados:', e);
            }
          }

          setSecret({
            ...secret,
            content: decryptedText,
            key_values: decryptedKeyValues
          });

          setIsUnlocked(true);
          await incrementViews();
        } else {
          setUnlockError('Senha incorreta! Tente novamente.');
        }
      } else {
        if (cleanPassword === secret.password) {
          if (isOneTime) {
            setShowConfirmBurn(true);
            return;
          }
          setIsUnlocked(true);
          await incrementViews();
        } else {
          setUnlockError('Senha incorreta! Acesso negado.');
        }
      }
    } catch (err) {
      console.error('Erro fatal no desbloqueio/incineração:', err);
      setError('Falha de segurança crítica durante o processamento dos dados. Link invalidado.');
    }
  };

  const confirmAndRevealOneTime = async () => {
    try {
      if (hasIncrementedOnce.current) {
        console.warn('⚠️ [ViewSecret] Tentativa de incremento duplicado em link de acesso único.');
        return;
      }

      // 1. Tentar incinerar PRIMEIRO no banco de dados
      // Se falhar (ex: RLS), a gente avisa e não mostra o dado (para garantir segurança)
      console.log('🔥 Iniciando processo de autodestruição para acesso único...');
      
      // Se tiver senha, precisamos preparar o conteúdo descriptografado antes de apagar
      const cleanPassword = password.trim();
      let finalContent = secret.content;
      let finalKV = secret.key_values;

      if (secret.password) {
        const decryptedText = decryptData(secret.content, cleanPassword);
        finalContent = decryptedText;
        
        if (secret.key_values) {
          const cipherText = (typeof secret.key_values === 'object') 
            ? (secret.key_values.payload || secret.key_values.encrypted || null)
            : (typeof secret.key_values === 'string' ? secret.key_values : null);
          if (cipherText) {
            const kvText = decryptData(cipherText, cleanPassword);
            if (kvText) finalKV = JSON.parse(kvText);
          }
        }
      }

      // Agora executamos a incineração no banco
      if (!hasIncrementedOnce.current) {
        hasIncrementedOnce.current = true;
        await incrementViews();
      }

      // Só então revelamos na tela
      setSecret({ ...secret, content: finalContent, key_values: finalKV });
      setIsUnlocked(true);
      setShowConfirmBurn(false);
      showNotification('Privacidade Máxima: Este dado foi incinerado do servidor.', 'success');
    } catch (e: any) {
      console.error('Erro na incineração:', e);
      setError('Erro de segurança: Não foi possível garantir a autodestruição dos dados. Por precaução, o acesso foi bloqueado.');
      setShowConfirmBurn(false);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <div className="size-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      <p className="text-slate-500 font-medium">Buscando dados seguros...</p>
    </div>
  );

  if (error) {
    const isAuthError = error === 'AUTH_REQUIRED';
    
    return (
      <div className="max-w-md mx-auto mt-20 p-8 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl">
        <div className={`size-16 rounded-2xl flex items-center justify-center mx-auto mb-6 ${isAuthError ? 'bg-amber-100 dark:bg-amber-900/20 text-amber-600' : 'bg-red-100 dark:bg-red-900/20 text-red-600'}`}>
          {isAuthError ? <ShieldCheck size={32} /> : <X size={32} />}
        </div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
          {isAuthError ? 'Acesso Restrito' : 'Link Indisponível'}
        </h2>
        <p className="text-slate-500 dark:text-slate-400 mb-8">
          {isAuthError 
            ? 'O criador deste link exige que você esteja logado para acessar os dados com segurança.' 
            : error}
        </p>
        
        <div className="space-y-3">
          {isAuthError && (
            <button 
              onClick={() => {
                localStorage.setItem('redirect_after_auth', window.location.search);
                setScreen('login');
              }}
              className="w-full py-4 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 hover:opacity-90 transition-all flex items-center justify-center gap-2"
            >
              <Fingerprint size={20} />
              Fazer Login agora
            </button>
          )}
          <button onClick={onBack} className="w-full py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold rounded-xl hover:bg-slate-200 transition-colors">
            Voltar ao Início
          </button>
        </div>
      </div>
    );
  }

  if (!isUnlocked && !showConfirmBurn) return (
    <div className="max-w-md mx-auto mt-20 p-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl">
      <div className="size-16 bg-blue-100 dark:bg-blue-900/20 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
        <Lock size={32} />
      </div>
      <h2 className="text-2xl font-bold text-slate-900 dark:text-white text-center mb-2">Protegido por Senha</h2>
      <p className="text-slate-500 dark:text-slate-400 text-center mb-8">Esta comunicação requer uma senha para ser visualizada.</p>
      
      {/* ... rest of unlock UI remains similar ... */}
      
      <div className="space-y-4">
        <div className="relative">
          <input 
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (unlockError) setUnlockError(null);
            }}
            onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
            placeholder="Digite a senha..."
            className={`w-full px-4 py-4 bg-slate-50 dark:bg-slate-950 border rounded-xl focus:ring-2 outline-none dark:text-white transition-all ${
              unlockError 
                ? 'border-red-500 focus:ring-red-500/20' 
                : 'border-slate-200 dark:border-slate-800 focus:ring-blue-600'
            }`}
          />
          <button 
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600"
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>
        
        {unlockError && (
          <motion.p 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-red-500 text-sm font-bold text-center bg-red-50 dark:bg-red-900/10 py-2 rounded-lg"
          >
            {unlockError}
          </motion.p>
        )}

        <button 
          onClick={handleUnlock}
          className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-2"
        >
          <Fingerprint size={20} />
          Desbloquear Conteúdo
        </button>
      </div>
    </div>
  );

  return (
    <ScreenProtector>
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        onContextMenu={(e) => e.preventDefault()}
        className="max-w-2xl mx-auto mt-12 p-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl select-none"
      >
      <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-4">
          <div className="size-12 rounded-2xl bg-green-100 dark:bg-green-900/20 text-green-600 flex items-center justify-center">
            <ShieldCheck size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">{secret.name || 'Comunicação Segura'}</h2>
            <p className="text-slate-500 text-xs font-medium">Visualizado agora • Criptografia de ponta-a-ponta</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {secret.require_email && (
            <div className="px-3 py-1 bg-amber-50 dark:bg-amber-900/20 text-amber-600 text-[10px] font-bold rounded-full uppercase tracking-wider flex items-center gap-1 border border-amber-100 dark:border-amber-900/40">
              <span className="size-1.5 bg-amber-600 rounded-full animate-pulse" />
              E-mail Identificado
            </div>
          )}
          {secret.restrict_ip && (
            <div className="px-3 py-1 bg-purple-50 dark:bg-purple-900/20 text-purple-600 text-[10px] font-bold rounded-full uppercase tracking-wider flex items-center gap-1 border border-purple-100 dark:border-purple-900/40">
              <ShieldCheck size={10} />
              IP Restrito
            </div>
          )}
          <div className="px-3 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 text-[10px] font-bold rounded-full uppercase tracking-wider border border-blue-100 dark:border-blue-900/40">
            Seguro
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {secret.content && (
          <div className="relative group/secret">
            <div className="p-6 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800 transition-all duration-75">
              <div className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed prose prose-slate dark:prose-invert max-w-none">
                <Markdown>{secret.content}</Markdown>
              </div>
            </div>
          </div>
        )}

        {/* --- SEÇÃO DE ARQUIVO ANEXADO --- */}
        {secret.file_url && (
          <div className="relative group/file">
             <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800 transition-all duration-75">
                <div className="flex flex-col gap-4">
                  {/* Preview se for imagem */}
                  {['jpg', 'jpeg', 'png', 'gif', 'webp', 'avif', 'svg'].some(ext => secret.file_url.toLowerCase().endsWith(ext)) ? (
                    <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 max-h-80 flex items-center justify-center bg-slate-200 dark:bg-slate-900">
                      <img 
                        src={secret.file_url} 
                        alt="Anexo" 
                        referrerPolicy="no-referrer"
                        className="max-w-full max-h-80 object-contain shadow-lg"
                      />
                    </div>
                  ) : (
                    <div className="flex items-center gap-4 p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                      <div className="size-12 bg-blue-100 dark:bg-blue-900/20 text-blue-600 rounded-lg flex items-center justify-center">
                        <FileIcon size={24} />
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <p className="text-sm font-bold text-slate-900 dark:text-white truncate">Arquivo Anexado</p>
                        <p className="text-[10px] text-slate-500 uppercase font-black">Documento Protegido</p>
                      </div>
                    </div>
                  )}

                  <a 
                    href={secret.file_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    download
                    className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-600/20"
                  >
                    <Download size={20} />
                    Download do Arquivo
                  </a>
                </div>
             </div>
          </div>
        )}

        {secret.key_values && Array.isArray(secret.key_values) && secret.key_values.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest ml-1">Dados Estruturados</h3>
            <div className="grid grid-cols-1 gap-3 relative group/data">
              <div className="transition-all duration-75 space-y-3">
                {secret.key_values.map((kv: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm">
                    <span className="text-sm font-bold text-slate-500 dark:text-slate-400">{kv.key}</span>
                    <div className="flex items-center gap-3">
                      <code className="text-sm font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded">
                        {kv.value}
                      </code>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          navigator.clipboard.writeText(kv.value);
                          showNotification('Copiado!', 'success');
                        }}
                        className="p-2 text-slate-400 hover:text-blue-600 transition-colors"
                      >
                        <Copy size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="mt-12 p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 rounded-2xl flex items-start gap-4">
        <div className="size-10 rounded-xl bg-amber-100 dark:bg-amber-900/20 text-amber-600 flex-shrink-0 flex items-center justify-center">
          <Timer size={20} />
        </div>
        <div>
          <h4 className="text-sm font-bold text-amber-900 dark:text-amber-300">Aviso de Segurança</h4>
          <p className="text-xs text-amber-700 dark:text-amber-400 mt-1 leading-relaxed">
            Esta informação foi configurada para ser destruída após a visualização. Ela será incinerada do servidor ao fechar esta página ou em 5 minutos.
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mt-8">
        <button 
          onClick={async () => {
            await handleFinalBurn();
            onBack();
          }}
          className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold rounded-xl hover:opacity-90 transition-all shadow-xl"
        >
          Entendido, fechar
        </button>
      </div>

      {secret.redirect_url && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800"
        >
          <a 
            href={secret.redirect_url.startsWith('http') ? secret.redirect_url : `https://${secret.redirect_url}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-5 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl shadow-xl shadow-blue-600/20 transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
          >
            <ExternalLink size={20} strokeWidth={3} />
            Continuar para o site destino
          </a>
          <p className="text-[10px] text-center text-slate-400 mt-3 uppercase font-black tracking-widest opacity-60">Você está sendo redirecionado para um link externo fornecido pelo criador</p>
        </motion.div>
      )}
    </motion.div>
    
    <AnimatePresence>
      {showConfirmBurn && (
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
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-4">
              {secret?.max_views === 1 ? 'Acesso Único Detectado' : 'Link de Acesso Limitado'}
            </h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-8">
              {secret?.max_views === 1 
                ? <>⚠️ Este dado foi marcado para <strong>Incineração Imediata</strong>. Ao clicar em visualizar, o conteúdo será apagado permanentemente do nosso servidor para garantir sua total privacidade.</>
                : <>Este link possui um limite de visualizações. Ao clicar em visualizar, um acesso será contabilizado. {secret?.views === 0 && <strong>Esta é a primeira visualização.</strong>}</>
              }
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={confirmAndRevealOneTime}
                className="w-full py-4 bg-red-600 text-white font-bold rounded-2xl hover:bg-red-700 transition-all shadow-lg shadow-red-600/20"
              >
                Confirmar e Revelar
              </button>
              <button
                onClick={() => {
                  setShowConfirmBurn(false);
                  onBack();
                }}
                className="w-full py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
              >
                Cancelar
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  </ScreenProtector>
  );
};
