import { createServer } from "node:http";

// Minimal Node service (spec §3: Node handles logic that must not run on clients —
// Stripe webhooks, scheduled jobs, AI, etc.). Phase 1 scaffold: health check only.
const port = Number(process.env.PORT ?? 4000);

const server = createServer((req, res) => {
  if (req.method === "GET" && req.url === "/health") {
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({ status: "ok" }));
    return;
  }
  res.writeHead(404, { "content-type": "application/json" });
  res.end(JSON.stringify({ error: "not_found" }));
});

server.listen(port, () => {
  console.log(`[api] listening on http://localhost:${port}`);
});
