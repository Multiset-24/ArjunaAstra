# Codeforces integration

| Feature | How |
|---|---|
| Rating ladder (800–2400) | `GET /api/cf/ladder` — the 40 most-solved problems per rating, at most one per contest, from the live problem set (cached daily). Falls back to `data/codeforces/problemset.json`. |
| Handle sync | `POST /api/cf/sync` — `user.info` + `user.status`; accepted submissions mark problems solved. Signed-in users get it saved to their account. |
| Lesson problem check | `npm run verify:problems` (offline) and `GET /api/cf/meta` (live names/ratings for every curated problem). |
| Snapshot refresh | `npm run data:cf` |

The server calls Codeforces at most once every ~2 seconds per instance, as the API asks. Public methods need no key; `CF_API_KEY` / `CF_API_SECRET` enable signed requests and stay on the server.

LeetCode problems are linked by slug and validated against `data/leetcode/problems.json` (free problems only).
