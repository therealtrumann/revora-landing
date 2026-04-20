const { kv } = require('@vercel/kv');

const LEADS_KEY = 'rv_leads';

function uid() {
  return 'l_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const { name, email, phone } = req.body || {};
    if (!name && !phone) return res.status(400).json({ error: 'name or phone required' });

    const leads = (await kv.get(LEADS_KEY)) || [];

    const ph = (phone || '').trim();
    if (ph && leads.some(l => l.phone === ph)) {
      return res.status(200).json({ ok: true, duplicate: true });
    }

    const lead = {
      id: uid(),
      name: (name || '').trim(),
      email: (email || '').trim(),
      phone: ph,
      notes: '',
      column: 'lead',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    leads.unshift(lead);
    await kv.set(LEADS_KEY, leads);

    return res.status(201).json({ ok: true });
  } catch (err) {
    console.error('[capture]', err);
    return res.status(500).json({ error: 'internal error' });
  }
};
