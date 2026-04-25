import { createServer } from "http";
import { readFileSync, existsSync } from "fs";
import { resolve, extname } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __dir = dirname(fileURLToPath(import.meta.url));

function loadEnv() {
  const path = resolve(__dir, ".env");
  if (!existsSync(path)) return {};
  const env = {};
  for (const line of readFileSync(path, "utf-8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq === -1) continue;
    const k = t.slice(0, eq).trim();
    const v = t.slice(eq + 1).trim();
    if (k && v) env[k] = v;
  }
  return env;
}

const MIME = {
  ".html": "text/html",
  ".js":   "application/javascript",
  ".css":  "text/css",
  ".json": "application/json",
};

const PORT = 3747;

createServer((req, res) => {
  // API keys endpoint — re-reads .env on every request so edits take effect immediately
  if (req.url === "/env") {
    const env = loadEnv();
    res.writeHead(200, {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    });
    return res.end(JSON.stringify({
      anthropic: env.ANTHROPIC_API_KEY || "",
      openai:    env.OPENAI_API_KEY    || "",
    }));
  }

  // Static file serving
  const safePath = req.url === "/" ? "/index.html" : req.url.split("?")[0];
  const file = resolve(__dir, "." + safePath);

  // Prevent directory traversal
  if (!file.startsWith(__dir)) {
    res.writeHead(403); return res.end("Forbidden");
  }

  if (!existsSync(file)) {
    res.writeHead(404); return res.end("Not found");
  }

  const ext  = extname(file);
  const mime = MIME[ext] || "application/octet-stream";
  res.writeHead(200, { "Content-Type": mime });
  res.end(readFileSync(file));

}).listen(PORT, () => {
  console.log(`NOKTA demo → http://localhost:${PORT}`);
});
