import type { Frame, Simulator } from "../types";
import { round } from "./util";

interface In {
  servers: number;
  strategy: "round-robin" | "least-connections";
  requests: [number, number][];
}

export const loadBalancer: Simulator<In> = ({ servers, strategy, requests }) => {
  const reqs = requests.map(([t, d], i) => ({ t, d, i: i + 1 })).sort((a, b) => a.t - b.t || a.i - b.i);
  const active: { end: number; s: number }[] = [];
  const conns = new Array<number>(servers).fill(0);
  const served = new Array<number>(servers).fill(0);
  let rr = 0;
  let peak = 0;
  const labels = Array.from({ length: servers }, (_, i) => `S${i + 1}`);
  const frames: Frame[] = [];
  const mk = (note: string, t: number, tones: Record<number, "active" | "done" | "muted"> = {}, extra: Record<string, string | number> = {}): Frame => ({
    bars: { values: [...conns], labels, tones, max: Math.max(3, peak), label: "active connections per server" },
    vars: { t: round(t, 2), strategy, ...extra },
    note,
    line: strategy === "round-robin" ? 1 : 2,
  });
  frames.push(mk(`${servers} servers, no traffic yet. Strategy: ${strategy === "round-robin" ? "round-robin (take turns)" : "least-connections (pick the least busy)"}.`, 0));
  for (const r of reqs) {
    // finish everything that ends before this arrival
    const done = active.filter((a) => a.end <= r.t).sort((a, b) => a.end - b.end);
    if (done.length) {
      const tones: Record<number, "done"> = {};
      for (const a of done) {
        conns[a.s]--;
        tones[a.s] = "done";
        active.splice(active.indexOf(a), 1);
      }
      frames.push(mk(`Before t=${round(r.t, 2)}, ${done.length} request${done.length > 1 ? "s" : ""} finished and freed connections.`, r.t, tones));
    }
    let s: number;
    let why: string;
    if (strategy === "round-robin") {
      s = rr % servers;
      rr++;
      why = `round-robin: it is ${labels[s]}'s turn`;
    } else {
      s = conns.indexOf(Math.min(...conns));
      why = `least-connections: ${labels[s]} has the fewest (${conns[s]})`;
    }
    conns[s]++;
    served[s]++;
    active.push({ end: r.t + r.d, s });
    peak = Math.max(peak, ...conns);
    frames.push(mk(`Request ${r.i} arrives at t=${round(r.t, 2)} and needs ${round(r.d, 1)}s. ${why}.`, r.t, { [s]: "active" }, { request: r.i, duration: round(r.d, 1) }));
  }
  for (const f of frames) if (f.bars) f.bars.max = Math.max(3, peak);
  return {
    frames,
    code: {
      lang: "text",
      lines: [
        "on request:",
        "  round-robin:       s = next server in turn",
        "  least-connections: s = server with fewest active",
        "  s.active += 1",
        "when a request finishes: s.active -= 1",
      ],
    },
    result: `peak load ${peak} connection${peak === 1 ? "" : "s"} on one server; requests served per server: ${served.join(", ")}`,
  };
};
