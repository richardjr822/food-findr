import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { endSession } from "@/lib/activity";
import { logEvent } from "@/lib/log";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const sessionAny: any = await getServerSession(authOptions as any);
  const uid = sessionAny?.user?.id as string | undefined;
  if (!uid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  let body: any = {};
  try {
    if (req.headers.get("content-type")?.includes("application/json")) {
      body = await req.json();
    }
  } catch {}
  const sessionId = typeof body?.sessionId === "string" ? body.sessionId : undefined;
  try {
    const ok = await endSession(uid, sessionId);
    await logEvent("info", "session_end", { uid, sessionId, ok });
    return NextResponse.json({ ok: !!ok });
  } catch (e: any) {
    await logEvent("error", "session_end_error", { message: e?.message, uid });
    return NextResponse.json({ error: "Failed to end session" }, { status: 500 });
  }
}
