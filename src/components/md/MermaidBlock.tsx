"use client";
import { useEffect, useId, useRef, useState } from "react";
import s from "./md.module.css";

function cssVar(name: string) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

let counter = 0;

export function MermaidBlock({ code = "" }: { code?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [error, setError] = useState(false);
  const [theme, setTheme] = useState<string | null>(null);
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");

  useEffect(() => {
    const read = () => setTheme(document.documentElement.dataset.theme ?? "dark");
    read();
    const mo = new MutationObserver(read);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => mo.disconnect();
  }, []);

  useEffect(() => {
    if (!theme) return;
    let cancelled = false;
    (async () => {
      try {
        const mermaid = (await import("mermaid")).default;
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: "strict",
          theme: "base",
          fontFamily: cssVar("--font-body"),
          themeVariables: {
            darkMode: theme !== "paper",
            background: cssVar("--surface"),
            primaryColor: cssVar("--surface-2"),
            primaryTextColor: cssVar("--text"),
            primaryBorderColor: cssVar("--accent"),
            secondaryColor: cssVar("--surface-3"),
            tertiaryColor: cssVar("--surface"),
            lineColor: cssVar("--text-3"),
            textColor: cssVar("--text"),
            mainBkg: cssVar("--surface-2"),
            nodeBorder: cssVar("--accent"),
            clusterBkg: cssVar("--surface"),
            clusterBorder: cssVar("--line"),
            edgeLabelBackground: cssVar("--surface"),
            actorBkg: cssVar("--surface-2"),
            actorBorder: cssVar("--accent"),
            actorTextColor: cssVar("--text"),
            signalColor: cssVar("--text-2"),
            signalTextColor: cssVar("--text"),
            noteBkgColor: cssVar("--surface-3"),
            noteTextColor: cssVar("--text"),
            noteBorderColor: cssVar("--line"),
            fontSize: "14px",
          },
        });
        const { svg } = await mermaid.render(`m${uid}${++counter}`, code);
        if (!cancelled && ref.current) {
          ref.current.innerHTML = svg;
          setError(false);
        }
      } catch {
        if (!cancelled) setError(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [code, theme, uid]);

  return (
    <figure className={s.mermaid}>
      {error ? <pre className={s.mermaidFallback}>{code}</pre> : <div ref={ref} className={s.mermaidSvg} aria-label="Diagram" role="img" />}
    </figure>
  );
}
