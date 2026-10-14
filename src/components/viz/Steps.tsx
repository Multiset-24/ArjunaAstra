"use client";
import { useMemo } from "react";
import type { StepsPayload } from "@/lib/content/blocks";
import type { Frame, Tone } from "@/lib/viz/types";
import { Player } from "./Player";
import s from "./Viz.module.css";

/** Hand-authored walkthrough: converts the lesson's frames into the shared Frame shape. */
export function Steps({ title, frames: raw }: StepsPayload) {
  const frames = useMemo<Frame[]>(
    () =>
      raw.map((f): Frame => {
        if ("grid" in f) {
          return {
            grid: { cells: f.grid, tones: f.highlight as Record<string, Tone> | undefined, rowLabels: f.rowLabels, colLabels: f.colLabels },
            vars: f.vars,
            note: f.note,
          };
        }
        const tones: Record<number, Tone> = {};
        for (const [k, v] of Object.entries(f.highlight ?? {})) {
          const i = Number(k);
          if (Number.isInteger(i)) tones[i] = v;
        }
        return {
          array: { values: f.arr, pointers: f.pointers, tones, window: f.window },
          vars: f.vars,
          note: f.note,
        };
      }),
    [raw],
  );
  const heading = title ?? "Walkthrough";
  return (
    <figure className={s.viz} data-steps>
      <figcaption className={s.head}>
        <span className={s.title}>{heading}</span>
      </figcaption>
      <Player sim={{ frames }} label={heading} />
    </figure>
  );
}
