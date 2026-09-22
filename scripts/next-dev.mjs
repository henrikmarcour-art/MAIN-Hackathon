/**
 * Reliable local dev for MaasNow:
 * - Ensures dependencies exist
 * - Clears broken / production .next output
 * - Frees port 3000 from stale Next/Node processes (macOS/Linux)
 * - Always listens on http://localhost:3000
 */
import { execSync, spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const cwd = process.cwd();
const nextDir = path.join(cwd, ".next");
const nextBin = path.join(cwd, "node_modules", "next", "dist", "bin", "next");
const PORT = 3000;

function sleep(ms) {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    /* wait for old process to release port */
  }
}

function ensureDependencies() {
  if (fs.existsSync(nextBin)) return;
  console.error(`
MaasNow dependencies are missing.

From the project folder run:
  npm install
  npm run dev
`);
  process.exit(1);
}

function shouldCleanNext() {
  if (process.env.MAASNOW_DEV_CLEAN === "1") return true;
  if (!fs.existsSync(nextDir)) return false;

  const prodPage = path.join(nextDir, "server/app/page.js");
  if (fs.existsSync(prodPage)) {
    const sample = fs.readFileSync(prodPage, "utf8").slice(0, 4000);
    if (
      sample.includes("runtime.prod.js") ||
      sample.includes("app-page.runtime.prod")
    ) {
      return true;
    }
  }

  const runtime = path.join(nextDir, "server/webpack-runtime.js");
  const chunksDir = path.join(nextDir, "server/chunks");
  if (fs.existsSync(runtime) && fs.existsSync(chunksDir)) {
    const rt = fs.readFileSync(runtime, "utf8");
    for (const m of rt.matchAll(/\.\/(\d+)\.js/g)) {
      const chunk = path.join(chunksDir, `${m[1]}.js`);
      if (!fs.existsSync(chunk)) return true;
    }
  }

  return false;
}

function cleanNext(reason) {
  if (!fs.existsSync(nextDir)) return;
  fs.rmSync(nextDir, { recursive: true, force: true });
  console.log(reason);
}

/** Stop leftover Next dev servers so Safari can use localhost:3000. */
function freePort3000() {
  if (process.platform === "win32") return;
  try {
    const out = execSync(`lsof -ti :${PORT} 2>/dev/null || true`, {
      encoding: "utf8",
    }).trim();
    if (!out) return;
    for (const pid of out.split(/\s+/)) {
      if (!pid) continue;
      let cmd = "";
      try {
        cmd = execSync(`ps -p ${pid} -o command= 2>/dev/null`, {
          encoding: "utf8",
        });
      } catch {
        continue;
      }
      if (!/next|node/i.test(cmd)) continue;
      try {
        process.kill(Number(pid), "SIGTERM");
      } catch {
        /* already gone */
      }
    }
    sleep(400);
  } catch {
    /* lsof unavailable */
  }
}

ensureDependencies();

if (shouldCleanNext()) {
  cleanNext(
    "Removed stale .next (production build or broken dev cache). Starting fresh…"
  );
}

freePort3000();

console.log(`
MaasNow dev server → http://localhost:${PORT}
Keep this terminal open while you use the app in the browser.
Press Ctrl+C to stop.
`);

const child = spawn(process.execPath, [nextBin, "dev", "-p", String(PORT)], {
  stdio: "inherit",
  cwd,
});
child.on("exit", (code) => process.exit(code ?? 0));
