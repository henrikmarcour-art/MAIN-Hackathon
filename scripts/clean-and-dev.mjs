/**
 * Fixes "Internal Server Error" on localhost:3000 after `npm run build`
 * ran while `next dev` was still running (both use `.next` and corrupt it).
 */
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const nextDir = path.join(process.cwd(), ".next");
if (fs.existsSync(nextDir)) {
  fs.rmSync(nextDir, { recursive: true, force: true });
  console.log("Removed .next (stale or corrupted dev cache).");
}

const nextBin = path.join(process.cwd(), "node_modules", "next", "dist", "bin", "next");
console.log("Starting next dev…");
const child = spawn(process.execPath, [nextBin, "dev"], {
  stdio: "inherit",
  cwd: process.cwd(),
});
child.on("exit", (code) => process.exit(code ?? 0));
