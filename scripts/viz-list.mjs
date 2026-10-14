#!/usr/bin/env node
// Prints the visualizer catalog (names, kind, inputs, example) from src/lib/viz/catalog.ts.
import { execFileSync } from "node:child_process";
const code = `import { VIZ } from "./src/lib/viz/catalog.ts";
for (const [name, s] of Object.entries(VIZ)) {
  console.log(name.padEnd(22), "[" + s.track + ", " + s.kind + "]", s.summary);
  console.log("".padEnd(22), "example:", JSON.stringify(s.example));
}`;
execFileSync("npx", ["tsx", "-e", code], { stdio: "inherit" });
