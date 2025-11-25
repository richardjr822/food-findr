"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { Balancer } from "react-wrap-balancer";

// --- Data defined outside component for performance and readability ---

// SVGs for Features section
const IconLeaf = () => (
  <svg
    className="w-6 h-6 text-emerald-700"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 21a9 9 0 100-18 9 9 0 000 18z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 21a9 9 0 01-9-9 10.4 10.4 0 011.62-5.093m14.76 0A10.4 10.4 0 0112 21a9 9 0 01-9-9M3.75 12a10.4 10.4 0 015.093-8.38M12 3a10.4 10.4 0 018.38 5.093"
    />
  </svg>
);

const IconBolt = () => (
  <svg
    className="w-6 h-6 text-emerald-700"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M3.75 13.5l10.5-11.25L12 10.5h5.25L9.75 20.25l1.5-6.75H6l-2.25 3z"
    />
  </svg>
);

const IconHeart = () => (
  <svg
    className="w-6 h-6 text-emerald-700"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M21 8.25c0-2.485-2.015-4.5-4.5-4.5S12 5.765 12 5.765c0 0-2.015-2.265-4.5-2.265S3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
    />
  </svg>
);

const IconBookmark = () => (
  <svg
    className="w-6 h-6 text-emerald-700"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.5 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0111.186 0z"
    />
  </svg>
);

// "How it works" data
const howItWorksSteps = [
  {
    icon: (
      <span className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-emerald-100 text-emerald-700 text-xl font-bold shadow-md" aria-hidden="true">
        1
      </span>
    ),
    title: "Start with what's on hand",
    desc: "Type, select, or scan items from your pantry.",
    color: "from-emerald-50/30 to-white",
  },
  {
    icon: (
      <span className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-emerald-100 text-emerald-700 text-xl font-bold shadow-md" aria-hidden="true">
        2
      </span>
    ),
    title: "Filter by diet & time",
    desc: "Customize by dietary needs, cooking time, and serving size.",
    color: "from-emerald-50/30 to-white",
  },
  {
    icon: (
      <span className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-emerald-100 text-emerald-700 text-xl font-bold shadow-md" aria-hidden="true">
        3
      </span>
    ),
    title: "Discover your next favorite meal",
    desc: "Get step-by-step instructions and save your favorites.",
    color: "from-emerald-50/30 to-white",
  },
];

// "Features" data
const featuresList = [
  {
    icon: <IconLeaf />,
    title: "Reduce waste",
    desc: "Make the most of your pantry.",
    bg: "bg-gradient-to-br from-emerald-50 to-white",
  },
  {
    icon: <IconBolt />,
    title: "Save time",
    desc: "Fast, personalized ideas.",
    bg: "bg-gradient-to-br from-amber-50 to-white",
  },
  {
    icon: <IconHeart />,
    title: "Healthy options",
    desc: "Diet filters included.",
    bg: "bg-gradient-to-br from-rose-50 to-white",
  },
  {
    icon: <IconBookmark />,
    title: "Save favorites",
    desc: "Keep go-to recipes.",
    bg: "bg-gradient-to-br from-blue-50 to-white",
  },
];

