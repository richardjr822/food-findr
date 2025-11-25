import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/session";
import { listUserActivity } from "@/lib/activity";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;
  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const limit = Number(searchParams.get("limit") || "50");
  const opts: any = { limit };
  if (from) opts.from = new Date(from);
  if (to) opts.to = new Date(to);
  const items = await listUserActivity(auth.userId, opts);
  return NextResponse.json({ items });
}
