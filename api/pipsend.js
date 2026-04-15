export default async function handler(req, res) {
        const path = req.query?._path || '/';
        const url  = 'https://api.pipsend.com/api/v1' + path;

  const headers = { 'Content-Type': 'application/json' };
        if (req.headers.authorization) headers['Authorization'] = req.headers.authorization;
        const body = ['GET','HEAD'].includes(req.method) ? undefined : JSON.stringify(req.body);

  try {
            const resp = await fetch(url, { method: req.method, headers, body });
            const text = await resp.text();
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Content-Type', 'application/json');
            res.status(resp.status).send(text);
  } catch (e) {
            res.status(502).json({ error: 'Proxy error', message: e.message, url });
  }
}
