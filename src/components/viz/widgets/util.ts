/** Defensive readers for widget input (already validated upstream, but never trust it blindly). */
export function num(v: unknown, fallback: number, min = -Infinity, max = Infinity): number {
  const n = typeof v === "number" && Number.isFinite(v) ? v : fallback;
  return Math.min(max, Math.max(min, n));
}
export function numArr(v: unknown, fallback: number[], min = -Infinity, max = Infinity, maxLen = 99): number[] {
  if (!Array.isArray(v)) return fallback;
  const out = v.filter((x): x is number => typeof x === "number" && Number.isFinite(x)).map((x) => Math.min(max, Math.max(min, x)));
  return out.length ? out.slice(0, maxLen) : fallback;
}
export function str(v: unknown, fallback: string): string {
  return typeof v === "string" ? v : fallback;
}
export function fmt(x: number, d = 2): string {
  if (!Number.isFinite(x)) return x > 0 ? "infinity" : x < 0 ? "-infinity" : "not a number";
  if (Math.abs(x) >= 1e6 || (x !== 0 && Math.abs(x) < 1e-3)) return x.toExponential(2);
  return (Math.round(x * 10 ** d) / 10 ** d).toFixed(d);
}
