#!/usr/bin/env node
/**
 * Search the Codeforces / LeetCode snapshots in data/ (offline).
 *
 *   node scripts/find.mjs cf --tags "two pointers,binary search" --min 1000 --max 1400 --limit 20
 *   node scripts/find.mjs cf --name "books"
 *   node scripts/find.mjs cf --id 279B,1352C
 *   node scripts/find.mjs lc --name "sliding window"   (free problems only)
 *   node scripts/find.mjs lc --slug two-sum,3sum
 *
 * CF results are sorted by solve count (a good proxy for "classic, well-tested problem").
 * Tags use Codeforces names: implementation, math, greedy, dp, data structures, brute force,
 * constructive algorithms, graphs, sortings, binary search, dfs and similar, trees, strings,
 * number theory, combinatorics, two pointers, bitmasks, geometry, dsu, shortest paths,
 * probabilities, divide and conquer, hashing, games, interactive, matrices, string suffix structures,
 * graph matchings, flows, 2-sat, ternary search, meet-in-the-middle, expression parsing, fft.
 */
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const args = process.argv.slice(2);
const site = args[0];
const opt = (k, d) => {
  const i = args.indexOf(`--${k}`);
  return i >= 0 ? args[i + 1] : d;
};

if (site === "cf") {
  const d = JSON.parse(fs.readFileSync(path.join(root, "data/codeforces/problemset.json"), "utf8"));
  let rows = d.problems.map(([c, i, n, r, s, t]) => ({ id: `${c}${i}`, name: n, rating: r, solved: s, tags: t }));
  const ids = opt("id");
  if (ids) {
    const want = new Set(ids.split(",").map((x) => x.trim().toUpperCase()));
    rows = rows.filter((p) => want.has(p.id));
  }
  const tags = opt("tags");
  if (tags) {
    const want = tags.split(",").map((x) => x.trim());
    const any = args.includes("--any");
    rows = rows.filter((p) => (any ? want.some((t) => p.tags.includes(t)) : want.every((t) => p.tags.includes(t))));
  }
  const name = opt("name");
  if (name) rows = rows.filter((p) => p.name.toLowerCase().includes(name.toLowerCase()));
  const min = Number(opt("min", 0)), max = Number(opt("max", 4000));
  if (!ids) rows = rows.filter((p) => p.rating >= min && p.rating <= max && p.rating > 0);
  if (!args.includes("--special")) rows = rows.filter((p) => !p.tags.includes("*special"));
  rows.sort((a, b) => b.solved - a.solved);
  const limit = Number(opt("limit", 25));
  for (const p of rows.slice(0, limit))
    console.log(`${p.id.padEnd(7)} ${String(p.rating || "-").padEnd(5)} ${String(p.solved).padStart(7)}  ${p.name}  [${p.tags.join(", ")}]`);
  console.log(`(${rows.length} matches, snapshot ${d.fetchedAt.slice(0, 10)})`);
} else if (site === "lc") {
  const d = JSON.parse(fs.readFileSync(path.join(root, "data/leetcode/problems.json"), "utf8"));
  const diff = ["", "Easy", "Medium", "Hard"];
  let rows = d.problems.map(([id, slug, title, lvl, paid]) => ({ id, slug, title, difficulty: diff[lvl], paid: !!paid }));
  const slugs = opt("slug");
  if (slugs) {
    const want = new Set(slugs.split(",").map((x) => x.trim()));
    rows = rows.filter((p) => want.has(p.slug));
  } else rows = rows.filter((p) => !p.paid);
  const name = opt("name");
  if (name) rows = rows.filter((p) => p.title.toLowerCase().includes(name.toLowerCase()));
  rows.sort((a, b) => a.id - b.id);
  for (const p of rows.slice(0, Number(opt("limit", 25))))
    console.log(`${String(p.id).padStart(4)}  ${p.difficulty.padEnd(6)} ${p.slug}  "${p.title}"${p.paid ? "  (PREMIUM - do not use)" : ""}`);
  console.log(`(${rows.length} matches)`);
} else {
  console.log("usage: node scripts/find.mjs cf|lc [--tags a,b] [--any] [--min 800] [--max 1400] [--name x] [--id 279B] [--slug two-sum] [--limit 25]");
}
