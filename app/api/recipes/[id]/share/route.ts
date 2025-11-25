import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(_: NextRequest) {
  return NextResponse.json({ error: "Sharing is disabled" }, { status: 410 });
}
