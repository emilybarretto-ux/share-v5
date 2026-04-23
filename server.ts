import express from 'express';
import { createServer as createViteServer } from 'vite';
import { createClient } from '@supabase/supabase-js';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Supabase Client (Prefered with Service Role Key to bypass RLS)
  const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // API Route to bypass RLS for creation
  app.post('/api/secrets', async (req, res) => {
    // Debugging environment variables and robust lookup
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
        console.error('[DATABASE ERROR]:', error);
        if (error.message.includes('row-level security policy')) {
          return res.status(403).json({ 
            error: `O banco de dados recusou a gravação (RLS).`,
            details: error.message,
            diagnosis: !serviceKey 
              ? 'A chave SUPABASE_SERVICE_ROLE_KEY não foi detectada pelo servidor. Verifique se o nome do Secret está correto (sem espaços).' 
              : 'A chave foi detectada, mas o Supabase não a reconheceu como uma chave de administração (service_role). Verifique se você copiou a chave certa do painel API do Supabase.'
          });
        }
        throw error;
      };
      
      console.log('[API] Segredo criado com sucesso!');
      res.json(data[0]);
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
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.log('✅ Chave de Serviço (Service Role Key) detectada. O servidor usará privilégios administrativos para criar segredos.');
    } else {
      console.warn('⚠️ AVISO: SUPABASE_SERVICE_ROLE_KEY não configurada. O RLS do Supabase impedirá a criação de segredos se não houver políticas públicas ativas.');
    }
  });
}

startServer();
