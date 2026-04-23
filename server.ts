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

  // ROTA DE VISUALIZAÇÃO E EVENTOS (Notificações)
  app.post('/api/view-event', async (req, res) => {
    const { id, viewerEmail, viewerIp, action = 'increment' } = req.body;
    
    if (!id) return res.status(400).json({ error: 'ID é obrigatório' });

    const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
    const supabase = createClient(supabaseUrl, serviceKey);

    try {
      const { data: secret, error: fetchError } = await supabase
        .from('secrets')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError || !secret) return res.status(404).json({ error: 'Não encontrado' });

      const maxViews = secret.max_views !== null ? Number(secret.max_views) : null;
      const isOneTime = maxViews === 1;
      const nextViews = (secret.views || 0) + 1;
      const reachedLimit = maxViews !== null && nextViews >= maxViews;

      let updatePayload: any = {};

      if (action === 'burn') {
        updatePayload = {
          status: 'completed',
          content: '',
          password: '',
          key_values: null,
          file_url: null
        };
      } else {
        updatePayload = { views: nextViews };
        if (isOneTime || reachedLimit) {
          updatePayload.status = 'completed';
          updatePayload.content = '';
          updatePayload.password = '';
        }
      }

      const { error: updateError } = await supabase.from('secrets').update(updatePayload).eq('id', id);
      
      if (updateError) {
        console.error('[DATABASE ERROR] Update failed:', updateError);
        
        // Fallback para erro de constraint de status: Garante a incineração do conteúdo
        if (updateError.message.includes('status') || updateError.message.includes('check constraint')) {
          console.warn('[SERVER] Status update failed, trying fallback without status change...');
          const fallbackPayload = { ...updatePayload };
          delete fallbackPayload.status;
          
          const { error: fallbackError } = await supabase.from('secrets').update(fallbackPayload).eq('id', id);
          if (!fallbackError) {
            return res.json({ 
              success: true, 
              incinerated: true,
              warning: 'Status constraint error bypassed, content cleared for security.' 
            });
          }
        }
        
        return res.status(500).json({ error: `Erro no banco: ${updateError.message}` });
      }

      // Notificação Resend (Apenas no primeiro acesso)
      if (action === 'increment' && secret.notify_access && secret.creator_email && process.env.RESEND_API_KEY) {
        const { Resend } = await import('resend');
        const resend = new Resend(process.env.RESEND_API_KEY);
        
        await resend.emails.send({
          from: 'Bold Share <onboarding@resend.dev>',
          to: secret.creator_email,
          subject: `Notificação de Acesso: ${secret.name}`,
          html: `<p>Seu segredo <strong>"${secret.name}"</strong> foi visualizado por ${viewerEmail || 'Usuário Anônimo'} (IP: ${viewerIp || 'Desconhecido'}).</p>`
        }).catch(e => console.error('Erro Resend:', e));
      }

      return res.json({ success: true, incinerated: action === 'burn' });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
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
