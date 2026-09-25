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

// -- package shell
writeFileSync(join(pkg, "index.ts"), 'export * from "../../entry";\n');
writeFileSync(
  join(pkg, "package.json"),
  JSON.stringify({ name: "maasnow", version: "0.1.0", private: true, types: "types/.design-sync/entry.d.ts" }, null, 2),
);
console.log(`wrote ${relative(root, pkg)}`);
