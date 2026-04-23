import { createClient } from '@supabase/supabase-js';

export async function handleCreateSecretLogic(req: any, res: any) {
  // Debugging environment variables
  let serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!serviceKey) {
    const foundKey = Object.keys(process.env).find(k => k.trim() === 'SUPABASE_SERVICE_ROLE_KEY');
    if (foundKey) {
      serviceKey = process.env[foundKey];
    }
  }

  const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
  const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
  const activeKey = serviceKey || anonKey || '';
  
  const supabase = createClient(supabaseUrl, activeKey);

  try {
    const secretData = req.body;
    console.log('[LOG] Criando segredo para:', secretData.name);

    if (!secretData.content) {
      return res.status(400).json({ error: 'Conteúdo do segredo é obrigatório.' });
    }

    const { data, error } = await supabase
      .from('secrets')
      .insert([secretData])
      .select();

    if (error) {
      console.error('[DB ERROR]:', error);
      if (error.message.includes('security policy')) {
        return res.status(403).json({ 
          error: 'Permissão Negada (RLS). A chave de serviço no servidor não tem permissão ou o banco está trancado.',
          sql: `ALTER TABLE public.secrets DISABLE ROW LEVEL SECURITY;`
        });
      }
      return res.status(500).json({ error: error.message });
    }

    if (data && data.length > 0) {
      return res.json(data[0]);
    } else {
      return res.status(500).json({ error: 'O banco não retornou o registro criado.' });
    }
  } catch (error: any) {
    console.error('[LOG ERROR]:', error);
    return res.status(500).json({ error: error.message });
  }
}
