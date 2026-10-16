# Contributing

1. Read [docs/CONTENT_GUIDE.md](docs/CONTENT_GUIDE.md).
2. Add or edit a lesson in `content/<track>/<NN-stage>/<NN-slug>.md`.
3. Check it:
   ```bash
   npx tsx scripts/lint-lesson.ts content/dsa/01-arrays/04-two-pointers.md
   npm run check:code -- content/dsa/01-arrays/04-two-pointers.md
   npm run dev
   ```
4. Keep it short, interactive, correct and honest. Open a pull request.
