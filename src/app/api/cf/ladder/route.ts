import { buildLadder, getProblemset } from "@/lib/cf/ladder";

export async function GET() {
  const ladder = buildLadder(await getProblemset());
  return Response.json(ladder, { headers: { "cache-control": "public, max-age=3600, s-maxage=86400" } });
}
