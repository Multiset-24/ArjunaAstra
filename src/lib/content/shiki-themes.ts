import type { ThemeRegistrationRaw } from "shiki";

/** Calm, warm syntax themes that match src/styles/tokens.css. */
function theme(name: string, type: "dark" | "light", c: Record<string, string>): ThemeRegistrationRaw {
  return {
    name,
    type,
    colors: { "editor.background": c.bg, "editor.foreground": c.fg },
    settings: [
      { settings: { background: c.bg, foreground: c.fg } },
      { scope: ["comment", "punctuation.definition.comment"], settings: { foreground: c.comment, fontStyle: "italic" } },
      { scope: ["keyword", "storage", "storage.type", "keyword.control", "keyword.operator.new", "keyword.other"], settings: { foreground: c.keyword } },
      { scope: ["string", "string.quoted", "constant.character", "markup.inline.raw"], settings: { foreground: c.string } },
      { scope: ["constant.numeric", "constant.language", "constant.other", "support.constant"], settings: { foreground: c.number } },
      { scope: ["entity.name.type", "entity.name.class", "support.type", "support.class", "storage.type.primitive", "entity.other.inherited-class"], settings: { foreground: c.type } },
      { scope: ["entity.name.function", "support.function", "meta.function-call", "variable.function"], settings: { foreground: c.func } },
      { scope: ["keyword.operator", "punctuation"], settings: { foreground: c.punct } },
      { scope: ["variable.parameter", "variable.other.member", "meta.attribute"], settings: { foreground: c.fg } },
      { scope: ["meta.preprocessor", "keyword.control.directive", "entity.name.function.preprocessor"], settings: { foreground: c.pre } },
      { scope: ["entity.name.tag", "support.type.property-name"], settings: { foreground: c.keyword } },
    ],
  };
}

export const teacherDark = theme("teacher-dark", "dark", {
  bg: "#120d09",
  fg: "#e6dac8",
  comment: "#8a7866",
  keyword: "#d9a06e",
  string: "#a9bb92",
  number: "#ddb96f",
  type: "#a5bccb",
  func: "#ecc89e",
  punct: "#b3a290",
  pre: "#c98f80",
});

export const teacherPaper = theme("teacher-paper", "light", {
  bg: "#f1e9dc",
  fg: "#2d2219",
  comment: "#8d7a66",
  keyword: "#9a5a2c",
  string: "#4f6b3a",
  number: "#8a6620",
  type: "#3f5f77",
  func: "#7b4321",
  punct: "#5e4c3c",
  pre: "#9a4a3a",
});
