# Internal contracts (for contributors and parallel builders)

Stack: Next.js 16.4 (App Router, `cacheComponents: true`, `partialPrefetching: true`), React 19.3, TypeScript, CSS Modules + global CSS tokens (no Tailwind), Better Auth 1.7 + Drizzle ORM + libSQL (SQLite file locally, Turso in production), Shiki 4, unified/remark/rehype, KaTeX (MathML output), Mermaid 12.

Read `node_modules/next/dist/docs/` before using a Next.js API you are not sure about (this Next version has breaking changes: async `params`, `proxy.ts` instead of middleware, Cache Components rules — runtime APIs like `cookies()`/`headers()` and uncached fetches must sit inside `<Suspense>` or be in route handlers).

## Content flow

```
content/**/*.md + track.yml
   └─ scripts/content.ts  (src/lib/content/compile.ts)
        └─ .content/catalog.json          Catalog (types.ts)
           .content/lessons/<track>/<slug>.json   Lesson (types.ts)
           .content/cards.json             Card[]
           .content/problems.json          Record<key, ProblemRef & {lessons: string[]}>
   └─ src/lib/content/catalog.ts  getCatalog() getTrack() getLesson() getAllCards() getAllProblems()
        └─ pages render Lesson.sections[i].hast with <Markdown hast={...} />
```

## Custom hast elements emitted by the compiler

`<Markdown>` (src/components/md/Markdown.tsx) maps these tag names to components. Properties arrive as props with these exact names.

| tagName | props | children | component |
|---|---|---|---|
| `ix-block` | `type` (IxType), `payload` (JSON string of the matching *Payload in blocks.ts) | none | `IxBlock` → Quiz / Predict / Order / Blanks / Cards / Estimate / Viz / Steps |
| `code-group` | `langs` ("cpp,java"), `titles` (JSON string array), optional `input` + `output` (sample run) | one `pre` per language (Shiki hast, `data-lang` attr) | `CodeGroup` (tabs follow the global C++/Java preference) |
| `callout` | `kind` (note, tip, warn, key, truth), `title` (optional) | content | `Callout` |
| `notes-block` | `title` (optional) | content | `NotesBlock` (copy button) |
| `details-block` | `title` | content | `DetailsBlock` (closed by default) |
| `hint-block` | `title` | content | `HintBlock` (spoiler) |
| `mermaid-block` | `code` | none | `MermaidBlock` (client, lazy `import("mermaid")`, themed from CSS tokens) |

Plain code fences with one language render as a normal `pre` (Shiki, dual theme via `--shiki-dark` / `--shiki-light` CSS variables, `defaultColor: false`). Math is MathML (`<math>`), no CSS needed.

Block ids: quiz question ids, card ids etc. are stable: `<lessonId>#<kind>-<hash of content>`.

## Client state

`src/lib/store/types.ts` defines `ProgressState` and `ProgressApi`. `src/lib/store/progress.tsx` exports `<ProgressProvider>` and `useProgress()`. All interactive components record through it:

- Quiz answered → `recordQuiz(questionId, correct)`
- Lesson finished → `setLessonDone(lessonId, true)` and `enrollCards(card ids of the lesson)`
- Learn-mode step reached → `setSection(lessonId, index)`
- Problem checkbox → `setProblem("cf:279B", "solved" | "tried" | null)`
- Review grade → `gradeCard(cardId, 0..3)`
- Personal notes → `saveNote(lessonId, text)`
- Preferences → `setPref("codeLang" | "theme" | "mode", value)`

Theme is applied as `data-theme="dark" | "paper"` on `<html>` (inline script in layout prevents a flash; default dark). Code language preference drives every CodeGroup.

## Server API (route handlers)

| route | method | auth | purpose |
|---|---|---|---|
| `/api/auth/[...all]` | GET/POST | — | Better Auth handler |
| `/api/config` | GET | — | `{ authEnabled, providers: { github, google } }` |
| `/api/me/state` | GET | session | full `ProgressState` (server copy, minus device-local `sections`) |
| `/api/me/events` | POST | session | batch of mutations `{ events: Event[] }`, last-write-wins by timestamp |
| `/api/cf/sync` | POST | optional | `{ handle }` → `{ handle, rating, maxRating, rank, solved: string[], tried: string[] }`; persists when signed in |
| `/api/cf/ladder` | GET | — | rating ladder 800–2400 built from the live problemset (cached daily) with snapshot fallback |
| `/api/cf/meta` | GET | — | live `{ [key]: { name, rating, tags } }` for every curated `cf:` problem, to verify lesson data |

When no database is configured in production, auth is disabled and the app runs fully in guest mode (localStorage). Never put Codeforces API keys in client code; `CF_API_KEY` / `CF_API_SECRET` are optional server env vars.

## Visualizers

`src/lib/viz/catalog.ts` (names, inputs, examples) + `src/lib/viz/types.ts` (Frame / Simulation). `<Viz algo input editable title />` (src/components/viz/Viz.tsx) validates input with the catalog, then:
- kind `frames`: runs the simulator from `src/lib/viz/registry.ts` (DSA) or `src/lib/viz/registry-b.ts` (SD/AI) and renders frames with `Player`;
- kind `widget`: renders `WIDGETS[algo]` from `src/components/viz/widgets/index.ts`.

## Design

Tokens in `src/styles/tokens.css` (dark brown default, paper light). Fonts: Fraunces (display), IBM Plex Sans (body), JetBrains Mono (code) via @fontsource-variable packages. Calm: no gradients, no glow, no emoji, borders over shadows, motion ≤ 220 ms and disabled under `prefers-reduced-motion`. Mobile first: 16px side gutters, no horizontal page scroll, touch targets ≥ 40px.
