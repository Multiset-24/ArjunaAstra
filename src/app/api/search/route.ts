import { getCatalog } from "@/lib/content/catalog";

export async function GET() {
  return Response.json(getCatalog().search);
}
