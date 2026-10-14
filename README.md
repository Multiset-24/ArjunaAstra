# teacher

A calm, interactive place to learn problem solving and software engineering from zero.

| Track | Goal | Status |
|---|---|---|
| DSA & Competitive Programming (C++ / Java) | Codeforces Candidate Master (1900+) | Live, stages being added |
| System Design | Intermediate, interview-ready | Coming soon |
| Low-Level Design (Java / C++) | Intermediate, machine-coding ready | Coming soon |
| AI Engineering (Python) | Build, evaluate and ship LLM features | Coming soon |

Every lesson is short and interactive: quick checks, predict-the-output, put-the-lines-in-order, fill-in-the-blanks, back-of-the-envelope estimates, step-through algorithm visualizers, flashcards with spaced review, copy-ready notes and real practice problems from Codeforces, LeetCode and CSES.

It is also honest. Reading lessons does not raise a rating; solving problems does. The site says so, and organises the practice.

## Quick start

```bash
npm install
npm run dev          # compiles lessons, applies DB migrations, starts http://localhost:3000
```

Requirements: Node 20.9+. No database setup: development uses a local SQLite file (`.data/teacher.db`).

| Command | What it does |
|---|---|
| `npm run dev` | Content watcher + Next.js dev server |
| `npm run build` / `npm start` | Production build / serve |
| `npm run content` | Compile `content/**/*.md` into `.content/` |
| `npm run check` | Validate every lesson (frontmatter, interactive blocks, problems) |
| `npm run check:code` | Compile and run every code sample against its expected output |
| `npm run db:migrate` | Apply database migrations |
| `npm run data:cf` | Refresh the Codeforces problem snapshot |

## How it is built

- **Next.js 16** (App Router, Cache Components), React 19, TypeScript, CSS Modules with design tokens (dark "walnut" + light "paper").
- **Lessons** are Markdown files with YAML frontmatter and fenced YAML blocks for interactivity, compiled at build time (unified, Shiki, KaTeX → MathML, Mermaid).
- **Accounts** with Better Auth (email + password, optional GitHub/Google), **Drizzle ORM** on libSQL (SQLite locally, Turso in production). Without a database the app runs in guest mode with progress in the browser.
- **Codeforces**: the server reads the public API (rating ladder rebuilt daily, handle sync). Optional `CF_API_KEY` / `CF_API_SECRET` for signed requests — never exposed to the browser.

## Docs

- [docs/CURRICULUM.md](docs/CURRICULUM.md) — every track, stage and lesson
- [docs/CONTENT_GUIDE.md](docs/CONTENT_GUIDE.md) — how to write a lesson and its interactive blocks
- [docs/CONTRACTS.md](docs/CONTRACTS.md) — architecture and internal interfaces
- [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) — Netlify / Vercel, database and environment variables

## License

MIT
