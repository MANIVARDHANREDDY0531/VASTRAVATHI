const { createServer } = require("http");
const { createReadStream, existsSync } = require("fs");
const { extname, join, normalize, resolve } = require("path");

const root = join(__dirname, "public");
const port = Number(process.env.PORT || 3000);

const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".ico": "image/x-icon"
};

createServer((req, res) => {
  const requestUrl = new URL(req.url || "/", `http://${req.headers.host}`);
  let filePath = requestUrl.pathname === "/"
    ? join(root, "index.html")
    : normalize(join(root, decodeURIComponent(requestUrl.pathname)));

  if (!resolve(filePath).startsWith(resolve(root))) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  if (!existsSync(filePath)) filePath = join(root, "index.html");

  res.writeHead(200, {
    "Content-Type": contentTypes[extname(filePath)] || "application/octet-stream"
  });
  createReadStream(filePath).pipe(res);
}).listen(port);
