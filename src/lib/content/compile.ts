/**
 * Content compiler: content/**.md + track.yml  ->  .content/*.json
 * Used by scripts/content.ts (build, watch, check). Never imported by the app at runtime.
 */
import fs from "node:fs";
import path from "node:path";
import YAML from "yaml";
import { z } from "zod";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import remarkDirective from "remark-directive";
import remarkRehype from "remark-rehype";
import rehypeKatex from "rehype-katex";
import rehypeSlug from "rehype-slug";
import { visit, SKIP } from "unist-util-visit";
import { toHtml } from "hast-util-to-html";
import { createHighlighter, type Highlighter } from "shiki";
import type { Root as MdRoot, RootContent, Code, Parent as MdParent } from "mdast";
import type { Root as HRoot, Element, ElementContent, RootContent as HRootContent } from "hast";
import { frontmatterSchema, trackSchema, type ProblemInput } from "./schema";
import { IX_SCHEMAS, IX_TYPES, type IxType } from "./blocks";
import { validateVizInput } from "../viz/catalog";
import { teacherDark, teacherPaper } from "./shiki-themes";
import type { Card, Catalog, Lesson, LessonMeta, ProblemRef, SearchEntry, Section, TocEntry, Track } from "./types";

// ---------------------------------------------------------------- helpers

export function fnv1a(s: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(36);
}

const CODE_LANGS = ["cpp", "c", "java", "python", "javascript", "typescript", "json", "bash", "sql", "yaml", "go", "text", "http"];
const LANG_ALIAS: Record<string, string> = { "c++": "cpp", py: "python", js: "javascript", ts: "typescript", sh: "bash", shell: "bash", txt: "text", plaintext: "text", yml: "yaml" };
const CALLOUTS = ["note", "tip", "warn", "key", "truth"];
const DIRECTIVES = [...CALLOUTS, "notes", "details", "hint"];

let highlighter: Highlighter | null = null;
export async function getHighlighter() {
  if (!highlighter) {
    highlighter = await createHighlighter({
      themes: [teacherDark, teacherPaper],
      langs: CODE_LANGS.filter((l) => l !== "text"),
    });
  }
  return highlighter;
}

function normLang(lang: string | null | undefined) {
  const l = (lang ?? "text").toLowerCase();
  return LANG_ALIAS[l] ?? l;
}

function shikiHast(code: string, lang: string): Element {
  const hl = highlighter!;
  const l = CODE_LANGS.includes(lang) && lang !== "http" ? lang : "text";
  const root = hl.codeToHast(code.replace(/\n$/, ""), {
    lang: l,
    themes: { dark: "teacher-dark", light: "teacher-paper" },
    defaultColor: false,
  }) as HRoot;
  const pre = root.children[0] as Element;
  pre.properties = { ...pre.properties, dataLang: lang };
  return pre;
}

function shikiHtml(code: string, lang: string) {
  return toHtml(shikiHast(code, lang));
}

function shikiLineHtml(line: string, lang: string) {
  const hl = highlighter!;
  const l = CODE_LANGS.includes(lang) && lang !== "http" ? lang : "text";
  const root = hl.codeToHast(line || " ", { lang: l, themes: { dark: "teacher-dark", light: "teacher-paper" }, defaultColor: false }) as HRoot;
  const pre = root.children[0] as Element;
  const code = pre.children[0] as Element;
  const lineEl = code.children.find((c) => c.type === "element") as Element | undefined;
  return lineEl ? toHtml(lineEl.children) : line;
}

// Inline markdown -> HTML (quiz options, card faces, explanations).
const inlineProcessor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkMath)
  .use(remarkRehype)
  .use(rehypeKatex, { output: "mathml" });

export function mdInline(src: string): string {
  const tree = inlineProcessor.runSync(inlineProcessor.parse(String(src))) as HRoot;
  const kids = tree.children.filter((c) => !(c.type === "text" && !c.value.trim()));
  if (kids.length === 1 && kids[0].type === "element" && kids[0].tagName === "p") return toHtml(kids[0].children);
  return toHtml(tree);
}

function textOf(node: HRootContent | ElementContent): string {
  if (node.type === "text") return node.value;
  if (node.type === "element") return node.children.map(textOf).join("");
  return "";
}

function stripPositions(node: unknown) {
  if (!node || typeof node !== "object") return;
  const n = node as { position?: unknown; children?: unknown[]; data?: unknown };
  delete n.position;
  if (Array.isArray(n.children)) n.children.forEach(stripPositions);
}

