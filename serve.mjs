import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
const types = { '.html':'text/html; charset=utf-8', '.css':'text/css', '.js':'text/javascript', '.json':'application/json', '.xml':'application/xml', '.svg':'image/svg+xml', '.png':'image/png', '.jpg':'image/jpeg', '.jpeg':'image/jpeg', '.webp':'image/webp' };
http.createServer((req, res) => {
  let p = path.join('dist', decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (fs.existsSync(p) && fs.statSync(p).isDirectory()) p = path.join(p, 'index.html');
  if (!fs.existsSync(p)) { res.writeHead(404, { 'content-type': types['.html'] }); return res.end(fs.readFileSync('dist/404.html')); }
  res.writeHead(200, { 'content-type': types[path.extname(p)] || 'application/octet-stream' }); fs.createReadStream(p).pipe(res);
}).listen(8080, () => console.log('Preview: http://localhost:8080'));
