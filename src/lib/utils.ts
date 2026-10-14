/** Small shared helpers (client + server safe). */

export function hashString(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function seededShuffle<T>(arr: T[], seed: string): T[] {
  const rnd = mulberry32(hashString(seed));
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function today(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function normalizeOutput(s: string): string {
  return s
    .replace(/\r/g, "")
    .split("\n")
    .map((l) => l.trim())
    .join("\n")
    .trim();
}

export function cx(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(" ");
}

export const TRACK_LABEL: Record<string, string> = {
  dsa: "DSA",
  "system-design": "System Design",
  lld: "LLD",
  ai: "AI Engineering",
};

export function ratingTitle(r?: number): string {
  if (!r) return "Unrated";
  if (r < 1200) return "Newbie";
  if (r < 1400) return "Pupil";
  if (r < 1600) return "Specialist";
  if (r < 1900) return "Expert";
  if (r < 2100) return "Candidate Master";
  if (r < 2300) return "Master";
  if (r < 2400) return "International Master";
  return "Grandmaster";
}
