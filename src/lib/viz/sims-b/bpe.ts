import type { Frame, Simulator } from "../types";

interface In {
  text: string;
  merges: number;
}

const CODE = [
  "split text into words, words into characters (+ end mark _)",
  "repeat for each merge:",
  "  count every adjacent pair inside words",
  "  pick the most frequent pair",
  "  replace it everywhere with one new token",
  "  vocabulary grows by 1",
];

export const bpe: Simulator<In> = ({ text, merges }) => {
  const words = text.toLowerCase().split(/\s+/).filter(Boolean).slice(0, 20);
  let seqs: string[][] = words.map((w) => [...w, "_"]);
  const vocab = new Set(seqs.flat());
  const flat = () => seqs.flat();
  const frames: Frame[] = [];
  const arr = (tones: Record<number, "compare" | "match"> = {}) => ({ values: flat(), tones, label: "tokens (_ marks the end of a word)", showIndex: false });
  frames.push({
    array: arr(),
    vars: { vocabSize: vocab.size, tokens: flat().length, pair: "-" },
    note: `Start from single characters. The vocabulary is just the ${vocab.size} distinct symbols seen, and the text is ${flat().length} tokens long.`,
    line: 0,
  });
  let done = 0;
  for (let m = 1; m <= merges; m++) {
    const counts = new Map<string, number>();
    for (const s of seqs) for (let i = 0; i + 1 < s.length; i++) {
      const key = s[i] + "\u0000" + s[i + 1];
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    let best = "";
    let bc = 0;
    for (const [key, c] of counts) if (c > bc) { bc = c; best = key; }
    if (bc < 1) {
      frames.push({ array: arr(), vars: { vocabSize: vocab.size, tokens: flat().length, pair: "-" }, note: "Every word is now a single token, so there is nothing left to merge. Stop.", line: 1 });
      break;
    }
    const [x, y] = best.split("\u0000");
    // highlight pair occurrences
    const hi: Record<number, "compare"> = {};
    let off = 0;
    for (const s of seqs) {
      for (let i = 0; i + 1 < s.length; i++) if (s[i] === x && s[i + 1] === y) { hi[off + i] = "compare"; hi[off + i + 1] = "compare"; }
      off += s.length;
    }
    frames.push({
      array: arr(hi),
      vars: { merge: m, pair: `${x} + ${y}`, count: bc, vocabSize: vocab.size },
      note: `Merge ${m}: the most frequent adjacent pair is "${x}" + "${y}" (${bc} time${bc === 1 ? "" : "s"}${bc === 1 ? "; ties go to the first one found" : ""}).`,
      line: 3,
    });
    const merged = x + y;
    seqs = seqs.map((s) => {
      const out: string[] = [];
      for (let i = 0; i < s.length; i++) {
        if (i + 1 < s.length && s[i] === x && s[i + 1] === y) { out.push(merged); i++; } else out.push(s[i]);
      }
      return out;
    });
    vocab.add(merged);
    const ok: Record<number, "match"> = {};
    flat().forEach((t, i) => { if (t === merged) ok[i] = "match"; });
    frames.push({
      array: arr(ok),
      vars: { merge: m, pair: `${x} + ${y}`, newToken: merged, vocabSize: vocab.size, tokens: flat().length },
      note: `Replace every "${x}" "${y}" with the new token "${merged}". Vocabulary: ${vocab.size}. Text length: ${flat().length} tokens.`,
      line: 4,
    });
    done++;
  }
  return { frames, code: { lang: "text", lines: CODE }, result: `${done} merge${done === 1 ? "" : "s"}; vocabulary ${vocab.size}, text ${flat().length} tokens` };
};
