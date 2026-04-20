module.exports = async function handler(req, res) {
  const checks = {};

  checks.CRM_SECRET              = process.env.CRM_SECRET              ? 'OK' : 'MISSING';
  checks.UPSTASH_REDIS_REST_URL  = process.env.UPSTASH_REDIS_REST_URL  ? 'OK' : 'MISSING';
  checks.UPSTASH_REDIS_REST_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN ? 'OK' : 'MISSING';

  try {
    const { Redis } = require('@upstash/redis');
    const redis = new Redis({
      url:   process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
    await redis.set('rv_health_check', 'ok');
    const val = await redis.get('rv_health_check');
    checks.Redis_connection = val === 'ok' ? 'OK' : 'UNEXPECTED_VALUE';
  } catch (err) {
    checks.Redis_connection = 'ERROR: ' + err.message;
  }

  const allOk = Object.values(checks).every(v => v === 'OK');
  return res.status(allOk ? 200 : 500).json({ ok: allOk, checks });
};
