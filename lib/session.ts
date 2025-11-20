import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export type AuthUser = {
  userId: string;
  email: string;
};

/**
 * Returns the authenticated user's id and email from the server session, or null if unauthenticated.
 */
export async function getAuthenticatedUser(): Promise<AuthUser | null> {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id as string | undefined;
  const email = session?.user?.email as string | undefined;
  if (!session || !userId || !email) return null;
  return { userId, email };
}

/**
 * Get userId or throw an error object you can map to 401 in your route.
 */
export async function getUserId(): Promise<string> {
  const user = await getAuthenticatedUser();
  if (!user) {
    throw Object.assign(new Error("Unauthorized"), { status: 401 });
  }
  return user.userId;
}

/**
 * Ensure auth or return a NextResponse 401 directly for convenience.
 * Usage:
 *   const auth = await requireUser();
 *   if (auth instanceof NextResponse) return auth; // 401
 *   const { userId, email } = auth;
 */
export async function requireUser(): Promise<AuthUser | NextResponse> {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return user;
}
