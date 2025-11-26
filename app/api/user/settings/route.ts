import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { User } from "@/lib/models/User";
import { z } from "zod";
import { requireUser } from "@/lib/session";
import { ObjectId } from "mongodb";

// Helper: get user by id
async function getUserById(userId: string) {
  const client = await clientPromise;
  const db = client.db();
  return db.collection<User>("users").findOne({ _id: new ObjectId(userId) as any });
}

// Helper: update user by id with atomic $set
async function updateUserById(userId: string, update: Partial<User> & Record<string, unknown>) {
  const client = await clientPromise;
  const db = client.db();
  await db.collection<User>("users").updateOne(
    { _id: new ObjectId(userId) as any },
    { $set: { ...update, updatedAt: new Date() } }
  );
}

const ProfileSchema = z
  .object({
    firstName: z
      .string()
      .trim()
      .min(1)
      .max(100)
      .refine((v) => !/\d/.test(v), "Numbers are not allowed"),
    lastName: z
      .string()
      .trim()
      .min(1)
      .max(100)
      .refine((v) => !/\d/.test(v), "Numbers are not allowed"),
    bio: z.string().trim().max(280).optional(),
    profilePic: z
      .string()
      .trim()
      .url()
      .max(2048)
      .optional(),
  })
  // Allow extra keys (like a malicious "email") but ignore them in our update logic
  .passthrough();

const PrivacySchema = z
  .object({
    showProfile: z.boolean(),
    searchable: z.boolean(),
  })
  .strict();

const NotificationsSchema = z
  .object({
    emailUpdates: z.boolean(),
    productNews: z.boolean(),
  })
  .strict();

const SettingsUpdateSchema = z
  .object({
    profile: ProfileSchema.optional(),
    privacy: PrivacySchema.optional(),
    notifications: NotificationsSchema.optional(),
  })
  .strict()
  .refine((val) => val.profile || val.privacy || val.notifications, {
    message: "No valid fields to update",
  });

// GET: fetch user settings
export async function GET(req: NextRequest) {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth; // 401
  const { userId } = auth;

  const user = await getUserById(userId);
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  return NextResponse.json({
    profile: {
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      email: user.email,
      bio: user.profile?.bio || "",
      profilePic: user.profilePic || "",
    },
    privacy: {
      showProfile: user.showProfile ?? true,
      searchable: user.searchable ?? true,
    },
    notifications: {
      emailUpdates: user.emailUpdates ?? true,
      productNews: user.productNews ?? false,
    },
  });
}

// PATCH: update user settings (profile, privacy, notifications)
export async function PATCH(req: NextRequest) {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth; // 401
  const { userId } = auth;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // IDOR attempt logging
  if (body && typeof body === "object") {
    const b: any = body;
    if (b.userId || b._id || b.email) {
      console.warn("[IDOR] Settings update included identifier fields and was ignored", {
        path: "/api/user/settings",
        actorUserId: userId,
        provided: { userId: b.userId, _id: b._id, email: b.email },
      });
    }
  }

  const parsed = SettingsUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const update: Partial<User> & Record<string, unknown> = {};

  if (parsed.data.profile) {
    const { firstName, lastName, profilePic, bio } = parsed.data.profile;
    update.firstName = firstName;
    update.lastName = lastName;
    if (typeof profilePic !== "undefined") {
      update.profilePic = profilePic;
      update["profile.profilePicture"] = profilePic;
    }
    if (typeof bio !== "undefined") {
      update["profile.bio"] = bio;
    }
    const fullName = `${firstName} ${lastName}`.trim();
    if (fullName) {
      update["profile.name"] = fullName;
    }
  }

  if (parsed.data.privacy) {
    update.showProfile = parsed.data.privacy.showProfile;
    update.searchable = parsed.data.privacy.searchable;
    update["settings.privacy"] = parsed.data.privacy.showProfile;
  }

  if (parsed.data.notifications) {
    update.emailUpdates = parsed.data.notifications.emailUpdates;
    update.productNews = parsed.data.notifications.productNews;
    update["settings.notifications"] = {
      email: parsed.data.notifications.emailUpdates,
      push: parsed.data.notifications.productNews,
    };
  }

  await updateUserById(userId, update);

  return NextResponse.json({ ok: true });
}