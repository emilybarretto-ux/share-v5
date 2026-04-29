import React from 'react';
import { Terminal, Copy, Check, ChevronRight, Key, Shield, Smartphone, ArrowLeft, Send, Zap, Book, Lock, Code, Trash2, Eye, Plus, ExternalLink, Cpu } from 'lucide-react';
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
                   <h2 className="text-3xl font-black text-white">API Playground</h2>
                   <p className="text-slate-500 text-sm">Teste seus endpoints sem precisar de ferramentas externas.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6 bg-white/5 p-8 rounded-3xl border border-white/10">
                    <h4 className="text-lg font-bold text-white flex items-center gap-2">
                      <Key size={20} className="text-accent" />
                      1. Gerar Token
                    </h4>
                    <div className="space-y-4">
                      <div>
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Client ID</label>
                        <input 
                          type="text"
                          value={testClientId}
                          onChange={(e) => setTestClientId(e.target.value)}
                          className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white font-mono outline-none focus:ring-1 focus:ring-accent"
                          placeholder="cl_..."
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
                        {isTesting ? 'Processando...' : 'Autenticar (POST /auth/token)'}
                      </button>
                    </div>

                    <div className="h-px bg-white/5 my-8" />

                    <h4 className="text-lg font-bold text-white flex items-center gap-2">
                      <Send size={20} className="text-emerald-400" />
                      2. Testar Endpoints
                    </h4>
                    <div className="space-y-3">
                       <button 
                         onClick={testListSecrets}
                         disabled={!testToken || isTesting}
                         className="w-full py-3 bg-white/5 border border-white/10 text-white font-bold rounded-xl hover:bg-white/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed text-sm flex items-center justify-center gap-2"
                       >
                         Listar Segredos (GET /v1/secrets)
                       </button>
                       <p className="text-[10px] text-slate-500 text-center uppercase tracking-tighter">* Requer token de acesso válido</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-sm font-black text-slate-500 uppercase tracking-widest">Resultado da Requisição</h4>
                    <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 h-[400px] overflow-auto font-mono text-xs">
                      {testResult ? (
                        <div className="space-y-4">
                          <div className={testResult.error ? 'text-red-400' : 'text-emerald-400'}>
                            <span className="font-bold">STATUS:</span> {testResult.status}
                          </div>
                          <pre className="text-slate-300 bg-black/40 p-4 rounded-xl whitespace-pre-wrap break-all">
                            {JSON.stringify(testResult.data || { error: testResult.error }, null, 2)}
                          </pre>
                        </div>
                      ) : (
                        <div className="h-full flex flex-col items-center justify-center text-slate-600 text-center space-y-4">
                          <Terminal size={48} className="opacity-20" />
                          <p>Nenhuma requisição realizada ainda.<br/>Preencha as credenciais ao lado para começar.</p>
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
                  <h2 className="text-3xl font-black text-white">OAuth2 Flow</h2>
                  <p className="text-slate-400">Obtenha seu <code>access_token</code> usando suas credenciais.</p>
                  
                  <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-black uppercase text-indigo-400 tracking-widest">Base API URL</p>
                      <code className="text-white font-mono text-sm">{window.location.origin}/api</code>
                    </div>
                    <button onClick={() => handleCopy(`${window.location.origin}/api`, 'base-url')} className="p-2 text-indigo-400 hover:bg-indigo-400/10 rounded-lg">
                      {copied === 'base-url' ? <Check size={16} /> : <Copy size={16} />}
                    </button>
                  </div>

                  <CodeBlock id="doc-auth" code={`curl -X POST "${window.location.origin}/api/auth/token" \\
  -H "Content-Type: application/json" \\
  -d '{ "clientId": "VOSS_ID", "clientSecret": "VOSSA_SECRET" }'`} />

                  <div className="space-y-3">
                    <p className="text-[10px] font-black text-slate-500 uppercase">Exemplo de Resposta (Sucesso)</p>
                    <pre className="bg-emerald-500/5 border border-emerald-500/20 p-4 rounded-xl text-[10px] text-emerald-400 font-mono">
{`{
  "access_token": "eyJhbGciOiJIUzI1...",
  "token_type": "Bearer",
  "expires_in": 86400,
  "scopes": ["secrets:read", "secrets:write"]
}`}
                    </pre>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="h-px bg-white/10 flex-1" />
                    <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest">Recursos de Segredos (Secrets)</h3>
                    <div className="h-px bg-white/10 flex-1" />
                  </div>

                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                       <span className="text-sm font-bold text-white">GET /v1/secrets</span>
                       <span className="text-[10px] font-black text-blue-400">READ_ONLY</span>
                    </div>
                    <p className="text-xs text-slate-500">Lista todos os segredos ativos que pertencem ao seu usuário.</p>
                    <CodeBlock id="doc-list" code={`curl -X GET "${window.location.origin}/api/v1/secrets" \\
  -H "Authorization: Bearer <TOKEN>"`} />
                  </div>

                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                       <span className="text-sm font-bold text-white">GET /v1/secrets/:id</span>
                       <span className="text-[10px] font-black text-blue-400">READ_ONLY</span>
                    </div>
                    <p className="text-xs text-slate-500">Recupera o conteúdo criptografado de um segredo específico. Requer senha se houver.</p>
                    <CodeBlock id="doc-get-one" code={`curl -X GET "${window.location.origin}/api/v1/secrets/SEG_ID?password=SuaSenha" \\
  -H "Authorization: Bearer <TOKEN>"`} />
                  </div>

                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                       <span className="text-sm font-bold text-white">POST /v1/secrets</span>
                       <span className="text-[10px] font-black text-emerald-400">WRITE_ACCESS</span>
                    </div>
                    <p className="text-xs text-slate-500">Cria um novo segredo com expiração e filtros de segurança.</p>
                    <CodeBlock id="doc-post" code={`curl -X POST "${window.location.origin}/api/v1/secrets" \\
  -H "Authorization: Bearer <TOKEN>" \\
  -H "Content-Type: application/json" \\
  -d '{ 
    "name": "Chave de Produção", 
    "content": "valor-ultra-secreto-aqui",
    "password": "senha-opcional",
    "expiration_hours": 24,
    "max_views": 1
  }'`} />
                  </div>

                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                       <span className="text-sm font-bold text-white">POST /v1/requests</span>
                       <span className="text-[10px] font-black text-emerald-400">WRITE_ACCESS</span>
                    </div>
                    <p className="text-xs text-slate-500">Cria uma nova solicitação de dados para terceiros preencherem.</p>
                    <CodeBlock id="doc-post-request" code={`curl -X POST "${window.location.origin}/api/v1/requests" \\
  -H "Authorization: Bearer <TOKEN>" \\
  -H "Content-Type: application/json" \\
  -d '{ 
    "title": "Documentos Adicionais", 
    "description": "Por favor, envie o comprovante de residência."
  }'`} />
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'postman' && (
              <motion.div key="postman" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                <div className="space-y-4 text-center py-12">
                   <Terminal size={64} className="text-accent mx-auto mb-6" />
                   <h2 className="text-3xl font-black text-white">Guia para o Postman</h2>
                   <p className="text-slate-400 max-w-xl mx-auto">Siga estes passos simples para validar sua integração no Postman em segundos.</p>
                   
                   <div className="mt-4 p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl max-w-md mx-auto">
                     <p className="text-amber-500 text-xs font-bold uppercase flex items-center justify-center gap-2">
                       <Shield size={14} /> Aviso de Segurança do Ambiente
                     </p>
                     <p className="text-[10px] text-amber-500/80 mt-1">
                       O Postman pode receber um erro de "Cookie check" porque este ambiente de pré-visualização é protegido. Em produção (Cloud Run), isso não ocorrerá.
                     </p>
                   </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {[
                    { n: '01', t: 'Auth Type', d: 'Selecione "OAuth 2.0" na aba Authorization ou use "Bearer Token" após obter o token via POST.' },
                    { n: '02', t: 'Endpoint', d: `Use ${window.location.host}/api/auth/token para obter o token enviando as credenciais no Body.` },
                    { n: '03', t: 'Headers', d: 'Certifique-se de incluir "Content-Type: application/json" e o header "Authorization".' }
                  ].map(item => (
                    <div key={item.n} className="flex gap-6 p-8 bg-white/5 rounded-3xl border border-white/5">
                      <span className="text-4xl font-black text-accent/20 italic">{item.n}</span>
                      <div>
                        <h5 className="text-lg font-bold text-white mb-1">{item.t}</h5>
                        <p className="text-sm text-slate-500">{item.d}</p>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="flex justify-center p-8">
                   <button className="flex items-center gap-2 text-accent font-bold hover:underline">
                     Baixar Coleção do Postman (v1.0) <ExternalLink size={16} />
                   </button>
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
