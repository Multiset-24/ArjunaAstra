import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import YAML from "yaml";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const dsaDir = path.join(root, "content/dsa");

/** Beginner → advanced. Slugs are the public URLs (`/learn/dsa/<slug>`). */
const PATH: { id: string; slugs: string[] }[] = [
  {
    id: "foundations",
    slugs: ["start-here", "how-to-think", "language-setup", "complexity", "math-basics", "implementation", "sorting-and-searching", "stl-and-collections"],
  },
  {
    id: "arrays",
    slugs: ["arrays-and-strings", "prefix-sums", "hashing-and-frequency", "two-pointers", "sliding-window", "binary-search", "binary-search-on-answer", "stacks-and-queues"],
  },
  { id: "recursion", slugs: ["recursion", "backtracking", "bit-manipulation"] },
  { id: "greedy", slugs: ["constructive-algorithms", "greedy", "sweep-line"] },
  { id: "math", slugs: ["number-theory", "modular-arithmetic", "combinatorics"] },
  {
    id: "graphs",
    slugs: ["heaps-and-priority-queues", "trees-basics", "graphs-bfs-dfs", "topological-sort", "shortest-paths", "dsu", "mst"],
  },
  {
    id: "dp",
    slugs: ["dp-introduction", "dp-1d-patterns", "dp-on-grids-and-strings", "knapsack", "lis-and-subsequences", "tree-dp-and-rerooting", "bitmask-dp", "digit-dp"],
  },
  { id: "ranges", slugs: ["sparse-table", "fenwick-tree", "segment-tree", "lazy-propagation", "sqrt-decomposition-and-mo"] },
  { id: "trees", slugs: ["lca-binary-lifting", "euler-tour", "small-to-large"] },
  { id: "strings", slugs: ["string-hashing", "kmp-and-z-function", "trie"] },
  { id: "advanced", slugs: ["game-theory", "probability-and-expected-value", "matrix-exponentiation", "scc-and-bridges"] },
  { id: "contests", slugs: ["interactive-problems", "contest-strategy"] },
];

function lessonFiles(): { stage: string; order: number; slug: string }[] {
  const out: { stage: string; order: number; slug: string }[] = [];
  for (const sd of fs.readdirSync(dsaDir)) {
    const sm = /^(\d+)-([a-z0-9-]+)$/.exec(sd);
    const dir = path.join(dsaDir, sd);
    if (!sm || !fs.statSync(dir).isDirectory()) continue;
    for (const f of fs.readdirSync(dir)) {
      const lm = /^(\d+)-([a-z0-9-]+)\.md$/.exec(f);
      if (!lm) continue;
      out.push({ stage: sm[2], order: Number(lm[1]), slug: lm[2] });
    }
  }
  return out;
}

test("DSA lessons follow the topic path and keep every slug", () => {
  const files = lessonFiles();
  const byStage = new Map<string, { order: number; slug: string }[]>();
  for (const f of files) {
    const list = byStage.get(f.stage) ?? [];
    list.push({ order: f.order, slug: f.slug });
    byStage.set(f.stage, list);
  }
  for (const list of byStage.values()) list.sort((a, b) => a.order - b.order);

  assert.deepEqual(
    [...byStage.keys()].sort(),
    PATH.map((s) => s.id).sort(),
  );
  for (const stage of PATH) {
    assert.deepEqual(
      (byStage.get(stage.id) ?? []).map((l) => l.slug),
      stage.slugs,
      stage.id,
    );
  }

  const yml = YAML.parse(fs.readFileSync(path.join(dsaDir, "track.yml"), "utf8")) as { stages: { id: string }[] };
  assert.deepEqual(
    yml.stages.map((s) => s.id),
    PATH.map((s) => s.id),
  );
});

test("every DSA prerequisite appears earlier on the path", () => {
  const slugs = PATH.flatMap((s) => s.slugs);
  const seen = new Set<string>();
  for (const stage of PATH) {
    const dir = fs.readdirSync(dsaDir).find((name) => name.endsWith(`-${stage.id}`));
    assert.ok(dir, stage.id);
    for (const slug of stage.slugs) {
      const file = fs.readdirSync(path.join(dsaDir, dir!)).find((name) => name.endsWith(`-${slug}.md`));
      assert.ok(file, slug);
      const fm = fs.readFileSync(path.join(dsaDir, dir!, file!), "utf8").split("---")[1] ?? "";
      const match = /prereqs:\s*\[([^\]]*)\]/.exec(fm);
      assert.ok(match, `${slug} has a prereqs line`);
      const prereqs = match![1]
        .split(",")
        .map((p) => p.trim())
        .filter(Boolean);
      for (const p of prereqs) {
        assert.ok(seen.has(p), `${slug} lists prereq ${p} before that lesson is reached`);
        assert.ok(slugs.includes(p), `${slug} prereq ${p} is a real lesson`);
      }
      seen.add(slug);
    }
  }
  assert.equal(seen.size, 57);
});
