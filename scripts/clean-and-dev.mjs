/**
 * Force a clean dev start (wipes .next, frees port 3000, then next dev).
 */
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

process.env.MAASNOW_DEV_CLEAN = "1";
const nextDir = path.join(process.cwd(), ".next");
if (fs.existsSync(nextDir)) {
  fs.rmSync(nextDir, { recursive: true, force: true });
  console.log("Removed .next (forced clean).");
}

const runner = path.join(process.cwd(), "scripts", "next-dev.mjs");
const child = spawn(process.execPath, [runner], {
  stdio: "inherit",
  cwd: process.cwd(),
});
child.on("exit", (code) => process.exit(code ?? 0));
