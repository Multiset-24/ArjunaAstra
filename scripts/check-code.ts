/**
 * npm run check:code [paths]   compile + run lesson code against its ```input/```output samples.
 * - C++ (g++ -std=c++17 -O2), Java (javac/java, class Main), Python (python3).
 * - Full programs without a sample are compile-checked only. Snippets are skipped.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync, spawnSync } from "node:child_process";

const root = path.resolve(__dirname, "..");
const args = process.argv.slice(2);
const targets = args.length ? args : ["content"];
function walk(p: string): string[] {
  const abs = path.resolve(p);
  if (!fs.existsSync(abs)) return [];
  if (fs.statSync(abs).isDirectory()) return fs.readdirSync(abs).flatMap((f) => walk(path.join(abs, f)));
  return abs.endsWith(".md") ? [abs] : [];
}
const files = targets.flatMap((t) => walk(t));

interface Fence { lang: string; body: string; line: number }
function fences(src: string): Fence[] {
  const out: Fence[] = [];
  const lines = src.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const m = /^```(\S*)/.exec(lines[i]);
    if (!m) continue;
    const start = i;
    const body: string[] = [];
    while (++i < lines.length && !/^```\s*$/.test(lines[i])) body.push(lines[i]);
    out.push({ lang: m[1].toLowerCase(), body: body.join("\n"), line: start + 1 });
    out[out.length - 1].line = start + 1;
    (out[out.length - 1] as Fence & { next?: number }).next = i + 1;
  }
  return out;
}

const norm = (s: string) => s.replace(/\r/g, "").split("\n").map((l) => l.trimEnd()).join("\n").trim();
const isFull = (lang: string, code: string) =>
  (lang === "cpp" && /\bint\s+main\s*\(/.test(code)) || (lang === "java" && /class\s+Main\b/.test(code) && /static\s+void\s+main/.test(code)) || lang === "python";

function run(lang: string, code: string, input: string | null): { ok: boolean; msg: string } {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "teacher-code-"));
  try {
    let cmd: string[];
    if (lang === "cpp") {
      fs.writeFileSync(path.join(dir, "a.cpp"), code);
      const c = spawnSync("g++", ["-std=c++17", "-O2", "-pthread", "-o", path.join(dir, "a"), path.join(dir, "a.cpp")], { encoding: "utf8" });
      if (c.status !== 0) return { ok: false, msg: "compile error: " + c.stderr.split("\n").slice(0, 3).join(" ") };
      cmd = [path.join(dir, "a")];
    } else if (lang === "java") {
      fs.writeFileSync(path.join(dir, "Main.java"), code);
      const c = spawnSync("javac", ["-d", dir, path.join(dir, "Main.java")], { encoding: "utf8" });
      if (c.status !== 0) return { ok: false, msg: "compile error: " + c.stderr.split("\n").filter((l) => !l.startsWith("Picked up")).slice(0, 3).join(" ") };
      cmd = ["java", "-cp", dir, "Main"];
    } else {
      fs.writeFileSync(path.join(dir, "a.py"), code);
      if (input === null) {
        const c = spawnSync("python3", ["-m", "py_compile", path.join(dir, "a.py")], { encoding: "utf8" });
        return c.status === 0 ? { ok: true, msg: "syntax ok" } : { ok: false, msg: "syntax error: " + c.stderr.split("\n").slice(-3).join(" ") };
      }
      cmd = ["python3", path.join(dir, "a.py")];
    }
    if (input === null) return { ok: true, msg: "compiles" };
    const r = spawnSync(cmd[0], cmd.slice(1), { input, encoding: "utf8", timeout: 10_000 });
    return { ok: r.status === 0, msg: r.status === 0 ? r.stdout : `exit ${r.status}: ${r.stderr.slice(0, 200)}` };
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

let pass = 0, fail = 0;
for (const f of files) {
  const rel = path.relative(root, f);
  const fs_ = fences(fs.readFileSync(f, "utf8"));
  for (let i = 0; i < fs_.length; i++) {
    const g: Fence[] = [];
    while (i < fs_.length && ["cpp", "java", "python"].includes(fs_[i].lang)) {
      g.push(fs_[i]);
      if ((fs_[i] as Fence & { next?: number }).next !== fs_[i + 1]?.line) { i++; break; }
      i++;
    }
    if (!g.length) continue;
    let input: string | null = null, output: string | null = null;
    if (fs_[i]?.lang === "input" && fs_[i + 1]?.lang === "output") { input = fs_[i].body; output = fs_[i + 1].body; i += 1; }
    else if (fs_[i]?.lang === "output") { input = ""; output = fs_[i].body; }
    else i--;
    for (const c of g) {
      if (!isFull(c.lang, c.body)) continue;
      if (c.lang === "python" && output !== null && /import (torch|sklearn|transformers)/.test(c.body)) { input = null; }
      const r = run(c.lang, c.body, output === null ? null : input ?? "");
      const ok = r.ok && (output === null || norm(r.msg) === norm(output));
      if (ok) pass++;
      else {
        fail++;
        console.log(`  ✗ ${rel}:${c.line} [${c.lang}] ${r.ok ? `output mismatch: got "${norm(r.msg).slice(0, 80)}" expected "${norm(output ?? "").slice(0, 80)}"` : r.msg}`);
      }
    }
  }
}
console.log(`check:code — ${pass} passed, ${fail} failed`);
void execFileSync;
process.exit(fail ? 1 : 0);