// ---------------------------------------------------------------- lesson compilation

export interface CompileContext {
  errors: string[];
  warnings: string[];
}

interface LessonFile {
  file: string; // absolute
  rel: string;
  track: string;
  stage: string;
  slug: string;
  order: number;
  stageOrder: number;
}

function buildIx(type: IxType, data: unknown, lessonId: string, raw: string): { payload: Record<string, unknown>; cards?: Card[] } {
  const id = `${lessonId}#${type}-${fnv1a(raw)}`;
  switch (type) {
    case "quiz": {
      const d = data as { questions?: unknown[] } & Record<string, unknown>;
      const qs = (d.questions ?? [d]) as { q: string; options: string[]; answer: number | number[]; why: string }[];
      return {
        payload: {
          id,
          questions: qs.map((q) => ({
            id: `${lessonId}#q-${fnv1a(q.q)}`,
            qHtml: mdInline(q.q),
            optionsHtml: q.options.map((o) => mdInline(String(o))),
            answer: Array.isArray(q.answer) ? q.answer : [q.answer],
            whyHtml: mdInline(q.why),
          })),
        },
      };
    }
    case "predict": {
      const d = data as { prompt?: string; lang: string; code: string; input?: string; output: string | number; why: string };
      const lang = normLang(d.lang);
      return {
        payload: {
          id,
          promptHtml: mdInline(d.prompt ?? "What does this print?"),
          lang,
          codeHtml: shikiHtml(d.code, lang),
          input: d.input,
          output: String(d.output).replace(/\s+$/, ""),
          whyHtml: mdInline(d.why),
        },
      };
    }
    case "order": {
      const d = data as { prompt?: string; lang: string; code: string; distractors: string[]; why?: string };
      const lang = normLang(d.lang);
      const lines = d.code.replace(/\s+$/, "").split("\n").filter((l) => l.trim() !== "");
      return {
        payload: {
          id,
          promptHtml: mdInline(d.prompt ?? "Put the lines in the right order."),
          lang,
          lines: lines.map((text) => ({ text, html: shikiLineHtml(text, lang) })),
          distractors: d.distractors.map((text) => ({ text, html: shikiLineHtml(text, lang) })),
          whyHtml: d.why ? mdInline(d.why) : undefined,
        },
      };
    }
    case "blanks": {
      const d = data as { prompt?: string; lang: string; code: string; why?: string };
      const parts: ({ kind: "text"; text: string } | { kind: "blank"; answers: string[] })[] = [];
      const re = /\[\[([^\]]+)\]\]/g;
      let last = 0;
      let m: RegExpExecArray | null;
      const code = d.code.replace(/\s+$/, "");
      while ((m = re.exec(code))) {
        if (m.index > last) parts.push({ kind: "text", text: code.slice(last, m.index) });
        parts.push({ kind: "blank", answers: m[1].split("|").map((s) => s.trim()) });
        last = m.index + m[0].length;
      }
      if (last < code.length) parts.push({ kind: "text", text: code.slice(last) });
      return {
        payload: { id, promptHtml: mdInline(d.prompt ?? "Fill in the blanks."), lang: normLang(d.lang), parts, whyHtml: d.why ? mdInline(d.why) : undefined },
      };
    }
    case "cards": {
      const list = (Array.isArray(data) ? data : (data as { cards: unknown[] }).cards) as { q: string; a: string }[];
      const cards: Card[] = list.map((c) => ({ id: `${lessonId}#card-${fnv1a(c.q)}`, lessonId, q: mdInline(c.q), a: mdInline(c.a) }));
      return { payload: { id, cards: cards.map((c) => ({ id: c.id, qHtml: c.q, aHtml: c.a })) }, cards };
    }
    case "estimate": {
      const d = data as { q: string; answer: number; unit?: string; tolerance: number | "order"; hint?: string; solution: string };
      return {
        payload: {
          id,
          qHtml: mdInline(d.q),
          answer: d.answer,
          unit: d.unit,
          tolerance: d.tolerance,
          hintHtml: d.hint ? mdInline(d.hint) : undefined,
          solutionHtml: mdInline(d.solution),
        },
      };
    }
    case "viz": {
      const d = data as { algo: string; input: Record<string, unknown>; editable: boolean; title?: string };
      return { payload: { id, algo: d.algo, input: d.input, editable: d.editable, title: d.title } };
    }
    case "steps": {
      const d = data as { title?: string; view: string; frames: unknown[] };
      return { payload: { id, title: d.title, view: d.view, frames: d.frames } };
    }
  }
}

