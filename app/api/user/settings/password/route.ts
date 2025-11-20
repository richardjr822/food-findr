 import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { User } from "@/lib/models/User";
import bcrypt from "@node-rs/bcrypt";
import { z } from "zod";
import { requireUser } from "@/lib/session";
import { ObjectId } from "mongodb";

const PasswordChangeSchema = z
  .object({
    currentPassword: z.string().trim().min(8).max(128),
    newPassword: z
      .string()
      .trim()
      .min(8)
      .max(128)
      .regex(/(?=.*[0-9!@#$%^&*()_+\-={}\[\]:";'<>?,./])/, "Password must contain at least one number or symbol."),
  })
  .strict()
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: "New password must be different from current password.",
    path: ["newPassword"],
  });

export async function POST(req: NextRequest) {
  try {
    const auth = await requireUser();
    if (auth instanceof NextResponse) return auth; // 401
    const { userId } = auth;

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    // IDOR attempt logging: reject/ignore any identifier fields
    if (body && typeof body === "object") {
      const b: any = body;
      if (b.userId || b._id || b.email) {
        console.warn("[IDOR] Password change included identifier fields and was ignored", {
          path: "/api/user/settings/password",
          actorUserId: userId,
          provided: { userId: b.userId, _id: b._id, email: b.email },
        });
      }
    }

    const parsed = PasswordChangeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const currentPassword = parsed.data.currentPassword.trim();
    const newPassword = parsed.data.newPassword.trim();

    const client = await clientPromise;
    const db = client.db();
    const user = await db.collection<User>("users").findOne({ _id: new ObjectId(userId) as any });

    if (!user || !user.passwordHash) {
      return NextResponse.json({ error: "Unable to change password" }, { status: 400 });
    }

    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValid) {
      return NextResponse.json({ error: "Incorrect current password" }, { status: 403 });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await db
      .collection<User>("users")
      .updateOne({ _id: new ObjectId(userId) as any }, { $set: { passwordHash, updatedAt: new Date() } });

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to change password" }, { status: 500 });
  }
}
