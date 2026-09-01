import http from 'node:http';

export function startHealthServer(
  port: number,
  checkReady: () => Promise<boolean>,
): http.Server {
  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url || '/', `http://localhost:${port}`);

    if (url.pathname === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'ok', service: 'shikkhok-worker' }));
      return;
    }

    if (url.pathname === '/ready') {
      try {
        const ready = await checkReady();
        res.writeHead(ready ? 200 : 503, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({
            status: ready ? 'ready' : 'not_ready',
            service: 'shikkhok-worker',
            checks: { redis: ready ? 'up' : 'down' },
          }),
        );
      } catch (err: any) {
        res.writeHead(503, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'not_ready', error: err.message }));
      }
      return;
    }

    res.writeHead(404);
    res.end();
  });

  server.listen(port);
  return server;
}