/** Restore text/leaf directives that are not ours ("ratio a:b") back to literal text. */
function restoreStrayDirectives(tree: MdRoot) {
  visit(tree, (node, index, parent) => {
    if ((node.type === "textDirective" || node.type === "leafDirective") && parent && index !== undefined) {
      const n = node as { name: string; children?: { type: string; value?: string }[]; attributes?: Record<string, string> };
      const label = n.children?.length ? `[${n.children.map((c) => c.value ?? "").join("")}]` : "";
      const prefix = node.type === "leafDirective" ? "::" : ":";
      (parent as MdParent).children.splice(index, 1, { type: "text", value: `${prefix}${n.name}${label}` } as RootContent);
      return [SKIP, index];
    }
  });
}

function compileBody(body: string, lessonId: string, rel: string, lineOffset: number, ctx: CompileContext) {
  const cards: Card[] = [];
  let interactive = 0;
  const err = (line: number | undefined, msg: string) => ctx.errors.push(`${rel}:${(line ?? 1) + lineOffset}  ${msg}`);

  const transform = (children: RootContent[]): RootContent[] => {
    const out: RootContent[] = [];
    for (let i = 0; i < children.length; i++) {
      const node = children[i];
      if (node.type === "html") {
        err(node.position?.start.line, "raw HTML is not allowed");
        continue;
      }
      if (node.type === "code") {
        const lang = normLang(node.lang);
        const line = node.position?.start.line;
        if ((IX_TYPES as readonly string[]).includes(lang)) {
          const type = lang as IxType;
          let data: unknown;
          try {
            data = YAML.parse(node.value);
          } catch (e) {
            err(line, `${type}: YAML error: ${(e as Error).message.split("\n")[0]}`);
            continue;
          }
          const r = IX_SCHEMAS[type].safeParse(data);
          if (!r.success) {
            err(line, `${type}: ${z.prettifyError(r.error).replace(/\n/g, " ")}`);
            continue;
          }
          let value = r.data;
          if (type === "viz") {
            const v = value as { algo: string; input: unknown };
            const vr = validateVizInput(v.algo, v.input);
            if (!vr.ok) {
              err(line, `viz ${v.algo}: ${vr.error.replace(/\n/g, " ")}`);
              continue;
            }
            value = { ...(value as object), input: vr.value };
          }
          try {
            const built = buildIx(type, value, lessonId, node.value);
            if (built.cards) cards.push(...built.cards);
            else interactive++;
            out.push({
              type: "ixBlock",
              data: { hName: "ix-block", hProperties: { type, payload: JSON.stringify(built.payload) } },
            } as unknown as RootContent);
          } catch (e) {
            err(line, `${type}: ${(e as Error).message}`);
          }
          continue;
        }
        if (lang === "mermaid") {
          out.push({ type: "mermaidBlock", data: { hName: "mermaid-block", hProperties: { code: node.value } } } as unknown as RootContent);
          continue;
        }
        if (lang === "input" || lang === "output") {
          err(line, `stray \`\`\`${lang} fence: input/output must directly follow a code block`);
          continue;
        }
        // code group: consecutive programming fences
        const group: Code[] = [node];
        while (i + 1 < children.length) {
          const nx = children[i + 1];
          if (nx.type !== "code") break;
          const nl = normLang(nx.lang);
          if ((IX_TYPES as readonly string[]).includes(nl) || nl === "mermaid" || nl === "input" || nl === "output") break;
          group.push(nx);
          i++;
        }
        let sample: { input: string; output: string } | null = null;
        const a = children[i + 1];
        const b = children[i + 2];
        if (a?.type === "code" && normLang(a.lang) === "input" && b?.type === "code" && normLang(b.lang) === "output") {
          sample = { input: a.value, output: b.value };
          i += 2;
        } else if (a?.type === "code" && normLang(a.lang) === "output") {
          sample = { input: "", output: a.value };
          i += 1;
        }
        if (group.length === 1 && !sample) {
          out.push(node);
          continue;
        }
        const titles = group.map((g) => /title="([^"]*)"/.exec(g.meta ?? "")?.[1] ?? "");
        const props: Record<string, string> = { langs: group.map((g) => normLang(g.lang)).join(","), titles: JSON.stringify(titles) };
        if (sample) {
          props.input = sample.input;
          props.output = sample.output;
        }
        out.push({ type: "codeGroup", children: [...group], data: { hName: "code-group", hProperties: props } } as unknown as RootContent);
        continue;
      }
      if (node.type === "containerDirective") {
        const n = node as unknown as { name: string; children: RootContent[]; position?: { start: { line: number } }; data?: Record<string, unknown> };
        if (!DIRECTIVES.includes(n.name)) {
          err(n.position?.start.line, `unknown block :::${n.name} (use ${DIRECTIVES.join(", ")})`);
          continue;
        }
        let title = "";
        const first = n.children[0] as { type: string; data?: { directiveLabel?: boolean }; children?: RootContent[] } | undefined;
        if (first?.type === "paragraph" && first.data?.directiveLabel) {
          title = (first.children ?? []).map((c) => ("value" in c ? String(c.value) : "")).join("");
          n.children = n.children.slice(1);
        }
        n.children = transform(n.children);
        const hName = CALLOUTS.includes(n.name) ? "callout" : n.name === "notes" ? "notes-block" : n.name === "details" ? "details-block" : "hint-block";
        if ((n.name === "details" || n.name === "hint") && !title) title = n.name === "hint" ? "Hint" : "Details";
        n.data = { hName, hProperties: { kind: n.name, title } };
        out.push(node);
        continue;
      }
      if ("children" in node && Array.isArray((node as MdParent).children) && node.type !== "paragraph" && node.type !== "heading") {
        (node as MdParent).children = transform((node as MdParent).children as RootContent[]) as MdParent["children"];
      }
      out.push(node);
    }
    return out;
  };

  const remarkTeacher = () => (tree: MdRoot) => {
    restoreStrayDirectives(tree);
    tree.children = transform(tree.children);
  };

  const rehypeTeacher = () => (tree: HRoot) => {
    visit(tree, "element", (node: Element, index, parent) => {
      if (node.tagName !== "pre" || !parent || index === undefined) return;
      const code = node.children[0];
      if (!code || code.type !== "element" || code.tagName !== "code") return;
      const cls = (code.properties?.className as string[] | undefined) ?? [];
      const lang = normLang(cls.find((c) => c.startsWith("language-"))?.slice(9));
      const raw = textOf(code);
      (parent as Element).children[index] = shikiHast(raw, lang);
      return SKIP;
    });
  };

  const processor = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkMath)
    .use(remarkDirective)
    .use(remarkTeacher)
    .use(remarkRehype)
    .use(rehypeKatex, { output: "mathml", throwOnError: false } as Parameters<typeof rehypeKatex>[0])
    .use(rehypeSlug)
    .use(rehypeTeacher);

  const hast = processor.runSync(processor.parse(body)) as HRoot;
  stripPositions(hast);

  // toc + sections
  const toc: TocEntry[] = [];
  const sections: Section[] = [];
  let cur: Section = { id: "intro", title: "", hast: { type: "root", children: [] } };
  for (const child of hast.children) {
    if (child.type === "element" && (child.tagName === "h2" || child.tagName === "h3")) {
      const id = String(child.properties?.id ?? "");
      const text = textOf(child).trim();
      toc.push({ id, text, depth: child.tagName === "h2" ? 2 : 3 });
      if (child.tagName === "h2") {
        if (cur.hast.children.some((c) => !(c.type === "text" && !c.value.trim()))) sections.push(cur);
        cur = { id, title: text, hast: { type: "root", children: [] } };
      }
    }
    cur.hast.children.push(child);
  }
  if (cur.hast.children.length) sections.push(cur);
  return { sections, toc, cards, interactive };
}

