import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'bold-share-secret-key-123';

const verifyToken = (authHeader: string | undefined | string[]) => {
  const header = Array.isArray(authHeader) ? authHeader[0] : authHeader;
  
  if (!header) {
    return { error: 'Cabeçalho Authorization ausente' };
  }

  // Tenta extrair o token removendo "Bearer " (case-insensitive)
  let token = header;
  if (header.toLowerCase().startsWith('bearer ')) {
    token = header.slice(7).trim();
  }

  if (!token || token === 'undefined' || token === 'null') {
    return { error: 'Token não encontrado no cabeçalho' };
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    return decoded;
  } catch (err: any) {
    console.error('Erro na verificação do JWT:', err.message);
    return { error: `JWT Error: ${err.message}` };
  }
};

export default async function handler(req: any, res: any) {
  // CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Pega o header de forma robusta
  const rawHeader = req.headers.authorization || req.headers.Authorization;
  const apiClient = verifyToken(rawHeader);
  
  if (apiClient.error) {
    return res.status(401).json({ 
      error: 'Autenticação falhou', 
      details: apiClient.error,
      hint: 'Certifique-se de que o cabeçalho Authorization contém "Bearer SEU_TOKEN"'
    });
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
  const supabase = createClient(supabaseUrl, serviceKey);

  if (req.method === 'GET') {
    const { id } = req.query;
    try {
      if (id) {
        const { data, error } = await supabase
          .from('secrets')
          .select('*')
          .eq('id', id)
          .eq('user_id', apiClient.userId)
          .single();
        if (error || !data) return res.status(404).json({ error: 'Segredo não encontrado' });
        return res.status(200).json(data);
      }

      const { data, error } = await supabase
        .from('secrets')
        .select('*')
        .eq('user_id', apiClient.userId);

      if (error) throw error;
      return res.status(200).json(data);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  if (req.method === 'POST') {
    if (!apiClient.scopes?.includes('secrets:write')) {
      return res.status(403).json({ error: 'Escopo insuficiente (secrets:write necessário)' });
    }
    try {
      const { 
        name, 
        content, 
        password, 
        expiration_hours, 
        max_views, 
        is_burn_on_read,
        restrict_ip,
        require_email,
        allowed_email,
        allowed_domain,
        notify_access,
        redirect_url
      } = req.body;
      
      const payload: any = { 
        name: name || 'Segredo sem nome',
        content,
        password, // Note: If the client sends a plain password, it should ideally be hashed here if not using the same logic as App.tsx
        max_views: is_burn_on_read ? 1 : max_views,
        restrict_ip,
        require_email,
        allowed_email,
        allowed_domain,
        notify_access,
        redirect_url,
        user_id: apiClient.userId,
        status: 'active'
      };

      if (expiration_hours) {
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + Number(expiration_hours));
        payload.expires_at = expiresAt.toISOString();
      }

      const { data, error } = await supabase
        .from('secrets')
        .insert([payload])
        .select();

      if (error) throw error;
      return res.status(201).json(data ? data[0] : {});
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: 'Método não permitido' });
}
