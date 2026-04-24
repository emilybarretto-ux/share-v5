import React, { useState, useEffect } from 'react';
// import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, Lock, Eye, EyeOff, Copy, X, Timer, Fingerprint, Trash2, ExternalLink, Download, FileIcon, ImageIcon, Key, Mail, RefreshCcw, Info, Check, ShieldAlert } from 'lucide-react';
import Markdown from 'react-markdown';
import { supabase } from '../../lib/supabase';
import { decryptData, hashPassword } from '../../lib/crypto';
import { useNotification } from '../shared/NotificationProvider';
import { ScreenProtector } from '../shared/ScreenProtector';

interface ViewSecretProps {
  key?: string;
  id: string;
  user: any;
  onBack: () => void;
  setScreen: (s: any) => void;
}


export const ViewSecret = ({ id, user, onBack, setScreen }: ViewSecretProps) => {
  const [loading, setLoading] = useState(true);
  const [secret, setSecret] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [unlockError, setUnlockError] = useState<string | null>(null);
  const [showConfirmBurn, setShowConfirmBurn] = useState(false);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [userIp, setUserIp] = useState<string>('');
  const [isVerifyingSecurity, setIsVerifyingSecurity] = useState(true);
  const [verificationEmail, setVerificationEmail] = useState('');
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const hasVerifiedManually = React.useRef(false); 
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
  }, [id]); // Removido 'user' daqui para evitar o loop de auto-show após login se quisermos ser "Manuais"

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
          
          // Se o segredo exige e-mail e ainda não validamos localmente NESTA SESSÃO do componente
          // Mostramos o portão mesmo que já esteja logado, forçando o clique no link/token (Não automático)
          if (!hasVerifiedManually.current) {
              console.warn('🚫 [ViewSecret] Bloqueio por E-mail: Validação manual pendente.');
              setError('AUTH_REQUIRED');
              setLoading(false);
              return;
          }

          const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
          
          if (authError || !authUser) {
              console.warn('🚫 [ViewSecret] Bloqueio por E-mail: Usuário NÃO autenticado no Supabase.');
              setError('AUTH_REQUIRED');
              setLoading(false);
              return;
          }
          console.log('✅ [ViewSecret] Usuário autenticado:', authUser.email);

          // --- NOVO: Verificação de E-mail ou Domínio Específicos ---
          const email = authUser.email?.toLowerCase() || '';
          
          if (data.allowed_email) {
            const allowedList = data.allowed_email.split(',').map((e: string) => e.trim().toLowerCase());
            if (!allowedList.includes(email)) {
              console.warn('🚫 [ViewSecret] E-mail não autorizado:', email);
              setError(`ACESSO_NEGADO_EMAIL:${data.allowed_email}`);
              setLoading(false);
              return;
            }
          }

          if (data.allowed_domain && !email.endsWith(`@${data.allowed_domain.toLowerCase()}`)) {
            console.warn('🚫 [ViewSecret] Domínio não autorizado:', email);
            setError(`ACESSO_NEGADO_DOMINIO:${data.allowed_domain}`);
            setLoading(false);
            return;
          }
      }

      // Se passou pelas travas, agora verificamos o acesso/desbloqueio
      if (data.password) {
        console.log('🔑 [ViewSecret] Link protegido por senha. Aguardando entrada do usuário...');
      } else {
        // Se não tem senha, descriptografamos com string vazia (padrão do App.tsx)
        const decryptedContent = decryptData(data.content, '');
        let decryptedKV = data.key_values;
        if (data.key_values) {
           const cipherText = (typeof data.key_values === 'object') 
             ? (data.key_values.payload || data.key_values.encrypted || null)
             : (typeof data.key_values === 'string' ? data.key_values : null);
           if (cipherText) {
             const kvText = decryptData(cipherText, '');
             if (kvText) {
               try { decryptedKV = JSON.parse(kvText); } catch(e) {}
             }
           }
        }
        
        setSecret({ ...data, content: decryptedContent, key_values: decryptedKV });

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
  const maxViews = secret?.max_views !== null ? Number(secret?.max_views) : null;
  const isOneTime = maxViews === 1;
  const isLimited = maxViews !== null;
  const currentViews = secret?.views || 0;
  const reachedLimit = isLimited && (currentViews + 1) >= maxViews;
  const willBeIncinerated = isOneTime || reachedLimit;

  useEffect(() => {
    // Timer de incineração automática (5 minutos)
    let burnTimer: any;
    if (isUnlocked && willBeIncinerated && !hasBurned) {
      console.log('⏰ Timer de autodestruição iniciado: 5 minutos.');
      burnTimer = setTimeout(() => {
        handleFinalBurn();
      }, 5 * 60 * 1000); // 5 minutos
    }
    return () => clearTimeout(burnTimer);
  }, [isUnlocked, willBeIncinerated, hasBurned]);

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
      setIsUnlocking(true);
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
    } finally {
      setIsUnlocking(false);
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

  const handleSendToken = async () => {
    if (!verificationEmail || !verificationEmail.includes('@')) {
      showNotification('Por favor, insira um e-mail válido.', 'info');
      return;
    }

    setIsSendingOtp(true);
    setResendCooldown(15); // 15 segundos de cooldown
    try {
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: verificationEmail.trim().toLowerCase(),
        options: {
          emailRedirectTo: window.location.href,
          shouldCreateUser: true,
        }
      });

      if (otpError) throw otpError;
      
      setOtpSent(true);
      setOtpCode(''); // Limpa código anterior
      showNotification('Token enviado! Verifique seu e-mail.', 'success');
    } catch (err: any) {
      console.error('Erro ao enviar OTP:', err);
      if (err.status === 429 || err.message?.includes('after')) {
        const seconds = err.message.match(/\d+/) || [15];
        showNotification(`Limite atingido. Aguarde ${seconds[0]} segundos para tentar novamente.`, 'info');
      } else {
        showNotification('Erro ao enviar e-mail: ' + err.message, 'error');
      }
    } finally {
      setIsSendingOtp(false);
    }
  };

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleVerifyOTP = async () => {
    if (otpCode.length < 6) return;
    
    setIsVerifyingOtp(true);
    try {
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email: verificationEmail.trim().toLowerCase(),
        token: otpCode,
        type: 'email'
      });

      if (verifyError) throw verifyError;
      
      hasVerifiedManually.current = true;
      showNotification('Identidade verificada!', 'success');
      
      // Recarrega o segredo agora que a identidade foi marcada como validada localmente
      fetchSecret(userIp || '0.0.0.0');
    } catch (err: any) {
      console.error('Erro ao verificar OTP:', err);
      showNotification('Token inválido ou expirado.', 'error');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div key="loading-state" className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <div className="size-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-500 font-medium font-sans">Buscando dados seguros...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div key="error-state-container" className="max-w-md w-full mx-auto p-8 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl">
          <div className={`size-16 rounded-2xl flex items-center justify-center mx-auto mb-6 ${error === 'AUTH_REQUIRED' ? 'bg-amber-100 dark:bg-amber-900/20 text-amber-600' : 'bg-red-100 dark:bg-red-900/20 text-red-600'}`}>
            {error === 'AUTH_REQUIRED' ? <ShieldCheck size={32} /> : <X size={32} />}
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
            {error === 'AUTH_REQUIRED' ? 'Acesso Restrito' : 'Link Indisponível'}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mb-8">
            {error === 'AUTH_REQUIRED' 
              ? 'Este segredo requer validação de identidade. Insira seu e-mail abaixo para receber um token de acesso.' 
              : error.startsWith('ACESSO_NEGADO_')
              ? 'Você não tem permissão para visualizar este segredo. Verifique se o e-mail informado está na lista de acesso.'
              : error}
          </p>
          
          <div className="space-y-4">
            {(error === 'AUTH_REQUIRED' || error.startsWith('ACESSO_NEGADO_')) && (
              <div key="otp-flow" className="space-y-4 text-left">
                {!otpSent ? (
                  <div key="otp-request" className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">E-mail para receber o token</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input 
                        type="email"
                        value={verificationEmail}
                        onChange={(e) => setVerificationEmail(e.target.value)}
                        placeholder="seu-email@exemplo.com"
                        className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-blue-600 dark:text-white"
                      />
                    </div>
                    <button 
                      onClick={handleSendToken}
                      disabled={isSendingOtp}
                      className="w-full py-4 bg-blue-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors"
                    >
                      {isSendingOtp ? <RefreshCcw className="animate-spin" size={20} /> : <Mail size={20} />}
                      {isSendingOtp ? 'Enviando...' : 'Receber Token'}
                    </button>
                  </div>
                ) : (
                  <div key="otp-verify" className="p-6 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-center space-y-4">
                    <div className="size-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
                      <Check size={24} />
                    </div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">Token Enviado!</p>
                    <input 
                      type="text"
                      maxLength={8}
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                      placeholder="00000000"
                      className="w-full p-4 text-center text-2xl tracking-widest font-mono border rounded-xl bg-white dark:bg-slate-900 dark:text-white"
                    />
                    <button 
                      onClick={handleVerifyOTP}
                      disabled={isVerifyingOtp}
                      className="w-full py-4 bg-green-600 text-white font-bold rounded-xl"
                    >
                      Confirmar Token
                    </button>
                    <button 
                      onClick={() => setOtpSent(false)} 
                      className="text-xs text-blue-600 font-bold uppercase tracking-widest"
                    >
                      Alterar E-mail
                    </button>
                  </div>
                )}
              </div>
            )}
            <button 
              onClick={onBack} 
              className="w-full py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700"
            >
              Voltar
            </button>
          </div>
        </div>
      );
    }

    if (!isUnlocked) {
      return (
        <div key="password-gate" className="max-w-md w-full mx-auto p-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl">
          <div className="size-16 bg-blue-100 dark:bg-blue-900/20 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Lock size={32} />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white text-center mb-2">Protegido por Senha</h2>
          <p className="text-slate-500 text-center mb-8 italic">Este segredo requer uma chave para ser revelado.</p>
          
          <div className="space-y-4">
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Chave de acesso"
                className="w-full px-4 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-center text-lg outline-none focus:ring-2 focus:ring-blue-600 dark:text-white"
                onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
              />
              <button 
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {unlockError && <div className="p-3 bg-red-50 text-red-600 rounded-lg text-xs font-bold text-center">{unlockError}</div>}
            <button 
              onClick={handleUnlock}
              disabled={isUnlocking}
              className="w-full py-4 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 active:scale-95 transition-all"
            >
              {isUnlocking ? 'Verificando...' : 'Desbloquear'}
            </button>
            <button onClick={onBack} className="w-full py-2 text-slate-400 text-sm font-bold uppercase">Voltar</button>
          </div>
        </div>
      );
    }

    return (
      <div key="revealed-content" className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden mx-auto">
        <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="size-12 rounded-2xl bg-green-600 text-white flex items-center justify-center">
              <ShieldCheck size={24} />
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Conteúdo Revelado</h2>
          </div>
          <button onClick={onBack} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400"><X size={20} /></button>
        </div>

        <div className="p-8 space-y-6" translate="no">
            {((secret as any).content || (secret as any).key_values) ? (
              <>
                {(secret as any).content && (
                  <div className="p-6 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <div className="text-slate-800 dark:text-slate-200 leading-relaxed markdown-body max-w-none">
                      <Markdown>{(secret as any).content}</Markdown>
                    </div>
                  </div>
                )}
                
                {(secret as any).key_values && (
                  <div className="space-y-3">
                    {Object.entries((secret as any).key_values).map(([key, value]: [string, any]) => (
                      <div key={key} className="flex flex-col p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-border-base">
                        <span className="text-[10px] font-black uppercase text-slate-400 mb-1">{key}</span>
                        <span className="font-mono text-sm break-all text-slate-700 dark:text-slate-300">{String(value)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="p-12 text-center bg-slate-50 dark:bg-slate-950 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800">
                <ShieldAlert className="size-12 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-500 font-medium italic">Nenhum conteúdo disponível ou já incinerado.</p>
              </div>
            )}
           
           {(secret as any).file_url && (
             <div className="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-900/30 flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <FileIcon className="text-blue-600" />
                  <span className="font-bold truncate text-sm">Arquivo em Anexo</span>
                </div>
                <a 
                  href={(secret as any).file_url} 
                  target="_blank" 
                  rel="noreferrer"
                  className="py-3 bg-blue-600 text-white text-center rounded-xl font-bold"
                >
                  Download do Arquivo
                </a>
             </div>
           )}

           <div className="flex flex-col gap-4 pt-4">
              <button 
                onClick={async () => {
                  if (willBeIncinerated) await handleFinalBurn();
                  onBack();
                }}
                className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold rounded-xl"
              >
                {willBeIncinerated ? 'Confirmar leitura e Apagar' : 'Fechar'}
              </button>
              {(secret as any).redirect_url && (
                <a 
                  href={(secret as any).redirect_url.startsWith('http') ? (secret as any).redirect_url : `https://${(secret as any).redirect_url}`}
                  target="_blank"
                  rel="noreferrer"
                  className="py-4 bg-blue-600 text-white text-center rounded-xl font-bold shadow-lg"
                >
                  Ir para URL Destino
                </a>
              )}
           </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans">
      <ScreenProtector active={isUnlocked && !loading && !hasBurned && !error}>
        <div className="min-h-screen py-12 px-4 flex items-center justify-center">
          <div className="w-full max-w-4xl flex items-center justify-center">
            {renderContent()}
          </div>
        </div>
      </ScreenProtector>

      {showConfirmBurn && (
        <div key="confirm-burn-overlay" className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div
            className="bg-white dark:bg-slate-950 max-w-sm w-full p-8 rounded-[2rem] border shadow-2xl text-center"
          >
            <div className="size-16 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <ShieldAlert size={32} />
            </div>
            <h3 className="text-xl font-black mb-4 dark:text-white">Atenção!</h3>
            <p className="text-slate-500 text-sm mb-8">
              Este segredo será autodestruído permanentemente após a leitura. Prosseguir?
            </p>
            <div className="flex flex-col gap-3">
              <button 
                onClick={confirmAndRevealOneTime}
                className="py-4 bg-red-600 text-white font-bold rounded-xl"
              >
                Sim, Revelar e Apagar
              </button>
              <button 
                onClick={() => { setShowConfirmBurn(false); onBack(); }}
                className="py-3 text-slate-400 font-bold"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
