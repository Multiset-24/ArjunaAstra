import type { Root } from "hast";
import type { ComponentType } from "react";
import { toJsxRuntime } from "hast-util-to-jsx-runtime";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import { IxBlock } from "@/components/ix/IxBlock";
import { CodeGroup } from "./CodeGroup";
import { CopyPre } from "./CopyPre";
import { MermaidBlock } from "./MermaidBlock";
import { NotesBlock } from "./NotesBlock";
import { Callout, DetailsBlock, HintBlock } from "./Blocks";

/** Renders compiled lesson hast (see docs/CONTRACTS.md) with interactive components. */
const components = {
  "ix-block": IxBlock,
  "code-group": CodeGroup,
  callout: Callout,
  "notes-block": NotesBlock,
  "details-block": DetailsBlock,
  "hint-block": HintBlock,
  "mermaid-block": MermaidBlock,
  pre: CopyPre,
  table: (props: Record<string, unknown>) => (
    <div className="table-wrap">
      <table {...props} />
    </div>
  ),
} as unknown as Record<string, ComponentType<Record<string, unknown>>>;

export function Markdown({ hast }: { hast: Root }) {
  return toJsxRuntime(hast, { Fragment, jsx, jsxs, components, ignoreInvalidStyle: true });
}
