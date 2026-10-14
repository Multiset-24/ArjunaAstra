import "server-only";
import crypto from "node:crypto";

/**
 * Minimal Codeforces API client.
 * - Public methods need no key. If CF_API_KEY and CF_API_SECRET are set, requests are signed
 *   (https://codeforces.com/apiHelp) — the key never reaches the browser.
 * - Codeforces allows roughly one call per two seconds; calls are serialised per instance.
 */
const BASE = "https://codeforces.com/api/";
let chain: Promise<unknown> = Promise.resolve();
let last = 0;

function sign(method: string, params: Record<string, string>) {
  const key = process.env.CF_API_KEY;
  const secret = process.env.CF_API_SECRET;
  if (!key || !secret) return params;
  const all: Record<string, string> = { ...params, apiKey: key, time: String(Math.floor(Date.now() / 1000)) };
  const rand = String(Math.floor(100000 + Math.random() * 900000));
  const qs = Object.keys(all)
    .sort()
    .map((k) => `${k}=${all[k]}`)
    .join("&");
  const hash = crypto.createHash("sha512").update(`${rand}/${method}?${qs}#${secret}`).digest("hex");
  return { ...all, apiSig: rand + hash };
}

export class CfError extends Error {}

export function cfCall<T>(method: string, params: Record<string, string> = {}, timeoutMs = 10_000): Promise<T> {
  const run = async () => {
    const wait = Math.max(0, last + 2100 - Date.now());
    if (wait) await new Promise((r) => setTimeout(r, wait));
    last = Date.now();
    const url = `${BASE}${method}?${new URLSearchParams(sign(method, params))}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(timeoutMs), headers: { "user-agent": "teacher-learning-app" } });
    const body = (await res.json().catch(() => null)) as { status?: string; result?: T; comment?: string } | null;
    if (!body || body.status !== "OK") throw new CfError(body?.comment ?? `Codeforces responded ${res.status}`);
    return body.result as T;
  };
  const p = chain.then(run, run);
  chain = p.catch(() => undefined);
  return p;
}
