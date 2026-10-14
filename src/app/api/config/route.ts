import { connection } from "next/server";
import { authEnabled, authProviders } from "@/lib/auth";

export async function GET() {
  await connection();
  return Response.json({ authEnabled, providers: authProviders });
}