function problemRef(p: ProblemInput): ProblemRef {
  const base = { name: p.name, core: p.core, note: p.note };
  if ("cf" in p) {
    const m = /^(\d+)([A-Z]\d?)$/.exec(p.cf)!;
    return { ...base, key: `cf:${p.cf}`, platform: "cf", id: p.cf, url: `https://codeforces.com/problemset/problem/${m[1]}/${m[2]}`, rating: p.rating };
  }
  if ("lc" in p) return { ...base, key: `lc:${p.lc}`, platform: "lc", id: p.lc, url: `https://leetcode.com/problems/${p.lc}/`, difficulty: p.difficulty };
  if ("cses" in p) return { ...base, key: `cses:${p.cses}`, platform: "cses", id: String(p.cses), url: `https://cses.fi/problemset/task/${p.cses}` };
  const slug = p.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  return { ...base, key: `other:${slug}`, platform: "other", id: slug, url: p.url, site: p.site };
}

export async function compileLessonFile(lf: LessonFile, ctx: CompileContext): Promise<Lesson | null> {
  await getHighlighter();
  const src = fs.readFileSync(lf.file, "utf8").replace(/\r\n/g, "\n");
  const m = /^---\n([\s\S]*?)\n---\n?/.exec(src);
  if (!m) {
    ctx.errors.push(`${lf.rel}:1  missing YAML frontmatter`);
    return null;
  }
  let fmRaw: unknown;
  try {
    fmRaw = YAML.parse(m[1]);
  } catch (e) {
    ctx.errors.push(`${lf.rel}:2  frontmatter YAML: ${(e as Error).message.split("\n")[0]}`);
    return null;
  }
  const fmParsed = frontmatterSchema.safeParse(fmRaw);
  if (!fmParsed.success) {
    ctx.errors.push(`${lf.rel}:2  frontmatter: ${z.prettifyError(fmParsed.error).replace(/\n/g, " ")}`);
    return null;
  }
  const fm = fmParsed.data;
  const slug = fm.slug ?? lf.slug;
  const id = `${lf.track}/${slug}`;
  const lineOffset = m[0].split("\n").length - 1;
  const before = ctx.errors.length;
  const { sections, toc, cards, interactive } = compileBody(src.slice(m[0].length), id, lf.rel, lineOffset, ctx);
  if (!/:::notes/.test(src)) ctx.warnings.push(`${lf.rel}  no :::notes block`);
  const problems = fm.problems.map(problemRef);
  return {
    id,
    track: lf.track,
    stage: lf.stage,
    slug,
    title: fm.title,
    summary: fm.summary,
    minutes: fm.minutes,
    difficulty: fm.difficulty,
    rating: fm.rating,
    tags: fm.tags,
    prereqs: fm.prereqs,
    toc,
    problemCount: problems.length,
    interactiveCount: interactive,
    cardCount: cards.length,
    sections,
    problems,
    exercises: fm.exercises.map(mdInline),
    resources: fm.resources,
    cards,
    ...(ctx.errors.length > before ? { _failed: true } : {}),
  } as Lesson;
}

