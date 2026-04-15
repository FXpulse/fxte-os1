export default async function handler(req, res) {
      const path = req.query?._path || '/';
      const base = 'https://api.pipsend.com';
      const url  = base + path;

  const headers = { 'Content-Type': 'application/json' };
      if (req.headers.authorization) headers['Authorization'] = req.headers.authorization;
      const body = ['GET','HEAD'].includes(req.method) ? undefined : JSON.stringify(req.body);

  try {
          const resp = await fetch(url, { method: req.method, headers, body });
          const text = await resp.text();
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('X-Proxy-URL', url);
          res.status(resp.status).send(text);
  } catch (e) {
          res.status(502).json({ error: 'Proxy error', message: e.message, url });
  }
}
