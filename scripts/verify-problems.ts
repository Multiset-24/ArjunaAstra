/** npm run verify:problems — compare every lesson's Codeforces problems with the snapshot. */
import fs from "node:fs";
import path from "node:path";

const root = path.join(__dirname, "..");
const snap = JSON.parse(fs.readFileSync(path.join(root, "data/codeforces/problemset.json"), "utf8"));
const byId = new Map<string, [number, string, string, number]>(snap.problems.map((p: [number, string, string, number]) => [`cf:${p[0]}${p[1]}`, p]));
const used = JSON.parse(fs.readFileSync(path.join(root, ".content/problems.json"), "utf8")) as Record<string, { name: string; rating?: number; lessons: string[] }>;
let bad = 0;
for (const [key, p] of Object.entries(used)) {
  if (!key.startsWith("cf:")) continue;
  const real = byId.get(key);
  if (!real) console.log(`✗ ${key} not found (${p.lessons.join(", ")})`), bad++;
  else if (real[2] !== p.name || (real[3] && real[3] !== p.rating)) console.log(`✗ ${key}: lesson says "${p.name}" ${p.rating}, Codeforces says "${real[2]}" ${real[3]}`), bad++;
}
console.log(`${Object.keys(used).filter((k) => k.startsWith("cf:")).length} Codeforces problems checked against snapshot ${snap.fetchedAt.slice(0, 10)}: ${bad} mismatches`);
process.exit(bad ? 1 : 0);
