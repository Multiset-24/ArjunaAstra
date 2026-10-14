import type { Frame, Simulation, Tone } from "../types";
import type { In } from "./util";

const CODE = [
  "is_prime[2..n] = true",
  "for p = 2; p * p <= n; p++:",
  "    if is_prime[p]:",
  "        for m = p * p; m <= n; m += p:",
  "            is_prime[m] = false",
  "primes = every p with is_prime[p]",
];

export function sieve(input: In<"sieve">): Simulation {
  const { n } = input;
  const cols = 10;
  const rows = Math.ceil(n / cols);
  const comp = new Array(n + 1).fill(false);
  const frames: Frame[] = [];
  let prime = -1;
  const justCrossed = new Set<number>();
  let finalMode = false;

  const grid = () => {
    const cells: (number | null)[][] = Array.from({ length: rows }, (_, r) => Array.from({ length: cols }, (_, c) => (r * cols + c + 1 <= n ? r * cols + c + 1 : null)));
    const tones: Record<string, Tone> = {};
    for (let v = 1; v <= n; v++) {
      const k = `${Math.floor((v - 1) / cols)},${(v - 1) % cols}`;
      if (v === 1 || comp[v]) tones[k] = "muted";
      if (finalMode && v >= 2 && !comp[v]) tones[k] = "match";
      if (justCrossed.has(v)) tones[k] = "bad";
      if (v === prime) tones[k] = "active";
    }
    return { cells, tones, label: `numbers 1..${n}; crossed out (faded) means composite` };
  };

  frames.push({ grid: grid(), note: "Assume every number from 2 to n is prime, then cross out the multiples of each prime we find.", line: 0 });
  for (let p = 2; p * p <= n; p++) {
    if (comp[p]) continue;
    prime = p;
    frames.push({ grid: grid(), vars: { p, start: p * p }, note: `${p} is not crossed out, so it is prime. Its multiples below ${p * p} were already crossed by smaller primes, so start at ${p} * ${p} = ${p * p}.`, line: 2 });
    justCrossed.clear();
    for (let m = p * p; m <= n; m += p) {
      if (!comp[m]) justCrossed.add(m);
      comp[m] = true;
    }
    frames.push({
      grid: grid(),
      vars: { p, "newly crossed": justCrossed.size },
      note: justCrossed.size ? `Cross out ${p * p}, ${p * p + p}, ${p * p + 2 * p}, ... up to ${n}: ${justCrossed.size} new composite${justCrossed.size === 1 ? "" : "s"} (red).` : `Every multiple of ${p} from ${p * p} up was already crossed out.`,
      line: 4,
    });
    justCrossed.clear();
  }
  prime = -1;
  finalMode = true;
  const primes: number[] = [];
  for (let v = 2; v <= n; v++) if (!comp[v]) primes.push(v);
  frames.push({
    grid: grid(),
    vars: { primes: primes.length },
    note: `No prime p with p * p <= ${n} is left to process, so everything still standing is prime: ${primes.length} primes.`,
    line: 5,
  });
  return { frames, code: { lang: "pseudocode", lines: CODE }, result: `${primes.length} primes <= ${n}: ${primes.join(", ")}` };
}
