import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'bold-share-secret-key-123';

const verifyToken = (authHeader: string | undefined | string[]) => {
  const header = Array.isArray(authHeader) ? authHeader[0] : authHeader;
  if (!header) return { error: 'Cabeçalho Authorization ausente' };

  let token = header;
  if (header.toLowerCase().startsWith('bearer ')) {
    token = header.slice(7).trim();
  }

  try {
    return jwt.verify(token, JWT_SECRET) as any;
  } catch (err: any) {
    return { error: err.message };
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

  const rawHeader = req.headers.authorization || req.headers.Authorization;
  const apiClient = verifyToken(rawHeader);

  if (apiClient.error) {
    return res.status(401).json({ error: 'Token inválido ou ausente', details: apiClient.error });
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
  const supabase = createClient(supabaseUrl, serviceKey);

  if (req.method === 'POST') {
    if (!apiClient.scopes?.includes('secrets:write')) {
      return res.status(403).json({ error: 'Escopo insuficiente' });
    }
    try {
      const { expiration_hours, ...rest } = req.body;
      
      const expiresAt = new Date();
      if (expiration_hours) {
        expiresAt.setHours(expiresAt.getHours() + Number(expiration_hours));
      } else {
        // Default to 24h if not provided
        expiresAt.setHours(expiresAt.getHours() + 24);
      }

      const payload = { 
        ...rest, 
        expires_at: expiresAt.toISOString(),
        user_id: apiClient.userId,
        status: 'active'
      };
      
      const { data, error } = await supabase
        .from('requests')
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
