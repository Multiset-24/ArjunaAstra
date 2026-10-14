# Deployment

teacher is a standard Next.js app. It runs in two modes:

| Mode | When | Progress is stored |
|---|---|---|
| Guest | `DATABASE_URL` is not set in production | In the visitor's browser (localStorage) |
| Accounts | `DATABASE_URL` points to a libSQL/Turso database | In the database, synced across devices |

## Netlify (recommended path)

1. Push the repo to GitHub.
2. Netlify → **Add new project → Import an existing project → GitHub** → pick the repo.
3. Build settings come from `netlify.toml` (`npm run build`, publish `.next`). Netlify's Next.js runtime is detected automatically.
4. Deploy. Every push to `main` redeploys.

## Turning on accounts

1. Create a free database at [turso.tech](https://turso.tech): `turso db create teacher`, then `turso db show teacher --url` and `turso db tokens create teacher`.
2. Migrations run at the start of every build (`npm run build`), so the tables are created on the first deploy after `DATABASE_URL` is set. To apply them by hand: `DATABASE_URL=libsql://... DATABASE_AUTH_TOKEN=... npm run db:migrate`.
3. In Netlify → Project configuration → Environment variables, add:
   - `DATABASE_URL`, `DATABASE_AUTH_TOKEN`
   - `BETTER_AUTH_SECRET` — output of `openssl rand -base64 32`
   - `BETTER_AUTH_URL` — your site URL, e.g. `https://teacher-xyz.netlify.app`
   - optional: `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET`, `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`
4. Trigger a redeploy. The sign-in page now works.

## Codeforces API key (optional)

Public data needs no key. To sign requests, set `CF_API_KEY` and `CF_API_SECRET` as server environment variables. Never commit them and never use a `NEXT_PUBLIC_` prefix.

## Vercel

Same steps: import the repo, add the same environment variables. The build command is `npm run build`.
