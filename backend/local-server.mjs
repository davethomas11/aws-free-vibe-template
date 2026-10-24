import http from "node:http";
import { handler } from "./src/handler.mjs";

const PORT = process.env.PORT || 3001;

const server = http.createServer(async (req, res) => {
  // Set permissive local CORS headers to mimic AWS Lambda Function URL CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "content-type, authorization");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  const rawBody = Buffer.concat(chunks).toString("utf8");
  const url = new URL(req.url || "/", `http://localhost:${PORT}`);

  // Construct an AWS Lambda Function URL v2.0 payload format event
  const event = {
    version: "2.0",
    rawPath: url.pathname,
    rawQueryString: url.searchParams.toString(),
    headers: req.headers,
    requestContext: {
      http: {
        method: req.method,
        path: url.pathname,
      },
    },
    body: rawBody || undefined,
    isBase64Encoded: false,
  };

  try {
    const result = await handler(event);
    const statusCode = result.statusCode || 200;
    const headers = result.headers || {};
    for (const [k, v] of Object.entries(headers)) {
      res.setHeader(k, v);
    }
    res.writeHead(statusCode);
    res.end(result.body || "");
  } catch (err) {
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: err.message }));
  }
});

server.listen(PORT, () => {
  console.log(`[local-lambda] Listening on http://localhost:${PORT}`);
});
