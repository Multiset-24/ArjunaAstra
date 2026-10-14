"use client";
import { Children, useRef, useState, type ReactNode } from "react";
import { useProgress } from "@/lib/store/progress";
import s from "./md.module.css";

const NAMES: Record<string, string> = {
  cpp: "C++",
  c: "C",
  java: "Java",
  python: "Python",
  javascript: "JavaScript",
  typescript: "TypeScript",
  bash: "Shell",
  sql: "SQL",
  json: "JSON",
  yaml: "YAML",
  go: "Go",
  text: "Text",
  http: "HTTP",
};

export function CodeGroup({ langs = "", titles, input, output, children }: { langs?: string; titles?: string; input?: string; output?: string; children?: ReactNode }) {
  const list = langs.split(",").filter(Boolean);
  let names: string[] = [];
  try {
    names = JSON.parse(titles || "[]");
  } catch {}
  const panes = Children.toArray(children).filter((c) => typeof c !== "string");
  const { state, setPref } = useProgress();
  const pref = state.prefs.codeLang;
  const [picked, setPicked] = useState<number | null>(null);
  const prefIdx = list.indexOf(pref);
  const active = picked ?? (prefIdx >= 0 ? prefIdx : 0);
  const paneRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  const choose = (i: number) => {
    setPicked(i);
    const l = list[i];
    if (l === "cpp" || l === "java") setPref("codeLang", l);
  };
  // follow global preference changes made elsewhere
  if (picked !== null && list[picked] !== pref && prefIdx >= 0 && (list[picked] === "cpp" || list[picked] === "java")) {
    setPicked(null);
  }

  const copy = async () => {
    const pre = paneRef.current?.querySelector(`[data-pane="${active}"] pre`);
    if (!pre) return;
    try {
      await navigator.clipboard.writeText(pre.textContent ?? "");
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {}
  };

  return (
    <div className={s.group}>
      <div className={s.groupBar}>
        <div className={s.tabs} role="tablist" aria-label="Code language">
          {list.map((l, i) => (
            <button key={l + i} role="tab" aria-selected={i === active} className={s.tab} onClick={() => choose(i)} type="button">
              {names[i] || NAMES[l] || l}
            </button>
          ))}
        </div>
        <button type="button" className={s.copy} onClick={copy} aria-label="Copy code">
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <div ref={paneRef}>
        {panes.map((p, i) => (
          <div key={i} data-pane={i} hidden={i !== active} className={s.pane}>
            {p}
          </div>
        ))}
      </div>
      {output !== undefined && (
        <div className={s.sample}>
          {input ? (
            <div>
              <div className={s.sampleLabel}>Input</div>
              <pre>{input}</pre>
            </div>
          ) : null}
          <div>
            <div className={s.sampleLabel}>Output</div>
            <pre>{output}</pre>
          </div>
        </div>
      )}
    </div>
  );
}
