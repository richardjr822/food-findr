"use client";

import Link from "next/link";
import { useState } from "react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) === false) {
      setError("Please enter a valid email address.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        // We still show generic success to prevent user enumeration
        setSent(true);
      } else {
        setSent(true);
      }
    } catch {
      setSent(true);
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-neutral-50 font-sans text-neutral-900 antialiased">
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur border-b border-neutral-200 shadow-sm" role="banner">
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <Link href="/" passHref legacyBehavior>
            <a className="flex items-center gap-3 group focus:outline-none focus:ring-2 focus:ring-emerald-200 rounded-md" aria-label="Go to homepage">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-neutral-100 to-white shadow ring-1 ring-neutral-100 transition">
                <svg className="h-7 w-7 text-emerald-700" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M3 11c0 4 3 7 9 7s9-3 9-7" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M7 10c1-2 3-3 5-3" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M15 6c1 1 1 3 0 4" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M9 4c.6 0 1.6.7 2 1.4" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
              <span className="font-bold text-2xl tracking-tight text-neutral-800">FoodFindr</span>
            </a>
          </Link>
          <nav className="flex items-center gap-3" role="navigation" aria-label="Main navigation">
            <Link href="/auth/login" className="text-sm text-neutral-700 hover:underline">Log in</Link>
            <Link href="/auth/signup" className="inline-flex items-center justify-center rounded-full bg-emerald-700 px-5 py-2 text-sm text-white font-semibold shadow hover:bg-emerald-800 transition-colors">Start for free</Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-md px-6 py-24 flex flex-col items-center justify-center min-h-[80vh]" role="main">
        <div className="w-full rounded-3xl bg-white/90 backdrop-blur-md p-10 shadow-[0_8px_24px_0_rgba(0,0,0,0.04)] border border-neutral-100">
          <h1 className="text-3xl font-bold mb-2 text-neutral-900 text-center">Forgot password</h1>
          <p className="text-neutral-600 mb-6 text-center">Enter the email associated with your account and we'll send you a reset link.</p>
          {!sent ? (
            <form className="grid gap-4" onSubmit={handleSubmit} noValidate>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-neutral-800 mb-1">
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  className={`w-full rounded-lg border px-4 py-3 text-sm placeholder-neutral-400 focus:outline-none focus:ring-2 transition ${
                    error ? "border-red-300 focus:ring-red-200" : "border-neutral-300 focus:ring-emerald-200"
                  }`}
                />
                {error && (
                  <p className="mt-1 text-sm text-red-600" role="alert">
                    {error}
                  </p>
                )}
              </div>
              <button
                type="submit"
                disabled={loading}
                className="mt-2 rounded-lg bg-emerald-700 px-4 py-3 text-white font-semibold shadow hover:bg-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-200 cursor-pointer"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"></circle>
                      <path fill="currentColor" className="opacity-75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Sending reset link...
                  </span>
                ) : (
                  "Send reset link"
                )}
              </button>
              <div className="text-sm text-neutral-700 text-center">
                Remembered your password? <Link href="/auth/login" className="text-emerald-700 font-semibold hover:underline">Log in</Link>
              </div>
            </form>
          ) : (
            <div className="flex flex-col items-center text-center gap-2">
              <svg className="w-8 h-8 text-emerald-700" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M5 12.5l4 4L19 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <p className="text-neutral-700">If an account exists for <span className="font-semibold">{email}</span>, you'll receive a password reset link shortly.</p>
              <p className="text-neutral-500 text-sm">Didn't get an email? Check your spam folder.</p>
              <div className="mt-2">
                <Link href="/auth/login" className="text-sm text-emerald-700 hover:underline">Back to login</Link>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}