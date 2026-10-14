/**
 * Toy self-attention. The Q and K vectors are built by hand (not learned) so that a few relations are visible:
 *  - dims 0-1: position, so most words look at the word just before them
 *  - dim 2: a pronoun looks for nouns
 *  - dim 3: he/she look for animate nouns
 *  - dim 4: pronouns prefer the first noun of the sentence (usually the subject)
 *  - dim 5: small deterministic per-word noise so unfamiliar words are not all identical
 */
import { hash32 } from "@/lib/viz/sims-b/util";

export const D = 6;
const THETA = 0.45;

const PRONOUNS = new Set(["it", "he", "she", "they", "its", "his", "him", "them", "their"]);
const ANIMATE_PRONOUNS = new Set(["he", "she", "him", "his", "they", "them", "their"]);
const ANIMATE = new Set("cat dog animal man woman boy girl bird fish horse child teacher student mouse fox robot king queen doctor driver mother father friend nurse patient lawyer engineer manager customer lion tiger monkey".split(" "));
const NOUNS = new Set(
  (
    "mat street ball table chair house car road river city book door window tree cup box bag phone laptop computer garden park school market team ship train bus bridge " +
    "road hill lake sea sun moon sky food soup bread water milk cake idea model word sentence paper pen key lock server cache queue graph"
  ).split(" "),
);
for (const a of ANIMATE) NOUNS.add(a);

export interface Attn {
  tokens: string[];
  /** weights[i][j]: how much token i (query) attends to token j (key). Rows sum to 1. */
  weights: number[][];
  kinds: ("pronoun" | "noun" | "other")[];
}

const noise = (w: string, salt: string) => (hash32(w + salt) / 4294967296) * 2 - 1;

export function tokenize(sentence: string): string[] {
  return (sentence.toLowerCase().match(/[\p{L}\p{N}']+/gu) ?? []).slice(0, 12);
}

export function buildAttention(sentence: string): Attn {
  const tokens = tokenize(sentence);
  const n = tokens.length;
  const kinds = tokens.map((t) => (PRONOUNS.has(t) ? "pronoun" : NOUNS.has(t) ? "noun" : "other") as "pronoun" | "noun" | "other");
  const firstNoun = kinds.indexOf("noun");
  const Q: number[][] = [];
  const K: number[][] = [];
  tokens.forEach((t, i) => {
    const q = new Array<number>(D).fill(0);
    const k = new Array<number>(D).fill(0);
    const pron = kinds[i] === "pronoun";
    const strength = pron ? 0.8 : 3;
    const at = Math.max(0, i - 1);
    q[0] = strength * Math.cos(at * THETA);
    q[1] = strength * Math.sin(at * THETA);
    k[0] = Math.cos(i * THETA);
    k[1] = Math.sin(i * THETA);
    if (pron) {
      q[2] = 3;
      q[3] = ANIMATE_PRONOUNS.has(t) ? 1.5 : 0;
      q[4] = 1.4;
    }
    if (kinds[i] === "noun") {
      k[2] = 2.4;
      k[3] = ANIMATE.has(t) ? 2 : 0;
      k[4] = i === firstNoun ? 2.2 : 0.3;
    }
    q[5] = 0.6 * noise(t, "q");
    k[5] = 0.6 * noise(t, "k");
    Q.push(q);
    K.push(k);
  });
  const weights = Q.map((q) => {
    const sc = K.map((k) => q.reduce((a, v, d) => a + v * k[d], 0) / Math.sqrt(D));
    const m = Math.max(...sc);
    const e = sc.map((v) => Math.exp(v - m));
    const sum = e.reduce((a, b) => a + b, 0);
    return e.map((v) => v / sum);
  });
  return { tokens, weights, kinds: n ? kinds : [] };
}
