"use client";
import { useId, useMemo, useState } from "react";
import { hash32 } from "@/lib/viz/sims-b/util";
import s from "./shared.module.css";
import c from "./ConsistentHashing.module.css";
import { num } from "./util";

const COLORS = ["var(--accent)", "var(--sage)", "var(--sky)", "var(--rose)", "var(--gold)", "var(--accent-2)", "var(--text-2)", "var(--text-3)"];
const MAX_SERVERS = 8;
const CX = 150;
const CY = 150;
const R_RING = 112;
const R_KEY = 88;

interface Cfg {
  servers: number[]; // server ids (1-based), ascending
  vnodes: number;
}

const angle = (h: number) => (h / 4294967296) * Math.PI * 2 - Math.PI / 2;
const pt = (h: number, r: number) => ({ x: CX + r * Math.cos(angle(h)), y: CY + r * Math.sin(angle(h)) });

function owners(cfg: Cfg, keys: number[]): Map<number, number> {
  const ring: { h: number; sv: number }[] = [];
  for (const sv of cfg.servers) for (let j = 0; j < cfg.vnodes; j++) ring.push({ h: hash32(`host-${sv}#${j}`), sv });
  ring.sort((a, b) => a.h - b.h || a.sv - b.sv);
  const out = new Map<number, number>();
  for (const k of keys) {
    const h = hash32(`obj-${k}`);
    const hit = ring.find((r) => r.h >= h) ?? ring[0];
    out.set(k, hit.sv);
  }
  return out;
}

/** Naive placement: hash(key) mod number of servers. */
function naive(cfg: Cfg, keys: number[]): Map<number, number> {
  const out = new Map<number, number>();
  for (const k of keys) out.set(k, cfg.servers[hash32(`obj-${k}`) % cfg.servers.length]);
  return out;
}

