module.exports = async function handler(req, res) {
  const checks = {};

  // 1. CRM_SECRET
  checks.CRM_SECRET = process.env.CRM_SECRET ? 'OK' : 'MISSING';

  // 2. KV env vars
  checks.KV_REST_API_URL   = process.env.KV_REST_API_URL   ? 'OK' : 'MISSING';
  checks.KV_REST_API_TOKEN = process.env.KV_REST_API_TOKEN ? 'OK' : 'MISSING';

  // 3. KV connection test
  try {
    const { kv } = require('@vercel/kv');
    await kv.set('rv_health_check', 'ok');
    const val = await kv.get('rv_health_check');
    checks.KV_connection = val === 'ok' ? 'OK' : 'UNEXPECTED_VALUE';
  } catch (err) {
    checks.KV_connection = 'ERROR: ' + err.message;
  }

  const allOk = Object.values(checks).every(v => v === 'OK');
  return res.status(allOk ? 200 : 500).json({ ok: allOk, checks });
};
