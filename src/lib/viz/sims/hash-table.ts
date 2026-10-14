import type { Frame, Simulation, Tone } from "../types";
import type { In } from "./util";

const CODE = [
  "for key in keys:",
  "    b = key mod size          // which bucket",
  "    append key to bucket[b]   // chain on collision",
  "load factor = n / size",
];

export function hashTable(input: In<"hash-table">): Simulation {
  const { keys, size } = input;
  const frames: Frame[] = [];
  // Final chain lengths decide the (fixed) number of columns so the picture does not jump around.
  const finalLen = new Array(size).fill(0);
  for (const k of keys) finalLen[k % size]++;
  const cols = Math.max(1, ...finalLen);
  const buckets: number[][] = Array.from({ length: size }, () => []);
  let collisions = 0;

  const grid = (tones: Record<string, Tone>) => ({
    cells: buckets.map((b) => Array.from({ length: cols }, (_, c) => (c < b.length ? b[c] : null))),
    rowLabels: buckets.map((_, i) => `bucket ${i}`),
    tones,
    label: `${size} buckets; each row is a chain`,
  });
  const arrState = (i: number | null) => {
    const tones: Record<number, Tone> = {};
    for (let k = 0; k < (i ?? keys.length); k++) tones[k] = "done";
    if (i !== null) tones[i] = "active";
    return { values: keys, tones, label: "keys to insert", pointers: i !== null ? { next: i } : undefined };
  };

  frames.push({
    array: arrState(0),
    grid: grid({}),
    vars: { size, inserted: 0, collisions },
    note: `An empty table with ${size} buckets. Each key goes to bucket (key mod ${size}).`,
    line: 0,
  });
  keys.forEach((k, i) => {
    const b = k % size;
    const chainBefore = [...buckets[b]];
    frames.push({
      array: arrState(i),
      grid: grid({ [`${b},0`]: "compare" }),
      vars: { key: k, bucket: b, inserted: i, collisions },
      note: `${k} mod ${size} = ${b}, so ${k} belongs in bucket ${b}.`,
      line: 1,
    });
    buckets[b].push(k);
    const collided = chainBefore.length > 0;
    if (collided) collisions++;
    const tones: Record<string, Tone> = { [`${b},${buckets[b].length - 1}`]: "active" };
    chainBefore.forEach((_, c) => (tones[`${b},${c}`] = "compare"));
    frames.push({
      array: arrState(i + 1 < keys.length ? i + 1 : null),
      grid: grid(tones),
      vars: { key: k, bucket: b, inserted: i + 1, collisions },
      note: collided ? `Collision: bucket ${b} already holds ${chainBefore.join(", ")}, so ${k} is chained after it.` : `Bucket ${b} was empty: ${k} goes in directly.`,
      line: 2,
    });
  });
  const longest = Math.max(...buckets.map((b) => b.length));
  const load = Math.round((keys.length / size) * 100) / 100;
  frames.push({
    array: arrState(null),
    grid: grid({}),
    vars: { size, "load factor": load, collisions, "longest chain": longest },
    note: `${keys.length} keys in ${size} buckets: load factor ${load}, ${collisions} collision${collisions === 1 ? "" : "s"}, longest chain ${longest}.`,
    line: 3,
  });
  return { frames, code: { lang: "pseudocode", lines: CODE }, result: `load factor ${load}, ${collisions} collisions, longest chain ${longest}` };
}
