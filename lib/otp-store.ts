import clientPromise from "./mongodb";

/**
 * Store OTP for an email (upsert).
 */
export async function storeOtp(email: string, code: string) {
  const client = await clientPromise;
  const db = client.db();
  await db.collection("otps").updateOne(
    { email },
    { $set: { code, expires: Date.now() + 10 * 60 * 1000 } },
    { upsert: true }
  );
}

/**
 * Verify OTP for an email.
 * Throws error if not found, expired, or invalid.
 */
export async function verifyOtp(email: string, code: string) {
  const client = await clientPromise;
  const db = client.db();
  const otpEntry = await db.collection("otps").findOne({ email });
  if (!otpEntry) throw new Error("No OTP found for this email");
  if (otpEntry.code !== code) throw new Error("Invalid confirmation code.");
  if (Date.now() > otpEntry.expires) throw new Error("OTP code has expired");
  await db.collection("otps").deleteOne({ email });
}