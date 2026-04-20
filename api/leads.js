const { kv } = require('@vercel/kv');

const LEADS_KEY = 'rv_leads';
const SECRET = process.env.CRM_SECRET || '';

function auth(req) {
  return SECRET !== '' && req.headers['x-crm-secret'] === SECRET;
}

function uid() {
  return 'l_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-crm-secret');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (!auth(req)) return res.status(401).json({ error: 'Unauthorized' });

  try {
    if (req.method === 'GET') {
      const leads = (await kv.get(LEADS_KEY)) || [];
      return res.status(200).json(leads);
    }

    if (req.method === 'POST') {
      const { name, email, phone, column, notes } = req.body || {};
      const leads = (await kv.get(LEADS_KEY)) || [];
      const lead = {
        id: uid(),
        name: (name || '').trim(),
        email: (email || '').trim(),
        phone: (phone || '').trim(),
        notes: (notes || '').trim(),
        column: column || 'lead',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      leads.unshift(lead);
      await kv.set(LEADS_KEY, leads);
      return res.status(201).json(lead);
    }

    if (req.method === 'PUT') {
      const { id, name, email, phone, notes, column } = req.body || {};
      if (!id) return res.status(400).json({ error: 'id required' });
      const leads = (await kv.get(LEADS_KEY)) || [];
      const idx = leads.findIndex(l => l.id === id);
      if (idx === -1) return res.status(404).json({ error: 'not found' });
      leads[idx] = {
        ...leads[idx],
        ...(name    !== undefined && { name:  name.trim() }),
        ...(email   !== undefined && { email: email.trim() }),
        ...(phone   !== undefined && { phone: phone.trim() }),
        ...(notes   !== undefined && { notes: notes.trim() }),
        ...(column  !== undefined && { column }),
        updatedAt: Date.now(),
      };
      await kv.set(LEADS_KEY, leads);
      return res.status(200).json(leads[idx]);
    }

    if (req.method === 'DELETE') {
      const { id } = req.body || {};
      if (!id) return res.status(400).json({ error: 'id required' });
      let leads = (await kv.get(LEADS_KEY)) || [];
      leads = leads.filter(l => l.id !== id);
      await kv.set(LEADS_KEY, leads);
      return res.status(200).json({ ok: true });
    }

    return res.status(405).end();
  } catch (err) {
    console.error('[leads]', err);
    return res.status(500).json({ error: 'internal error' });
  }
};
