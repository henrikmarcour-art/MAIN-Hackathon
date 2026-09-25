// Prepares the design-sync input package at .design-sync/.cache/pkg/ (the app
// has no library build, so this stands in for one; nothing here is used by the
// app):
//   pkg/maasnow.css  Tailwind v4 + globals.css compiled to one static sheet,
//                    minus the app-shell body rule (position: fixed) that
//                    would clip preview cards, plus Geist from Google Fonts
//                    (the app gets it from next/font at build time).
//   pkg/types/       tsc declarations for .design-sync/entry.ts, with the
//                    "@/..." alias rewritten to relative paths so the
//                    converter can read real prop types.
//   pkg/index.ts     bundle entry re-exporting .design-sync/entry.ts.
// Run: node .design-sync/build.mjs
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import postcss from "postcss";
import tailwind from "@tailwindcss/postcss";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const pkg = resolve(here, ".cache/pkg");
rmSync(pkg, { recursive: true, force: true });
mkdirSync(pkg, { recursive: true });

// -- stylesheet
const src = resolve(here, "ds-styles.css");
const dropAppShell = {
  postcssPlugin: "drop-app-shell",
  Rule(rule) {
    if (rule.selector.trim() === "body" && rule.some((d) => d.prop === "position" && d.value === "fixed")) rule.remove();
  },
};
const css = await postcss([tailwind({ base: root, optimize: false }), dropAppShell]).process(readFileSync(src, "utf8"), {
  from: src,
  to: join(pkg, "maasnow.css"),
});
writeFileSync(
  join(pkg, "maasnow.css"),
  '@import url("https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&display=swap");\n' +
    ':root { --font-geist: "Geist"; }\n' +
    css.css,
);

// -- declarations
const types = join(pkg, "types");
writeFileSync(
  join(pkg, "tsconfig.json"),
  JSON.stringify({
    extends: relative(pkg, join(root, "tsconfig.json")),
    compilerOptions: {
      noEmit: false,
      declaration: true,
      emitDeclarationOnly: true,
      incremental: false,
      rootDir: relative(pkg, root),
      outDir: "types",
      plugins: [],
    },
    include: [],
    files: [relative(pkg, join(here, "entry.ts"))],
  }),
);
execFileSync(join(root, "node_modules/.bin/tsc"), ["-p", join(pkg, "tsconfig.json")], { stdio: "inherit" });
const walk = (d) => readdirSync(d).flatMap((n) => (statSync(join(d, n)).isDirectory() ? walk(join(d, n)) : [join(d, n)]));
for (const f of walk(types).filter((f) => f.endsWith(".d.ts"))) {
  const text = readFileSync(f, "utf8").replace(/(["'])@\/([^"']+)\1/g, (_, q, p) => {
    let rel = relative(dirname(f), join(types, "src", p));
    if (!rel.startsWith(".")) rel = "./" + rel;
    return q + rel + q;
  });
  writeFileSync(f, text);
}

// -- design tokens, on their own
// src/app/tokens.css is the single source of truth. Its `@theme` block becomes
// a plain :root stylesheet in a tiny package (cfg.tokensPkg), so the
// converter lists only real MaasNow tokens, never Tailwind's --tw-* internals.
// The `@theme inline` block (mode-aware aliases) is app wiring, not tokens.
{
  const src = readFileSync(join(root, "src/app/tokens.css"), "utf8");
  const header = src.match(/^\/\*[\s\S]*?\*\//)?.[0] ?? "";
  const start = src.search(/@theme\s*\{/);
  let depth = 0;
  let end = start;
  for (let i = src.indexOf("{", start); i < src.length; i++) {
    if (src[i] === "{") depth++;
    else if (src[i] === "}" && --depth === 0) {
      end = i;
      break;
    }
  }
  const body = src.slice(src.indexOf("{", start) + 1, end);
  const tokensDir = resolve(here, ".cache/tokens");
  rmSync(tokensDir, { recursive: true, force: true });
  mkdirSync(tokensDir, { recursive: true });
  writeFileSync(
    join(tokensDir, "tokens.css"),
    `${header}\n\n/* Generated from src/app/tokens.css by .design-sync/build.mjs. */\n:root {${body}}\n`
  );
  writeFileSync(
    join(tokensDir, "package.json"),
    JSON.stringify({ name: "maasnow-tokens", version: "0.1.0", private: true }, null, 2)
  );
}

// -- package shell
writeFileSync(join(pkg, "index.ts"), 'export * from "../../entry";\n');
writeFileSync(
  join(pkg, "package.json"),
  JSON.stringify({ name: "maasnow", version: "0.1.0", private: true, types: "types/.design-sync/entry.d.ts" }, null, 2),
);
console.log(`wrote ${relative(root, pkg)}`);