export default function Home() {
  const [scrollY, setScrollY] = useState(0);

  // Throttled scroll listener using requestAnimationFrame
  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setScrollY(window.scrollY);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 via-white to-neutral-50 font-sans text-neutral-900 antialiased">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-neutral-200/50 shadow-sm" role="banner">
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group focus:outline-none focus:ring-2 focus:ring-emerald-200 rounded-md" aria-label="Go to homepage">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-50 to-emerald-100 shadow-md ring-1 ring-emerald-100 transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg">
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
              className="hidden sm:inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-emerald-100 transition-all duration-200 hover:-translate-y-0.5"
            >
              Log in
            </Link>
            <Link
              href="/auth/signup"
              className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-emerald-600 to-emerald-700 px-5 py-2 text-sm text-white font-semibold shadow-md hover:shadow-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-200 hover:-translate-y-0.5"
            >
              Start for free
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-16 sm:py-24" role="main">
        {/* Hero Section */}
        <section className="relative grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center mb-24 sm:mb-32" aria-labelledby="hero-heading">
          <div className="space-y-7 z-10">
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700 ring-1 ring-emerald-100">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              AI-Powered Recipe Generator
            </div>
            <h1 id="hero-heading" className="text-5xl sm:text-6xl lg:text-7xl font-extrabold leading-tight tracking-tight text-neutral-900">
              <Balancer>Effortless home cooking.</Balancer>
            </h1>
            <p className="text-neutral-600 text-lg sm:text-xl max-w-xl leading-relaxed">
              <Balancer>
                FoodFindr reveals tasty dishes from what's already in your kitchen. Discover AI-powered recipes for any mood or season.
              </Balancer>
            </p>
            <div className="flex flex-col sm:flex-row gap-4 pt-2">
              <Link
                href="/try"
                className="group inline-flex items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 px-8 py-4 text-white font-bold shadow-lg hover:shadow-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-200 hover:-translate-y-1"
                aria-label="Generate a recipe"
              >
                <svg className="w-5 h-5 text-amber-300 group-hover:rotate-90 transition-transform duration-300" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M12 5v14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M5 12h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Generate a recipe
              </Link>
              <Link
                href="/auth/signup"
                className="inline-flex items-center justify-center rounded-xl border-2 border-neutral-200 px-8 py-4 text-neutral-800 bg-white hover:bg-neutral-50 font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-neutral-200 hover:-translate-y-1 hover:border-neutral-300"
                aria-label="Start for free"
              >
                Start for free
              </Link>
            </div>
          </div>
          
          {/* Parallax Hero Image */}
          <div className="relative w-full h-[400px] sm:h-[500px] lg:h-[550px] overflow-hidden rounded-3xl shadow-2xl ring-1 ring-neutral-200">
            <Image
              priority={true}
              fill={true}
              src="https://images.unsplash.com/photo-1569718212165-3a8278d5f624?ixlib=rb-4.1.0&auto=format&fit=crop&q=80&w=2080"
              alt="A healthy, beautifully plated meal with salmon and vegetables"
              className="object-cover transition-transform duration-75"
              style={{
                transform: `translateY(${scrollY * 0.3}px) scale(1.1)`,
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-neutral-900/30 via-transparent to-transparent" />
          </div>
        </section>

        {/* How it Works Section */}
        <section className="py-16 sm:py-24" aria-labelledby="how-it-works-heading">
          <div className="text-center mb-12">
            <h2 id="how-it-works-heading" className="text-3xl sm:text-4xl font-bold text-neutral-900 tracking-tight mb-3">
              How it works
            </h2>
            <p className="text-neutral-600 text-lg max-w-2xl mx-auto">
              Three simple steps to discover your next favorite meal
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {howItWorksSteps.map((step, i) => (
              <div
                key={i}
                className={`relative flex flex-col items-start bg-gradient-to-br ${step.color} rounded-3xl shadow-md border border-neutral-100 p-8 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl group`}
              >
                <div className="mb-5 group-hover:scale-110 transition-transform duration-300">
                  {step.icon}
                </div>
                <h3 className="text-xl font-bold text-neutral-900 mb-2">{step.title}</h3>
                <p className="text-base text-neutral-600 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 sm:py-24" aria-labelledby="features-heading">
          <div className="text-center mb-12">
            <h2 id="features-heading" className="text-3xl sm:text-4xl font-bold text-neutral-900 tracking-tight mb-3">
              Designed for everyday cooks
            </h2>
            <p className="text-neutral-600 text-lg max-w-2xl mx-auto">
              Small details that make a big difference in your kitchen every day
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {featuresList.map((f) => (
              <div
                key={f.title}
                className={`flex flex-col items-center rounded-3xl ${f.bg} p-8 shadow-md border border-neutral-100 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl group`}
              >
                <div className="h-14 w-14 flex items-center justify-center rounded-2xl mb-4 bg-white shadow-md group-hover:scale-110 transition-transform duration-300" aria-hidden="true">
                  {f.icon}
                </div>
                <h3 className="font-bold text-lg text-neutral-900 mb-2">{f.title}</h3>
                <p className="text-sm text-neutral-600 text-center leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 sm:py-24 text-center" aria-labelledby="cta-heading">
          <div className="max-w-3xl mx-auto space-y-6">
            <h2 id="cta-heading" className="text-3xl sm:text-4xl font-bold text-neutral-900 tracking-tight">
              <Balancer>Ready to transform your cooking?</Balancer>
            </h2>
            <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
              Join thousands of home cooks discovering delicious recipes every day
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-4 justify-center pt-4">
              <Link
                href="/auth/signup"
                className="rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 px-10 py-5 text-white font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-200 hover:-translate-y-1"
              >
                Start for free
              </Link>
              <Link
                href="/try"
                className="rounded-xl border-2 border-neutral-200 px-10 py-5 text-neutral-800 bg-white text-lg font-semibold hover:bg-neutral-50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-neutral-200 hover:-translate-y-1 hover:border-neutral-300"
              >
                Try generator
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer - Full Width */}
      <footer className="border-t border-neutral-200 bg-gradient-to-b from-white to-neutral-50 w-full" role="contentinfo">
        <div className="mx-auto max-w-6xl px-6 py-12 flex flex-col md:flex-row items-center justify-between gap-8 text-neutral-700">
          {/* Brand/Tagline */}
          <div className="flex flex-col gap-3 items-start w-full md:w-auto">
            <div className="flex items-center gap-2">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100 shadow-sm">
                <svg className="h-6 w-6 text-emerald-700" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M3 11c0 4 3 7 9 7s9-3 9-7" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M7 10c1-2 3-3 5-3" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M15 6c1 1 1 3 0 4" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M9 4c.6 0 1.6.7 2 1.4" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
              <span className="text-2xl font-bold tracking-tight text-neutral-900">FoodFindr</span>
            </div>
            <p className="text-sm text-neutral-600 max-w-xs leading-relaxed">
              Smarter, more sustainable home cooking powered by AI. Discover inspiration with every ingredient.
            </p>
            <span className="mt-1 text-xs text-neutral-500">
              © {new Date().getFullYear()} FoodFindr. All rights reserved.
            </span>
          </div>
          {/* Social Icons */}
          <div className="flex gap-3 items-center w-full md:w-auto justify-start md:justify-end">
            <a href="#" aria-label="Twitter" className="group p-3 rounded-xl bg-neutral-100 hover:bg-emerald-50 transition-all duration-200 hover:-translate-y-0.5">
              <svg className="w-5 h-5 text-neutral-500 group-hover:text-emerald-700 transition-colors" fill="currentColor" viewBox="0 0 24 24">
                <path d="M22 5.95a8.19 8.19 0 0 1-2.36.65A4.13 4.13 0 0 0 21.4 4.1a8.28 8.28 0 0 1-2.6 1A4.13 4.13 0 0 0 12 8.03c0 .32.04.64.1.94-3.44-.17-6.48-1.82-8.52-4.33A4.11 4.11 0 0 0 2.8 6.2a4.19 4.19 0 0 0 1.83 3.44A4 4 0 0 1 2 9.14v.05a4.13 4.13 0 0 0 3.32 4.05c-.2.06-.41.09-.63.09-.16 0-.31-.01-.47-.04.32 1 1.23 1.78 2.3 1.8A8.33 8.33 0 0 1 2 19.13a11.76 11.76 0 0 0 6.29 1.84c7.54 0 11.67-6.25 11.67-11.67v-.53c.8-.57 1.5-1.3 2.04-2.12Z" />
              </svg>
            </a>
            <a href="#" aria-label="Instagram" className="group p-3 rounded-xl bg-neutral-100 hover:bg-emerald-50 transition-all duration-200 hover:-translate-y-0.5">
              <svg className="w-5 h-5 text-neutral-500 group-hover:text-emerald-700 transition-colors" fill="currentColor" viewBox="0 0 24 24">
                <path d="M7 2C4.243 2 2 4.243 2 7v10c0 2.757 2.243 5 5 5h10c2.757 0 5-2.243 5-5V7c0-2.757-2.243-5-5-5zm10 2c1.654 0 3 1.346 3 3v10c0 1.654-1.346 3-3 3H7c-1.654 0-3-1.346-3-3V7c0-1.654 1.346-3 3-3zm-5 3a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm0 2a3 3 0 1 1 0 6 3 3 0 0 1 0-6zm6.5 1.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z"/>
              </svg>
            </a>
            <a href="#" aria-label="GitHub" className="group p-3 rounded-xl bg-neutral-100 hover:bg-emerald-50 transition-all duration-200 hover:-translate-y-0.5">
              <svg className="w-5 h-5 text-neutral-500 group-hover:text-emerald-700 transition-colors" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" d="M12 2C6.48 2 2 6.48 2 12c0 4.42 2.87 8.17 6.84 9.5.5.09.66-.22.66-.48v-1.68c-2.78.6-3.37-1.16-3.37-1.16-.45-1.14-1.1-1.44-1.1-1.44-.9-.62.07-.61.07-.61 1 0 1.53 1 1.53 1 .89 1.53 2.34 1.09 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.56-1.11-4.56-4.95 0-1.09.38-1.99 1-2.69-.1-.25-.43-1.28.1-2.67 0 0 .82-.26 2.7 1A9.47 9.47 0 0112 6.87c.83.004 1.66.11 2.44.32 1.88-1.25 2.7-1 2.7-1 .53 1.39.2 2.42.1 2.67.62.7 1 1.6 1 2.69 0 3.85-2.34 4.7-4.57 4.94.35.3.67.91.67 1.84v2.71c0 .27.16.58.67.48A10.01 10.01 0 0022 12c0-5.52-4.48-10-10-10z" clipRule="evenodd"/>
              </svg>
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}