// ---------------------------------------------------------------- discovery + catalog

export function discover(root: string, ctx: CompileContext) {
  const tracks: { input: z.infer<typeof trackSchema>; lessons: LessonFile[] }[] = [];
  const contentDir = path.join(root, "content");
  if (!fs.existsSync(contentDir)) return tracks;
  for (const t of fs.readdirSync(contentDir).sort()) {
    const tdir = path.join(contentDir, t);
    const ymlPath = path.join(tdir, "track.yml");
    if (!fs.existsSync(ymlPath)) continue;
    const parsed = trackSchema.safeParse(YAML.parse(fs.readFileSync(ymlPath, "utf8")));
    if (!parsed.success) {
      ctx.errors.push(`content/${t}/track.yml  ${z.prettifyError(parsed.error).replace(/\n/g, " ")}`);
      continue;
    }
    const input = parsed.data;
    const stageIds = input.stages.map((s) => s.id);
    const lessons: LessonFile[] = [];
    for (const sd of fs.readdirSync(tdir).sort()) {
      const sm = /^(\d+)-([a-z0-9-]+)$/.exec(sd);
      if (!sm || !fs.statSync(path.join(tdir, sd)).isDirectory()) continue;
      if (!stageIds.includes(sm[2])) {
        ctx.errors.push(`content/${t}/${sd}  stage "${sm[2]}" is not listed in track.yml`);
        continue;
      }
      for (const f of fs.readdirSync(path.join(tdir, sd)).sort()) {
        const lm = /^(\d+)-([a-z0-9-]+)\.md$/.exec(f);
        if (!lm) continue;
        lessons.push({
          file: path.join(tdir, sd, f),
          rel: path.join("content", t, sd, f),
          track: input.id,
          stage: sm[2],
          slug: lm[2],
          order: Number(lm[1]),
          stageOrder: stageIds.indexOf(sm[2]),
        });
      }
    }
    lessons.sort((a, b) => a.stageOrder - b.stageOrder || a.order - b.order);
    tracks.push({ input, lessons });
  }
  tracks.sort((a, b) => a.input.order - b.input.order);
  return tracks;
}

