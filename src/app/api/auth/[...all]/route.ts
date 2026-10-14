import { toNextJsHandler } from "better-auth/next-js";
import { authEnabled, getAuth } from "@/lib/auth";

const disabled = () => Response.json({ error: "Accounts are not enabled on this deployment." }, { status: 503 });

export async function GET(req: Request) {
  // Guest mode: the client still asks for a session; answer "no session" quietly.
  if (!authEnabled) return new URL(req.url).pathname.endsWith("/get-session") ? Response.json(null) : disabled();
  return toNextJsHandler(getAuth()).GET(req);
}
export async function POST(req: Request) {
  if (!authEnabled) return disabled();
  return toNextJsHandler(getAuth()).POST(req);
}
