"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [emailError, setEmailError] = useState("");
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuOpen(false);
    }
    if (menuOpen) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  useEffect(() => {
    if (sent) {
      const t = setTimeout(() => setSent(false), 3500);
      return () => clearTimeout(t);
    }
  }, [sent]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setEmailError("");
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError("Please enter a valid email address.");
      return;
    }
    setLoading(true);
    try {
      await new Promise((r) => setTimeout(r, 900));
      setSent(true);
      setEmail("");
    } catch (error) {
      setEmailError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-neutral-50 font-sans text-neutral-900 antialiased">
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur border-b border-neutral-200 shadow-sm" role="banner">
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group focus:outline-none focus:ring-2 focus:ring-emerald-200 rounded-md" aria-label="Go to homepage">
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
          <nav className="flex items-center gap-3" role="navigation" aria-label="Main navigation">
            <Link
              href="/auth/login"
              className="hidden sm:inline-flex items-center justify-center rounded-md px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-emerald-100 transition"
            >
              Log in
            </Link>
            <Link
              href="/auth/signup"
              className="inline-flex items-center justify-center rounded-full bg-emerald-700 px-5 py-2 text-sm text-white font-semibold shadow hover:bg-emerald-800 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-200"
            >
              Start for free
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-24" role="main">
        {/* Hero */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center" aria-labelledby="hero-heading">
          <div className="space-y-7">
            <h1 id="hero-heading" className="text-5xl sm:text-6xl font-extrabold leading-tight tracking-tight text-neutral-900">
              Effortless home cooking.
            </h1>
            <p className="text-neutral-700 text-xl max-w-xl">
              FoodFindr reveals tasty dishes from what’s already in your kitchen. Discover AI-powered recipes for any mood or season.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/generate"
                className="inline-flex items-center gap-3 rounded-lg bg-emerald-700 px-8 py-4 text-white font-bold shadow-lg hover:bg-emerald-800 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-200"
                aria-label="Generate a recipe"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M12 5v14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M5 12h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Generate a recipe
              </Link>
              <Link
                href="/signup"
                className="inline-flex items-center justify-center rounded-lg border border-neutral-200 px-8 py-4 text-neutral-800 bg-white hover:bg-neutral-100 transition-colors focus:outline-none focus:ring-2 focus:ring-neutral-200"
                aria-label="Start for free"
              >
                Start for free
              </Link>
            </div>
          </div>
          <aside className="mx-auto w-full max-w-md" aria-labelledby="signup-heading">
            <div className="rounded-3xl bg-white/90 backdrop-blur-md p-10 shadow-[0_8px_24px_0_rgba(0,0,0,0.04)] border border-neutral-100">
              <div className="flex items-center gap-4 mb-6">
                <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-gradient-to-br from-neutral-100 to-white text-emerald-700 shadow-inner">
                  <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M12 3c3 0 5 1.5 6 3-1 0-2 0-3 1-1 1-2 1.5-3 2-1-.5-2-1-3-2-1-1-2-1-3-1 1-1.5 3-3 6-3z" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M4 12c0 4 3 7 8 7s8-3 8-7" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div>
                  <h3 id="signup-heading" className="text-xl font-semibold text-neutral-900">Get started</h3>
                  <p className="text-sm text-neutral-600">Sign up to unlock smarter home cooking.</p>
                </div>
              </div>
              <form className="grid gap-4" onSubmit={handleSubmit} aria-label="Signup form" noValidate>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-neutral-800 mb-1">
                    Email address
                  </label>
                  <input
                    id="email"
                    type="email"
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
                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 rounded-lg bg-emerald-700 px-4 py-3 text-white font-semibold shadow hover:bg-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-200"
                    aria-describedby={loading ? "loading-status" : undefined}
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"></circle>
                          <path fill="currentColor" className="opacity-75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span id="loading-status">Starting...</span>
                      </span>
                    ) : (
                      "Start for free"
                    )}
                  </button>
                  <Link
                    href="/auth/login"
                    className="flex-1 rounded-lg border border-neutral-200 px-4 py-3 text-neutral-800 bg-white hover:bg-neutral-100 transition-colors text-center font-medium focus:outline-none focus:ring-2 focus:ring-neutral-200"
                    aria-label="Log in to your account"
                  >
                    Log in
                  </Link>
                </div>
              </form>
              <div className="mt-4 text-xs text-neutral-600 text-center">
                By continuing, you agree to our{" "}
                <a className="underline hover:text-neutral-800 transition-colors focus:outline-none focus:ring-2 focus:ring-neutral-200" href="/terms" target="_blank" rel="noopener noreferrer">
                  Terms of Service
                </a>{" "}
                and{" "}
                <a className="underline hover:text-neutral-800 transition-colors focus:outline-none focus:ring-2 focus:ring-neutral-200" href="/privacy" target="_blank" rel="noopener noreferrer">
                  Privacy Policy
                </a>
                .
              </div>
              {sent && (
                <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-2 text-sm text-emerald-800 shadow-sm border border-emerald-100" role="status" aria-live="polite">
                  <svg className="w-4 h-4 text-emerald-700" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M5 12.5l4 4L19 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Invitation sent — check your inbox!
                </div>
              )}
            </div>
            <div className="mt-6 text-sm text-neutral-700 text-center">
              <h4 className="font-semibold">Why FoodFindr?</h4>
              <p className="mt-2">AI-first suggestions, mindful of ingredients and time — designed to reduce waste and make cooking joyful.</p>
            </div>
          </aside>
        </section>

        {/* How it works */}
        <section className="mt-20" aria-labelledby="how-it-works-heading">
          <h2 id="how-it-works-heading" className="text-4xl font-bold mb-10 text-center text-neutral-900 tracking-tight">
            How it works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              {
                icon: (
                  <span className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-neutral-100 text-emerald-700 text-xl font-bold shadow" aria-hidden="true">
                    1
                  </span>
                ),
                title: "Add ingredients",
                desc: "Type, select, or scan items from your pantry.",
                color: "from-neutral-50 to-white",
              },
              {
                icon: (
                  <span className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-neutral-100 text-emerald-700 text-xl font-bold shadow" aria-hidden="true">
                    2
                  </span>
                ),
                title: "Refine preferences",
                desc: "Filter by diet, time, and serving size.",
                color: "from-neutral-50 to-white",
              },
              {
                icon: (
                  <span className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-neutral-100 text-emerald-700 text-xl font-bold shadow" aria-hidden="true">
                    3
                  </span>
                ),
                title: "Get recipes",
                desc: "Receive step-by-step instructions and save favorites.",
                color: "from-neutral-50 to-white",
              },
            ].map((step, i) => (
              <div
                key={i}
                className={`flex flex-col items-center bg-gradient-to-b ${step.color} rounded-2xl shadow border border-neutral-100 p-8`}
              >
                {step.icon}
                <h3 className="mt-4 text-lg font-semibold text-neutral-900">{step.title}</h3>
                <p className="mt-2 text-base text-neutral-700 text-center">{step.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Features */}
        <section className="mt-20" aria-labelledby="features-heading">
          <h2 id="features-heading" className="text-4xl font-bold text-center text-neutral-900 tracking-tight mb-2">
            Designed for everyday cooks
          </h2>
          <p className="mb-10 text-neutral-700 max-w-2xl text-lg text-center mx-auto">
            Small details that make a big difference in your kitchen every day.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {[
              {
                icon: "🌱",
                title: "Reduce waste",
                desc: "Make the most of your pantry.",
                bg: "bg-neutral-50",
              },
              {
                icon: "⚡",
                title: "Save time",
                desc: "Fast, personalized ideas.",
                bg: "bg-neutral-100",
              },
              {
                icon: "🥗",
                title: "Healthy options",
                desc: "Diet filters included.",
                bg: "bg-neutral-50",
              },
              {
                icon: "💾",
                title: "Save favorites",
                desc: "Keep go-to recipes.",
                bg: "bg-neutral-100",
              },
            ].map((f, i) => (
              <div
                key={f.title}
                className={`flex flex-col items-center rounded-2xl ${f.bg} p-8 shadow border border-neutral-100`}
              >
                <div className="h-12 w-12 flex items-center justify-center rounded-full text-2xl mb-3 bg-white shadow" aria-hidden="true">{f.icon}</div>
                <h3 className="font-bold text-lg text-neutral-900 mb-1">{f.title}</h3>
                <p className="text-base text-neutral-700 text-center">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="mt-32 flex flex-col sm:flex-row items-center gap-4 justify-center" aria-labelledby="cta-heading">
          <h2 id="cta-heading" className="sr-only">Call to Action</h2>
          <Link
            href="/signup"
            className="rounded-lg bg-emerald-700 px-10 py-5 text-white font-bold text-lg shadow-lg hover:bg-emerald-800 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-200"
          >
            Start for free
          </Link>
          <Link
            href="/generate"
            className="rounded-lg border border-neutral-200 px-10 py-5 text-neutral-800 bg-white text-lg font-semibold hover:bg-neutral-100 transition-colors focus:outline-none focus:ring-2 focus:ring-neutral-200"
          >
            Try generator
          </Link>
        </section>

        <footer className="border-t border-neutral-200 bg-white/95 mt-32 w-full" role="contentinfo">
          <div className="w-full">
            <div className="mx-auto max-w-6xl px-6 py-12 grid grid-cols-1 sm:grid-cols-3 gap-10 text-neutral-700">
            {/* Brand/Tagline */}
            <div className="flex flex-col gap-2">
              <span className="text-2xl font-bold tracking-tight text-neutral-900">FoodFindr</span>
              <p className="text-sm text-neutral-500 max-w-xs">Smarter, more sustainable home cooking powered by AI. Discover inspiration with every ingredient.</p>
              <span className="mt-2 text-xs text-neutral-400">© {new Date().getFullYear()} FoodFindr. All rights reserved.</span>
            </div>
            {/* Navigation Links */}
            <nav className="flex flex-col sm:items-center gap-2 text-sm font-medium">
              <a className="hover:text-emerald-700 transition-colors" href="/">Home</a>
              <a className="hover:text-emerald-700 transition-colors" href="/generate">Generator</a>
              <a className="hover:text-emerald-700 transition-colors" href="/auth/signup">Sign Up</a>
              <a className="hover:text-emerald-700 transition-colors" href="/auth/login">Login</a>
              <a className="hover:text-emerald-700 transition-colors" href="/terms">Terms</a>
              <a className="hover:text-emerald-700 transition-colors" href="/privacy">Privacy</a>
            </nav>
            {/* Social Icons */}
            <div className="flex flex-col sm:items-end gap-3">
              <span className="font-semibold text-sm mb-1">Follow us</span>
              <div className="flex gap-4">
                <a href="#" aria-label="Twitter" className="group p-2 rounded-full hover:bg-emerald-50 transition-colors"><svg className="w-5 h-5 text-neutral-400 group-hover:text-emerald-700" fill="currentColor" viewBox="0 0 24 24"><path d="M22 5.95a8.19 8.19 0 0 1-2.36.65A4.13 4.13 0 0 0 21.4 4.1a8.28 8.28 0 0 1-2.6 1A4.13 4.13 0 0 0 12 8.03c0 .32.04.64.1.94-3.44-.17-6.48-1.82-8.52-4.33A4.11 4.11 0 0 0 2.8 6.2a4.19 4.19 0 0 0 1.83 3.44A4 4 0 0 1 2 9.14v.05a4.13 4.13 0 0 0 3.32 4.05c-.2.06-.41.09-.63.09-.16 0-.31-.01-.47-.04.32 1 1.23 1.78 2.3 1.8A8.33 8.33 0 0 1 2 19.13a11.76 11.76 0 0 0 6.29 1.84c7.54 0 11.67-6.25 11.67-11.67v-.53c.8-.57 1.5-1.3 2.04-2.12Z" /></svg></a>
                <a href="#" aria-label="Instagram" className="group p-2 rounded-full hover:bg-emerald-50 transition-colors"><svg className="w-5 h-5 text-neutral-400 group-hover:text-emerald-700" fill="currentColor" viewBox="0 0 24 24"><path d="M7 2C4.243 2 2 4.243 2 7v10c0 2.757 2.243 5 5 5h10c2.757 0 5-2.243 5-5V7c0-2.757-2.243-5-5-5zm10 2c1.654 0 3 1.346 3 3v10c0 1.654-1.346 3-3 3H7c-1.654 0-3-1.346-3-3V7c0-1.654 1.346-3 3-3zm-5 3a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm0 2a3 3 0 1 1 0 6 3 3 0 0 1 0-6zm6.5 1.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z"/></svg></a>
                <a href="#" aria-label="GitHub" className="group p-2 rounded-full hover:bg-emerald-50 transition-colors"><svg className="w-5 h-5 text-neutral-400 group-hover:text-emerald-700" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" d="M12 2C6.48 2 2 6.48 2 12c0 4.42 2.87 8.17 6.84 9.5.5.09.66-.22.66-.48v-1.68c-2.78.6-3.37-1.16-3.37-1.16-.45-1.14-1.1-1.44-1.1-1.44-.9-.62.07-.61.07-.61 1 0 1.53 1 1.53 1 .89 1.53 2.34 1.09 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.56-1.11-4.56-4.95 0-1.09.38-1.99 1-2.69-.1-.25-.43-1.28.1-2.67 0 0 .82-.26 2.7 1A9.47 9.47 0 0112 6.87c.83.004 1.66.11 2.44.32 1.88-1.25 2.7-1 2.7-1 .53 1.39.2 2.42.1 2.67.62.7 1 1.6 1 2.69 0 3.85-2.34 4.7-4.57 4.94.35.3.67.91.67 1.84v2.71c0 .27.16.58.67.48A10.01 10.01 0 0022 12c0-5.52-4.48-10-10-10z" clipRule="evenodd"/></svg></a>
              </div>
              <span className="text-xs text-neutral-400 mt-3">Let's connect!</span>
            </div>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
