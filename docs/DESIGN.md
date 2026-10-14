# Design

A quiet, warm interface for long study sessions — a zen teacher, not a game.

## Principles

- **One thing at a time.** Learn mode reveals a lesson section by section. Focus mode (`F`) removes everything but the text.
- **Calm over catchy.** No gradients, glows, confetti or emoji. Borders over shadows. Motion ≤ 220 ms, off under `prefers-reduced-motion`.
- **Text only where needed.** Labels are short. Feedback is one sentence plus the explanation.
- **Honest feedback.** Correct answers turn sage, wrong ones a muted clay red — never alarming, always explained.

## Tokens (`src/styles/tokens.css`)

| Token | Walnut (default, dark) | Paper (light) | Use |
|---|---|---|---|
| `--bg` | `#17110d` | `#f4ede1` | page |
| `--surface` | `#231a14` | `#f9f4eb` | cards, blocks |
| `--text` | `#ece1d1` | `#2a1f17` | body text |
| `--text-2` / `--text-3` | `#c4b4a1` / `#988775` | `#5b4a3b` / `#7d6b59` | secondary / hints |
| `--accent` | `#d39d6b` (clay) | `#9a5a2c` | links, primary actions, progress |
| `--sage` | `#a3b68f` | `#56713f` | correct, done |
| `--rose` | `#dc917d` | `#a5503d` | wrong, careful |
| `--gold` | `#dcb96f` | `#8f6c22` | reality checks, hints |

Components never hard-code colours; switching `data-theme` on `<html>` re-themes everything, including Shiki code (dual-theme CSS variables) and Mermaid diagrams.

## Type

- **Fraunces** (soft, light weights) for headings and the wordmark.
- **IBM Plex Sans** for reading; 17px lesson text, 1.72 line height, 720px measure.
- **JetBrains Mono** for code, numbers and counters.

## Motif

The ensō — a single brush circle drawn as a tapered SVG path (`src/components/shell/Enso.tsx`) — is the logo, and the progress ring is an ensō that closes as you finish a track.

## Layout

Docs-style three columns on wide screens (lessons · content · contents + notes), a drawer and toolbar on tablets and phones, 16px gutters, ≥ 40px touch targets, no horizontal page scroll.
