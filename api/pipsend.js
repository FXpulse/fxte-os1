export default async function handler(req, res) {
  const target = req.url.replace(/^\/api\/pipsend/, '');
  const url = 'https://api.pipsend.com/api/v1' + (target || '');

  try {
    const resp = await fetch(url, {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        ...(req.headers.authorization ? { Authorization: req.headers.authorization } : {}),
      },
      body: ['GET', 'HEAD'].includes(req.method) ? undefined : JSON.stringify(req.body),
    });

    const data = await resp.json().catch(() => ({}));
    res.status(resp.status).json(data);
  } catch (e) {
    res.status(502).json({ error: 'Proxy error', message: e.message });
  }
}
