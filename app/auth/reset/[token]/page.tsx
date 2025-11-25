"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

export default function ResetPasswordPage() {
  const params = useParams();
  const token = ((params as any)?.token as string) || "";
  const [status, setStatus] = useState<"checking" | "invalid" | "expired" | "used" | "ok">("checking");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function validate() {
      try {
        const res = await fetch(`/api/auth/reset/validate?token=${encodeURIComponent(token)}`);
        if (res.ok) {
          setStatus("ok");
        } else {
          const data = await res.json().catch(() => ({}));
          const reason = data?.reason as string;
          if (reason === "expired") setStatus("expired");
          else if (reason === "used") setStatus("used");
          else setStatus("invalid");
        }
      } catch {
        setStatus("invalid");
      }
    }
    if (token) validate();
  }, [token]);

  function validatePassword(pw: string) {
    return pw.trim().length >= 8 && /(?=.*[0-9!@#$%^&*()_+\-={}\[\]:";'<>?,./])/.test(pw);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!validatePassword(password)) {
      setError("Password must be at least 8 characters and include a number or symbol.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const reason = data?.reason as string;
        if (reason === "invalid") setError("This reset link is invalid.");
        else if (reason === "expired") setError("This reset link has expired. Please request a new one.");
        else if (reason === "used") setError("This reset link has already been used.");
        else setError("Unable to reset password. Please try again.");
      } else {
        router.replace("/auth/login?reset=success");
      }
    } catch {
      setError("Unable to reset password. Please try again.");
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-neutral-50 font-sans text-neutral-900 antialiased">
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur border-b border-neutral-200 shadow-sm" role="banner">
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-neutral-100 to-white shadow ring-1 ring-neutral-100 transition">
              <svg className="h-7 w-7 text-emerald-700" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M3 11c0 4 3 7 9 7s9-3 9-7" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M7 10c1-2 3-3 5-3" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M15 6c1 1 1 3 0 4" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M9 4c.6 0 1.6.7 2 1.4" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </span>
            <span className="font-bold text-2xl tracking-tight text-neutral-800">FoodFindr</span>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-md px-6 py-24 flex flex-col items-center justify-center min-h-[80vh]" role="main">
        <div className="w-full rounded-3xl bg-white/90 backdrop-blur-md p-10 shadow-[0_8px_24px_0_rgba(0,0,0,0.04)] border border-neutral-100">
          {status === "checking" && (
            <div className="text-center text-neutral-700">Validating reset link...</div>
          )}

          {status !== "checking" && status !== "ok" && (
            <div className="text-center flex flex-col gap-2 items-center">
              <svg className="w-8 h-8 text-red-600" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M12 9v4m0 4h.01M10.29 3.86l-7.53 13A2 2 0 004.47 20h15.06a2 2 0 001.71-3.14l-7.53-13a2 2 0 00-3.42 0z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <h1 className="text-2xl font-bold">Reset link not usable</h1>
              <p className="text-neutral-600">
                {status === "expired" && "This link has expired. Please request a new password reset."}
                {status === "used" && "This link has already been used. Please request a new password reset."}
                {status === "invalid" && "This link is invalid. Please request a new password reset."}
              </p>
              <Link href="/auth/forgot" className="text-emerald-700 hover:underline">Request a new reset link</Link>
            </div>
          )}

          {status === "ok" && (
            <form className="grid gap-4" onSubmit={handleSubmit} noValidate>
              <h1 className="text-3xl font-bold mb-2 text-neutral-900 text-center">Set a new password</h1>
              <p className="text-neutral-600 mb-2 text-center">Your new password must be at least 8 characters and include a number or symbol.</p>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-neutral-800 mb-1">New password</label>
                <input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter new password"
                  required
                  className={`w-full rounded-lg border px-4 py-3 text-sm placeholder-neutral-400 focus:outline-none focus:ring-2 transition ${
                    error ? "border-red-300 focus:ring-red-200" : "border-neutral-300 focus:ring-emerald-200"
                  }`}
                />
              </div>
              <div>
                <label htmlFor="confirm" className="block text-sm font-medium text-neutral-800 mb-1">Confirm password</label>
                <input
                  id="confirm"
                  type="password"
                  autoComplete="new-password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Re-enter new password"
                  required
                  className={`w-full rounded-lg border px-4 py-3 text-sm placeholder-neutral-400 focus:outline-none focus:ring-2 transition ${
                    error ? "border-red-300 focus:ring-red-200" : "border-neutral-300 focus:ring-emerald-200"
                  }`}
                />
              </div>
              {error && (
                <p className="text-sm text-red-600" role="alert">{error}</p>
              )}
              <button
                type="submit"
                disabled={loading}
                className="mt-2 rounded-lg bg-emerald-700 px-4 py-3 text-white font-semibold shadow hover:bg-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-200 cursor-pointer"
              >
                {loading ? "Resetting..." : "Reset password"}
              </button>
              <div className="text-sm text-neutral-700 text-center">
                Remembered your password? <Link href="/auth/login" className="text-emerald-700 font-semibold hover:underline">Log in</Link>
              </div>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
