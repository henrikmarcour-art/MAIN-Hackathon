/**
 * Starts `next dev` and auto-removes `.next` when it contains a production
 * build or broken webpack chunks (e.g. "Cannot find module './586.js'").
 */
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const cwd = process.cwd();
const nextDir = path.join(cwd, ".next");

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

if (shouldCleanNext()) {
  fs.rmSync(nextDir, { recursive: true, force: true });
  console.log(
    "Removed stale .next (production build or broken dev cache). Starting fresh…"
  );
}

const nextBin = path.join(cwd, "node_modules", "next", "dist", "bin", "next");
const child = spawn(process.execPath, [nextBin, "dev"], {
  stdio: "inherit",
  cwd,
});
child.on("exit", (code) => process.exit(code ?? 0));
