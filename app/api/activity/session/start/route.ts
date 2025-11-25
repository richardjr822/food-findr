import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { startSession } from "@/lib/activity";
import { logEvent } from "@/lib/log";

export const runtime = "nodejs";

export async function POST(_req: NextRequest) {
  const sessionAny: any = await getServerSession(authOptions as any);
  const uid = sessionAny?.user?.id as string | undefined;
  if (!uid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const sessionId = await startSession(uid);
    await logEvent("info", "session_start", { uid, sessionId });
    return NextResponse.json({ sessionId });
  } catch (e: any) {
    await logEvent("error", "session_start_error", { message: e?.message, uid });
    return NextResponse.json({ error: "Failed to start session" }, { status: 500 });
  }
}
