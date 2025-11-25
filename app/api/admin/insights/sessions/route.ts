import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { findUserByEmail } from "@/lib/auth";
import { listUserSessions } from "@/lib/activity";

export const runtime = "nodejs";

function isAdminEmail(email?: string | null) {
  const allow = (process.env.ADMIN_EMAILS || "").split(",").map(s => s.trim().toLowerCase()).filter(Boolean);
  if (!allow.length) return false;
  return !!email && allow.includes(email.toLowerCase());
}

export async function GET(req: NextRequest) {
  const sessionAny: any = await getServerSession(authOptions as any);
  const email = sessionAny?.user?.email as string | undefined;
  if (!isAdminEmail(email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { searchParams } = new URL(req.url);
  const targetEmail = searchParams.get("email");
  const format = (searchParams.get("format") || "json").toLowerCase();
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const limit = Number(searchParams.get("limit") || "200");
  if (!targetEmail) return NextResponse.json({ error: "email is required" }, { status: 400 });
  const user = await findUserByEmail(targetEmail);
  if (!user?._id) return NextResponse.json({ items: [] });
  const opts: any = { limit };
  if (from) opts.from = new Date(from);
  if (to) opts.to = new Date(to);
  const items = await listUserSessions(user._id.toString(), opts);
  if (format === "csv") {
    const header = "sessionId,startAt,endAt,durationMs\n";
    const rows = items.map((s: any) => `${s._id || ""},${new Date(s.startAt).toISOString()},${s.endAt ? new Date(s.endAt).toISOString() : ""},${s.durationMs ?? ""}`).join("\n");
    return new NextResponse(header + rows, { headers: { "Content-Type": "text/csv" } });
  }
  return NextResponse.json({ items });
}
