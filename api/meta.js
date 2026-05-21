// Meta Graph API proxy — runs as Vercel Node Serverless Function.
// Keeps META_TOKEN server-side and restricts which endpoints clients can hit.

const ALLOWED_ENDPOINT_PATTERNS = [
  /^act_929824683759001(\/(insights|ads|adsets|campaigns|customaudiences|adcreatives))?$/,
  /^\d+\/insights$/,                  // ad / adset / campaign insights by id
  /^17841404681419259(\/media|\/media_publish)?$/,  // IG account
  /^225426867908315(\/photos|\/posts|\/feed)?$/,    // FB page
  /^\d+$/,                            // single object lookup by id
];

function isEndpointAllowed(endpoint) {
  if (!endpoint || typeof endpoint !== 'string') return false;
  return ALLOWED_ENDPOINT_PATTERNS.some(re => re.test(endpoint));
}

function resolveAllowedOrigin(req) {
  const origin = req.headers.origin || '';
  const host = req.headers.host || '';
  // Allow same-host requests (the Vercel deployment serving this fn) and localhost during dev.
  if (origin && (origin.endsWith(host) || /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin))) {
    return origin;
  }
  // Same-origin fetches from the dashboard itself may omit the Origin header — allow same host.
  if (!origin) return `https://${host}`;
  return null;
}

export default async function handler(req, res) {
  const allowedOrigin = resolveAllowedOrigin(req);
  if (!allowedOrigin) {
    res.status(403).json({ error: 'Origen no permitido' });
    return;
  }
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  const token = process.env.META_TOKEN;
  if (!token) { res.status(500).json({ error: 'META_TOKEN no configurado en Vercel' }); return; }

  const { endpoint, ...params } = req.query || {};
  if (!endpoint) { res.status(400).json({ error: 'Falta parámetro endpoint' }); return; }

  if (!isEndpointAllowed(endpoint)) {
    res.status(403).json({ error: `Endpoint no permitido: ${endpoint}` });
    return;
  }

  const url = new URL(`https://graph.facebook.com/v22.0/${endpoint}`);
  // Forward query params (excluding `endpoint`) for GET; for POST these get merged with body.
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v));
  });
  url.searchParams.set('access_token', token);

  try {
    const init = { method: req.method };
    if (req.method === 'POST') {
      const body = req.body && typeof req.body === 'object' ? req.body : {};
      init.headers = { 'Content-Type': 'application/json' };
      init.body = JSON.stringify({ ...body, access_token: token });
      // Avoid duplicating access_token both in URL and body — strip from URL when posting.
      url.searchParams.delete('access_token');
    }
    const response = await fetch(url.toString(), init);
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
