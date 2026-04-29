import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'bold-share-secret-key-123';

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
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { clientId, clientSecret } = req.body;

  if (!clientId || !clientSecret) {
    return res.status(400).json({ error: 'clientId e clientSecret são obrigatórios' });
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
  const supabase = createClient(supabaseUrl, serviceKey);

  try {
    const { data: client, error } = await supabase
      .from('api_apps')
      .select('*')
      .eq('client_id', clientId)
      .single();

    if (error || !client) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    if (client.client_secret !== clientSecret) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const token = jwt.sign(
      { 
        clientId: client.client_id, 
        userId: client.user_id, 
        scopes: client.scopes || ['read'] 
      }, 
      JWT_SECRET, 
      { expiresIn: '24h' }
    );

    return res.status(200).json({
      access_token: token,
      token_type: 'Bearer',
      expires_in: 86400,
      scopes: client.scopes
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}
