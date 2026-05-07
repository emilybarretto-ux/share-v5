import React from 'react';
import { Terminal, Copy, Check, ChevronRight, Key, Shield, ShieldCheck, ShieldQuestion, Smartphone, ArrowLeft, ArrowRight, Send, Zap, Book, Lock, Code, Trash2, Eye, Plus, ExternalLink, Cpu } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../../lib/supabase';
import { useNotification } from '../shared/NotificationProvider';

export const DeveloperPortal = ({ setScreen }: { setScreen: (s: any) => void }) => {
  const [copied, setCopied] = React.useState<string | null>(null);
  const [activeTab, setActiveTab] = React.useState('introduction');
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
    { id: 'introduction', title: 'Início', icon: <Cpu size={18} /> },
    { id: 'apps', title: 'Minhas Credenciais', icon: <Key size={18} /> },
    { id: 'playground', title: 'API Playground', icon: <Zap size={18} /> },
    { id: 'docs', title: 'Documentação API', icon: <Book size={18} /> },
  ];

  const [testClientId, setTestClientId] = React.useState('');
  const [testClientSecret, setTestClientSecret] = React.useState('');
  const [testToken, setTestToken] = React.useState('');
  const [testResult, setTestResult] = React.useState<any>(null);
  const [isTesting, setIsTesting] = React.useState(false);
  const [activeEndpointId, setActiveEndpointId] = React.useState<string | null>(null);
  const [snippetLanguage, setSnippetLanguage] = React.useState<'curl' | 'js' | 'python'>('js');
  const [expandedEndpoint, setExpandedEndpoint] = React.useState<string | null>(null);
  const [requestHeaders, setRequestHeaders] = React.useState<Record<string, string>>({});
  const [requestParams, setRequestParams] = React.useState<Record<string, string>>({});
  const [requestBody, setRequestBody] = React.useState<string>('');
  const [isJsonValid, setIsJsonValid] = React.useState(true);

  React.useEffect(() => {
    if (!requestBody || requestBody === '') {
      setIsJsonValid(true);
      return;
    }
    try {
      JSON.parse(requestBody);
      setIsJsonValid(true);
    } catch {
      setIsJsonValid(false);
    }
  }, [requestBody]);

  const formatJson = () => {
    try {
      const parsed = JSON.parse(requestBody);
      setRequestBody(JSON.stringify(parsed, null, 2));
    } catch (e) {
      showNotification('JSON inválido para formatar', 'error');
    }
  };

  const generateSnippet = (endpoint: any) => {
    let url = `${window.location.origin}${endpoint.path}`;
    if (endpoint.params) {
      Object.keys(requestParams).forEach(key => {
        url = url.replace(`:${key}`, requestParams[key] || `{${key}}`);
      });
    }

    const headers: any = { 'Content-Type': 'application/json' };
    if (endpoint.auth) headers['Authorization'] = `Bearer ${testToken || '[SEU_TOKEN]'}`;
    Object.entries(requestHeaders).forEach(([k, v]) => { if (v) headers[k] = v; });

    if (snippetLanguage === 'curl') {
      let cmd = `curl -X ${endpoint.method} "${url}" \\\n`;
      Object.entries(headers).forEach(([k, v]) => { cmd += `  -H "${k}: ${v}" \\\n`; });
      if (['POST', 'PUT'].includes(endpoint.method)) cmd += `  -d '${requestBody}'`;
      return cmd.trim();
    }

    if (snippetLanguage === 'js') {
      return `fetch("${url}", {
  method: "${endpoint.method}",
  headers: ${JSON.stringify(headers, null, 2)},
  ${['POST', 'PUT'].includes(endpoint.method) ? `body: JSON.stringify(${requestBody})` : ''}
}).then(res => res.json()).then(console.log);`;
    }

    if (snippetLanguage === 'python') {
      return `import requests

url = "${url}"
headers = ${JSON.stringify(headers, null, 2)}
${['POST', 'PUT'].includes(endpoint.method) ? `payload = ${requestBody}\nresponse = requests.${endpoint.method.toLowerCase()}(url, json=payload, headers=headers)` : `response = requests.${endpoint.method.toLowerCase()}(url, headers=headers)`}

print(response.json())`;
    }
  };

  // Removido o preenchimento automático de credenciais para que o usuário as insira manualmente
  
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


  const endpoints = [
    {
      id: 'auth-token',
      method: 'POST',
      path: '/api/auth/token',
      title: 'Obter access_token',
      description: 'Gera um token JWT válido por 24h usando suas credenciais de Client ID e Client Secret.',
      auth: false,
      body: {
        clientId: { type: 'string', required: true, description: 'Seu ID de cliente gerado no portal' },
        clientSecret: { type: 'string', required: true, description: 'Sua chave secreta (mantenha em segurança)' }
      },
      responses: {
        200: 'Token gerado com sucesso.',
        401: 'Credenciais inválidas ou App inativo.'
      }
    },
    {
      id: 'list-secrets',
      method: 'GET',
      path: '/api/v1/secrets',
      title: 'Listar Segredos',
      description: 'Retorna a lista de todos os segredos criados pelo seu usuário. Note que o campo "content" não é enviado nesta listagem por segurança.',
      auth: true,
      scopes: ['secrets:read'],
      query: {
        limit: { type: 'number', required: false, description: 'Quantidade de itens (padrão 100)' },
        offset: { type: 'number', required: false, description: 'Ponto de partida para paginação' }
      },
      responses: {
        200: 'Lista retornada com sucesso.',
        401: 'Token ausente ou expirado.'
      }
    },
    {
      id: 'get-secret',
      method: 'GET',
      path: '/api/v1/secrets/:id',
      title: 'Ver Detalhes do Segredo',
      description: 'Recupera os dados completos de um segredo específico. Se houver senha, ela deve ser enviada para descriptografia.',
      auth: true,
      params: { id: { type: 'string', required: true, description: 'ID único do segredo (UUID)', example: '' } },
      headers: {
        'X-Secret-Password': { type: 'string', required: false, description: 'A mesma senha real que você definiu ao criar o segredo.' }
      },
      scopes: ['secrets:read'],
      responses: {
        200: 'Segredo encontrado e descriptografado.',
        403: 'Senha incorreta ou ausente para este segredo.',
        404: 'Segredo não encontrado.'
      }
    },
    {
      id: 'refresh-token',
      method: 'POST',
      path: '/api/auth/refresh',
      title: 'Atualizar Token',
      description: 'Gera um novo access_token usando um token atual. Útil para manter sessões logadas sem pedir novas credenciais.',
      auth: true,
      headers: {
        'Authorization': { type: 'string', required: true, description: 'Bearer <seu_token_atual>' }
      },
      responses: {
        200: 'Novo token gerado.',
        401: 'Token original inválido ou bloqueado.'
      }
    },
    {
      id: 'create-secret',
      method: 'POST',
      path: '/api/v1/secrets',
      title: 'Criar Novo Segredo',
      description: 'Armazena um novo dado sensível criptografado ponta-a-ponta.',
      auth: true,
      scopes: ['secrets:write'],
      body: {
        name: { type: 'string', required: true, example: 'Credenciais Externas', description: 'Nome identificador do segredo' },
        content: { 
          type: 'any', 
          required: true, 
          example: { teste: '123', emily: '456' }, 
          description: 'O conteúdo sensível. Pode ser uma string simples ou um objeto JSON com múltiplos pares.' 
        },
        password: { type: 'string', required: false, description: 'Senha real para proteger. Opcional se usar restrição por e-mail/domínio (Token via e-mail).' },
        expiration_hours: { type: 'number', required: false, example: 24, description: 'Validade em horas.' },
        max_views: { type: 'number', required: false, example: 1, description: 'Limite de acessos.' },
        is_burn_on_read: { type: 'boolean', required: false, example: true, description: 'Se TRUE, destrói após a primeira leitura (max_views vira 1).' },
        restrict_ip: { type: 'boolean', required: false, example: false, description: 'Restringir acesso apenas ao seu IP atual' },
        require_email: { type: 'boolean', required: false, example: false, description: 'Exigir que o visualizador informe o e-mail' },
        allowed_email: { type: 'string', required: false, example: 'user@example.com', description: 'Permitir visualização apenas para este e-mail específico' },
        allowed_domain: { type: 'string', required: false, example: 'empresa.com', description: 'Restringir a um domínio de e-mail corporativo' },
        notify_access: { type: 'boolean', required: false, example: true, description: 'Receber notificação por e-mail quando acessado' },
        redirect_url: { type: 'string', required: false, example: 'https://meusite.com', description: 'URL para redirecionar após a leitura' }
      },
      responses: {
        201: 'Segredo criado com sucesso.',
        400: 'Dados inválidos ou incompletos.'
      }
    },
    {
      id: 'update-secret',
      method: 'PUT',
      path: '/api/v1/secrets/:id',
      title: 'Atualizar Segredo',
      description: 'Modifica os metadados ou o conteúdo de um segredo existente.',
      auth: true,
      params: { id: { type: 'string', required: true, description: 'ID do segredo (UUID)' } },
      body: {
        name: { type: 'string', required: false, description: 'Novo nome do segredo' },
        content: { type: 'string', required: false, description: 'Novo conteúdo sensível' },
        status: { type: 'string', required: false, description: 'Estado: active ou completed' },
        max_views: { type: 'number', required: false, description: 'Novo limite de acessos' }
      },
      responses: {
        200: 'Segredo atualizado.',
        404: 'Não encontrado ou sem permissão.'
      }
    },
    {
      id: 'delete-secret',
      method: 'DELETE',
      path: '/api/v1/secrets/:id',
      title: 'Excluir Segredo',
      description: 'Remove permanentemente um segredo do sistema.',
      auth: true,
      params: { id: { type: 'string', required: true, description: 'ID do segredo (UUID)' } },
      responses: {
        200: 'Segredo excluído.',
        404: 'Não encontrado ou sem permissão.'
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
      },
      responses: {
        201: 'Solicitação criada com sucesso.',
        401: 'Token ausente ou inválido.',
        403: 'Escopo insuficiente.'
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
          if (endpoint.params[key]) {
             url = url.replace(`:${key}`, requestParams[key] || `:${key}`);
          }
        });
      }
      
      // Add query params
      const query = new URLSearchParams();
      if (endpoint.query) {
        Object.keys(requestParams).forEach(key => {
          if (endpoint.query[key] && requestParams[key]) {
            query.append(key, requestParams[key]);
          }
        });
      }
      const queryString = query.toString();
      if (queryString) url += `?${queryString}`;

      const apiUrl = `${window.location.origin}${url}`;
      console.group('🚀 API PLAYGROUND DEBUG');
      console.log('Endpoint:', endpoint.title);
      console.log('Full URL:', apiUrl);
      console.log('Method:', endpoint.method);
      console.log('Headers:', { ...requestHeaders, Authorization: testToken ? 'Bearer [HIDDEN]' : 'None' });
      console.groupEnd();

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

      const response = await fetch(apiUrl, options);
      const isFromNode = response.headers.get('x-processed-by') === 'Bold-Share-API';
      const contentType = response.headers.get('content-type');
      let data;
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        data = { 
          error: 'O servidor não retornou JSON.', 
          raw_response: text.substring(0, 1000) + (text.length > 1000 ? '...' : '')
        };
      }
      
      setTestResult({
        status: response.status + ' ' + response.statusText,
        data,
        isError: !response.ok,
        isFromNode
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
      setTestResult({ status: 'Erro de Rede', error: err.message, isError: true });
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
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
              <div className="size-2 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">API Status: Online</span>
            </div>
            <button onClick={() => {
              setScreen('home');
              window.history.pushState({}, '', '/');
            }} className="text-sm font-bold text-slate-400 hover:text-white transition-colors flex items-center gap-2">
              <ArrowLeft size={16} /> Voltar ao Início
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
              Trate o seu <code className="text-accent">client_secret</code> como uma senha. Nunca o exponha no lado do cliente (navegador).
            </p>
          </div>
        </aside>

        {/* Content */}
        <main className="flex-1 space-y-12">
          <AnimatePresence mode="wait">
            {activeTab === 'introduction' && (
              <motion.div key="intro" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                <div className="space-y-4">
                  <h2 className="text-5xl font-black text-white tracking-tight">Integre com o <br/>Bold Share.</h2>
                  <p className="text-lg text-slate-400 max-w-2xl leading-relaxed">
                    Nossa API é robusta, segura e permite que você integre compartilhamento de segredos e coleta de dados 
                    diretamente em seus fluxos de trabalho, ERPs e ferramentas personalizadas.
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
                  <div className="p-8 bg-white/5 rounded-[2rem] border border-white/5 hover:border-accent/30 transition-all hover:-translate-y-1">
                    <div className="size-12 bg-accent/20 rounded-2xl flex items-center justify-center mb-6">
                       <Zap className="text-accent" size={24} />
                    </div>
                    <h4 className="text-lg font-bold text-white mb-2">Tokens JWT</h4>
                    <p className="text-sm text-slate-500 leading-relaxed">Autenticação robusta via OAuth2 para máxima segurança.</p>
                  </div>
                  <div className="p-8 bg-white/5 rounded-[2rem] border border-white/5 hover:border-indigo-400/30 transition-all hover:-translate-y-1">
                    <div className="size-12 bg-indigo-500/20 rounded-2xl flex items-center justify-center mb-6">
                       <Shield className="text-indigo-400" size={24} />
                    </div>
                    <h4 className="text-lg font-bold text-white mb-2">RESTful API</h4>
                    <p className="text-sm text-slate-500 leading-relaxed">Endpoints padronizados para integrar em qualquer linguagem.</p>
                  </div>
                  <div className="p-8 bg-white/5 rounded-[2rem] border border-white/5 hover:border-emerald-400/30 transition-all hover:-translate-y-1">
                    <div className="size-12 bg-emerald-500/20 rounded-2xl flex items-center justify-center mb-6">
                       <Code className="text-emerald-400" size={24} />
                    </div>
                    <h4 className="text-lg font-bold text-white mb-2">Playground Vivo</h4>
                    <p className="text-sm text-slate-500 leading-relaxed">Teste requisições em tempo real e copie o código pronto.</p>
                  </div>
                </div>

                <div className="mt-12 space-y-6">
                   <h5 className="text-sm font-black text-slate-500 uppercase tracking-widest">Início rápido em 3 passos</h5>
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {[
                        { step: '01', title: 'Crie um App', desc: 'Gere suas credenciais na aba "Minhas Credenciais".' },
                        { step: '02', title: 'Obtenha o Token', desc: 'Use o Playground para gerar seu access_token.' },
                        { step: '03', title: 'Integre!', desc: 'Use os snippets de código para integrar no seu fluxo.' }
                      ].map((s) => (
                        <div key={s.step} className="p-6 bg-slate-900/50 rounded-2xl border border-white/5 flex gap-4">
                           <span className="text-2xl font-black text-white/10 select-none">{s.step}</span>
                           <div>
                             <h6 className="text-sm font-bold text-white mb-1">{s.title}</h6>
                             <p className="text-xs text-slate-500">{s.desc}</p>
                           </div>
                        </div>
                      ))}
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
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h2 className="text-3xl font-black text-white">API Playground</h2>
                    <p className="text-slate-500 text-sm">
                      {activeEndpointId 
                        ? `Testando: ${endpoints.find(e => e.id === activeEndpointId)?.title}` 
                        : 'Configure sua autenticação para testar os endpoints.'}
                    </p>
                  </div>
                  {activeEndpointId && (
                    <button 
                      onClick={() => setActiveEndpointId(null)}
                      className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-[10px] font-black uppercase text-slate-400 hover:text-white transition-all border border-white/5"
                    >
                      Limpar Endpoint Selecionado
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    {/* Autenticação Section */}
                    <div className={`bg-white/5 p-8 rounded-3xl border border-white/10 transition-all ${testToken ? 'opacity-50 hover:opacity-100 grayscale-[0.5] hover:grayscale-0' : ''}`}>
                      <h4 className="text-lg font-bold text-white flex items-center gap-2 mb-2">
                        <Lock size={20} className="text-accent" />
                        Autenticação
                      </h4>
                      <p className="text-xs text-slate-500 mb-6">Gere um token JWT para autorizar suas chamadas de API.</p>
                      
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2 font-mono">Client ID</label>
                            <input 
                              type="text"
                              value={testClientId}
                              onChange={(e) => setTestClientId(e.target.value)}
                              className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white font-mono outline-none focus:ring-1 focus:ring-accent"
                              placeholder=""
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2 font-mono">Client Secret</label>
                            <input 
                              type="password"
                              value={testClientSecret}
                              onChange={(e) => setTestClientSecret(e.target.value)}
                              className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white font-mono outline-none focus:ring-1 focus:ring-accent"
                              placeholder=""
                            />
                          </div>
                        </div>
                        <button 
                          onClick={testGetToken}
                          disabled={isTesting || !testClientId || !testClientSecret}
                          className="w-full py-4 bg-accent text-white font-bold rounded-2xl shadow-lg shadow-accent/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          {isTesting ? <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Zap size={18} />}
                          {testToken ? 'Gerar Novo Token (Renovar)' : 'Gerar access_token'}
                        </button>
                      </div>
                    </div>

                    {/* Endpoint Simulation if selected */}
                    {activeEndpointId && (
                      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-white/5 p-8 rounded-3xl border border-accent/20 space-y-6">
                        <div className="flex items-center justify-between">
                          <h4 className="text-lg font-bold text-white flex items-center gap-2">
                            <Send size={20} className="text-emerald-400" />
                            Parâmetros da Requisição
                          </h4>
                          <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 text-[9px] font-black uppercase rounded-lg border border-emerald-500/20">
                            {endpoints.find(e => e.id === activeEndpointId)?.method}
                          </span>
                        </div>

                        <div className="space-y-6">
                           <div className="bg-black/40 p-4 rounded-xl border border-white/5">
                              <code className="text-xs text-indigo-400 font-mono italic break-all">
                                {endpoints.find(e => e.id === activeEndpointId)?.path}
                              </code>
                           </div>

                           {/* Path Params & Query Params */}
                           {(endpoints.find(e => e.id === activeEndpointId)?.params || endpoints.find(e => e.id === activeEndpointId)?.query || endpoints.find(e => e.id === activeEndpointId)?.headers) && (
                             <div className="space-y-4 pt-2">
                               <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-white/5 pb-2">Parâmetros e Cabeçalhos</h5>
                               <div className="grid grid-cols-1 gap-4">
                                 {endpoints.find(e => e.id === activeEndpointId)?.params && Object.entries(endpoints.find(e => e.id === activeEndpointId)!.params).map(([key, info]: any) => (
                                   <div key={key}>
                                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Path: :{key}</label>
                                     <input 
                                       type="text"
                                       value={requestParams[key] || ''}
                                       onChange={(e) => setRequestParams(prev => ({ ...prev, [key]: e.target.value }))}
                                       className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white font-mono outline-none focus:ring-1 focus:ring-accent"
                                       placeholder={info.description}
                                     />
                                   </div>
                                 ))}
                                 {endpoints.find(e => e.id === activeEndpointId)?.query && Object.entries(endpoints.find(e => e.id === activeEndpointId)!.query).map(([key, info]: any) => (
                                   <div key={key}>
                                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Query: ?{key}</label>
                                     <input 
                                       type="text"
                                       value={requestParams[key] || ''}
                                       onChange={(e) => setRequestParams(prev => ({ ...prev, [key]: e.target.value }))}
                                       className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white font-mono outline-none focus:ring-1 focus:ring-accent"
                                       placeholder={info.description}
                                     />
                                   </div>
                                 ))}
                                 {endpoints.find(e => e.id === activeEndpointId)?.headers && Object.entries(endpoints.find(e => e.id === activeEndpointId)!.headers).map(([key, info]: any) => (
                                   <div key={key}>
                                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Header: {key}</label>
                                     <input 
                                       type="text"
                                       value={requestHeaders[key] || ''}
                                       onChange={(e) => setRequestHeaders(prev => ({ ...prev, [key]: e.target.value }))}
                                       className="w-full bg-black/40 border border-indigo-500/30 rounded-xl p-3 text-sm text-white font-mono outline-none focus:ring-1 focus:ring-indigo-400"
                                       placeholder={info.description}
                                     />
                                   </div>
                                 ))}
                               </div>
                             </div>
                           )}

                           {/* Request Body (for POST/PUT) */}
                           {['POST', 'PUT', 'PATCH'].includes(endpoints.find(e => e.id === activeEndpointId)?.method || '') && (
                             <div className="space-y-4 pt-2">
                               <div className="flex items-center justify-between border-b border-white/5 pb-2">
                                 <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Corpo da Requisição (JSON)</h5>
                                 <button 
                                   onClick={formatJson}
                                   className="text-[9px] font-black text-accent hover:text-white uppercase transition-colors"
                                 >
                                   Formatar JSON
                                 </button>
                               </div>
                               <div className="relative">
                                 <textarea 
                                   value={requestBody}
                                   onChange={(e) => setRequestBody(e.target.value)}
                                   className={`w-full h-48 bg-black/40 border ${isJsonValid ? 'border-white/10' : 'border-red-500/50'} rounded-xl p-4 text-xs text-white font-mono outline-none focus:ring-1 focus:ring-accent transition-all`}
                                   placeholder="{}"
                                 />
                                 {!isJsonValid && (
                                   <div className="absolute bottom-3 right-3 flex items-center gap-1.5 text-red-500 text-[9px] font-black uppercase bg-red-500/10 px-2 py-1 rounded">
                                     <Shield size={10} /> JSON Inválido
                                   </div>
                                 )}
                               </div>
                             </div>
                           )}

                           {!testToken && (
                             <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-500">
                               <Shield size={16} />
                               <span className="text-[10px] font-bold uppercase tracking-tight">Token de autenticação obrigatório.</span>
                             </div>
                           )}

                           <button 
                             onClick={() => handleTestEndpoint(endpoints.find(e => e.id === activeEndpointId))}
                             disabled={isTesting || (endpoints.find(e => e.id === activeEndpointId)?.auth && !testToken) || !isJsonValid}
                             className="w-full py-5 bg-emerald-500 text-white font-bold rounded-2xl shadow-lg shadow-emerald-500/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                           >
                             {isTesting ? <div className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <ChevronRight size={20} />}
                             Executar Requisição de Teste
                           </button>
                        </div>
                      </motion.div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-black text-slate-500 uppercase tracking-widest">Resultado da API</h4>
                      <div className="flex gap-2">
                        {testToken && (
                          <span className="text-[10px] font-black text-emerald-400 uppercase bg-emerald-400/10 px-2 py-0.5 rounded-full border border-emerald-400/20 flex items-center gap-1">
                            <Check size={10} /> Bearer Ok
                          </span>
                        )}
                        {testResult && (
                          <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border flex items-center gap-1 ${testResult.isFromNode ? 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20' : 'text-amber-400 bg-amber-400/10 border-amber-400/20'}`}>
                            {testResult.isFromNode ? <Check size={10} /> : <Shield size={10} />}
                            {testResult.isFromNode ? 'Bold API' : 'Proxy/WAF'}
                          </span>
                        )}
                        {testResult && (
                          <button onClick={() => setTestResult(null)} className="text-[10px] font-black text-slate-500 hover:text-white uppercase">Limpar</button>
                        )}
                      </div>
                    </div>

                    <div className="bg-slate-900 border border-white/10 rounded-3xl h-full min-h-[400px] flex flex-col overflow-hidden relative group">
                      {testResult ? (
                        <div className="flex-1 flex flex-col p-6 space-y-4 overflow-hidden">
                          <div className={`flex items-center justify-between ${testResult.isError ? 'text-red-400' : 'text-emerald-400'}`}>
                            <div className="flex items-center gap-2">
                              <div className={`size-2 rounded-full ${testResult.isError ? 'bg-red-400' : 'bg-emerald-400'} animate-pulse`} />
                              <span className="font-black text-[10px] uppercase">Status</span>
                            </div>
                            <div className="flex items-center gap-2">
                               {testResult.isError && (
                                 <span className="text-[9px] font-bold text-red-500/80 bg-red-500/5 px-2 py-0.5 rounded border border-red-500/10">
                                   {testResult.status.includes('403') ? 'Acesso Negado' : 
                                    testResult.status.includes('401') ? 'Não Autorizado' : 
                                    testResult.status.includes('404') ? 'Não Encontrado' : 'Erro na Requisição'}
                                 </span>
                               )}
                               <span className="text-[10px] font-mono bg-white/5 px-2 py-1 rounded border border-white/5">{testResult.status}</span>
                            </div>
                          </div>

                          {testResult.isError && (
                            <div className="p-4 bg-red-500/5 border border-red-500/10 rounded-xl space-y-2">
                              <p className="text-[10px] text-red-400 font-bold uppercase flex items-center gap-1.5">
                                <Shield size={12} /> Diagnóstico de Erro
                              </p>
                              <p className="text-[11px] text-slate-400 leading-relaxed">
                                {testResult.status.includes('403') ? 'Acesso Negado: Verifique se este segredo possui uma senha. Se sim, informe-a no header X-Secret-Password.' : 
                                 testResult.status.includes('401') ? 'Não Autorizado: Seu token pode estar expirado ou o Client ID/Secret estão incorretos. Tente gerar um novo token.' : 
                                 testResult.status.includes('404') ? 'Não Encontrado: O recurso solicitado não existe ou você não tem permissão para acessá-lo diretamente.' : 
                                 'Ocorreu um erro inesperado. Verifique os parâmetros e tente novamente.'}
                              </p>
                              {!testResult.isFromNode && (
                                <p className="text-[9px] text-amber-500 font-mono pt-1">
                                   * Esta resposta foi interceptada por um Proxy/WAF antes de chegar na Bold API.
                                </p>
                              )}
                            </div>
                          )}

                          <div className="flex-1 relative overflow-auto custom-scrollbar">
                            <pre className="text-slate-300 bg-black/40 p-6 rounded-2xl whitespace-pre-wrap break-all border border-white/5 font-mono text-xs leading-relaxed">
                              {JSON.stringify(testResult.data || { error: testResult.error }, null, 2)}
                            </pre>
                            <button 
                              onClick={() => handleCopy(JSON.stringify(testResult.data, null, 2), 'res-copy')}
                              className="absolute right-4 top-4 p-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-white opacity-0 group-hover:opacity-100 transition-opacity border border-white/10"
                            >
                              {copied === 'res-copy' ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
                            </button>
                          </div>
                          
                          {!testResult.isError && testToken && activeTab === 'playground' && (
                            <motion.div 
                              initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                              className="p-5 bg-accent/10 border border-accent/20 rounded-2xl flex items-center justify-between gap-4"
                            >
                              <div>
                                <p className="text-accent text-[10px] font-black uppercase mb-1 flex items-center gap-1"><Zap size={10} /> Teste Concluído</p>
                                <p className="text-slate-400 text-[11px] leading-tight">Implemente este endpoint no seu app.</p>
                              </div>
                              <button 
                                onClick={() => setActiveTab('docs')}
                                className="text-[10px] font-black text-white bg-accent px-4 py-2.5 rounded-xl flex items-center gap-2 hover:bg-accent/80 transition-colors shadow-lg shadow-accent/20 shrink-0"
                              >
                                Ver Docs <ArrowRight size={14} />
                              </button>
                            </motion.div>
                          )}
                        </div>
                      ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-slate-600 text-center space-y-6 py-20 px-8">
                          <div className="size-20 bg-white/[0.02] rounded-[2rem] flex items-center justify-center border border-white/5">
                            <Terminal size={40} className="opacity-20" />
                          </div>
                          <div className="space-y-2">
                             <p className="font-bold text-white/50">Terminal Interativo</p>
                             <p className="text-xs text-slate-500 max-w-[240px] leading-relaxed">
                               {activeEndpointId ? 'O resultado da requisição de teste aparecerá aqui.' : 'Aguardando ação... Autentique-se ou escolha um recurso para testar.'}
                             </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'docs' && (
              <motion.div key="docs" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-16">
                {/* Intro Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                  <div className="space-y-6">
                    <h2 className="text-4xl font-black text-white tracking-tight">API Reference</h2>
                    <p className="text-slate-400 leading-relaxed">
                      A API do Bold Share é organizada em torno de REST. Nossa API possui URLs previsíveis e orientadas a recursos, 
                      aceita corpos de solicitação codificados em JSON e retorna respostas codificadas em JSON.
                    </p>
                    <div className="flex flex-wrap gap-3">
                      <div className="px-3 py-1 bg-white/5 rounded-full border border-white/10 flex items-center gap-2">
                        <div className="size-2 bg-emerald-500 rounded-full" />
                        <span className="text-[10px] font-black text-white uppercase tracking-widest">v1.0 (Stable)</span>
                      </div>
                      <div className="px-3 py-1 bg-white/5 rounded-full border border-white/10 flex items-center gap-2">
                        <Lock size={12} className="text-indigo-400" />
                        <span className="text-[10px] font-black text-white uppercase tracking-widest">OAuth 2.0 / Bearer</span>
                      </div>
                      <div className="px-3 py-1 bg-white/5 rounded-full border border-white/10 flex items-center gap-2">
                        <Shield size={12} className="text-emerald-400" />
                        <span className="text-[10px] font-black text-white uppercase tracking-widest">TLS 1.3 / Encrypted</span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="bg-slate-900 border border-white/5 rounded-3xl p-6 space-y-4 shadow-2xl relative overflow-hidden">
                      <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest">Base URL</h4>
                      <div className="flex items-center gap-3 bg-black/40 p-4 rounded-2xl border border-indigo-500/20 group">
                        <code className="text-indigo-400 font-mono text-sm">{window.location.origin}/api/v1</code>
                        <button onClick={() => handleCopy(`${window.location.origin}/api/v1`, 'base-url')} className="p-2 opacity-0 group-hover:opacity-100 transition-opacity text-slate-500 hover:text-white">
                          {copied === 'base-url' ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                        </button>
                      </div>
                    </div>
                    <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-3xl p-6 flex gap-4">
                       <div className="size-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-500 shrink-0">
                          <ShieldCheck size={20} />
                       </div>
                       <div>
                          <h6 className="text-sm font-bold text-white mb-1">Criptografia em Trânsito</h6>
                          <p className="text-xs text-slate-400 leading-tight">
                            Todas as requisições, incluindo senhas e tokens, são protegidas por SSL/TLS 1.3, garantindo que nada seja interceptado.
                          </p>
                       </div>
                    </div>
                  </div>
                </div>

                {/* Authentication Section */}
                <div className="space-y-8">
                  <div className="flex items-center gap-4">
                    <div className="size-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                      <Shield size={20} />
                    </div>
                    <h3 className="text-xl font-black text-white uppercase tracking-widest">Autenticação</h3>
                  </div>
                  <div className="bg-white/[0.02] border border-white/5 rounded-[2rem] p-8 space-y-6">
                    <p className="text-sm text-slate-400 leading-relaxed max-w-2xl">
                      Todas as requisições de API devem ser autenticadas usando seu <span className="text-white font-bold">Client Secret</span> trocada por um Token de Sessão (Playground) ou via Header direto para endpoints públicos.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                       <div className="space-y-4">
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Header Recomendado</p>
                          <div className="bg-slate-950 p-6 rounded-2xl border border-white/5 font-mono text-xs space-y-2">
                             <p className="text-indigo-400">Authorization: <span className="text-white font-bold">Bearer &lt;SEU_TOKEN&gt;</span></p>
                             <p className="text-indigo-400">Content-Type: <span className="text-white font-bold">application/json</span></p>
                          </div>
                       </div>
                       <div className="bg-white/[0.03] p-6 rounded-2xl border border-white/5 flex flex-col justify-center">
                          <p className="text-xs text-slate-400 font-medium italic">
                            "Segurança não é uma opção, é a fundação do Bold Share. Nunca exponha seu Client Secret em código front-end."
                          </p>
                       </div>
                    </div>
                  </div>
                </div>

                {/* Endpoints Table View (More Objective) */}
                <div className="space-y-8">
                  <div className="flex items-center gap-4">
                    <div className="size-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                      <Cpu size={20} />
                    </div>
                    <h3 className="text-xl font-black text-white uppercase tracking-widest">Endpoints Disponíveis</h3>
                  </div>
                  
                  <div className="space-y-3">
                    {endpoints.map((ep) => (
                      <div key={ep.id} className="group border border-white/5 rounded-2xl overflow-hidden bg-white/[0.02] hover:bg-white/[0.04] transition-all">
                        {/* Summary Line */}
                        <div className="flex items-center gap-4 p-5">
                          <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase w-20 text-center ${
                            ep.method === 'GET' ? 'bg-blue-500/20 text-blue-400' :
                            ep.method === 'POST' ? 'bg-emerald-500/20 text-emerald-400' :
                            'bg-slate-500/20 text-slate-400'
                          }`}>
                            {ep.method}
                          </span>
                          <code className="text-sm font-mono text-indigo-300 font-bold flex-1">{ep.path}</code>
                          <span className="text-slate-500 text-xs font-bold uppercase tracking-widest hidden md:inline">{ep.title}</span>
                          <button 
                            onClick={() => {
                              setExpandedEndpoint(expandedEndpoint === ep.id ? null : ep.id);
                              if (ep.body) setRequestBody(JSON.stringify(ep.body, null, 2));
                            }}
                            className="bg-accent/10 hover:bg-accent text-accent hover:text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all"
                          >
                            {expandedEndpoint === ep.id ? 'Fechar Docs' : 'Ver Detalhes'}
                          </button>
                        </div>

                        <AnimatePresence>
                          {expandedEndpoint === ep.id && (
                            <motion.div 
                              initial={{ height: 0, opacity: 0 }} 
                              animate={{ height: 'auto', opacity: 1 }} 
                              exit={{ height: 0, opacity: 0 }}
                              className="border-t border-white/5 bg-black/20"
                            >
                              <div className="p-8 space-y-10">
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                                  <div className="space-y-8">
                                    <div className="space-y-4">
                                       <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Descrição Técnica</h5>
                                       <p className="text-sm text-slate-300 leading-relaxed">{ep.description}</p>
                                    </div>

                                    {ep.body && (
                                       <div className="space-y-4">
                                          <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Schema do Objeto (JSON Body)</h5>
                                          <div className="space-y-2">
                                             {Object.entries(ep.body).map(([key, val]: [string, any]) => (
                                                <div key={key} className="flex items-start gap-4 p-3 bg-white/5 rounded-xl border border-white/5">
                                                   <div className="flex-1">
                                                      <div className="flex items-center gap-2 mb-1">
                                                         <code className="text-xs text-emerald-400 font-bold">{key}</code>
                                                         <span className="text-[9px] text-slate-500 font-mono">({val.type})</span>
                                                         {val.required && <span className="text-[7px] text-red-500 font-black uppercase bg-red-500/10 px-1.5 py-0.5 rounded-full">Required</span>}
                                                      </div>
                                                      <p className="text-[11px] text-slate-400">{val.description}</p>
                                                   </div>
                                                </div>
                                             ))}
                                          </div>
                                       </div>
                                    )}
                                  </div>

                                  <div className="space-y-6">
                                     <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                           <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Exemplo de Integração</h5>
                                           <div className="flex bg-white/10 p-1 rounded-lg">
                                             {['js', 'curl', 'python'].map(l => (
                                               <button 
                                                 key={l}
                                                 onClick={() => setSnippetLanguage(l as any)}
                                                 className={`px-3 py-1 rounded-md text-[9px] font-black uppercase transition-all ${snippetLanguage === l ? 'bg-accent text-white' : 'text-slate-500'}`}
                                               >
                                                 {l}
                                               </button>
                                             ))}
                                           </div>
                                        </div>
                                        <div className="bg-slate-900 border border-white/10 rounded-2xl overflow-hidden">
                                           <pre className="p-6 font-mono text-[11px] text-indigo-300 leading-relaxed overflow-x-auto">
                                              <code>{generateSnippet(ep)}</code>
                                           </pre>
                                        </div>
                                     </div>
                                     
                                     <button 
                                        onClick={() => {
                                          setActiveTab('playground');
                                          setActiveEndpointId(ep.id);
                                        }}
                                        className="w-full py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-xs font-black text-white hover:text-accent transition-all flex items-center justify-center gap-3"
                                     >
                                        <Zap size={16} />
                                        Testar no Playground Interativo
                                     </button>
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ))}
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
