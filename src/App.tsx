import React, { useState, useEffect } from 'react';
// Force redeploy sync v1.0.5
// import { AnimatePresence, motion } from 'motion/react';
import { Sun, Moon, ShieldCheck, Mail, Lock, Eye, EyeOff, Copy, X, Timer, Fingerprint, RefreshCcw, ShieldAlert } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { supabase } from './lib/supabase';
import { encryptData, hashPassword } from './lib/crypto';
import { Screen, SharedLink, DataRequest } from './types';
import { useNotification } from './components/shared/NotificationProvider';

// Screens
import { HomeScreen } from './components/screens/HomeScreen';
import { CreateSecretScreen } from './components/screens/CreateSecretScreen';
import { LoginScreen } from './components/screens/LoginScreen';
import { RegisterScreen } from './components/screens/RegisterScreen';
import { DashboardScreen } from './components/screens/DashboardScreen';
import { SuccessScreen } from './components/screens/SuccessScreen';
import { CreateRequestScreen } from './components/screens/CreateRequestScreen';
import { RequestSuccessScreen } from './components/screens/RequestSuccessScreen';
import { HowItWorksScreen } from './components/screens/HowItWorksScreen';
import { SecurityScreen } from './components/screens/SecurityScreen';
import { DeveloperPortal } from './components/screens/DeveloperPortal';
import { PasswordGateScreen } from './components/screens/PasswordGateScreen';
import { ForgotPasswordScreen } from './components/screens/ForgotPasswordScreen';
import { ResetPasswordScreen } from './components/screens/ResetPasswordScreen';

// Features
import { ViewSecret } from './components/features/ViewSecret';
import { FillRequest } from './components/features/FillRequest';
import { ViewForm } from './components/features/ViewForm';

// Builder
import { FormBuilderScreen } from './components/builder/FormBuilderScreen';

