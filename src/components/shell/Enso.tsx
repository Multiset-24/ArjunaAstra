/** Original ensō (zen brush circle) drawn as a tapered filled path. */
function ensoPath(size: number, weight: number) {
  const c = size / 2;
  const r = size * 0.38;
  const start = (-80 * Math.PI) / 180;
  const sweep = (322 * Math.PI) / 180;
  const n = 140;
  const outer: string[] = [];
  const inner: string[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const a = start + sweep * t;
    // brush pressure: quick press, long ease-out, dry tail
    const w = weight * (0.35 + 0.9 * Math.sin(Math.min(1, t * 6) * (Math.PI / 2)) * (1 - 0.75 * t ** 1.6)) * (1 + 0.06 * Math.sin(t * 23));
    const rr = r * (1 + 0.025 * Math.sin(t * 7 + 1) + 0.012 * Math.sin(t * 17));
    outer.push(`${(c + (rr + w / 2) * Math.cos(a)).toFixed(2)},${(c + (rr + w / 2) * Math.sin(a)).toFixed(2)}`);
    inner.push(`${(c + (rr - w / 2) * Math.cos(a)).toFixed(2)},${(c + (rr - w / 2) * Math.sin(a)).toFixed(2)}`);
  }
  return `M${outer.join("L")}L${inner.reverse().join("L")}Z`;
}

const PATH = ensoPath(100, 11);

export function Enso({ size = 28, className, title }: { size?: number; className?: string; title?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className={className} role={title ? "img" : undefined} aria-hidden={title ? undefined : true}>
      {title && <title>{title}</title>}
      <path d={PATH} fill="currentColor" />
    </svg>
  );
}

/** Progress as an unfinished circle that closes as you finish lessons. */
export function EnsoRing({ value, size = 44, stroke = 3.5, label }: { value: number; size?: number; stroke?: number; label?: string }) {
  const r = (size - stroke * 2) / 2;
  const len = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(1, value));
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={label ?? `${Math.round(v * 100)}% complete`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--line)" strokeWidth={1} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="var(--accent)"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={`${Math.max(v * len, v > 0 ? 2 : 0)} ${len}`}
        transform={`rotate(-100 ${size / 2} ${size / 2})`}
        style={{ transition: "stroke-dasharray 400ms var(--ease)" }}
      />
    </svg>
  );
}
