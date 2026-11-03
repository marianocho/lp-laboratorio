import { cp, mkdir, rm, stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { join } from "node:path";

const root = fileURLToPath(new URL("../", import.meta.url));
await rm(join(root, "dist"), { recursive: true, force: true });
await mkdir(join(root, "dist"), { recursive: true });
await cp(join(root, "public"), join(root, "dist"), { recursive: true });
await cp(join(root, "src"), join(root, "dist/src"), { recursive: true });
await cp(join(root, "index.html"), join(root, "dist/index.html"));
const { size } = await stat(join(root, "dist/index.html"));
console.log(`Site estático gerado em dist/ (${size} bytes de HTML).`);
