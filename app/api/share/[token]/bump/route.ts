import { NextRequest, NextResponse } from "next/server";
import { bumpShare } from "@/lib/models/share";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params;
    const body = await req.json().catch(() => ({}));
    const method = body?.method === "webshare" ? "webshare" : body?.method === "copy" ? "copy" : undefined;
    await bumpShare(token, method);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed" }, { status: 500 });
  }
}
