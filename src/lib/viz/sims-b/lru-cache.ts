import type { Frame, Simulation, Simulator } from "../types";

interface In {
  capacity: number;
  ops: string[];
}

const CODE = [
  "get(k):",
  "  if k not in map: miss, return -1",
  "  move k to front; hit; return map[k]",
  "put(k, v):",
  "  if k in map: update, move to front",
  "  else:",
  "    if size == capacity: evict the last (LRU)",
  "    insert k at front",
];

export const lruCache: Simulator<In> = ({ capacity, ops }) => {
  const frames: Frame[] = [];
  /** Front of the array = most recently used. */
  let list: { k: string; v: string }[] = [];
  let hit = 0;
  let miss = 0;
  let evicted = "-";
  const cells = () => list.map((e) => `${e.k}:${e.v}`);
  const base = (note: string, line: number, tones: Record<number, "active" | "bad" | "match" | "muted" | "compare"> = {}, op = ""): Frame => ({
    array: { values: cells(), tones, label: `recency list (front = most recent, back = next to evict), capacity ${capacity}`, showIndex: false, pointers: list.length ? { MRU: 0, LRU: list.length - 1 } : undefined },
    vars: { op, hit, miss, evicted, size: `${list.length}/${capacity}` },
    note,
    line,
  });

  frames.push(base(`Empty cache with room for ${capacity} entries. The list keeps the most recently used entry at the front.`, 0));
  for (const raw of ops) {
    const [cmd, k, v] = raw.split(" ");
    if (cmd === "get") {
      const i = list.findIndex((e) => e.k === k);
      if (i < 0) {
        miss++;
        frames.push(base(`get ${k}: not in the cache, a miss. Nothing changes.`, 1, {}, raw));
      } else {
        hit++;
        frames.push(base(`get ${k}: found at position ${i}, a hit. It is about to move to the front.`, 2, { [i]: "match" }, raw));
        const [e] = list.splice(i, 1);
        list.unshift(e);
        frames.push(base(`${k} is now the most recently used, so it sits at the front.`, 2, { 0: "active" }, raw));
      }
    } else {
      const i = list.findIndex((e) => e.k === k);
      if (i >= 0) {
        list[i].v = v;
        frames.push(base(`put ${k} ${v}: ${k} already exists, so overwrite its value. Move it to the front next.`, 4, { [i]: "compare" }, raw));
        const [e] = list.splice(i, 1);
        list.unshift(e);
        frames.push(base(`${k} moves to the front (just used).`, 4, { 0: "active" }, raw));
      } else {
        if (list.length === capacity) {
          const last = list.length - 1;
          frames.push(base(`put ${k} ${v}: the cache is full, so evict the least recently used entry (${list[last].k}).`, 6, { [last]: "bad" }, raw));
          evicted = list[last].k;
          list.pop();
          frames.push(base(`${evicted} is evicted to make room.`, 6, {}, raw));
        }
        list.unshift({ k, v });
        frames.push(base(`${k} is inserted at the front as the most recently used.`, 7, { 0: "active" }, raw));
      }
    }
  }
  const total = hit + miss;
  const sim: Simulation = {
    frames,
    code: { lang: "text", lines: CODE },
    result: total ? `${hit} hits, ${miss} misses (${Math.round((100 * hit) / total)}% hit rate)` : "no get operations",
  };
  return sim;
};
