import clientPromise from "./mongodb";

export type LogLevel = "info" | "warn" | "error" | "critical";

export async function logEvent(
  level: LogLevel,
  event: string,
  context?: Record<string, any>
) {
  try {
    const client = await clientPromise;
    const db = client.db();
    const safeContext = redact(context || {});
    await db.collection("app_logs").insertOne({
      level,
      event,
      context: safeContext,
      createdAt: new Date(),
    });
  } catch (e) {
    // Avoid throwing from logger
    console.error("logEvent failed:", e);
  }
}

export async function logSecurityEvent(event: string, context?: Record<string, any>) {
  return logEvent("warn", event, context);
}

function redact(input: Record<string, any>) {
  const clone: Record<string, any> = { ...input };
  for (const k of Object.keys(clone)) {
    const key = k.toLowerCase();
    if (key.includes("password") || key.includes("token") || key.includes("secret")) {
      clone[k] = "[REDACTED]";
    }
  }
  return clone;
}