export interface CompileResult {
  catalog: Catalog;
  lessons: Lesson[];
  cards: Card[];
  problems: Record<string, ProblemRef & { lessons: string[] }>;
}

const cache = new Map<string, { hash: string; lesson: Lesson | null; errors: string[]; warnings: string[] }>();

export async function compileAll(root: string, ctx: CompileContext, only?: (rel: string) => boolean): Promise<CompileResult> {
  await getHighlighter();
  const found = discover(root, ctx);
  const allLessons: Lesson[] = [];
  const tracks: Track[] = [];
  for (const { input, lessons: files } of found) {
    const compiled: Lesson[] = [];
    for (const lf of files) {
      if (only && !only(lf.rel)) continue;
      if (input.status === "soon") continue;
      const src = fs.readFileSync(lf.file, "utf8");
      const hash = fnv1a(src);
      let entry = cache.get(lf.file);
      if (!entry || entry.hash !== hash) {
        const sub: CompileContext = { errors: [], warnings: [] };
        let lesson: Lesson | null = null;
        try {
          lesson = await compileLessonFile(lf, sub);
        } catch (e) {
          sub.errors.push(`${lf.rel}  ${(e as Error).message}`);
        }
        entry = { hash, lesson, errors: sub.errors, warnings: sub.warnings };
        cache.set(lf.file, entry);
      }
      ctx.errors.push(...entry.errors);
      ctx.warnings.push(...entry.warnings);
      if (entry.lesson) compiled.push(structuredClone(entry.lesson));
    }
    // dedupe slugs
    const seen = new Set<string>();
    const lessons = compiled.filter((l) => {
      if (seen.has(l.id)) {
        ctx.errors.push(`duplicate lesson id ${l.id}`);
        return false;
      }
      seen.add(l.id);
      return true;
    });
    lessons.forEach((l, i) => {
      l.prev = lessons[i - 1]?.id;
      l.next = lessons[i + 1]?.id;
      for (const p of l.prereqs) if (!seen.has(`${input.id}/${p}`) && !seen.has(p)) ctx.warnings.push(`${l.id}: prereq "${p}" not found`);
    });
    tracks.push({
      ...input,
      stages: input.stages.map((s) => ({ ...s, lessons: lessons.filter((l) => l.stage === s.id).map((l) => l.id) })),
      lessonCount: lessons.length,
      minutes: lessons.reduce((a, l) => a + l.minutes, 0),
    });
    allLessons.push(...lessons);
  }

  const metaOf = (l: Lesson): LessonMeta => {
    const { sections: _s, problems: _p, exercises: _e, resources: _r, cards: _c, ...meta } = l;
    void _s; void _p; void _e; void _r; void _c;
    delete (meta as { _failed?: boolean })._failed;
    return meta;
  };
  const search: SearchEntry[] = allLessons.map((l) => ({
    id: l.id,
    title: l.title,
    summary: l.summary,
    track: l.track,
    stage: l.stage,
    tags: l.tags,
    headings: l.toc.map((t) => t.text),
  }));
  const problems: CompileResult["problems"] = {};
  for (const l of allLessons)
    for (const p of l.problems) {
      problems[p.key] ??= { ...p, lessons: [] };
      problems[p.key].lessons.push(l.id);
    }
  return {
    catalog: {
      generatedAt: new Date().toISOString(),
      tracks,
      lessons: Object.fromEntries(allLessons.map((l) => [l.id, metaOf(l)])),
      search,
    },
    lessons: allLessons,
    cards: allLessons.flatMap((l) => l.cards),
    problems,
  };
}

export function writeOutput(outDir: string, r: CompileResult) {
  fs.rmSync(path.join(outDir, "lessons"), { recursive: true, force: true });
  fs.mkdirSync(path.join(outDir, "lessons"), { recursive: true });
  for (const l of r.lessons) {
    const dir = path.join(outDir, "lessons", l.track);
    fs.mkdirSync(dir, { recursive: true });
    const clean = { ...l } as Lesson & { _failed?: boolean };
    delete clean._failed;
    fs.writeFileSync(path.join(dir, `${l.slug}.json`), JSON.stringify(clean));
  }
  fs.writeFileSync(path.join(outDir, "catalog.json"), JSON.stringify(r.catalog));
  fs.writeFileSync(path.join(outDir, "cards.json"), JSON.stringify(r.cards));
  fs.writeFileSync(path.join(outDir, "problems.json"), JSON.stringify(r.problems));
}
