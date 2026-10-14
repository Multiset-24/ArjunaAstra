/**
 * Fast, standalone lesson linter (no build needed).
 *
 *   npx tsx scripts/lint-lesson.ts content/dsa/01-core/03-two-pointers.md [more files or dirs]
 *
 * Checks frontmatter, every interactive block (YAML + schema), viz inputs against the catalog,
 * problems against the Codeforces / LeetCode snapshots in data/, the notes block, and minimum
 * interactivity. Exit code 1 if any error.
 */
import fs from "node:fs";
import path from "node:path";
import YAML from "yaml";
import { z } from "zod";
import { frontmatterSchema } from "../src/lib/content/schema";
import { IX_SCHEMAS, IX_TYPES, type IxType } from "../src/lib/content/blocks";
import { validateVizInput } from "../src/lib/viz/catalog";

const root = path.resolve(__dirname, "..");
const cf = new Map<string, { name: string; rating: number }>();
const lc = new Map<string, { title: string; difficulty: string; paid: boolean }>();
try {
  const d = JSON.parse(fs.readFileSync(path.join(root, "data/codeforces/problemset.json"), "utf8"));
  for (const [c, i, n, r] of d.problems) cf.set(`${c}${i}`, { name: n, rating: r });
} catch {}
try {
  const d = JSON.parse(fs.readFileSync(path.join(root, "data/leetcode/problems.json"), "utf8"));
  const diff = ["", "Easy", "Medium", "Hard"];
  for (const [, slug, title, lvl, paid] of d.problems) lc.set(slug, { title, difficulty: diff[lvl], paid: !!paid });
} catch {}

function collect(p: string): string[] {
  const st = fs.statSync(p);
  if (st.isDirectory()) return fs.readdirSync(p).flatMap((f) => collect(path.join(p, f)));
  return p.endsWith(".md") ? [p] : [];
}

const files = process.argv.slice(2).flatMap(collect);
if (!files.length) {
  console.log("usage: npx tsx scripts/lint-lesson.ts <file-or-dir>...");
  process.exit(1);
}

let errors = 0;
let warnings = 0;
for (const file of files) {
  const rel = path.relative(root, file);
  const src = fs.readFileSync(file, "utf8");
  const err = (line: number, msg: string) => {
    errors++;
    console.log(`  ✗ ${rel}:${line}  ${msg}`);
  };
  const warn = (line: number, msg: string) => {
    warnings++;
    console.log(`  ! ${rel}:${line}  ${msg}`);
  };

  const m = /^---\n([\s\S]*?)\n---\n/.exec(src);
  if (!m) {
    err(1, "missing YAML frontmatter (--- ... ---)");
    continue;
  }
  const fmLines = m[0].split("\n").length - 1;
  let fm: z.infer<typeof frontmatterSchema> | undefined;
  try {
    const parsed = frontmatterSchema.safeParse(YAML.parse(m[1]));
    if (!parsed.success) err(2, "frontmatter: " + z.prettifyError(parsed.error).replace(/\n/g, "\n      "));
    else fm = parsed.data;
  } catch (e) {
    err(2, "frontmatter YAML: " + (e as Error).message);
  }

  if (fm) {
    for (const p of fm.problems) {
      if ("cf" in p) {
        const real = cf.get(p.cf);
        if (!cf.size) continue;
        if (!real) err(2, `cf ${p.cf} does not exist in the Codeforces snapshot`);
        else {
          if (real.name !== p.name) err(2, `cf ${p.cf} name is "${real.name}", not "${p.name}"`);
          if (real.rating && p.rating !== real.rating) err(2, `cf ${p.cf} rating is ${real.rating}, not ${p.rating ?? "missing"}`);
          if (!real.rating) warn(2, `cf ${p.cf} has no official rating yet`);
        }
      } else if ("lc" in p) {
        const real = lc.get(p.lc);
        if (!lc.size) continue;
        if (!real) err(2, `lc ${p.lc} does not exist in the LeetCode snapshot`);
        else {
          if (real.paid) err(2, `lc ${p.lc} is a premium problem; use a free one`);
          if (real.title !== p.name) err(2, `lc ${p.lc} title is "${real.title}", not "${p.name}"`);
          if (real.difficulty !== p.difficulty) err(2, `lc ${p.lc} difficulty is ${real.difficulty}, not ${p.difficulty}`);
        }
      }
    }
    const track = rel.split(path.sep)[1];
    if (track === "dsa" && fm.problems.length < 4 && !/start-here|contest-strategy/.test(rel)) warn(2, "DSA lessons should list 6–12 problems");
  }

  // fenced blocks
  const body = src.slice(m[0].length);
  const lines = body.split("\n");
  let ix = 0;
  let cards = 0;
  let inFence = false;
  let fenceLang = "";
  let fenceStart = 0;
  let buf: string[] = [];
  let prose = 0;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const fence = /^(`{3,})(.*)$/.exec(line);
    if (fence && !inFence) {
      inFence = true;
      fenceLang = fence[2].trim().split(/\s+/)[0];
      fenceStart = i;
      buf = [];
      continue;
    }
    if (inFence && /^`{3,}\s*$/.test(line)) {
      inFence = false;
      const at = fmLines + fenceStart + 1;
      if ((IX_TYPES as readonly string[]).includes(fenceLang)) {
        const t = fenceLang as IxType;
        if (t === "cards") cards++;
        else ix++;
        try {
          const data = YAML.parse(buf.join("\n"));
          const r = IX_SCHEMAS[t].safeParse(data);
          if (!r.success) err(at, `${t}: ` + z.prettifyError(r.error).replace(/\n/g, "\n      "));
          else if (t === "viz") {
            const v = r.data as { algo: string; input: unknown };
            const vr = validateVizInput(v.algo, v.input);
            if (!vr.ok) err(at, `viz ${v.algo}: ${vr.error}`);
          }
        } catch (e) {
          err(at, `${t}: YAML error: ${(e as Error).message.split("\n")[0]}`);
        }
      }
      continue;
    }
    if (inFence) {
      buf.push(line);
      continue;
    }
    if (!/^\s*(:::|#|\||$)/.test(line)) prose += line.split(/\s+/).filter(Boolean).length;
  }
  if (inFence) err(fmLines + fenceStart + 1, "unclosed code fence");
  if (!/^:::notes\s*$/m.test(body)) err(fmLines + lines.length, "missing the closing :::notes block");
  if (ix < 3) warn(1, `only ${ix} interactive blocks (need >= 3 besides cards)`);
  if (cards < 1) warn(1, "no cards block (need 1)");
  if (prose > 1500) warn(1, `~${prose} words of prose — trim toward 500–1100`);
  const opens = (body.match(/^:::(note|tip|warn|key|truth|notes|details|hint)\b/gm) || []).length;
  const closes = (body.match(/^:::\s*$/gm) || []).length;
  if (opens !== closes) err(1, `${opens} ::: blocks opened but ${closes} closed`);
  console.log(`${errors ? "" : ""}${rel}: ${ix} interactive, ${cards} cards, ~${prose} words`);
}
console.log(`\n${files.length} file(s), ${errors} error(s), ${warnings} warning(s)`);
process.exit(errors ? 1 : 0);
