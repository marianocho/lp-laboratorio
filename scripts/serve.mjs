import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { resolve, extname, sep } from "node:path";

const root = resolve(fileURLToPath(new URL("../", import.meta.url)));
const publicRoot = resolve(root, "public");
const port = Number(process.env.PORT || 4173);
const mime = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml",
  ".jpg": "image/jpeg",
  ".png": "image/png",
  ".ttf": "font/ttf",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
};

createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(
      new URL(req.url, "http://localhost").pathname,
    );
    const file = resolve(
      pathname.startsWith("/src/")
        ? root
        : pathname === "/"
          ? root
          : publicRoot,
      `.${pathname === "/" ? "/index.html" : pathname}`,
    );
    if (file !== root && !file.startsWith(root + sep)) {
      res.writeHead(403).end();
      return;
    }
    if (!(await stat(file)).isFile()) {
      res.writeHead(404).end();
      return;
    }
    res.writeHead(200, {
      "Content-Type": mime[extname(file)] || "application/octet-stream",
      "Cache-Control": "no-cache",
    });
    res.end(await readFile(file));
  } catch {
    res
      .writeHead(404, { "Content-Type": "text/plain" })
      .end("Página não encontrada");
  }
}).listen(port, "127.0.0.1", () =>
  console.log(`Local: http://localhost:${port}`),
);
