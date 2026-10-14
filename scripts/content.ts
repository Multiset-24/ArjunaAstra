/**
 * npm run content            build .content/ from content/
 * npm run content -- --watch rebuild on every change (used by npm run dev)
 * npm run check [paths]      validate only (exit 1 on errors)
 * Options: --root <dir> (default: repo root), --out <dir> (default: <root>/.content), --force
 */
import fs from "node:fs";
import path from "node:path";
import { compileAll, writeOutput, type CompileContext } from "../src/lib/content/compile";

const args = process.argv.slice(2);
const opt = (k: string) => {
  const i = args.indexOf(`--${k}`);
  return i >= 0 ? args[i + 1] : undefined;
};
const root = path.resolve(opt("root") ?? path.join(__dirname, ".."));
const out = path.resolve(opt("out") ?? path.join(root, ".content"));
const check = args.includes("--check");
const watch = args.includes("--watch");
const force = args.includes("--force");
const paths = args.filter((a, i) => !a.startsWith("--") && !["--root", "--out"].includes(args[i - 1] ?? ""));

async function run(quiet = false) {
  const t0 = Date.now();
  const ctx: CompileContext = { errors: [], warnings: [] };
  const filter = paths.length ? (rel: string) => paths.some((p) => rel.startsWith(path.relative(root, path.resolve(p)))) : undefined;
  const r = await compileAll(root, ctx, filter);
  const ms = Date.now() - t0;
  for (const e of ctx.errors) console.log(`  ✗ ${e}`);
  if (!quiet || check) for (const w of ctx.warnings.slice(0, 40)) console.log(`  ! ${w}`);
  const summary = `${r.lessons.length} lessons, ${r.cards.length} cards, ${Object.keys(r.problems).length} problems — ${ctx.errors.length} errors, ${ctx.warnings.length} warnings (${ms} ms)`;
  if (check) {
    console.log(summary);
    return ctx.errors.length === 0;
  }
  if (ctx.errors.length && !force && !watch) {
    console.log(summary);
    console.log("Fix the errors above (or pass --force to write the valid lessons).");
    return false;
  }
  fs.mkdirSync(out, { recursive: true });
  writeOutput(out, r);
  console.log(`content: ${summary}`);
  return true;
}

(async () => {
  if (!watch) {
    const ok = await run();
    process.exit(ok ? 0 : 1);
  }
  await run();
  let timer: NodeJS.Timeout | null = null;
  fs.watch(path.join(root, "content"), { recursive: true }, () => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => run(true).catch((e) => console.error(e)), 200);
  });
  console.log("content: watching content/ for changes");
})();
