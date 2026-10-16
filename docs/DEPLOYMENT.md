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
   - optional: `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`
4. Trigger a redeploy. The sign-in page now works.

## GitHub sign-in (optional)

The sign-in page shows **Continue with GitHub** only when both `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` are set. If either is missing or blank, the button stays hidden and the server does not register the provider.

GitHub OAuth apps allow one callback URL. Use one app for production and a second app for local development.

1. Open [GitHub → Settings → Developer settings → OAuth Apps](https://github.com/settings/developers) → **New OAuth App**.
2. Production app:
   - Homepage URL: `https://teacherv0.netlify.app`
   - Authorization callback URL: `https://teacherv0.netlify.app/api/auth/callback/github`
3. Local app (only if you want to try sign-in on your machine):
   - Homepage URL: `http://localhost:3000`
   - Authorization callback URL: `http://localhost:3000/api/auth/callback/github`
4. Generate a client secret. Put the client id and secret in Netlify environment variables as `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET`. For local development, put the local app's values in `.env` and set `BETTER_AUTH_URL=http://localhost:3000`.
5. Redeploy (or restart `npm run dev`). Do not commit the secret.

Someone who already has an email account keeps that account. GitHub does not silently take it over: sign in with the password, then use **Connect GitHub** on the profile page. Linking succeeds only when the GitHub email is the same address. A different GitHub email stays a separate account. New visitors can use **Continue with GitHub** directly.

## Codeforces API key (optional)

Public data needs no key. To sign requests, set `CF_API_KEY` and `CF_API_SECRET` as server environment variables. Never commit them and never use a `NEXT_PUBLIC_` prefix.

## Vercel

Same steps: import the repo, add the same environment variables. The build command is `npm run build`.
