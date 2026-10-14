"use client";
import { useRef, useState, type ComponentProps } from "react";
import s from "./md.module.css";

/** A single highlighted code block with a quiet copy button. */
export function CopyPre(props: ComponentProps<"pre">) {
  const ref = useRef<HTMLPreElement>(null);
  const [copied, setCopied] = useState(false);
  return (
    <div className={s.single}>
      <pre ref={ref} {...props} />
      <button
        type="button"
        className={s.copyFloat}
        aria-label="Copy code"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(ref.current?.textContent ?? "");
            setCopied(true);
            setTimeout(() => setCopied(false), 1400);
          } catch {}
        }}
      >
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}
