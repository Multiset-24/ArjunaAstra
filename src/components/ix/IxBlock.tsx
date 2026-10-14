"use client";
import type {
  BlanksPayload,
  CardsPayload,
  EstimatePayload,
  OrderPayload,
  PredictPayload,
  QuizPayload,
  StepsPayload,
  VizPayload,
} from "@/lib/content/blocks";
import { Viz } from "@/components/viz/Viz";
import { Steps } from "@/components/viz/Steps";
import { Quiz } from "./Quiz";
import { Predict } from "./Predict";
import { Order } from "./Order";
import { Blanks } from "./Blanks";
import { Cards } from "./Cards";
import { Estimate } from "./Estimate";
import s from "./ix.module.css";

/** Dispatches a compiled interactive block (ix-block element) to its component. */
export function IxBlock({ type, payload }: { type?: string; payload?: string }) {
  let data: unknown;
  try {
    data = JSON.parse(payload ?? "{}");
  } catch {
    return null;
  }
  switch (type) {
    case "quiz":
      return <Quiz {...(data as QuizPayload)} />;
    case "predict":
      return <Predict {...(data as PredictPayload)} />;
    case "order":
      return <Order {...(data as OrderPayload)} />;
    case "blanks":
      return <Blanks {...(data as BlanksPayload)} />;
    case "cards":
      return <Cards {...(data as CardsPayload)} />;
    case "estimate":
      return <Estimate {...(data as EstimatePayload)} />;
    case "viz":
      return (
        <div className={s.vizWrap}>
          <Viz {...(data as VizPayload)} />
        </div>
      );
    case "steps":
      return (
        <div className={s.vizWrap}>
          <Steps {...(data as StepsPayload)} />
        </div>
      );
    default:
      return null;
  }
}
