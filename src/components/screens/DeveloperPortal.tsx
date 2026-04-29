import React from 'react';
import { Terminal, Copy, Check, ChevronRight, Key, Shield, Smartphone, ArrowLeft, ArrowRight, Send, Zap, Book, Lock, Code, Trash2, Eye, Plus, ExternalLink, Cpu } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../../lib/supabase';
import { useNotification } from '../shared/NotificationProvider';

export const DeveloperPortal = ({ setScreen }: { setScreen: (s: any) => void }) => {
  const [copied, setCopied] = React.useState<string | null>(null);
  const [activeTab, setActiveTab] = React.useState('apps');
  const [apiApps, setApiApps] = React.useState<any[]>([]);
  const [isCreatingApp, setIsCreatingApp] = React.useState(false);
  const [newAppName, setNewAppName] = React.useState('');
  const [showSecretId, setShowSecretId] = React.useState<string | null>(null);
  const { showNotification } = useNotification();
  const [user, setUser] = React.useState<any>(null);

  React.useEffect(() => {
    fetchUserAndApps();
  }, []);

  const fetchUserAndApps = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        const { data, error } = await supabase
          .from('api_apps')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        
        if (error) {
          if (error.message.includes('not found')) {
            showNotification('Módulo de API: Tabela api_apps não encontrada. Crie-a no SQL Editor do Supabase.', 'info');
            setTestResult({ 
              status: 'Aviso de Configuração', 
              error: 'Tabela api_apps não instalada.',
              hint: 'Copie o SQL de criação no seu Supabase para ativar este módulo.'
            });
          } else {
            showNotification('Erro API: ' + error.message, 'error');
          }
          return;
        }
        if (data) setApiApps(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const createApp = async () => {
    if (!newAppName || !user) return;
    const clientId = 'cl_' + Math.random().toString(36).substring(2, 12);
    const clientSecret = 'sk_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

    const { error } = await supabase.from('api_apps').insert([{
      name: newAppName,
      client_id: clientId,
      client_secret: clientSecret,
      user_id: user.id,
      scopes: ['secrets:read', 'secrets:write']
    }]);

    if (error) {
       showNotification('Erro ao criar: ' + error.message, 'error');
    } else {
       showNotification('App criado com sucesso!', 'success');
       setNewAppName('');
       setIsCreatingApp(false);
       fetchUserAndApps();
    }
  };

  const deleteApp = async (id: string) => {
    const { error } = await supabase.from('api_apps').delete().eq('id', id);
    if (!error) {
      showNotification('App removido.', 'success');
      fetchUserAndApps();
    }
  };

  const sections = [
    { id: 'introduction', title: 'Home', icon: <Cpu size={18} /> },
    { id: 'apps', title: 'Minhas Credenciais', icon: <Key size={18} /> },
    { id: 'playground', title: 'API Playground', icon: <Zap size={18} /> },
    { id: 'docs', title: 'Documentação API', icon: <Book size={18} /> },
    { id: 'postman', title: 'Ambiente Externo', icon: <Terminal size={18} /> },
  ];

  const [testClientId, setTestClientId] = React.useState('');
  const [testClientSecret, setTestClientSecret] = React.useState('');
  const [testToken, setTestToken] = React.useState('');
  const [testResult, setTestResult] = React.useState<any>(null);
  const [isTesting, setIsTesting] = React.useState(false);

  const testGetToken = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const response = await fetch('/api/auth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId: testClientId, clientSecret: testClientSecret })
      });
      const data = await response.json();
      if (data.access_token) {
        setTestToken(data.access_token);
        setTestResult({ status: 'Sucesso!', data });
        showNotification('Token gerado com sucesso!', 'success');
      } else {
        setTestResult({ status: 'Erro', error: data.error });
        showNotification('Falha ao gerar token: ' + (data.error || 'Erro desconhecido'), 'error');
      }
    } catch (err: any) {
      setTestResult({ status: 'Erro de Conexão', error: err.message });
    } finally {
      setIsTesting(false);
    }
  };

  const testListSecrets = async () => {
    if (!testToken) return;
    setIsTesting(true);
    try {
      const response = await fetch('/api/v1/secrets', {
        headers: { 'Authorization': `Bearer ${testToken}` }
      });
      const data = await response.json();
      setTestResult({ status: 'Resposta da API', data });
      showNotification('Busca realizada!', 'success');
    } catch (err: any) {
      setTestResult({ status: 'Erro', error: err.message });
    } finally {
      setIsTesting(false);
    }
  };

  const [expandedEndpoint, setExpandedEndpoint] = React.useState<string | null>(null);
  const [requestHeaders, setRequestHeaders] = React.useState<Record<string, string>>({});
  const [requestParams, setRequestParams] = React.useState<Record<string, string>>({});
  const [requestBody, setRequestBody] = React.useState<string>('{}');

  const endpoints = [
    {
      id: 'auth-token',
      method: 'POST',
      path: '/api/auth/token',
      title: 'Obter access_token',
      description: 'Gera um token JWT válido por 24h usando suas credenciais de Client ID e Client Secret.',
      auth: false,
      body: {
        clientId: { type: 'string', required: true, description: 'Seu ID de cliente gerado no portal', example: 'cl_...' },
        clientSecret: { type: 'string', required: true, description: 'Sua chave secreta (mantenha em segurança)', example: 'sk_...' }
      }
    },
    {
      id: 'list-secrets',
      method: 'GET',
      path: '/api/v1/secrets',
      title: 'Listar Segredos',
      description: 'Retorna a lista de todos os segredos criados pelo seu usuário. Paginação e filtros podem ser aplicados via query.',
      auth: true,
      scopes: ['secrets:read'],
      query: {
        limit: { type: 'number', required: false, description: 'Quantidade de itens (padrão 100)' },
        offset: { type: 'number', required: false, description: 'Ponto de partida para paginação' }
      }
    },
    {
      id: 'get-secret',
      method: 'GET',
      path: '/api/v1/secrets/:id',
      title: 'Ver Detalhes do Segredo',
      description: 'Recupera os dados completos de um segredo específico. O conteúdo é descriptografado se a senha estiver correta.',
      auth: true,
      params: { id: { type: 'string', required: true, description: 'ID único do segredo' } },
      query: { 
        password: { type: 'string', required: false, description: 'Senha de acesso (se definida na criação)' } 
      },
      scopes: ['secrets:read']
    },
    {
      id: 'create-secret',
      method: 'POST',
      path: '/api/v1/secrets',
      title: 'Criar Novo Segredo',
      description: 'Armazena um novo dado sensível. Você pode definir regras de autodestruição, expiração temporal e restrições de acesso por e-mail ou IP.',
      auth: true,
      scopes: ['secrets:write'],
      body: {
        name: { type: 'string', required: true, example: 'Minha API Key', description: 'Nome identificador do segredo' },
        content: { type: 'string', required: true, example: 'v-secret-123', description: 'O valor sensível que será armazenado' },
        password: { type: 'string', required: false, description: 'Senha adicional para acesso (Opcional)' },
        expiration_hours: { type: 'number', required: false, example: 24, description: 'Prazo de validade em horas. Opções sugeridas: 1, 24, 168 (7 dias).' },
        max_views: { type: 'number', required: false, example: 1, description: 'Limite de visualizações. Use 1 para garantir acesso único.' },
        is_burn_on_read: { type: 'boolean', required: false, example: true, description: 'Acesso Único Automático: Se true, o segredo é deletado imediatamente após a primeira leitura.' },
        restrict_ip: { type: 'boolean', required: false, example: false, description: 'Se true, apenas o seu IP atual poderá acessar' },
        require_email: { type: 'boolean', required: false, example: false, description: 'Exigir que o destinatário valide o e-mail (2FA)' },
        allowed_emails: { type: 'array', required: false, example: ['user@example.com'], description: 'Lista de e-mails específicos permitidos' },
        allowed_domain: { type: 'string', required: false, example: 'empresa.com', description: 'Restringir a um domínio de e-mail (ex: boldsolution.com.br)' },
        redirect_url: { type: 'string', required: false, example: 'https://seusite.com', description: 'URL para onde o usuário será enviado após ler o segredo' },
        notify_access: { type: 'boolean', required: false, example: true, description: 'Enviar e-mail para você quando for acessado' }
      }
    },
    {
      id: 'create-request',
      method: 'POST',
      path: '/api/v1/requests',
      title: 'Criar Solicitação de Dados',
      description: 'Gera um link seguro para solicitar informações (arquivos ou texto) de terceiros.',
      auth: true,
      scopes: ['secrets:write'],
      body: {
        title: { type: 'string', required: true, example: 'Documentos para Onboarding', description: 'Título da solicitação' },
        description: { type: 'string', required: false, example: 'Favor enviar o RG e CPF.', description: 'Instruções para quem for enviar os dados' },
        expiration_hours: { type: 'number', required: false, example: 48, description: 'Expiração do link (em horas). Sugestões: 1, 24, 168.' }
      }
    }
  ];

  const handleTestEndpoint = async (endpoint: any) => {
    setIsTesting(true);
    setTestResult(null);
    try {
      let url = endpoint.path;
      // Replace path params
      if (endpoint.params) {
        Object.keys(requestParams).forEach(key => {
          url = url.replace(`:${key}`, requestParams[key]);
        });
      }
      // Add query params
      const query = new URLSearchParams();
      if (endpoint.query) {
        Object.keys(requestParams).forEach(key => {
          if (endpoint.query[key]) query.append(key, requestParams[key]);
        });
      }
      const queryString = query.toString();
      if (queryString) url += `?${queryString}`;

      const options: RequestInit = {
        method: endpoint.method,
        headers: {
          'Content-Type': 'application/json',
          ...requestHeaders
        }
      };

      if (endpoint.auth && testToken) {
        (options.headers as any)['Authorization'] = `Bearer ${testToken}`;
      }

      if (['POST', 'PUT', 'PATCH'].includes(endpoint.method)) {
        options.body = requestBody;
      }

      const response = await fetch(url, options);
      const data = await response.json();
      
      setTestResult({
        status: response.status + ' ' + response.statusText,
        data,
        isError: !response.ok
      });
      
      if (response.ok) {
        showNotification('Requisição concluída!', 'success');
        if (endpoint.id === 'auth-token' && data.access_token) {
           setTestToken(data.access_token);
        }
      } else {
        showNotification('Erro na requisição: ' + (data.error || response.statusText), 'error');
      }
    } catch (err: any) {
      setTestResult({ status: 'Network Error', error: err.message, isError: true });
    } finally {
      setIsTesting(false);
    }
  };

  const CodeBlock = ({ code, id }: { code: string, id: string }) => (
    <div className="relative group">
      <div className="absolute right-4 top-4 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={() => handleCopy(code, id)} className="p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white">
          {copied === id ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
        </button>
      </div>
      <pre className="bg-slate-900 p-6 rounded-2xl overflow-x-auto text-sm font-mono text-emerald-400 border border-white/5">
        <code>{code}</code>
      </pre>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-300 font-sans selection:bg-accent/30">
      {/* Header Estilo Developer */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-white/5 px-8 py-5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="size-10 bg-gradient-to-tr from-accent to-indigo-600 rounded-xl flex items-center justify-center text-white shadow-xl shadow-accent/20">
              <Code size={24} strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-xl font-black text-white tracking-tighter">BOLD<span className="text-accent underline decoration-2 underline-offset-4">SHARE</span>_DEV</h1>
              <p className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest">Developer Gateway v1.0</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <button onClick={() => {
              setScreen('home');
              window.history.pushState({}, '', '/');
            }} className="text-sm font-bold text-slate-400 hover:text-white transition-colors flex items-center gap-2">
              <ArrowLeft size={16} /> App Principal
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto pt-32 pb-24 px-8 flex flex-col lg:flex-row gap-16">
        {/* Siderbar */}
        <aside className="w-full lg:w-64 space-y-2 shrink-0">
          {sections.map((sec) => (
            <button
              key={sec.id}
              onClick={() => setActiveTab(sec.id)}
              className={`w-full flex items-center gap-3 px-5 py-3.5 rounded-2xl text-sm font-bold transition-all ${
                activeTab === sec.id 
                  ? 'bg-accent text-white shadow-lg shadow-accent/20' 
                  : 'text-slate-500 hover:bg-white/5 hover:text-slate-200'
              }`}
            >
              {sec.icon}
              {sec.title}
            </button>
          ))}
          
          <div className="mt-12 p-6 bg-accent/5 rounded-3xl border border-accent/10">
            <div className="flex items-center gap-2 text-accent mb-2">
              <Shield size={16} />
              <span className="text-[10px] font-black uppercase">Segurança</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Trate o seu <code className="text-accent">client_secret</code> como uma senha. Nunca o exponha no lado do cliente (browser).
            </p>
          </div>
        </aside>

        {/* Content */}
        <main className="flex-1 space-y-12">
          <AnimatePresence mode="wait">
            {activeTab === 'introduction' && (
              <motion.div key="intro" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                <div className="space-y-4">
                  <h2 className="text-5xl font-black text-white tracking-tight">Construa sobre <br/>o Bold Share.</h2>
                  <p className="text-lg text-slate-400 max-w-2xl leading-relaxed">
                    Nossa API é robusta, segura e permite que você integre compartilhamento de segredos e coleta de dados 
                    diretamente em seus fluxos de trabalho, ERPs e ferramentas personalizadas.
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                  <div className="p-8 bg-white/5 rounded-[2rem] border border-white/5 hover:border-accent/30 transition-colors">
                    <Zap className="text-accent mb-4" size={32} />
                    <h4 className="text-lg font-bold text-white mb-2">Tokens Rápidos</h4>
                    <p className="text-sm text-slate-500">Autenticação via OAuth2 para máxima segurança e praticidade.</p>
                  </div>
                  <div className="p-8 bg-white/5 rounded-[2rem] border border-white/5 hover:border-accent/30 transition-colors">
                    <Smartphone className="text-indigo-400 mb-4" size={32} />
                    <h4 className="text-lg font-bold text-white mb-2">Full CRUD</h4>
                    <p className="text-sm text-slate-500">Controle total sobre segredos: Criar, Listar, Atualizar e Deletar.</p>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'apps' && (
              <motion.div key="apps" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-3xl font-black text-white">Minhas Credenciais</h2>
                    <p className="text-slate-500 text-sm">Gere chaves para autenticar suas requisições.</p>
                  </div>
                  {!user ? (
                    <button onClick={() => window.location.href='/login'} className="px-6 py-3 bg-white/10 text-white rounded-xl font-bold">Faça Login para Gerenciar</button>
                  ) : (
                    <button 
                      onClick={() => setIsCreatingApp(true)}
                      className="px-6 py-3 bg-accent text-white font-bold rounded-2xl shadow-lg shadow-accent/20 flex items-center gap-2 hover:scale-105 transition-transform"
                    >
                      <Plus size={18} /> Novo App
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-6">
                  {apiApps.map(app => (
                    <div key={app.id} className="bg-white/5 border border-white/10 rounded-3xl p-8 space-y-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="size-12 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-accent">
                            <Smartphone size={24} />
                          </div>
                          <div>
                            <h5 className="text-lg font-bold text-white">{app.name}</h5>
                            <div className="flex gap-2">
                              {app.scopes?.map((s: string) => (
                                <span key={s} className="text-[10px] bg-accent/10 text-accent px-2 py-0.5 rounded-full font-black uppercase tracking-tight">{s}</span>
                              ))}
                            </div>
                          </div>
                        </div>
                        <button onClick={() => deleteApp(app.id)} className="p-2 text-slate-500 hover:text-red-500 transition-colors">
                          <Trash2 size={18} />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Client ID</label>
                          <div className="flex items-center gap-3 bg-black/40 border border-white/5 p-4 rounded-2xl">
                             <code className="text-xs text-slate-300 font-mono flex-1">{app.client_id}</code>
                             <button onClick={() => handleCopy(app.client_id, 'id-'+app.id)} className="text-slate-500 hover:text-white">
                                {copied === 'id-'+app.id ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                             </button>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Client Secret</label>
                          <div className="flex items-center gap-3 bg-black/40 border border-white/5 p-4 rounded-2xl">
                             <code className="text-xs text-slate-300 font-mono flex-1">
                               {showSecretId === app.id ? app.client_secret : '••••••••••••••••••••••••'}
                             </code>
                             <button onClick={() => setShowSecretId(showSecretId === app.id ? null : app.id)} className="text-slate-500 hover:text-white">
                               <Eye size={14} />
                             </button>
                             <button onClick={() => handleCopy(app.client_secret, 'sk-'+app.id)} className="text-slate-500 hover:text-white">
                                {copied === 'sk-'+app.id ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                             </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'playground' && (
              <motion.div key="playground" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                <div className="space-y-2">
                   <h2 className="text-3xl font-black text-white">Console de Autenticação</h2>
                   <p className="text-slate-500 text-sm">Gere tokens de acesso para usar em suas requisições.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6 bg-white/5 p-8 rounded-3xl border border-white/10 h-fit">
                    <h4 className="text-lg font-bold text-white flex items-center gap-2">
                      <Lock size={20} className="text-accent" />
                      Token de Acesso (JWT)
                    </h4>
                    <p className="text-xs text-slate-500">Insira suas credenciais abaixo para obter um token de portador (Bearer Token).</p>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Client ID</label>
                        <input 
                          type="text"
                          value={testClientId}
                          onChange={(e) => setTestClientId(e.target.value)}
                          className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white font-mono outline-none focus:ring-1 focus:ring-accent"
                          placeholder="cl_p4wcalcspx"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Client Secret</label>
                        <input 
                          type="password"
                          value={testClientSecret}
                          onChange={(e) => setTestClientSecret(e.target.value)}
                          className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white font-mono outline-none focus:ring-1 focus:ring-accent"
                          placeholder="sk_..."
                        />
                      </div>
                      <button 
                        onClick={testGetToken}
                        disabled={isTesting || !testClientId || !testClientSecret}
                        className="w-full py-4 bg-accent text-white font-bold rounded-2xl shadow-lg shadow-accent/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                      >
                        {isTesting ? 'Validando...' : 'Gerar Token (POST /auth/token)'}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-black text-slate-500 uppercase tracking-widest">Estado da Sessão API</h4>
                      {testToken && (
                        <span className="text-[10px] font-black text-emerald-400 uppercase bg-emerald-400/10 px-2 py-0.5 rounded-full">Autenticado</span>
                      )}
                    </div>

                    <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 h-full min-h-[300px] overflow-auto font-mono text-xs relative group">
                      {testResult ? (
                        <div className="space-y-4">
                          <div className={`flex items-center justify-between ${testResult.isError ? 'text-red-400' : 'text-emerald-400'}`}>
                            <span className="font-bold">RESULTADO:</span>
                            <span className="text-[10px] bg-white/5 px-2 py-1 rounded">{testResult.status}</span>
                          </div>
                          <div className="relative">
                            <pre className="text-slate-300 bg-black/40 p-4 rounded-xl whitespace-pre-wrap break-all border border-white/5">
                              {JSON.stringify(testResult.data || { error: testResult.error }, null, 2)}
                            </pre>
                            {testToken && (
                              <button 
                                onClick={() => handleCopy(testToken, 'token-copy')}
                                className="absolute right-3 top-3 p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                {copied === 'token-copy' ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                              </button>
                            )}
                          </div>
                          
                          {!testResult.isError && testToken && (
                            <div className="mt-8 p-4 bg-accent/10 border border-accent/20 rounded-2xl">
                              <p className="text-accent text-[10px] font-black uppercase mb-1">Próximo Passo</p>
                              <p className="text-slate-300 text-[11px] leading-relaxed mb-3">
                                Seu token foi salvo localmente. Vá para a aba de Documentação para testar seus recursos.
                              </p>
                              <button 
                                onClick={() => setActiveTab('docs')}
                                className="text-[10px] font-black text-white bg-accent px-3 py-1.5 rounded-lg flex items-center gap-2 hover:bg-accent/80"
                              >
                                Ir para Endpoints <ArrowRight size={12} />
                              </button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="h-full flex flex-col items-center justify-center text-slate-600 text-center space-y-4 py-20">
                          <Terminal size={48} className="opacity-10" />
                          <p>Aguardando autenticação...<br/>Seus dados de sessão aparecerão aqui.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'docs' && (
              <motion.div key="docs" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-12">
                <div className="space-y-4">
                  <h2 className="text-3xl font-black text-white">Referência da API</h2>
                  <p className="text-slate-400">Explore e teste os endpoints do Bold Share diretamente aqui.</p>
                  
                  <div className="p-5 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <Lock size={20} className="text-indigo-400" />
                      <div>
                        <p className="text-[10px] font-black uppercase text-indigo-400 tracking-widest">Bearer Token Ativo</p>
                        <code className="text-white font-mono text-xs truncate max-w-[200px] block">
                          {testToken ? testToken : 'Nenhum token gerado'}
                        </code>
                      </div>
                    </div>
                    <button 
                      onClick={() => setActiveTab('playground')}
                      className="text-xs font-bold text-indigo-400 hover:text-white px-4 py-2 border border-indigo-400/20 rounded-xl hover:bg-indigo-400/10"
                    >
                      Gerar Token no Playground
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  {endpoints.map((ep) => (
                    <div key={ep.id} className="border border-white/5 rounded-2xl overflow-hidden bg-white/[0.02]">
                      <button 
                        onClick={() => {
                          setExpandedEndpoint(expandedEndpoint === ep.id ? null : ep.id);
                          setTestResult(null);
                          // Initialize body if post
                          if (ep.body) {
                            const initialBody: any = {};
                            Object.keys(ep.body).forEach(k => {
                              const prop = (ep.body as any)[k];
                              if (prop.example !== undefined) {
                                initialBody[k] = prop.example;
                              } else {
                                // Default values based on type
                                switch (prop.type) {
                                  case 'number': initialBody[k] = 0; break;
                                  case 'boolean': initialBody[k] = false; break;
                                  case 'array': initialBody[k] = []; break;
                                  default: initialBody[k] = '';
                                }
                              }
                            });
                            setRequestBody(JSON.stringify(initialBody, null, 2));
                          }
                        }}
                        className={`w-full flex items-center gap-4 p-4 text-left transition-colors ${
                          expandedEndpoint === ep.id ? 'bg-white/5' : 'hover:bg-white/[0.05]'
                        }`}
                      >
                        <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase w-20 text-center ${
                          ep.method === 'GET' ? 'bg-blue-500/20 text-blue-400' :
                          ep.method === 'POST' ? 'bg-emerald-500/20 text-emerald-400' :
                          'bg-slate-500/20 text-slate-400'
                        }`}>
                          {ep.method}
                        </span>
                        <code className="text-sm font-mono text-white flex-1">{ep.path}</code>
                        <span className="text-slate-500 text-sm hidden md:inline">{ep.title}</span>
                        <ChevronRight className={`text-slate-500 transition-transform ${expandedEndpoint === ep.id ? 'rotate-90' : ''}`} size={16} />
                      </button>

                      <AnimatePresence>
                        {expandedEndpoint === ep.id && (
                          <motion.div 
                            initial={{ height: 0, opacity: 0 }} 
                            animate={{ height: 'auto', opacity: 1 }} 
                            exit={{ height: 0, opacity: 0 }}
                          >
                            <div className="p-6 border-t border-white/5 space-y-6">
                              <p className="text-sm text-slate-400 leading-relaxed">{ep.description}</p>
                              
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                  {/* Headers (Standard for API) */}
                                  <div className="space-y-3">
                                    <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Cabeçalhos (Headers)</h5>
                                    <div className="space-y-2">
                                      <div className="flex flex-col gap-1">
                                        <div className="flex items-center gap-2">
                                          <span className="text-xs font-mono text-emerald-400">Content-Type</span>
                                          <span className="text-[8px] font-black text-slate-600 uppercase">Fixo</span>
                                        </div>
                                        <div className="bg-black/20 p-2 rounded-xl border border-white/5 opacity-50">
                                          <code className="text-xs text-white">application/json</code>
                                        </div>
                                      </div>
                                      
                                      {ep.auth && (
                                        <div className="flex flex-col gap-1">
                                          <div className="flex items-center gap-2">
                                            <span className="text-xs font-mono text-indigo-400">Authorization</span>
                                            <span className="text-[8px] font-black text-red-500 uppercase">Obrigatório</span>
                                          </div>
                                          <div className="bg-black/20 p-2 rounded-xl border border-accent/30 flex items-center gap-2">
                                            <span className="text-[10px] text-slate-500 font-mono">Bearer</span>
                                            <input 
                                              type="text" 
                                              value={testToken}
                                              readOnly
                                              placeholder="Token não gerado"
                                              className="bg-transparent border-none outline-none text-[10px] text-white font-mono flex-1 truncate"
                                            />
                                          </div>
                                          {!testToken && <p className="text-[9px] text-amber-500">Gere um token na aba anterior primeiro.</p>}
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  {/* Parameters */}
                                  {(ep.params || ep.query) && (
                                    <div className="space-y-4">
                                      <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Parâmetros (Path & Query)</h5>
                                      <div className="space-y-3">
                                        {[...Object.entries(ep.params || {}), ...Object.entries(ep.query || {})].map(([key, val]: [string, any]) => (
                                          <div key={key} className="space-y-1">
                                            <div className="flex items-center gap-2">
                                              <span className="text-xs font-mono text-indigo-400">{key}</span>
                                              {val.required && <span className="text-[8px] font-black text-red-500 uppercase">Obrigatório</span>}
                                              <span className="text-[10px] text-slate-600">({val.type})</span>
                                            </div>
                                            <div className="flex items-center gap-4 bg-black/20 p-2 rounded-xl border border-white/5 focus-within:border-accent/40">
                                              <input 
                                                type="text" 
                                                placeholder={val.description || val.type}
                                                onChange={(e) => setRequestParams(prev => ({ ...prev, [key]: e.target.value }))}
                                                className="bg-transparent border-none outline-none text-xs text-white placeholder:text-slate-700 flex-1 px-1"
                                              />
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {/* Body Definition / Schema */}
                                  {ep.body && (
                                    <div className="space-y-4">
                                      <div className="flex items-center justify-between">
                                        <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Estrutura do Corpo (Body Schema)</h5>
                                      </div>
                                      <div className="space-y-3 bg-black/20 rounded-2xl p-4 border border-white/5">
                                        {Object.entries(ep.body).map(([key, val]: [string, any]) => (
                                          <div key={key} className="flex flex-col gap-1 pb-3 border-b border-white/5 last:border-0 last:pb-0">
                                            <div className="flex items-center gap-2">
                                              <span className="text-xs font-mono text-emerald-400">{key}</span>
                                              {val.required ? (
                                                <span className="text-[8px] font-black text-red-500 uppercase">Obrigatório</span>
                                              ) : (
                                                <span className="text-[8px] font-black text-slate-600 uppercase">Opcional</span>
                                              )}
                                              <span className="text-[10px] text-slate-500">({val.type})</span>
                                            </div>
                                            <p className="text-[11px] text-slate-400">{val.description}</p>
                                          </div>
                                        ))}
                                      </div>
                                      
                                      <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                          <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Editor de Requisição (JSON)</h5>
                                          <span className="text-[10px] text-slate-600 font-mono">application/json</span>
                                        </div>
                                        <textarea 
                                          value={requestBody}
                                          onChange={(e) => setRequestBody(e.target.value)}
                                          className="w-full h-48 bg-black/40 border border-white/5 rounded-2xl p-4 text-xs font-mono text-emerald-400 outline-none focus:ring-1 focus:ring-accent"
                                        />
                                      </div>
                                    </div>
                                  )}

                                  <button 
                                    onClick={() => handleTestEndpoint(ep)}
                                    disabled={isTesting || (ep.auth && !testToken)}
                                    className="w-full py-4 bg-accent text-white font-bold rounded-2xl shadow-lg shadow-accent/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                  >
                                    {isTesting ? <Zap className="animate-pulse" size={16} /> : <Send size={16} />}
                                    {isTesting ? 'Executando...' : 'Try it out / Executar'}
                                  </button>
                                  {ep.auth && !testToken && <p className="text-[10px] text-red-400 text-center uppercase tracking-tighter">* Requer autenticação</p>}
                                </div>

                                {/* Result area */}
                                <div className="space-y-4">
                                  <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Servidor Resposta</h5>
                                  <div className="bg-slate-900 border border-white/5 rounded-2xl p-5 h-64 overflow-auto font-mono text-xs">
                                    {testResult ? (
                                      <div className="space-y-4">
                                        <div className={`font-bold ${testResult.isError ? 'text-red-400' : 'text-emerald-400'}`}>
                                          HTTP {testResult.status}
                                        </div>
                                        <pre className="text-slate-300 bg-black/20 p-4 rounded-xl whitespace-pre-wrap break-all">
                                          {JSON.stringify(testResult.data || { error: testResult.error }, null, 2)}
                                        </pre>
                                      </div>
                                    ) : (
                                      <div className="h-full flex flex-col items-center justify-center text-slate-700 text-center">
                                        <Terminal size={32} className="opacity-20 mb-2" />
                                        <p>Execute a requisição para<br/>ver o resultado.</p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'postman' && (
              <motion.div key="postman" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-12">
                <div className="space-y-4 text-center py-12">
                   <Terminal size={64} className="text-accent mx-auto mb-6" />
                   <h2 className="text-3xl font-black text-white">Guia de Integração Externa</h2>
                   <p className="text-slate-400 max-w-xl mx-auto">Use o Bold Share em suas automações (n8n, Zapier) ou ferramentas de teste (Postman, Insomnia).</p>
                   
                   <div className="mt-4 p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl max-w-md mx-auto">
                     <p className="text-amber-500 text-xs font-bold uppercase flex items-center justify-center gap-2">
                       <Shield size={14} /> Dica de Produção
                     </p>
                     <p className="text-[10px] text-amber-500/80 mt-1">
                       Em ferramentas externas, use sempre o header <code className="text-white">Authorization: Bearer [SEU_TOKEN]</code>.
                     </p>
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6 bg-white/5 p-8 rounded-3xl border border-white/10">
                    <h4 className="text-xl font-bold text-white flex items-center gap-3">
                      <Zap size={24} className="text-accent" />
                      No n8n (HTTP Request)
                    </h4>
                    <ul className="space-y-4 text-sm text-slate-400">
                      <li className="flex gap-3">
                        <span className="text-accent font-black">1.</span>
                        <span>Selecione <strong>Authentication: None</strong> se for injetar o header manualmente.</span>
                      </li>
                      <li className="flex gap-3">
                        <span className="text-accent font-black">2.</span>
                        <span>Ou em <strong>Authentication</strong>, mude para <strong>Predefined Credential Type</strong>.</span>
                      </li>
                      <li className="flex gap-3">
                        <span className="text-accent font-black">3.</span>
                        <span>Escolha <strong>Header Auth</strong>. Nome: <code className="text-white">Authorization</code>. Valor: <code className="text-white">Bearer SEU_TOKEN</code></span>
                      </li>
                      <li className="flex gap-3">
                        <span className="text-accent font-black">4.</span>
                        <span>Envie como <strong>Method: POST</strong> e <strong>Body Type: JSON</strong>.</span>
                      </li>
                    </ul>
                  </div>

                  <div className="space-y-6 bg-white/5 p-8 rounded-3xl border border-white/10">
                    <h4 className="text-xl font-bold text-white flex items-center gap-3">
                      <Terminal size={24} className="text-orange-400" />
                      No Postman
                    </h4>
                    <ul className="space-y-4 text-sm text-slate-400">
                      <li className="flex gap-3">
                        <span className="text-orange-400 font-black">1.</span>
                        <span>Vá na aba <strong>Auth</strong> do request.</span>
                      </li>
                      <li className="flex gap-3">
                        <span className="text-orange-400 font-black">2.</span>
                        <span>Selecione Type: <strong>Bearer Token</strong>.</span>
                      </li>
                      <li className="flex gap-3">
                        <span className="text-orange-400 font-black">3.</span>
                        <span>Cole o token gerado no campo <strong>Token</strong>.</span>
                      </li>
                      <li className="flex gap-3">
                        <span className="text-orange-400 font-black">4.</span>
                        <span>O Postman adiciona o prefixo "Bearer " automaticamente.</span>
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-sm font-black text-slate-500 uppercase tracking-widest text-center">Endpoints de Teste</h4>
                  <div className="bg-slate-900 rounded-3xl border border-white/5 p-8 grid grid-cols-1 md:grid-cols-2 gap-8 font-mono text-xs">
                    <div className="space-y-2">
                      <p className="text-slate-500">OBTER TOKEN (POST)</p>
                      <code className="text-emerald-400 block pb-2 border-b border-white/5">{window.location.origin}/api/auth/token</code>
                    </div>
                    <div className="space-y-2">
                      <p className="text-slate-500">LISTAR SECRETS (GET)</p>
                      <code className="text-emerald-400 block pb-2 border-b border-white/5">{window.location.origin}/api/v1/secrets</code>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* Modal Criar App */}
      <AnimatePresence>
        {isCreatingApp && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-md">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-slate-900 w-full max-w-md rounded-[2.5rem] border border-white/10 shadow-2xl p-8">
              <h3 className="text-2xl font-black text-white mb-2">Identificar Integração</h3>
              <p className="text-sm text-slate-500 mb-6">Dê um nome para este App (ex: LinkSync Dashboard).</p>
              <input 
                type="text" autoFocus
                value={newAppName}
                onChange={(e) => setNewAppName(e.target.value)}
                className="w-full px-5 py-4 bg-black/40 border border-white/10 rounded-2xl outline-none focus:ring-2 focus:ring-accent font-bold text-white mb-6"
                placeholder="Ex: ERP Integrator"
              />
              <div className="flex gap-4">
                <button onClick={() => setIsCreatingApp(false)} className="flex-1 py-4 text-slate-400 font-bold hover:text-white transition-colors">Voltar</button>
                <button onClick={createApp} className="flex-1 py-4 bg-accent text-white font-bold rounded-2xl shadow-lg shadow-accent/40 active:scale-95 transition-all">Gerar Chaves</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
