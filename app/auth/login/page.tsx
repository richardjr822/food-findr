"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setEmailError("");
    setPasswordError("");
    let valid = true;
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError("Please enter a valid email address.");
      valid = false;
    }
    if (!password) {
      setPasswordError("Please enter your password.");
      valid = false;
    }
    if (!valid) return;
    setLoading(true);
    try {
      // Use NextAuth signIn for credentials with redirect: false
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      if (res?.error) {
        // Show the real error message from NextAuth if available
        setEmailError(res.error);
        setLoading(false);
        return;
      }
      if (res?.ok) {
        setSent(true);
        setEmail("");
        setPassword("");
        setTimeout(() => {
          router.push("/dashboard");
        }, 1200);
      } else {
        setEmailError("Login failed. Please try again.");
      }
    } catch {
      setEmailError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleGoogleLogin() {
    signIn("google", { callbackUrl: "/dashboard" });
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
            <Link
              href="/auth/login"
              passHref
              legacyBehavior
            >
              <a className="hidden sm:inline-flex items-center justify-center rounded-md px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-emerald-100 transition cursor-pointer">
                Log in
              </a>
            </Link>
            <Link
              href="/auth/signup"
              passHref
              legacyBehavior
            >
              <a className="inline-flex items-center justify-center rounded-full bg-emerald-700 px-5 py-2 text-sm text-white font-semibold shadow hover:bg-emerald-800 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-200 cursor-pointer">
                Start for free
              </a>
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-md px-6 py-24 flex flex-col items-center justify-center min-h-[80vh]" role="main">
        <div className="w-full rounded-3xl bg-white/90 backdrop-blur-md p-10 shadow-[0_8px_24px_0_rgba(0,0,0,0.04)] border border-neutral-100">
          <h1 className="text-3xl font-bold mb-2 text-neutral-900 text-center">Log in to FoodFindr</h1>
          <p className="text-neutral-600 mb-6 text-center">Welcome back! Sign in to your account.</p>
          <form className="grid gap-4" onSubmit={handleSubmit} aria-label="Login form" noValidate>
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
                aria-describedby={emailError ? "email-error" : undefined}
                className={`w-full rounded-lg border px-4 py-3 text-sm placeholder-neutral-400 focus:outline-none focus:ring-2 transition ${
                  emailError ? "border-red-300 focus:ring-red-200" : "border-neutral-300 focus:ring-emerald-200"
                }`}
              />
              {emailError && (
                <p id="email-error" className="mt-1 text-sm text-red-600" role="alert">
                  {emailError}
                </p>
              )}
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-neutral-800 mb-1">
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                aria-describedby={passwordError ? "password-error" : undefined}
                className={`w-full rounded-lg border px-4 py-3 text-sm placeholder-neutral-400 focus:outline-none focus:ring-2 transition ${
                  passwordError ? "border-red-300 focus:ring-red-200" : "border-neutral-300 focus:ring-emerald-200"
                }`}
              />
              {passwordError && (
                <p id="password-error" className="mt-1 text-sm text-red-600" role="alert">
                  {passwordError}
                </p>
              )}
            </div>
            <div className="flex items-center justify-between">
              <Link href="/forgot" className="text-sm text-emerald-700 hover:underline">
                Forgot password?
              </Link>
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
                  Logging in...
                </span>
              ) : (
                "Log in"
              )}
            </button>
            {/* Google Auth Button */}
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-neutral-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white px-2 text-neutral-400">or</span>
              </div>
            </div>
            <button
              type="button"
              className="w-full flex items-center justify-center gap-3 rounded-lg border border-neutral-200 bg-white px-4 py-3 text-sm font-semibold text-neutral-700 shadow hover:bg-neutral-50 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-200 cursor-pointer"
              onClick={handleGoogleLogin}
            >
              <svg className="w-5 h-5" viewBox="0 0 48 48" aria-hidden="true">
                <g>
                  <path fill="#4285F4" d="M24 9.5c3.54 0 6.36 1.53 7.82 2.81l5.77-5.77C33.64 3.36 29.2 1.5 24 1.5 14.82 1.5 6.98 7.36 3.69 15.09l6.89 5.35C12.06 14.36 17.56 9.5 24 9.5z"/>
                  <path fill="#34A853" d="M46.1 24.5c0-1.64-.15-3.22-.43-4.74H24v9.01h12.43c-.54 2.9-2.18 5.36-4.65 7.01l7.19 5.6C43.98 37.64 46.1 31.54 46.1 24.5z"/>
                  <path fill="#FBBC05" d="M10.58 28.44A14.48 14.48 0 009.5 24c0-1.54.27-3.03.76-4.44l-6.89-5.35A23.93 23.93 0 000 24c0 3.77.9 7.34 2.5 10.44l8.08-6z"/>
                  <path fill="#EA4335" d="M24 46.5c6.48 0 11.92-2.14 15.89-5.83l-7.19-5.6c-2.01 1.35-4.59 2.13-8.7 2.13-6.44 0-11.94-4.86-13.42-11.44l-8.08 6C6.98 40.64 14.82 46.5 24 46.5z"/>
                  <path fill="none" d="M0 0h48v48H0z"/>
                </g>
              </svg>
              Continue with Google
            </button>
          </form>
          {sent && (
            <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-2 text-sm text-emerald-800 shadow-sm border border-emerald-100" role="status" aria-live="polite">
              <svg className="w-4 h-4 text-emerald-700" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M5 12.5l4 4L19 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Login successful!
            </div>
          )}
          <div className="mt-6 text-sm text-neutral-700 text-center">
            Don&apos;t have an account?{" "}
            <Link href="/auth/signup" className="text-emerald-700 font-semibold hover:underline">
              Sign up
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}