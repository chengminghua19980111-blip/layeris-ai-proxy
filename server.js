const http = require('http');
const https = require('https');
const { URL } = require('url');
const PORT = process.env.PORT || 3000;
const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');
  if (req.method === 'OPTIONS') { res.writeHead(200); res.end(); return; }
  let targetHost = (req.url.startsWith('/v1beta') || req.url.includes('/models/')) ? 'generativelanguage.googleapis.com' : 'api.openai.com';
  const headers = { ...req.headers }; delete headers.host; delete headers.connection; headers.host = targetHost;
  const proxyReq = https.request({ hostname: targetHost, port: 443, path: req.url, method: req.method, headers: headers }, (proxyRes) => {
    const responseHeaders = { ...proxyRes.headers }; delete responseHeaders['transfer-encoding']; responseHeaders['access-control-allow-origin'] = '*';
    res.writeHead(proxyRes.statusCode, responseHeaders); proxyRes.pipe(res);
  });
  proxyReq.on('error', (err) => { res.writeHead(502); res.end('Proxy Error: ' + err.message); });
  proxyReq.setTimeout(300000, () => { proxyReq.destroy(new Error('Timeout')); });
  req.pipe(proxyReq);
});
server.listen(PORT, () => { console.log(`Proxy running on port ${PORT}`); });
