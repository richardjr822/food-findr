import { NextRequest, NextResponse } from "next/server";
import { verifyOtp } from "@/lib/otp-store";
import clientPromise from "@/lib/mongodb";

export async function POST(req: NextRequest) {
  try {
    const { email, code } = await req.json();
    if (!email || !code) {
      return NextResponse.json({ error: "Email and code are required." }, { status: 400 });
    }

    await verifyOtp(email, code);

    // Mark user as verified in the database
    const client = await clientPromise;
    const db = client.db();
    await db.collection("users").updateOne(
      { email },
      { $set: { isVerified: true } }
    );

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to verify code." }, { status: 400 });
  }
}