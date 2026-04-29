import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'bold-share-secret-key-123';

const verifyToken = (authHeader: string | undefined) => {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.split(' ')[1];
  try {
    return jwt.verify(token, JWT_SECRET) as any;
  } catch (err) {
    return null;
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

  const apiClient = verifyToken(req.headers.authorization);
  if (!apiClient) {
    return res.status(401).json({ error: 'Token inválido ou ausente' });
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
      const payload = { ...req.body, user_id: apiClient.userId };
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