export default function ConsistentHashing({ input }: { input: Record<string, unknown> }) {
  const id = useId();
  const nKeys = Math.round(num(input.keys, 24, 4, 40));
  const keys = useMemo(() => Array.from({ length: nKeys }, (_, i) => i), [nKeys]);
  const initial = (): Cfg => ({ servers: Array.from({ length: Math.round(num(input.servers, 3, 1, MAX_SERVERS)) }, (_, i) => i + 1), vnodes: Math.round(num(input.vnodes, 3, 1, 12)) });
  const [cfg, setCfg] = useState<Cfg>(initial);
  const [prev, setPrev] = useState<Cfg>(initial);
  const [msg, setMsg] = useState("Add or remove a server and watch which keys change owner.");
  const [sel, setSel] = useState<number | null>(null);

  const cur = useMemo(() => owners(cfg, keys), [cfg, keys]);
  const before = useMemo(() => owners(prev, keys), [prev, keys]);
  const nCur = useMemo(() => naive(cfg, keys), [cfg, keys]);
  const nBefore = useMemo(() => naive(prev, keys), [prev, keys]);
  const moved = keys.filter((k) => cur.get(k) !== before.get(k));
  const movedSet = new Set(moved);
  const naiveMoved = keys.filter((k) => nCur.get(k) !== nBefore.get(k)).length;
  const changed = prev.servers.join() !== cfg.servers.join() || prev.vnodes !== cfg.vnodes;

  const apply = (next: Cfg, text: string) => {
    setPrev(cfg);
    setCfg(next);
    setMsg(text);
  };
  const nextId = () => {
    for (let i = 1; i <= MAX_SERVERS; i++) if (!cfg.servers.includes(i)) return i;
    return 0;
  };
  const counts = new Map<number, number>();
  for (const sv of cfg.servers) counts.set(sv, 0);
  for (const k of keys) counts.set(cur.get(k)!, (counts.get(cur.get(k)!) ?? 0) + 1);

  const vnodeDots = cfg.servers.flatMap((sv) => Array.from({ length: cfg.vnodes }, (_, j) => ({ sv, j, h: hash32(`host-${sv}#${j}`) })));
  const selOwner = sel !== null ? cur.get(sel) : undefined;

  return (
    <div className={s.root} role="group" aria-label="Consistent hashing ring">
      <svg className={s.svg} viewBox="0 0 300 300" role="img" aria-label={`Hash ring with ${cfg.servers.length} servers, ${cfg.vnodes} virtual nodes each, and ${nKeys} keys. Squares are virtual nodes, dots are keys coloured by the server that owns them.`}>
        <circle cx={CX} cy={CY} r={R_RING} fill="none" stroke="var(--line)" strokeWidth="2" />
        {sel !== null && selOwner !== undefined && (
          <line x1={pt(hash32(`obj-${sel}`), R_KEY).x} y1={pt(hash32(`obj-${sel}`), R_KEY).y} x2={CX} y2={CY} stroke="var(--line)" strokeDasharray="3 3" />
        )}
        {vnodeDots.map((v) => {
          const p = pt(v.h, R_RING);
          const sz = 5;
          return <rect key={`${v.sv}-${v.j}`} x={p.x - sz} y={p.y - sz} width={sz * 2} height={sz * 2} rx="1.5" fill={COLORS[(v.sv - 1) % COLORS.length]} stroke="var(--surface)" strokeWidth="1.5" />;
        })}
        {cfg.servers.map((sv) => {
          const p = pt(hash32(`host-${sv}#0`), R_RING + 17);
          return (
            <text key={sv} x={p.x} y={p.y} textAnchor="middle" dominantBaseline="central" fill="var(--text)" fontSize="11" fontFamily="var(--font-mono)">
              S{sv}
            </text>
          );
        })}
        {keys.map((k) => {
          const p = pt(hash32(`obj-${k}`), R_KEY);
          const o = cur.get(k)!;
          const mv = movedSet.has(k);
          return (
            <g key={k} onClick={() => setSel(sel === k ? null : k)} style={{ cursor: "pointer" }}>
              <circle cx={p.x} cy={p.y} r={14} fill="transparent" />
              {mv && <circle cx={p.x} cy={p.y} r={8.5} fill="none" stroke="var(--text)" strokeWidth="1.5" />}
              <circle cx={p.x} cy={p.y} r={sel === k ? 6 : 4.5} fill={COLORS[(o - 1) % COLORS.length]} stroke={sel === k ? "var(--text)" : "var(--surface)"} strokeWidth="1" />
            </g>
          );
        })}
        <text x={CX} y={CY - 6} textAnchor="middle" fill="var(--text-2)" fontSize="12">
          {changed ? `moved ${moved.length} of ${nKeys}` : `${nKeys} keys`}
        </text>
        <text x={CX} y={CY + 12} textAnchor="middle" fill="var(--text-3)" fontSize="10">
          {changed ? `naive mod-N: ${naiveMoved} of ${nKeys}` : "no change yet"}
        </text>
      </svg>

      <div className={s.row}>
        <button type="button" className={`${s.btn} ${s.btnPrimary}`} disabled={cfg.servers.length >= MAX_SERVERS} onClick={() => {
          const n = nextId();
          apply({ ...cfg, servers: [...cfg.servers, n].sort((a, b) => a - b) }, `Added S${n}.`);
        }}>
          Add server
        </button>
        <button type="button" className={s.btn} disabled={!changed} onClick={() => { setPrev(cfg); setMsg("Highlight cleared."); }}>
          Clear highlight
        </button>
      </div>

      <div className={s.row} role="list" aria-label="Servers and how many keys each owns">
        {cfg.servers.map((sv) => (
          <span key={sv} role="listitem" className={s.chip}>
            <svg width="12" height="12" aria-hidden="true">
              <rect width="12" height="12" rx="2" fill={COLORS[(sv - 1) % COLORS.length]} />
            </svg>
            <span className={s.mono}>
              S{sv}: {counts.get(sv)}
            </span>
            <button
              type="button"
              className={c.remove}
              disabled={cfg.servers.length <= 1}
              aria-label={`Remove server S${sv}`}
              onClick={() => apply({ ...cfg, servers: cfg.servers.filter((x) => x !== sv) }, `Removed S${sv}.`)}
            >
              x
            </button>
          </span>
        ))}
      </div>

      <div className={s.field}>
        <label className={s.label} htmlFor={`${id}-v`}>
          vnodes
        </label>
        <input id={`${id}-v`} className={s.range} type="range" min={1} max={12} step={1} value={cfg.vnodes} onChange={(e) => {
          const v = Number(e.target.value);
          apply({ ...cfg, vnodes: v }, `Each server now has ${v} virtual node${v === 1 ? "" : "s"}.`);
        }} />
        <span className={s.mono}>{cfg.vnodes}</span>
      </div>

      <div className={s.field}>
        <label className={s.label} htmlFor={`${id}-k`}>
          inspect key
        </label>
        <select id={`${id}-k`} className={s.select} value={sel ?? ""} onChange={(e) => setSel(e.target.value === "" ? null : Number(e.target.value))}>
          <option value="">none</option>
          {keys.map((k) => (
            <option key={k} value={k}>
              key {k}
            </option>
          ))}
        </select>
        <span />
      </div>

      <div className={s.readout} aria-live="polite">
        <span>{msg}</span>
        {changed && (
          <>
            <span>Consistent hashing moved {moved.length} of {nKeys} keys.</span>
            <span>Hash mod N would have moved {naiveMoved} of {nKeys}.</span>
          </>
        )}
        {sel !== null && selOwner !== undefined && <span>key {sel} lands on S{selOwner}: first virtual node clockwise from its hash.</span>}
      </div>
      <p className={s.caption}>
        Squares on the ring are virtual nodes; dots are keys, coloured by owner. A key belongs to the first virtual node clockwise from it. Outlined keys changed owner in the last
        edit. Tap a key to see its owner. Few vnodes give lumpy, uneven shares; more vnodes even them out.
      </p>
    </div>
  );
}
