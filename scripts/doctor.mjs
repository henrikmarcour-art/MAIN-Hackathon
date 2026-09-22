#!/usr/bin/env node
/**
 * Quick local checks when http://localhost:3000 refuses connection.
 */
import { execSync } from "node:child_process";
import fs from "node:fs";
import net from "node:net";
import path from "node:path";

const cwd = process.cwd();
const PORT = 3000;

function ok(msg) {
  console.log(`✓ ${msg}`);
}
function warn(msg) {
  console.warn(`⚠ ${msg}`);
}
function fail(msg) {
  console.error(`✗ ${msg}`);
}

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

console.log("MaasNow doctor — connection refused on localhost:3000?\n");

if (!fs.existsSync(path.join(cwd, "package.json"))) {
  fail("Run this from the MaasNow project folder (where package.json is).");
  process.exit(1);
}

if (!fs.existsSync(path.join(cwd, "node_modules/next"))) {
  fail("Dependencies not installed.");
  console.log("\nFix:\n  npm install\n  npm run up\n");
  process.exit(1);
}
ok("node_modules/next present");

const listening = await portOpen(PORT);
if (listening) {
  ok(`Something is listening on port ${PORT} — try reloading the browser.`);
  try {
    execSync(`curl -s -o /dev/null -w "" http://127.0.0.1:${PORT}/`, {
      stdio: "ignore",
    });
    ok("HTTP request to / succeeded.");
  } catch {
    warn("Port is open but HTTP failed — run: npm run dev:clean");
  }
  process.exit(0);
}

fail(`Nothing is listening on port ${PORT} (ERR_CONNECTION_REFUSED).`);
console.log(`
The dev server is not running. Browsers cannot connect until you start it.

Fix (in this folder):

  npm install
  npm run up

Leave that terminal open. When you see "Ready", open:
  http://localhost:3000

Do not use "npm start" unless you already ran "npm run build".
`);

if (process.platform !== "win32") {
  try {
    const pids = execSync(`lsof -ti :${PORT} 2>/dev/null || true`, {
      encoding: "utf8",
    }).trim();
    if (pids) warn(`Port ${PORT} has processes but did not accept HTTP: ${pids}`);
  } catch {
    /* ignore */
  }
}

process.exit(1);
