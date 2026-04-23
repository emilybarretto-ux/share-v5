import express from 'express';
import cors from 'cors';
import { createServer as createViteServer } from 'vite';
import { createClient } from '@supabase/supabase-js';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // Log de requisições para depuração
  app.use((req, res, next) => {
    console.log(`[DEBUG SERVER] ${req.method} ${req.url}`);
    next();
  });

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'API is alive' });
  });

  // ROTA PRINCIPAL DE CRIAÇÃO
  app.post('/api/create-secret', async (req, res) => {
    console.log('[DEBUG] Recebido POST em /api/create-secret');
    
    let serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    // Tentativa de busca resiliente caso o nome tenha espaços ou caracteres invisíveis
    if (!serviceKey) {
      const foundKey = Object.keys(process.env).find(k => k.trim() === 'SUPABASE_SERVICE_ROLE_KEY');
      if (foundKey) {
        console.log(`[DEBUG] Chave encontrada com nome ligeiramente diferente: "${foundKey}"`);
        serviceKey = process.env[foundKey];
      }
    }

    const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
    const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
    
    console.log('[DEBUG] SUPABASE_SERVICE_ROLE_KEY exists:', !!serviceKey);
    console.log('[DEBUG] VITE_SUPABASE_ANON_KEY exists:', !!anonKey);
    console.log('[DEBUG] SUPABASE_URL exists:', !!supabaseUrl);

    // Ensure we are using the Service Role Key if available
    const activeKey = serviceKey || anonKey || '';
    const tempSupabase = createClient(supabaseUrl, activeKey);

    try {
      console.log('[API] Tentando inserir segredo no banco...');
      const { data, error } = await tempSupabase
        .from('secrets')
        .insert([req.body])
        .select();

      if (error) {
        console.error('[DATABASE ERROR DETAILS]:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        });
        
        if (error.message.includes('row-level security policy')) {
          const isActuallyAnon = serviceKey && anonKey && serviceKey.trim() === anonKey.trim();
          
          return res.status(403).json({ 
            error: `Erro de Segurança RLS no Supabase.`,
            details: error.message,
            diagnosis: isActuallyAnon 
              ? 'A chave SUPABASE_SERVICE_ROLE_KEY configurada é IGUAL à chave anon pública. Você deve usar a chave "service_role" secreta encontrada no painel API do Supabase.'
              : 'O banco de dados negou a gravação. Isso acontece quando as políticas de RLS estão ativas mas não há permissão para inserir.',
            solution: 'Copie e cole o comando SQL abaixo no SQL Editor do seu Supabase para liberar o acesso:',
            sql: `
-- COMANDO PARA CORRIGIR PERMISSÕES RLS --
ALTER TABLE public.secrets DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.requests DISABLE ROW LEVEL SECURITY;
-- Ou, se preferir manter o RLS ativo, rode:
-- CREATE POLICY "Permitir inserção pública" ON public.secrets FOR INSERT WITH CHECK (true);
            `
          });
        }
        throw error;
      };
      
      console.log('[API] Segredo criado com sucesso!');
      if (data && data.length > 0) {
        res.json(data[0]);
      } else {
        res.status(500).json({ error: 'Erro inesperado: O banco de dados não retornou o registro criado.' });
      }
    } catch (error: any) {
      console.error('[SERVER ERROR]:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Vite integration
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Bold Share Server running on http://localhost:${PORT}`);
  });

  return app;
}

export const app = startServer();
export default app;
