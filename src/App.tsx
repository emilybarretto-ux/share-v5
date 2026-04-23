import React, { useState, useEffect } from 'react';
// Force redeploy sync v1.0.5
import { AnimatePresence, motion } from 'motion/react';
import { Sun, Moon, ShieldCheck, Mail, Lock, Eye, EyeOff, Copy, X, Timer, Fingerprint, RefreshCcw } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { supabase } from './lib/supabase';
import { encryptData, hashPassword } from './lib/crypto';
import { Screen, SharedLink, DataRequest } from './types';
import { useNotification } from './components/shared/NotificationProvider';

// Screens
import { HomeScreen } from './components/screens/HomeScreen';
import { LoginScreen } from './components/screens/LoginScreen';
import { RegisterScreen } from './components/screens/RegisterScreen';
import { DashboardScreen } from './components/screens/DashboardScreen';
import { SuccessScreen } from './components/screens/SuccessScreen';
import { CreateRequestScreen } from './components/screens/CreateRequestScreen';
import { RequestSuccessScreen } from './components/screens/RequestSuccessScreen';
import { HowItWorksScreen } from './components/screens/HowItWorksScreen';
import { SecurityScreen } from './components/screens/SecurityScreen';
import { VerificationScreen } from './components/screens/VerificationScreen';
import { PasswordGateScreen } from './components/screens/PasswordGateScreen';

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
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-300">
        <motion.div 
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
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
                      toast.success('Comando SQL copiado!');
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
        </motion.div>
      </div>
    );
  };
  const [screen, setScreenState] = useState<Screen>(() => {
    // 1. Tenta recuperar a tela da URL primeiro (Fator determinante)
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.has('id')) return 'view-secret';
      if (params.has('request')) return 'fill-request';
      if (params.has('form')) return 'view-form';
      
      // 2. Persistência de tela (apenas para certas telas)
      const savedScreen = localStorage.getItem('app_screen') as Screen;
      if (savedScreen && ['dashboard', 'form-builder', 'security', 'how-it-works'].includes(savedScreen)) {
        return savedScreen;
      }
    }
    return 'home';
  });
  
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
  const [dashboardTab, setDashboardTab] = useState<'links' | 'requests' | 'forms' | 'security'>('links');

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
      const urlId = params.get('id');
      const urlRequest = params.get('request');
      const urlForm = params.get('form');

      if (urlId) setScreen('view-secret');
      else if (urlRequest) setScreen('fill-request');
      else if (urlForm) setScreen('view-form');
    };

    // Inicializa URL params uma vez no montagem
    handleUrlParams();
    window.addEventListener('popstate', handleUrlParams);

    const initializeAuth = async (retries = 3) => {
      if (isInitializingRef.current && retries === 3) return;
      isInitializingRef.current = true;

      try {
        const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();
        
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

        const { data: mfaData, error: mfaError } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
        if (mfaError) throw mfaError;
        
        // --- LÓGICA DE PERSISTÊNCIA E TEMPO (2 HORAS) ---
        const lastVerifiedStr = localStorage.getItem(`mfa_verified_at_${currentUser.id}`);
        const lastVerified = lastVerifiedStr ? parseInt(lastVerifiedStr) : 0;
        const needsVerification = (Date.now() - lastVerified) > (2 * 60 * 60 * 1000); // 2 horas

        const { data: factorsData, error: factorsError } = await supabase.auth.mfa.listFactors();
        if (factorsError) throw factorsError;

        const allFactors = factorsData?.all || [];
        const verifiedFactor = allFactors.find(f => f.status === 'verified');

        // 1. Se JÁ TEM um fator verificado
        if (verifiedFactor) {
          setMfaFactorId(verifiedFactor.id);
          
          // Se o nível atual é aal1 OU se já passou 2 horas da última verificação
          if (mfaData?.currentLevel === 'aal1' || needsVerification) {
            setScreen('verify-2fa' as any);
            setLoading(false);
            return;
          }
          
          // Se está tudo certo (aal2 e dentro do tempo), vai pro dashboard se estiver em telas de entrada
          const authEntryScreens = ['home', 'login', 'register'];
          if (mfaData?.currentLevel === 'aal2' && !needsVerification && authEntryScreens.includes(screenRef.current)) {
            setScreen('dashboard');
          }
        } 
        // 2. Se NÃO TEM nenhum fator verificado (Configuração Inicial ou Incompleta)
        else {
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
      } else if (event === 'SIGNED_OUT' || (event as any) === 'USER_DELETED') {
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

  const handleLogout = async () => {
    if (user) {
      localStorage.removeItem(`mfa_verified_at_${user.id}`);
    }
    await supabase.auth.signOut();
    setMfaFactorId('');
    setQrCodeUrl('');
    setMfaCode('');
    
    // Limpar estados do dashboard para não vazar pro próximo usuário
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

      setScreen('dashboard');
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
    if (!password) {
      showNotification('Defina uma senha de proteção.', 'info');
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

      const encryptedContent = encryptData(secretText, password);
      const passwordHashed = hashPassword(password);
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

      console.log('🚀 Criando segredo via API Backend para contornar RLS...');

      const secretData = {
        name: referenceName || 'Segredo sem nome',
        content: encryptedContent,
        password: passwordHashed,
        key_values: encryptedKeyValues,
        expires_at: isOneTime ? null : expiresAt.toISOString(),
        max_views: isOneTime ? 1 : (limitViews ? maxViews : null),
        status: 'active',
        user_id: user?.id,
        restrict_ip: !!restrictIp,
        require_email: !!requireEmail,
        notify_access: !!notifyAccess,
        file_url: fileUrl || null,
        creator_ip: creatorIp || null,
        redirect_url: redirectUrl || null
      };

      const resp = await fetch('/api/secrets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(secretData)
      });

      if (!resp.ok) {
        const errorData = await resp.json();
        // Erro amigável se o backend ainda estiver barrado pelo RLS (provavelmente falta de chave mestra)
        if (resp.status === 403 || errorData.error?.includes('security policy')) {
          if (errorData.sql) setErrorSql(errorData.sql);
          throw new Error(errorData.error || 'Permissão Negada (RLS). Verifique se a SUPABASE_SERVICE_ROLE_KEY está correta nos Secrets.');
        }
        throw new Error(errorData.error || 'Falha ao criar segredo via servidor');
      }

      const data = await resp.json();

      if (data) {
        setLastCreatedId(data.id);
        setScreen('success');
        setSecretText('');
        setPassword('');
        setKeyValuePairs([]);
        setReferenceName('');
        showNotification('Comunicação gerada com sucesso!', 'success');
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
    const link = text || `${window.location.origin}/?id=${lastCreatedId}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    showNotification('Copiado!', 'success');
  };

  // Renderização de Carregamento
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-bg-base">
      <div className="size-12 border-4 border-accent/30 border-t-accent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-bg-base text-text-primary font-sans">
      <nav className="border-b border-border-base bg-surface sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => setScreen('home')}>
              <div className="size-10 bg-accent rounded-lg flex items-center justify-center text-white shadow-lg">
                <ShieldCheck size={24} />
              </div>
              <span className="font-bold text-xl hidden sm:block">Bold Share</span>
            </div>
            <div className="flex items-center gap-6 ml-4">
              <button onClick={() => setScreen('home')} className="text-sm font-bold text-text-secondary hover:text-accent">Início</button>
              <button onClick={() => navigateWithAuth('dashboard')} className="text-sm font-bold text-text-secondary hover:text-accent">Dashboard</button>
              <button onClick={() => navigateWithAuth('form-builder')} className="text-sm font-bold text-text-secondary hover:text-accent">Construtor</button>
              <button onClick={() => navigateWithAuth('create-request')} className="text-sm font-bold text-text-secondary hover:text-accent">Solicitação</button>
              <button onClick={() => setScreen('security')} className="text-sm font-bold text-text-secondary hover:text-accent">Segurança</button>
              <button onClick={() => setScreen('how-it-works')} className="text-sm font-bold text-text-secondary hover:text-accent truncate max-w-[100px] sm:max-w-none">Como Funciona</button>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => setDarkMode(!darkMode)} className="p-2 text-text-secondary hover:text-accent">
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            {user ? (
              <button 
                onClick={handleLogout} 
                className="px-4 py-2 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white text-sm font-bold rounded-lg transition-all"
              >
                Sair
              </button>
            ) : (
              <button 
                onClick={() => setScreen('login')} 
                className="px-4 py-2 bg-accent text-white text-sm font-bold rounded-lg hover:opacity-90 transition-all"
              >
                Entrar
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Alerta de Storage se necessário */}
      <StorageWarning />
      <RLSRepairModal />

      <main className="relative">
        <AnimatePresence mode="wait">
          {screen === 'home' && (
            <motion.div key="home" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <HomeScreen 
                secretText={secretText} setSecretText={setSecretText}
                keyValuePairs={keyValuePairs} addPair={addPair} removePair={removePair} updatePair={updatePair}
                handleFormat={handleFormat} expiration={expiration} setExpiration={setExpiration}
                limitViews={limitViews} setLimitViews={setLimitViews} maxViews={maxViews} setMaxViews={setMaxViews}
                password={password} setPassword={setPassword} referenceName={referenceName} setReferenceName={setReferenceName}
                handleCreateSecret={handleCreateSecret} setScreen={setScreen as any}
                isCreating={isCreatingSecret}
                restrictIp={restrictIp} setRestrictIp={setRestrictIp}
                requireEmail={requireEmail} setRequireEmail={setRequireEmail}
                notifyAccess={notifyAccess} setNotifyAccess={setNotifyAccess}
                selectedFile={selectedFile} setSelectedFile={setSelectedFile}
                redirectUrl={redirectUrl} setRedirectUrl={setRedirectUrl}
              />
            </motion.div>
          )}

          {screen === 'login' && (
            <motion.div key="login" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <LoginScreen 
                loginEmail={loginEmail} setLoginEmail={setLoginEmail}
                loginPassword={loginPassword} setLoginPassword={setLoginPassword}
                handleLogin={handleLogin} isLoggingIn={isLoggingIn} setScreen={setScreen as any}
              />
            </motion.div>
          )}

          {screen === 'view-form' && (
            <motion.div key={`form-${new URLSearchParams(window.location.search).get('form')}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <ViewForm 
                id={new URLSearchParams(window.location.search).get('form') || ''} 
                onBack={() => { window.history.pushState({}, '', '/'); setScreen('home'); }} 
              />
            </motion.div>
          )}

          {screen === 'form-builder' && (
            <motion.div key="builder" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <FormBuilderScreen onBack={() => setScreen('home')} onPreview={() => {}} />
            </motion.div>
          )}

          {screen === 'setup-2fa' as any && (
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
          )}

          {screen === 'verify-2fa' as any && (
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
          )}

          {screen === 'register' && (
            <RegisterScreen 
              registerName={registerName} setRegisterName={setRegisterName}
              registerEmail={registerEmail} setRegisterEmail={setRegisterEmail}
              registerPassword={registerPassword} setRegisterPassword={setRegisterPassword}
              handleRegister={handleRegister} isRegistering={isRegistering} setScreen={setScreen as any}
            />
          )}

          {screen === 'dashboard' && user && (
            <DashboardScreen 
              key={`dashboard-${user.id}`}
              userEmail={user.email || ''}
              links={links} requests={requests} forms={forms}
              dashboardTab={dashboardTab} setDashboardTab={setDashboardTab}
              fetchLinks={fetchLinks} fetchRequests={fetchRequests} fetchForms={fetchForms}
              copied={copied} setCopied={setCopied} setScreen={setScreen as any} handleCopy={handleCopy}
            />
          )}

          {screen === 'success' && (
            <SuccessScreen 
              generatedLinkId={lastCreatedId} qrVisible={qrVisible} setQrVisible={setQrVisible}
              copied={copied} handleCopy={() => handleCopy()} setScreen={setScreen as any}
              restrictIp={restrictIp} requireEmail={requireEmail}
            />
          )}

          {screen === 'request-success' && (
            <RequestSuccessScreen 
              generatedLinkId={lastCreatedId}
              copied={copied}
              handleCopy={(text) => handleCopy(text)}
              setScreen={setScreen as any}
            />
          )}

          {screen === 'view-secret' && (
            <motion.div key={`secret-${new URLSearchParams(window.location.search).get('id')}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <ViewSecret 
                id={new URLSearchParams(window.location.search).get('id') || ''} 
                onBack={() => { window.history.pushState({}, '', '/'); setScreen('home'); }} 
              />
            </motion.div>
          )}

          {screen === 'fill-request' && (
            <motion.div key={`request-${new URLSearchParams(window.location.search).get('request')}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <FillRequest 
                id={new URLSearchParams(window.location.search).get('request') || ''} 
                onSuccess={() => { window.history.pushState({}, '', '/'); setScreen('home'); }} 
              />
            </motion.div>
          )}

          {screen === 'create-request' && (
            <motion.div key="create-request" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <CreateRequestScreen 
                title={requestTitle} setTitle={setRequestTitle}
                description={requestDescription} setDescription={setRequestDescription}
                expiration={requestExpiration} setExpiration={setRequestExpiration}
                isOneTime={requestIsOneTime} setIsOneTime={setRequestIsOneTime}
                isCreating={isCreatingRequest} handleCreateRequest={handleCreateRequest} setScreen={setScreen as any}
              />
            </motion.div>
          )}

          {screen === 'how-it-works' && (
            <motion.div key="how-it-works" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <HowItWorksScreen setScreen={setScreen as any} />
            </motion.div>
          )}

          {screen === 'security' && (
            <motion.div key="security" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <SecurityScreen setScreen={setScreen as any} />
            </motion.div>
          )}

        </AnimatePresence>
      </main>
    </div>
  );
}