export default function App() {
  const { showNotification } = useNotification();
  
  // Verificação de configuração do Supabase
  const isSupabaseConfigured = 
    import.meta.env.VITE_SUPABASE_URL && 
    import.meta.env.VITE_SUPABASE_ANON_KEY &&
    !import.meta.env.VITE_SUPABASE_URL.includes('placeholder');

  const [demoMode, setDemoMode] = useState(false);

  if (!isSupabaseConfigured && !demoMode) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-3xl p-8 shadow-2xl text-center">
          <div className="size-20 bg-amber-500/10 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShieldCheck size={40} />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Configuração Necessária</h1>
          <p className="text-slate-400 mb-8">
            Para usar o <strong>Bold Share</strong> com dados reais, você precisa configurar o Supabase.
          </p>
          <div className="space-y-4 text-left mb-8">
            <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700">
              <p className="text-xs font-mono text-slate-500 uppercase mb-2">Passo 1</p>
              <p className="text-sm text-slate-300">Vá em <strong>Settings</strong> &gt; <strong>Secrets</strong> no AI Studio.</p>
            </div>
            <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700">
              <p className="text-xs font-mono text-slate-500 uppercase mb-2">Passo 2</p>
              <p className="text-sm text-slate-300">Adicione <code>VITE_SUPABASE_URL</code> e <code>VITE_SUPABASE_ANON_KEY</code>.</p>
            </div>
          </div>
          
          <div className="flex flex-col gap-3">
            <button 
              onClick={() => setDemoMode(true)}
              className="w-full py-4 bg-white/5 hover:bg-white/10 text-white font-bold rounded-2xl transition-all border border-white/10"
            >
              Apenas Visualizar (Modo Demo)
            </button>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">
              Ou salve os secrets para ativar
            </p>
          </div>
        </div>
      </div>
    );
  }

  const [storageConfigured, setStorageConfigured] = useState(true);
  const [showStorageWarning, setShowStorageWarning] = useState(true);

  // --- COMPONENTE DE AVISO DE STORAGE ---
  const StorageWarning = () => {
    if (storageConfigured || !isSupabaseConfigured || !showStorageWarning) return null;
    
    return (
      <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-3 flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top duration-500">
        <div className="flex items-center gap-3 justify-center flex-1">
          <div className="size-2 bg-amber-500 rounded-full animate-ping" />
          <p className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
            Configuração Pendente: Crie o bucket "secrets-files" (público) no Storage do seu Supabase para ativar o envio de arquivos.
          </p>
        </div>
        <button 
          onClick={() => setShowStorageWarning(false)}
          className="p-1 hover:bg-amber-500/20 rounded-full text-amber-600 transition-colors"
        >
          <X size={16} />
        </button>
      </div>
    );
  };

  // --- COMPONENTE DE REPARO DE RLS ---
  const RLSRepairModal = () => {
    if (!errorSql) return null;
    
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
        <div 
          className="bg-white dark:bg-slate-900 border border-red-500/30 rounded-2xl p-6 max-w-xl w-full shadow-2xl relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-red-500" />
          
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full text-red-600">
              <ShieldAlert size={24} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">
                Reparo Necessário no Supabase
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                O erro de RLS persistiu mesmo com a chave configurada.
              </p>
            </div>
          </div>

          <div className="space-y-4 mb-8">
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-800 text-sm">
              <p className="mb-2 text-slate-700 dark:text-slate-300">
                Execute este comando no <strong>SQL Editor</strong> do seu Supabase para resolver definitivamente:
              </p>
              
              <div className="relative group">
                <pre className="bg-slate-900 text-green-400 p-4 rounded-lg font-mono text-[13px] overflow-x-auto border border-slate-700">
                  {errorSql}
                </pre>
                <div className="flex justify-end mt-2">
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(errorSql);
                      showNotification('Comando SQL copiado!', 'success');
                    }}
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-md transition-colors flex items-center gap-2 text-xs font-medium"
                  >
                    <Copy size={14} /> Copiar Código
                  </button>
                </div>
              </div>
            </div>

            <ol className="text-xs text-slate-500 space-y-2 list-decimal pl-4">
              <li>Acesse o <a href="https://supabase.com/dashboard" target="_blank" className="text-indigo-500 hover:underline">Dashboard do Supabase</a>.</li>
              <li>Vá em <strong>SQL Editor</strong> e clique em <strong>"New query"</strong>.</li>
              <li>Cole o comando acima e clique em <strong>"Run"</strong>.</li>
            </ol>
          </div>

          <button 
            onClick={() => setErrorSql(null)}
            className="w-full px-4 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold transition-transform active:scale-95"
          >
            Entendi, vou corrigir
          </button>
        </div>
      </div>
    );
  };
  const [screen, setScreenState] = useState<Screen>(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      const params = new URLSearchParams(window.location.search);
      
      // Rotas limpas por path
      if (path.startsWith('/f/')) return 'view-form';
      if (path.startsWith('/s/')) return 'view-secret';
      if (path.startsWith('/r/')) return 'fill-request';
      if (path === '/app') return 'dashboard';
      if (path === '/app/builder') return 'form-builder';
      if (path === '/app/requests/new') return 'create-request';
      
      // Fallback para params legados
      if (params.has('id')) return 'view-secret';
      if (params.has('request')) return 'fill-request';
      if (params.has('form')) return 'view-form';
      
      const savedScreen = localStorage.getItem('app_screen') as Screen;
      if (savedScreen && ['dashboard', 'form-builder', 'security', 'how-it-works'].includes(savedScreen)) {
        return savedScreen;
      }
    }
    return 'home';
  });

  // Helper para obter o ID da URL baseado no path
  const getUrlId = () => {
    const path = window.location.pathname;
    const parts = path.split('/');
    if (parts.length >= 3) return parts[2];
    
    const params = new URLSearchParams(window.location.search);
    return params.get('id') || params.get('request') || params.get('form');
  };
  
  const screenRef = React.useRef<Screen>(screen);
  
  const setScreen = (s: Screen) => {
    screenRef.current = s;
    setScreenState(s);
    localStorage.setItem('app_screen', s);
  };

  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark' || 
        (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  // --- ESTADOS DO 2FA (MFA) ---
  const [mfaFactorId, setMfaFactorId] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  // --- ESTADOS DE CONTEÚDO ---
  const [secretText, setSecretText] = useState('');
  const [keyValuePairs, setKeyValuePairs] = useState<Array<{ id: number, key: string, value: string }>>([]);
  const [expiration, setExpiration] = useState('Expiração em 24 horas');
  const [limitViews, setLimitViews] = useState(false);
  const [maxViews, setMaxViews] = useState(1);
  const [password, setPassword] = useState('');
  const [referenceName, setReferenceName] = useState('');
  const [isCreatingSecret, setIsCreatingSecret] = useState(false);
  const [errorSql, setErrorSql] = useState<string | null>(null);
  const [restrictIp, setRestrictIp] = useState(false);
  const [requireEmail, setRequireEmail] = useState(false);
  const [allowedEmails, setAllowedEmails] = useState<string[]>([]);
  const [allowedDomain, setAllowedDomain] = useState('');
  const [notifyAccess, setNotifyAccess] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [redirectUrl, setRedirectUrl] = useState('');

  // --- ESTADOS DE AUTH ---
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [registerName, setRegisterName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  // --- ESTADOS DO DASHBOARD ---
  const [links, setLinks] = useState<SharedLink[]>([]);
  const [requests, setRequests] = useState<DataRequest[]>([]);
  const [forms, setForms] = useState<any[]>([]);
  const [apiApps, setApiApps] = useState<any[]>([]);
  const [dashboardTab, setDashboardTab] = useState<'links' | 'requests' | 'forms' | 'security' | 'create'>('links');

  // Limpeza de estado quando o usuário muda (segurança extra)
  useEffect(() => {
    if (!user) {
      setLinks([]);
      setRequests([]);
      setForms([]);
    }
  }, [user]);
  const [copied, setCopied] = useState(false);
  const [lastCreatedId, setLastCreatedId] = useState('');
  const [qrVisible, setQrVisible] = useState(false);

  // --- ESTADOS DE SOLICITAÇÃO ---
  const [requestTitle, setRequestTitle] = useState('');
  const [requestDescription, setRequestDescription] = useState('');
  const [requestExpiration, setRequestExpiration] = useState('24 horas');
  const [requestIsOneTime, setRequestIsOneTime] = useState(true);
  const [isCreatingRequest, setIsCreatingRequest] = useState(false);

  // --- HANDLERS DE PARES CHAVE-VALOR ---
  const addPair = () => {
    setKeyValuePairs(prev => [...prev, { 
      id: Math.floor(Math.random() * 1000000), 
      key: '', 
      value: '' 
    }]);
    showNotification('NOVO PAR ADICIONADO COM SUCESSO!', 'success');
  };

  const removePair = (id: number) => {
    setKeyValuePairs(prev => prev.filter(p => p.id !== id));
  };

  const updatePair = (id: number, field: 'key' | 'value', value: string) => {
    setKeyValuePairs(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const handleFormat = (type: 'bold' | 'italic' | 'code') => {
    const textarea = document.getElementById('secret-textarea') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selectedText = text.substring(start, end);
    
    let formattedText = '';
    let offset = 0;
    switch (type) {
      case 'bold': 
        formattedText = `**${selectedText}**`; 
        offset = 2;
        break;
      case 'italic': 
        formattedText = `_${selectedText}_`; 
        offset = 1;
        break;
      case 'code': 
        formattedText = `\`${selectedText}\``; 
        offset = 1;
        break;
    }

    const newText = text.substring(0, start) + formattedText + text.substring(end);
    setSecretText(newText);
    
    // Devolver o foco
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + offset, end + offset);
    }, 0);
  };

  // --- EFEITOS ---
  
  // Verificação de Storage
  useEffect(() => {
    const checkStorage = async () => {
      if (!isSupabaseConfigured) return;
      try {
        // Tentamos apenas listar os objetos de forma limitada para ver se o bucket responde
        const { data, error } = await supabase.storage.from('secrets-files').list('', { limit: 1 });
        
        // Se não houver erro, ou se o erro não for 'Bucket not found', consideramos configurado
        if (error && error.message.includes('not found')) {
          setStorageConfigured(false);
        } else {
          // Mesmo com erro de permissão, se o erro não for 'not found', o bucket existe
          setStorageConfigured(true);
        }
      } catch (e) {
        // Silenciosamente falha
      }
    };
    checkStorage();
    
    // Tenta novamente em 10 segundos caso o usuário tenha acabado de criar
    const timer = setTimeout(checkStorage, 10000);
    return () => clearTimeout(timer);
  }, [isSupabaseConfigured]);

  // Dark Mode
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  // Inicialização e Verificação de 2FA Obrigatório
  const authChecked = React.useRef(false);
  const isInitializingRef = React.useRef(false);

  useEffect(() => {
    const handleUrlParams = () => {
      const params = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      
      const urlId = params.get('id');
      const urlRequest = params.get('request');
      const urlForm = params.get('form');
      
      const path = window.location.pathname;
      const pathId = path.startsWith('/s/') ? path.split('/')[2] : null;
      const pathForm = path.startsWith('/form/') ? path.split('/')[2] : null;
      const pathRequest = path.startsWith('/request/') ? path.split('/')[2] : null;

      const isDev = path === '/developers' || path === '/docs';
      const isResetPath = path === '/reset-password';
      const isForgotPath = path === '/forgot-password';
      const isRecoveryHash = hashParams.get('type') === 'recovery';

      if (isDev) setScreen('developer-portal');
      else if (isResetPath || isRecoveryHash) setScreen('reset-password');
      else if (isForgotPath) setScreen('forgot-password');
      else if (urlId || pathId) {
        if (pathId) {
          // Sync state with path if needed
        }
        setScreen('view-secret');
      }
      else if (urlRequest || pathRequest) setScreen('fill-request');
      else if (urlForm || pathForm) setScreen('view-form');
    };

    // Inicializa URL params uma vez no montagem
    handleUrlParams();
    window.addEventListener('popstate', handleUrlParams);

    const initializeAuth = async (retries = 3) => {
      if (isInitializingRef.current && retries === 3) return;
      isInitializingRef.current = true;

      try {
        const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();
        
        // Detect recovery mode from hash or session storage even if event hasn't fired
        const hash = window.location.hash;
        const isRecovery = hash.includes('type=recovery') || 
                          hash.includes('access_token=') ||
                          sessionStorage.getItem('supabase_recovery_mode') === 'true';
        
        if (isRecovery) {
          console.log('🔄 [Auth] Modo de recuperação detectado.');
          sessionStorage.setItem('supabase_recovery_mode', 'true');
          setScreen('reset-password');
          setLoading(false);
          isInitializingRef.current = false;
          return;
        }

        if (userError) {
          // Se for erro de sessão ausente, apenas tratamos como deslogado
          if (userError.message?.includes('session missing') || userError.status === 401) {
            setUser(null);
            setLoading(false);
            return;
          }
          throw userError;
        }

        if (!currentUser) {
          setUser(null);
          setLoading(false);
          return;
        }

        setUser(currentUser);

        // --- BYPASS PARA TELAS PÚBLICAS (Segredos, Solicitações, Formulários) ---
        // Se o usuário está apenas visualizando um conteúdo, não forçamos 2FA/MFA da conta dele
        const urlParams = new URLSearchParams(window.location.search);
        const isPublicId = urlParams.has('id') || urlParams.has('request') || urlParams.has('form') || urlParams.has('uid');
        const isPublicScreen = ['view-secret', 'fill-request', 'view-form', 'reset-password'].includes(screenRef.current) || isPublicId;

        if (isPublicScreen) {
          console.log('🔓 [App] Usuário em tela pública. Ignorando verificações de MFA da conta.');
          setLoading(false);
          return;
        }

        const { data: mfaData, error: mfaError } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
        if (mfaError) throw mfaError;
        
        // --- LÓGICA DE PERSISTÊNCIA E TEMPO ---
        const lastVerifiedStr = localStorage.getItem(`mfa_verified_at_${currentUser.id}`);
        const lastVerified = lastVerifiedStr ? parseInt(lastVerifiedStr) : 0;
        const now = Date.now();
        const timeSinceLastVerified = now - lastVerified;
        
        const needsVerification = timeSinceLastVerified > (2 * 60 * 60 * 1000); // 2 horas
        const recentlyVerified = timeSinceLastVerified < (5 * 60 * 1000); // 5 minutos (bypass)

        const { data: factorsData, error: factorsError } = await supabase.auth.mfa.listFactors();
        if (factorsError) throw factorsError;

        const allFactors = factorsData?.all || [];
        const verifiedFactor = allFactors.find(f => f.status === 'verified');

        // 1. Se JÁ TEM um fator verificado
        if (verifiedFactor) {
          setMfaFactorId(verifiedFactor.id);
          
          // Se o nível atual é aal1 OU se já passou 2 horas da última verificação
          // NÃO redirecionamos para 2FA se o usuário estiver visualizando um segredo ou preenchendo uma solicitação/formulário
          const params = new URLSearchParams(window.location.search);
          const isViewingScreen = ['view-secret', 'fill-request', 'view-form', 'reset-password'].includes(screenRef.current) || params.has('id') || params.has('uid');
          
          if (((mfaData?.currentLevel === 'aal1' && !recentlyVerified) || needsVerification) && !isViewingScreen) {
            setScreen('verify-2fa' as any);
            setLoading(false);
            return;
          }
          
          // Se está tudo certo (aal2 OU verificado recentemente e dentro do tempo)
          const authEntryScreens = ['home', 'login', 'register', 'reset-password'];
          if ((mfaData?.currentLevel === 'aal2' || recentlyVerified) && !needsVerification) {
            const redirectParams = localStorage.getItem('redirect_after_auth');
            if (redirectParams) {
              localStorage.removeItem('redirect_after_auth');
              window.history.pushState({}, '', redirectParams);
              const params = new URLSearchParams(redirectParams);
              if (params.get('id')) setScreen('view-secret');
              else if (params.get('request')) setScreen('fill-request');
              else if (params.get('form')) setScreen('view-form');
              setLoading(false);
              return;
            }

            if (authEntryScreens.includes(screenRef.current)) {
              setScreen('dashboard');
            }
            setLoading(false);
            return;
          }
          
          // Se chegou aqui com um fator verificado mas não é nível aal2 nem recente, garante desligar o loading
          setLoading(false);
        } 
        // 2. Se NÃO TEM nenhum fator verificado (Configuração Inicial ou Incompleta)
        else {
          // NÃO forçamos o setup de 2FA se o usuário estiver apenas visualizando um segredo/formulário
          // pois ele pode ser um convidado verificando identidade via e-mail e não quer criar conta completa
          if (['view-secret', 'fill-request', 'view-form'].includes(screenRef.current)) {
            setLoading(false);
            return;
          }

          // Tenta limpar e gerar novo QR
          try {
            // Limpar absolutamente TODOS os fatores existentes se nenhum estiver verificado
            // Isso resolve o erro de "friendly name "" already exists" pois remove o lixo pendente
            if (allFactors.length > 0) {
              console.log(`Limpando ${allFactors.length} fatores pendentes...`);
              for (const f of allFactors) {
                await supabase.auth.mfa.unenroll({ factorId: f.id }).catch((err) => {
                  console.warn('Erro ao remover fator antigo:', f.id, err);
                });
              }
              // Delay generoso para garantir que o Supabase limpou o cache/banco
              await new Promise(resolve => setTimeout(resolve, 800));
            }

            // Gera um novo Enroll com um nome amigável único com prefixo datado
            const uniqueName = `BS-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
            console.log('Iniciando novo enroll:', uniqueName);
            
            const { data: enrollData, error: enrollError } = await supabase.auth.mfa.enroll({ 
              factorType: 'totp',
              friendlyName: uniqueName
            });

            if (enrollError) {
              // Se ainda assim der erro de friendly name, tentamos uma última vez sem nome (default do Supabase)
              if (enrollError.message.includes('friendly name')) {
                console.log('Tentando enroll fallback sem nome...');
                const { data: fallbackData, error: fallbackError } = await supabase.auth.mfa.enroll({ factorType: 'totp' });
                if (fallbackError) throw fallbackError;
                if (fallbackData) {
                  setMfaFactorId(fallbackData.id);
                  setQrCodeUrl(fallbackData.totp.uri);
                  setScreen('setup-2fa' as any);
                }
              } else {
                throw enrollError;
              }
            } else if (enrollData) {
              setMfaFactorId(enrollData.id);
              setQrCodeUrl(enrollData.totp.uri);
              setScreen('setup-2fa' as any);
            }
          } catch (mfaSetupErr: any) {
            console.error('Falha crítica no setup de MFA:', mfaSetupErr);
            // Se houver erro, garantimos que o usuário saiba que precisa resetar
            setScreen('setup-2fa' as any);
            showNotification('Erro na segurança. Tente clicar em "Resetar" se o QR não aparecer.', 'error');
          }
        }
      } catch (err: any) {
        console.error('Erro na inicialização do Auth:', err);
        if (retries > 0 && err.message?.includes('fetch')) {
          console.log(`Tentando reconectar... (${retries} tentativas restantes)`);
          setTimeout(() => initializeAuth(retries - 1), 1500);
          return;
        }
        showNotification('Erro de conexão. Verifique suas chaves do Supabase ou internet.', 'error');
      } finally {
        setLoading(false);
        isInitializingRef.current = false;
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔔 Evento de Auth:', event, session?.user?.email);
      
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        if (session?.user) {
          setUser(session.user);
          // Limpamos os dados antes de recarregar para garantir isolamento
          setLinks([]);
          setRequests([]);
          setForms([]);
        }
        initializeAuth();
      } else if (event === 'PASSWORD_RECOVERY') {
        sessionStorage.setItem('supabase_recovery_mode', 'true');
        setScreen('reset-password');
      } else if (event === 'SIGNED_OUT' || (event as any) === 'USER_DELETED') {
        sessionStorage.removeItem('supabase_recovery_mode');
        setUser(null);
        setLinks([]);
        setRequests([]);
        setForms([]);
        setScreen('home');
        isInitializingRef.current = false;
        localStorage.removeItem('app_screen');
      }
    });

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('popstate', handleUrlParams);
    };
  }, []);

  // Fetch Dashboard Data
  useEffect(() => {
    if (user && screen === 'dashboard') {
      fetchLinks();
      fetchRequests();
      fetchForms();
      fetchApiApps();
    }
  }, [user, screen]);

  // --- FUNÇÕES DE NEGÓCIO ---

  const fetchLinks = async () => {
    if (!user) return;
    console.log(`🔍 [DEBUG] Buscando links para: ${user.email} (${user.id})`);
    const { data, error } = await supabase
      .from('secrets')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (!error && data) setLinks(data);
  };

  const fetchRequests = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('requests')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    
    if (!error && data) {
      // Auto-incineração de solicitações expiradas por tempo
      const now = new Date();
      const expiredRequests = data.filter(r => 
        r.status === 'completed' && 
        r.expires_at && 
        new Date(r.expires_at) < now
      );

      if (expiredRequests.length > 0) {
        const expiredIds = expiredRequests.map(r => r.id);
        await supabase.from('requests')
          .update({ status: 'completed', response: '' })
          .in('id', expiredIds);
        
        // Refetch para garantir que a UI mostre os dados atualizados
        const { data: updatedData } = await supabase
          .from('requests')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        if (updatedData) setRequests(updatedData);
      } else {
        setRequests(data);
      }
    }
  };

  const fetchForms = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('forms')
      .select('*, form_responses(*)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (!error && data) setForms(data);
  };

  const fetchApiApps = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('api_apps')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (!error && data) setApiApps(data);
  };

  const handleLogout = async () => {
    if (user) {
      localStorage.removeItem(`mfa_verified_at_${user.id}`);
    }
    await supabase.auth.signOut();
    setMfaFactorId('');
    setQrCodeUrl('');
    setMfaCode('');
    
    // Limpar estados do dashboard para não vazar pro próximo usuário
    localStorage.removeItem('form_builder_draft');
    setLinks([]);
    setRequests([]);
    setForms([]);
    setUser(null);
    
    setScreen('home');
    showNotification('Você saiu da conta.', 'info');
  };

  const resetMFA = async () => {
    try {
      setIsVerifying(true);
      const { data: factorsData } = await supabase.auth.mfa.listFactors();
      
      // Remove todos os fatores existentes (verificados ou não) de forma sequencial
      if (factorsData?.all && factorsData.all.length > 0) {
        for (const f of factorsData.all) {
          await supabase.auth.mfa.unenroll({ factorId: f.id }).catch(() => {});
        }
        // Delay para propagação no banco
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      // Gera um novo com nome único
      const { data: enrollData, error: enrollError } = await supabase.auth.mfa.enroll({ 
        factorType: 'totp',
        friendlyName: `BoldShare-Reset-${Math.random().toString(36).slice(2, 9)}`
      });
      if (enrollError) throw enrollError;
      
      setMfaFactorId(enrollData.id);
      setQrCodeUrl(enrollData.totp.uri);
      setMfaCode('');
      setScreen('setup-2fa' as any);
      showNotification('Novo QR Code gerado!', 'success');
    } catch (err: any) {
      showNotification('Erro ao resetar: ' + err.message, 'error');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleLogin = async () => {
    setIsLoggingIn(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email: loginEmail, password: loginPassword });
      if (error) throw error;
      // A lógica de redirecionamento para o MFA é tratada no useEffect de initializeAuth via onAuthStateChange
    } catch (err: any) {
      showNotification(err.message, 'error');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleVerify2FA = async () => {
    if (mfaCode.length !== 6) return;
    setIsVerifying(true);
    try {
      const challenge = await supabase.auth.mfa.challenge({ factorId: mfaFactorId });
      if (challenge.error) throw challenge.error;

      const verify = await supabase.auth.mfa.verify({
        factorId: mfaFactorId,
        challengeId: challenge.data.id,
        code: mfaCode
      });

      if (verify.error) throw verify.error;

      // Salva o timestamp da verificação vinculada ao usuário
      if (user) {
        localStorage.setItem(`mfa_verified_at_${user.id}`, Date.now().toString());
      }

      const redirectParams = localStorage.getItem('redirect_after_auth');
      if (redirectParams) {
        localStorage.removeItem('redirect_after_auth');
        window.history.pushState({}, '', redirectParams);
        const params = new URLSearchParams(redirectParams);
        if (params.get('id')) setScreen('view-secret');
        else if (params.get('request')) setScreen('fill-request');
        else if (params.get('form')) setScreen('view-form');
      } else {
        setScreen('dashboard');
      }
      
      setMfaCode('');
      showNotification('Autenticado com sucesso!', 'success');
    } catch (err: any) {
      showNotification('Código inválido.', 'error');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleRegister = async () => {
    if (!registerEmail || !registerPassword || !registerName) return;
    setIsRegistering(true);
    try {
      const { error } = await supabase.auth.signUp({
        email: registerEmail,
        password: registerPassword,
        options: { data: { full_name: registerName } }
      });
      if (error) throw error;
      showNotification('Verifique seu e-mail para confirmar a conta.', 'success');
      setScreen('login');
    } catch (err: any) {
      showNotification(err.message, 'error');
    } finally {
      setIsRegistering(false);
    }
  };

  const handleCreateSecret = async () => {
    const hasEmailRestriction = requireEmail || allowedEmails.length > 0 || allowedDomain;
    
    if (!password && !hasEmailRestriction) {
      showNotification('Defina uma senha ou ative a validação por e-mail.', 'info');
      return;
    }

    const validPairs = keyValuePairs.filter(p => p.key.trim() && p.value.trim());
    if (!secretText.trim() && validPairs.length === 0) {
      showNotification('Adicione algum conteúdo ou um par de dados.', 'info');
      return;
    }
    
    setIsCreatingSecret(true);
    try {
      const expiresAt = new Date();
      if (expiration.includes('1 hora')) expiresAt.setHours(expiresAt.getHours() + 1);
      else if (expiration.includes('24 horas')) expiresAt.setHours(expiresAt.getHours() + 24);
      else if (expiration.includes('7 dias')) expiresAt.setDate(expiresAt.getDate() + 7);

      // Se não houver senha mas houver trava de e-mail, permitimos criar
      // Nesse caso, o conteúdo é "criptografado" com uma string vazia (ou guardamos em plain se preferir, mas AES com '' é funcional)
      const encryptedContent = encryptData(secretText, password);
      // Se a senha for vazia, guardamos NULL no banco para o ViewSecret saber que não há 2FA
      const passwordHashed = password ? hashPassword(password) : null;
      const isOneTime = expiration.includes('Acesso único');

      let fileUrl = '';
      let creatorIp = '';

      if (restrictIp) {
        try {
          const res = await fetch('https://api.ipify.org?format=json');
          const ipData = await res.json();
          creatorIp = ipData.ip;
        } catch (e) {
          console.error('Falha ao obter IP para restrição:', e);
        }
      }

      if (selectedFile) {
        const fileExt = selectedFile.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${user?.id || 'anonymous'}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('secrets-files')
          .upload(filePath, selectedFile);

        if (uploadError) {
          if (uploadError.message.includes('Bucket not found')) {
            throw new Error('O bucket "secrets-files" não foi encontrado no seu Supabase. Por favor, crie um bucket público com este nome no painel do Supabase > Storage.');
          }
          if (uploadError.message.includes('row-level security policy')) {
            setErrorSql(`
-- LIBERAR O STORAGE (Para os arquivos funcionarem) --
CREATE POLICY "Permitir Upload Público" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'secrets-files');
CREATE POLICY "Permitir Visualização Pública" ON storage.objects FOR SELECT USING (bucket_id = 'secrets-files');
            `);
            throw new Error('Permissão Negada no Storage (RLS). Execute o código SQL de reparo.');
          }
          throw uploadError;
        }
        
        const { data: { publicUrl } } = supabase.storage
          .from('secrets-files')
          .getPublicUrl(filePath);
          
        fileUrl = publicUrl;
      }

      // Criptografar pares chave-valor se existirem
      let encryptedKeyValues: any = null;
      if (validPairs.length > 0) {
        const kvPayload = JSON.stringify(validPairs.map(({ key, value }) => ({ key, value })));
        encryptedKeyValues = encryptData(kvPayload, password);
      }

      const secretData = {
        name: referenceName || 'Segredo sem nome',
        content: encryptedContent,
        password: passwordHashed,
        key_values: encryptedKeyValues,
        expires_at: isOneTime ? null : expiresAt.toISOString(),
        max_views: isOneTime ? 1 : (limitViews ? maxViews : null),
        status: 'active',
        user_id: user?.id,
        creator_email: user?.email || null,
        allowed_email: allowedEmails.length > 0 ? allowedEmails.join(',').toLowerCase() : null,
        allowed_domain: allowedDomain ? allowedDomain.trim().toLowerCase() : null,
        restrict_ip: !!restrictIp,
        require_email: !!requireEmail,
        notify_access: !!notifyAccess,
        file_url: fileUrl || null,
        creator_ip: creatorIp || null,
        redirect_url: redirectUrl || null
      };

      console.log('🚀 Enviando para o Backend...');

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000); // 20 segundos de timeout

      try {
        const resp = await fetch('/api/create-secret', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(secretData),
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);

        const responseText = await resp.text();
        let data: any;
        try {
          data = responseText ? JSON.parse(responseText) : null;
        } catch (e) {
          console.error('Falha ao parsear JSON:', responseText);
          throw new Error('Servidor retornou uma resposta inválida. Verifique os logs.');
        }

        if (!resp.ok) {
          // Erro amigável se o backend ainda estiver barrado pelo RLS (provavelmente falta de chave mestra)
          if (resp.status === 403 || data?.error?.includes('security policy')) {
            if (data?.sql) setErrorSql(data.sql);
            throw new Error(data?.error || 'Permissão Negada (RLS). Verifique se a SUPABASE_SERVICE_ROLE_KEY está correta.');
          }
          throw new Error(data?.error || `Erro ${resp.status}: Falha ao criar segredo via servidor`);
        }

        if (data) {
          setLastCreatedId(data.id);
          showNotification('Segredo criado com sucesso!', 'success');
          
          // Limpar campos e ir para sucesso
          setSecretText('');
          setPassword('');
          setReferenceName('');
          setKeyValuePairs([{ id: Date.now(), key: '', value: '' }]);
          setSelectedFile(null);
          setExpiration('Expiração em 24 horas'); 
          setLimitViews(false);
          setMaxViews(1);
          setRestrictIp(false);
          setRequireEmail(false);
          setAllowedEmails([]);
          setAllowedDomain('');
          setNotifyAccess(false);
          setRedirectUrl('');
          setScreen('success');
        }
      } catch (fetchErr: any) {
        if (fetchErr.name === 'AbortError') {
          throw new Error('A conexão demorou muito e foi cancelada (Timeout). O servidor pode estar sobrecarregado ou bloqueado.');
        }
        throw fetchErr;
      }
    } catch (err: any) {
      console.error('Erro ao criar segredo:', err);
      showNotification('Erro ao salvar no banco: ' + (err.message || 'Erro desconhecido'), 'error');
    } finally {
      setIsCreatingSecret(false);
    }
  };

  const handleCreateRequest = async () => {
    if (!requestTitle) {
      showNotification('Dê um título para sua solicitação.', 'info');
      return;
    }
    
    setIsCreatingRequest(true);
    try {
      // Link de solicitação expira em 7 dias por padrão (tempo para o remetente preencher)
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      const { data, error } = await supabase.from('requests').insert([{
        title: requestTitle,
        description: requestDescription,
        status: 'active',
        expires_at: expiresAt.toISOString(),
        user_id: user?.id
      }]).select();

      if (error) throw error;

      if (data) {
        setLastCreatedId(data[0].id);
        setScreen('request-success' as any); // Assumindo que existe ou redirecionando apropriadamente
        setRequestTitle('');
        setRequestDescription('');
        showNotification('Solicitação criada com sucesso!', 'success');
      }
    } catch (err: any) {
      showNotification(err.message, 'error');
    } finally {
      setIsCreatingRequest(false);
    }
  };

  const navigateWithAuth = async (targetScreen: Screen) => {
    if (!user) {
      setScreen('login');
      return;
    }

    const { data } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    
    // Verificação do limite de 2 horas (7200000 ms)
    const mfaVerifiedAt = localStorage.getItem(`mfa_verified_at_${user.id}`);
    const isExpired = mfaVerifiedAt ? (Date.now() - parseInt(mfaVerifiedAt) > 7200000) : true;

    // Se o nível é aal1 OU se o tempo de 2 horas expirou, forçamos o fluxo 2FA
    if (data?.currentLevel === 'aal1' || isExpired) {
      const { data: factorsList } = await supabase.auth.mfa.listFactors();
      const factor = factorsList?.all?.find(f => f.status === 'verified');
      const unverified = factorsList?.all?.filter(f => (f.status as string) === 'unverified') || [];

      if (factor) {
        setMfaFactorId(factor.id);
        setScreen('verify-2fa' as any);
      } else {
        // Limpar lixo antes de tentar novo enroll em navegação
        if (unverified.length > 0) {
          for (const f of unverified) {
            await supabase.auth.mfa.unenroll({ factorId: f.id }).catch(() => {});
          }
          await new Promise(r => setTimeout(r, 400));
        }

        const { data: enrollData } = await supabase.auth.mfa.enroll({ 
          factorType: 'totp',
          friendlyName: `BoldShare-Nav-${Math.random().toString(36).slice(2, 9)}`
        });
        if (enrollData) {
          setMfaFactorId(enrollData.id);
          setQrCodeUrl(enrollData.totp.uri);
          setScreen('setup-2fa' as any);
        }
      }
      
      if (isExpired && mfaVerifiedAt) {
        showNotification('Sua sessão de segurança expirou (limite de 2 horas). Autentique-se novamente.', 'info');
      } else {
        showNotification('Autenticação de 2 fatores necessária.', 'info');
      }
      return;
    }

    setScreen(targetScreen);
  };

  const handleCopy = (text?: string) => {
    const link = text || `${window.location.origin}/s/${lastCreatedId}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    showNotification('Copiado!', 'success');
  };

  const queryParams = new URLSearchParams(window.location.search);
  const pathParts = window.location.pathname.split('/');
  const viewingFormId = queryParams.get('form') || (window.location.pathname.startsWith('/form/') ? pathParts[2] : '');
  const viewingSecretId = queryParams.get('id') || (window.location.pathname.startsWith('/s/') ? pathParts[2] : '');
  const fillingRequestId = queryParams.get('request') || (window.location.pathname.startsWith('/request/') ? pathParts[2] : '');

  // --- DETERMINAR SE É UMA TELA PÚBLICA (SEM NAVBAR) ---
  const isPublicScreen = 
    screen === 'view-secret' || 
    screen === 'view-form' || 
    screen === 'fill-request' || 
    screen === 'success' ||
    screen === 'request-success' ||
    screen === 'fill-success' ||
    screen === 'forgot-password' ||
    screen === 'reset-password' ||
    ['setup-2fa', 'verify-2fa'].includes(screen as any);

  return (
    <div className={`min-h-screen ${darkMode ? 'dark' : ''} bg-bg-base text-text-primary transition-colors duration-300 font-sans selection:bg-accent/20 selection:text-accent`}>
      {loading ? (
        <div className="min-h-screen flex items-center justify-center bg-bg-base">
          <div className="size-12 border-4 border-accent/30 border-t-accent rounded-full animate-spin" />
        </div>
      ) : (
        <>
      {!isPublicScreen && (
      <nav className={`border-b border-border-base sticky top-0 z-50 backdrop-blur-md ${screen === 'home' ? 'bg-bg-base/80 border-transparent' : 'bg-surface'}`}>
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => setScreen('home')}>
              <div className="size-10 bg-accent rounded-lg flex items-center justify-center text-white shadow-lg">
                <ShieldCheck size={24} />
              </div>
              <span className="font-black text-xl hidden sm:block tracking-tighter uppercase italic text-text-primary">Bold Share</span>
            </div>
            
            <div className="hidden md:flex items-center gap-10 ml-10">
              <button onClick={() => setScreen('home')} className={`text-[10px] font-black uppercase tracking-[0.2em] transition-all hover:translate-y-[-1px] ${screen === 'home' ? 'text-accent' : 'text-text-secondary hover:text-accent'}`}>Home</button>
              <button onClick={() => setScreen('create-secret')} className={`text-[10px] font-black uppercase tracking-[0.2em] transition-all hover:translate-y-[-1px] ${screen === 'create-secret' ? 'text-accent' : 'text-text-secondary hover:text-accent'}`}>Criar Link</button>
              
              {user ? (
                <>
                  <button onClick={() => setScreen('dashboard')} className={`text-[10px] font-black uppercase tracking-[0.2em] transition-all hover:translate-y-[-1px] ${screen === 'dashboard' ? 'text-accent' : 'text-text-secondary hover:text-accent'}`}>Dashboard</button>
                  <button 
                    onClick={() => {
                      setScreen('developer-portal');
                      window.history.pushState({}, '', '/developers');
                    }} 
                    className={`text-[10px] font-black uppercase tracking-[0.2em] transition-all hover:translate-y-[-1px] ${screen === 'developer-portal' ? 'text-accent' : 'text-text-secondary hover:text-accent'}`}
                  >
                    API / Devs
                  </button>
                </>
              ) : (
                <>
                  <button onClick={() => setScreen('how-it-works')} className={`text-[10px] font-black uppercase tracking-[0.2em] transition-all hover:translate-y-[-1px] ${screen === 'how-it-works' ? 'text-accent' : 'text-text-secondary hover:text-accent'}`}>Como Funciona</button>
                  <button onClick={() => setScreen('security')} className={`text-[10px] font-black uppercase tracking-[0.2em] transition-all hover:translate-y-[-1px] ${screen === 'security' ? 'text-accent' : 'text-text-secondary hover:text-accent'}`}>Segurança</button>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button onClick={() => setDarkMode(!darkMode)} className="p-2 text-text-secondary hover:text-accent transition-colors">
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            
            {user ? (
              <div className="flex items-center gap-4 pl-4 border-l border-border-base">
                <div className="text-right hidden sm:block">
                  <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest">Usuário Verificado</p>
                  <p className="text-xs font-bold text-text-primary">{user.email?.split('@')[0]}</p>
                </div>
                <button 
                  onClick={handleLogout} 
                  className="px-4 py-2 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all"
                >
                  Sair
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 sm:gap-4">
                <button onClick={() => setScreen('login')} className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-text-secondary hover:text-text-primary px-1">Entrar</button>
                <button 
                  onClick={() => setScreen('register')} 
                  className="px-4 sm:px-6 py-2 sm:py-2.5 bg-accent text-white text-[10px] sm:text-xs font-black uppercase tracking-widest rounded-xl hover:scale-105 active:scale-95 transition-all shadow-xl shadow-accent/20"
                >
                  Criar Conta
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>
      )}

      {/* Alerta de Storage se necessário */}
      <StorageWarning />
      <RLSRepairModal />

      <main className="relative">
        <div key="main-content-flow">
          {screen === 'home' && (
            <div key="home-screen-container">
              <HomeScreen setScreen={setScreen as any} user={user} />
            </div>
          )}

          {screen === 'create-secret' && (
            <div key="create-secret-container">
              <CreateSecretScreen 
                user={user}
                secretText={secretText} setSecretText={setSecretText}
                keyValuePairs={keyValuePairs} addPair={addPair} removePair={removePair} updatePair={updatePair}
                handleFormat={handleFormat} expiration={expiration} setExpiration={setExpiration}
                limitViews={limitViews} setLimitViews={setLimitViews} maxViews={maxViews} setMaxViews={setMaxViews}
                password={password} setPassword={setPassword} referenceName={referenceName} setReferenceName={setReferenceName}
                handleCreateSecret={handleCreateSecret}
                isCreating={isCreatingSecret}
                restrictIp={restrictIp} setRestrictIp={setRestrictIp}
                requireEmail={requireEmail} setRequireEmail={setRequireEmail}
                allowedEmails={allowedEmails} setAllowedEmails={setAllowedEmails}
                allowedDomain={allowedDomain} setAllowedDomain={setAllowedDomain}
                notifyAccess={notifyAccess} setNotifyAccess={setNotifyAccess}
                selectedFile={selectedFile} setSelectedFile={setSelectedFile}
                redirectUrl={redirectUrl} setRedirectUrl={setRedirectUrl}
              />
            </div>
          )}

          {screen === 'login' && (
            <div key="login">
              <LoginScreen 
                loginEmail={loginEmail} setLoginEmail={setLoginEmail}
                loginPassword={loginPassword} setLoginPassword={setLoginPassword}
                handleLogin={handleLogin} isLoggingIn={isLoggingIn} setScreen={setScreen as any}
              />
            </div>
          )}

          {screen === 'forgot-password' && (
            <div key="forgot-password">
              <ForgotPasswordScreen onBack={() => setScreen('login')} />
            </div>
          )}

          {screen === 'reset-password' && (
            <div key="reset-password">
              <ResetPasswordScreen onSuccess={() => {
                // Ao redefinir com sucesso, o Supabase mantém a sessão. 
                // Se o usuário já verificou o MFA durante o reset, ele pode entrar direto.
                setScreen('dashboard');
              }} />
            </div>
          )}

          {screen === 'view-form' && (
            <div key="view-form-screen">
              <ViewForm 
                id={viewingFormId} 
                user={user}
                onBack={() => { 
                  window.history.pushState({}, '', '/'); 
                  setScreen(user ? 'dashboard' : 'home'); 
                }} 
              />
            </div>
          )}

          {screen === 'form-builder' && (
            <div key="builder">
              <FormBuilderScreen onBack={() => setScreen(user ? 'dashboard' : 'home')} onPreview={() => {}} />
            </div>
          )}

          {screen === 'setup-2fa' as any && (
            <div key="setup-2fa">
              <div className="max-w-md mx-auto mt-20 p-8 bg-surface border border-border-base rounded-3xl shadow-xl text-center">
                <div className="size-16 bg-accent/10 text-accent rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <ShieldCheck size={32} />
                </div>
                <h2 className="text-2xl font-bold text-text-primary mb-2">Segurança Obrigatória</h2>
                <p className="text-text-secondary text-sm mb-6">Escaneie o QR Code abaixo para ativar o 2FA. Se o seu token der erro, use o botão de reset abaixo.</p>
                <div className="flex justify-center mb-6 bg-white p-4 rounded-xl inline-block min-h-[232px] flex-col items-center">
                  {qrCodeUrl ? (
                    <QRCodeSVG value={qrCodeUrl} size={200} />
                  ) : (
                    <div className="size-[200px] flex flex-col items-center justify-center gap-4 text-text-secondary">
                      <RefreshCcw className="animate-spin" size={32} />
                      <p className="text-[10px] uppercase font-black">Gerando QR Code...</p>
                      <button 
                        onClick={resetMFA}
                        className="mt-2 px-4 py-2 bg-accent text-white rounded-lg text-xs font-bold"
                      >
                        Tentar Gerar Novamente
                      </button>
                    </div>
                  )}
                </div>
                <div className="space-y-4">
                  <input 
                    type="text" maxLength={6} value={mfaCode}
                    onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="000000"
                    className="w-full px-4 py-4 text-center text-2xl tracking-[0.5em] font-mono bg-bg-base border border-border-base rounded-xl outline-none"
                  />
                  <button onClick={handleVerify2FA} disabled={isVerifying || mfaCode.length !== 6} className="w-full py-4 bg-accent text-white font-bold rounded-xl active:scale-95 transition-transform">
                    {isVerifying ? 'Verificando...' : 'Ativar 2FA'}
                  </button>
                  
                  <div className="pt-4 border-t border-border-base flex flex-col gap-2">
                    <button onClick={resetMFA} disabled={isVerifying} className="text-xs font-bold text-accent hover:underline">
                      Token inválido? Gerar novo QR Code
                    </button>
                    <button onClick={handleLogout} className="text-sm text-text-secondary hover:text-red-500 font-bold">Cancelar e Sair</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {screen === 'verify-2fa' as any && (
            <div key="verify-2fa">
              <div className="max-w-md mx-auto mt-20 p-8 bg-surface border border-border-base rounded-3xl shadow-xl text-center">
                <div className="size-16 bg-accent/10 text-accent rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Lock size={32} />
                </div>
                <h2 className="text-2xl font-bold text-text-primary mb-2">Código de Segurança</h2>
                <p className="text-text-secondary text-sm mb-8">Digite o código do seu aplicativo autenticador.</p>
                <div className="space-y-4">
                  <input 
                    type="text" maxLength={6} value={mfaCode}
                    onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="000000"
                    className="w-full px-4 py-4 text-center text-3xl tracking-[0.5em] font-mono bg-bg-base border border-border-base rounded-xl outline-none"
                  />
                  <button onClick={handleVerify2FA} disabled={isVerifying || mfaCode.length !== 6} className="w-full py-4 bg-accent text-white font-bold rounded-xl">
                    {isVerifying ? 'Verificando...' : 'Entrar'}
                  </button>
                  <button onClick={handleLogout} className="text-sm text-text-secondary hover:text-red-500 font-bold">Voltar</button>
                </div>
              </div>
            </div>
          )}

          {screen === 'register' && (
            <div key="register">
              <RegisterScreen 
                registerName={registerName} setRegisterName={setRegisterName}
                registerEmail={registerEmail} setRegisterEmail={setRegisterEmail}
                registerPassword={registerPassword} setRegisterPassword={setRegisterPassword}
                handleRegister={handleRegister} isRegistering={isRegistering} setScreen={setScreen as any}
              />
            </div>
          )}

          {screen === 'dashboard' && user && (
            <div key={`dashboard-${user.id}`}>
              <DashboardScreen 
                userEmail={user.email || ''}
                links={links} requests={requests} forms={forms}
                dashboardTab={dashboardTab as any} setDashboardTab={setDashboardTab as any}
                fetchLinks={fetchLinks} fetchRequests={fetchRequests} fetchForms={fetchForms}
                copied={copied} setCopied={setCopied} setScreen={setScreen as any} handleCopy={handleCopy}
                user={user}
                secretText={secretText}
                setSecretText={setSecretText}
                keyValuePairs={keyValuePairs}
                addPair={addPair}
                removePair={removePair}
                updatePair={updatePair}
                handleFormat={handleFormat}
                expiration={expiration}
                setExpiration={setExpiration}
                limitViews={limitViews}
                setLimitViews={setLimitViews}
                maxViews={maxViews}
                setMaxViews={setMaxViews}
                password={password}
                setPassword={setPassword}
                referenceName={referenceName}
                setReferenceName={setReferenceName}
                handleCreateSecret={handleCreateSecret}
                isCreating={isCreatingSecret}
                restrictIp={restrictIp}
                setRestrictIp={setRestrictIp}
                requireEmail={requireEmail}
                setRequireEmail={setRequireEmail}
                allowedEmails={allowedEmails}
                setAllowedEmails={setAllowedEmails}
                allowedDomain={allowedDomain}
                setAllowedDomain={setAllowedDomain}
                notifyAccess={notifyAccess}
                setNotifyAccess={setNotifyAccess}
                selectedFile={selectedFile}
                setSelectedFile={setSelectedFile}
                redirectUrl={redirectUrl}
                setRedirectUrl={setRedirectUrl}
              />
            </div>
          )}

          {screen === 'success' && (
            <div key="success">
              <SuccessScreen 
                generatedLinkId={lastCreatedId} qrVisible={qrVisible} setQrVisible={setQrVisible}
                copied={copied} handleCopy={() => handleCopy()} setScreen={setScreen as any}
                restrictIp={restrictIp} requireEmail={requireEmail}
              />
            </div>
          )}

          {screen === 'request-success' && (
            <div key="request-success">
              <RequestSuccessScreen 
                generatedLinkId={lastCreatedId}
                copied={copied}
                handleCopy={(text) => handleCopy(text)}
                setScreen={setScreen as any}
              />
            </div>
          )}

          {screen === 'view-secret' && (
            <div key="view-secret-screen">
              <ViewSecret 
                id={viewingSecretId} 
                user={user}
                onBack={() => { window.history.pushState({}, '', '/'); setScreen('home'); }} 
                setScreen={setScreen as any}
              />
            </div>
          )}

          {screen === 'fill-request' && (
            <div key="fill-request-screen">
              <FillRequest 
                id={fillingRequestId} 
                user={user}
                onSuccess={() => { 
                  window.history.pushState({}, '', '/'); 
                  setScreen(user ? 'dashboard' : 'home'); 
                }} 
              />
            </div>
          )}

          {screen === 'create-request' && (
            <div key="create-request">
              <CreateRequestScreen 
                title={requestTitle} setTitle={setRequestTitle}
                description={requestDescription} setDescription={setRequestDescription}
                expiration={requestExpiration} setExpiration={setRequestExpiration}
                isOneTime={requestIsOneTime} setIsOneTime={setRequestIsOneTime}
                isCreating={isCreatingRequest} handleCreateRequest={handleCreateRequest} setScreen={setScreen as any}
              />
            </div>
          )}

          {screen === 'how-it-works' && (
            <div key="how-it-works">
              <HowItWorksScreen setScreen={setScreen as any} />
            </div>
          )}

          {screen === 'developer-portal' && (
            <div key="developer-portal">
              <DeveloperPortal setScreen={setScreen as any} />
            </div>
          )}

          {screen === 'security' && (
            <div key="security">
              <SecurityScreen setScreen={setScreen as any} />
            </div>
          )}

        </div>
      </main>
      </>
      )}
    </div>
  );
}