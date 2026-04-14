// Vercel Serverless Function — PipSend API Proxy
// Solves CORS: browser → /api/pipsend/* → api.pipsend.com/api/v1/*

const PIPSEND_BASE = 'https://api.pipsend.com/api/v1';

export default async function handler(req, res) {
  // CORS headers — allow fxte-os.vercel.app and any subdomain
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Build the PipSend URL — strip /api/pipsend prefix
  const path = req.url.replace(/^\/api\/pipsend/, '') || '/';
  const targetUrl = PIPSEND_BASE + path;

  try {
    const headers = {
      'Content-Type': 'application/json',
    };

    // Forward Authorization header if present
    if (req.headers.authorization) {
      headers['Authorization'] = req.headers.authorization;
    }

    const fetchOptions = {
      method: req.method,
      headers,
    };

    // Forward body for POST/PUT
    if (['POST', 'PUT', 'PATCH'].includes(req.method) && req.body) {
      fetchOptions.body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    }

    const response = await fetch(targetUrl, fetchOptions);

    // Forward rate limit headers
    const rateLimitHeaders = ['X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset'];
    rateLimitHeaders.forEach(h => {
      const val = response.headers.get(h);
      if (val) res.setHeader(h, val);
    });

    const data = await response.json();
    return res.status(response.status).json(data);

  } catch (error) {
    console.error('PipSend proxy error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Proxy error: ' + error.message
    });
  }
}
