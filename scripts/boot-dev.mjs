/**
 * One command after git pull: install deps (if needed), clean .next, start dev.
 */
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import http from "node:http";
import net from "node:net";
import path from "node:path";

const cwd = process.cwd();
const PORT = 3000;
const nextBin = path.join(cwd, "node_modules", "next", "dist", "bin", "next");

function portOpen(port) {
  return new Promise((resolve) => {
    const socket = net.connect({ port, host: "127.0.0.1" }, () => {
      socket.end();
      resolve(true);
    });
    socket.on("error", () => resolve(false));
    socket.setTimeout(800, () => {
      socket.destroy();
      resolve(false);
    });
  });
}

function httpOk() {
  return new Promise((resolve) => {
    const req = http.get(`http://127.0.0.1:${PORT}/`, (res) => {
      res.resume();
      resolve(res.statusCode !== undefined && res.statusCode < 500);
    });
    req.on("error", () => resolve(false));
    req.setTimeout(2000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

if (!fs.existsSync(path.join(cwd, "package.json"))) {
  console.error("Run this from the MaasNow folder (where package.json is).");
  process.exit(1);
}

if (!fs.existsSync(nextBin)) {
  console.log("Installing dependencies (first time or after pull)…\n");
  const install = spawnSync("npm", ["install"], {
    cwd,
    stdio: "inherit",
    shell: true,
  });
  if (install.status !== 0) {
    console.error("\nnpm install failed. Fix errors above, then run: npm run up\n");
    process.exit(install.status ?? 1);
  }
}

if ((await portOpen(PORT)) && (await httpOk())) {
  console.log(`
MaasNow is already running → http://localhost:${PORT}
Open that in your browser. Keep the terminal where dev is running open.
`);
  process.exit(0);
}

process.env.MAASNOW_DEV_CLEAN = "1";
const nextDir = path.join(cwd, ".next");
if (fs.existsSync(nextDir)) {
  fs.rmSync(nextDir, { recursive: true, force: true });
  console.log("Removed .next for a clean dev start.\n");
}

const runner = path.join(cwd, "scripts", "next-dev.mjs");
const child = spawn(process.execPath, [runner], {
  stdio: "inherit",
  cwd,
});
child.on("exit", (code) => process.exit(code ?? 0));
