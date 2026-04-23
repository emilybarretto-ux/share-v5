import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

export default async function handler(req: any, res: any) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id, viewerEmail, viewerIp } = req.body;

  if (!id) {
    return res.status(400).json({ error: 'ID do segredo é obrigatório.' });
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
  const supabase = createClient(supabaseUrl, serviceKey);

  try {
    // 1. Buscar o segredo para saber as restrições e o dono
    const { data: secret, error: fetchError } = await supabase
      .from('secrets')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !secret) {
      return res.status(404).json({ error: 'Segredo não encontrado.' });
    }

    // 2. Incrementar visualizações
    const nextViews = (secret.views || 0) + 1;
    const maxViews = secret.max_views !== null ? Number(secret.max_views) : null;
    const isOneTime = maxViews === 1;
    const reachedLimit = maxViews !== null && nextViews >= maxViews;

    const updatePayload: any = { 
      views: nextViews,
      last_viewer_email: viewerEmail || null
    };

    if (isOneTime || reachedLimit) {
      updatePayload.status = 'completed';
      updatePayload.content = '';
      updatePayload.key_values = null;
      updatePayload.password = '';
      updatePayload.file_url = null;
    }

    const { error: updateError } = await supabase.from('secrets').update(updatePayload).eq('id', id);
    
    if (updateError) {
      console.error('[DATABASE ERROR] Falha ao atualizar segredo:', updateError);
      return res.status(500).json({ error: 'Erro ao processar autodestruição no banco de dados.' });
    }

    // 3. Notificar se o dono pediu
    if (secret.notify_access) {
      console.log(`[DEBUG] Notificação solicitada para o segredo: ${secret.name}`);
      
      if (!secret.creator_email) {
        console.warn('[WARN] E-mail do criador não encontrado no registro do segredo.');
      } else if (!process.env.RESEND_API_KEY) {
        console.error('[ERROR] RESEND_API_KEY não configurada no ambiente.');
      } else {
        const resend = new Resend(process.env.RESEND_API_KEY);
        
        const emailBody = `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <h2 style="color: #2563eb;">🔓 Seu link foi acessado!</h2>
            <p>O segredo <strong>"${secret.name}"</strong> acabou de ser visualizado.</p>
            <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
            <ul style="list-style: none; padding: 0;">
              <li><strong>👤 Quem acessou:</strong> ${viewerEmail || 'Usuário Anônimo'}</li>
              <li><strong>🌐 IP do Visitante:</strong> ${viewerIp || 'Desconhecido'}</li>
              <li><strong>⏰ Horário:</strong> ${new Date().toLocaleString('pt-BR')}</li>
            </ul>
            <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin-top: 20px; font-size: 12px; color: #64748b;">
              Este link possui ${nextViews} de ${maxViews || 'ilimitadas'} visualizações permitidas.
              ${reachedLimit ? '<br/><strong>⚠️ Este link foi incinerado automaticamente após este acesso.</strong>' : ''}
            </div>
            <p style="margin-top: 20px; font-size: 12px; color: #94a3b8; text-align: center;">
              © 2024 Bold Share - Excelência em Privacidade
            </p>
          </div>
        `;

        try {
          const { data: mailData, error: mailError } = await resend.emails.send({
            from: 'Bold Share <onboarding@resend.dev>',
            to: secret.creator_email,
            subject: `Notificação de Acesso: ${secret.name}`,
            html: emailBody,
          });

          if (mailError) {
            console.error('[RESEND ERROR]', mailError);
          } else {
            console.log('[SUCCESS] E-mail enviado com ID:', mailData?.id);
          }
        } catch (mailErr) {
          console.error('[CRITICAL MAIL ERROR]', mailErr);
        }
      }
    }

    return res.status(200).json({ success: true, incinerated: reachedLimit || isOneTime });
  } catch (err: any) {
    console.error('[CRITICAL] Erro no handler de visualização:', err);
    return res.status(500).json({ error: err.message });
  }
}
