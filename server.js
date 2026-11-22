const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = Number(process.env.PORT) || 3000;
const ROOT_DIR = __dirname;

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".svg": "image/svg+xml; charset=utf-8",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".xml": "application/xml; charset=utf-8",
  ".txt": "text/plain; charset=utf-8"
};

function resolveSafePath(urlPath) {
  let cleanPath = "/";
  try {
    cleanPath = decodeURIComponent(String(urlPath || "/").split("?")[0]);
  } catch {
    return null;
  }

  if (cleanPath === "/") cleanPath = "/index.html";
  const normalized = path.posix.normalize(cleanPath).replace(/^\/+/, "");
  if (!normalized || normalized.startsWith("..") || normalized.startsWith(".")) {
    return null;
  }

  const candidate = path.resolve(ROOT_DIR, normalized);
  if (!candidate.startsWith(ROOT_DIR + path.sep) && candidate !== ROOT_DIR) {
    return null;
  }

  if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
    return candidate;
  }

  if (!path.extname(candidate)) {
    const htmlCandidate = candidate + ".html";
    if (fs.existsSync(htmlCandidate) && fs.statSync(htmlCandidate).isFile()) {
      return htmlCandidate;
    }
  }

  return null;
}

const server = http.createServer((req, res) => {
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.writeHead(405, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Method Not Allowed");
    return;
  }

  const filePath = resolveSafePath(req.url);
  if (!filePath) {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Not Found");
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || "application/octet-stream";

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Internal Server Error");
      return;
    }
    res.writeHead(200, { "Content-Type": contentType });
    if (req.method === "HEAD") {
      res.end();
    } else {
      res.end(data);
    }
  });
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Static HTML/CSS/JS server listening on http://0.0.0.0:${PORT}`);
});
