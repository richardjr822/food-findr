"use client";

import { useState, useEffect } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

export default function SignInPage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = (searchParams?.get("callbackUrl") as string) || "/dashboard";
  const { status } = useSession();

  useEffect(() => {
    if (status === "authenticated") {
      router.replace(callbackUrl);
    }
  }, [status, router, callbackUrl]);

  async function handleGoogleSignIn() {
    setLoading(true);
    // Redirects to Google OAuth, then back to your app
    await signIn("google", { callbackUrl });
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-neutral-50">
      <div className="w-full max-w-md bg-white rounded-xl shadow p-8 flex flex-col gap-6">
        <h1 className="text-2xl font-bold text-center">Sign in to FoodFindr</h1>
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 rounded-lg border border-neutral-200 bg-white px-4 py-3 text-sm font-semibold text-neutral-700 shadow hover:bg-neutral-50 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-200 disabled:opacity-60"
        >
          <svg className="w-5 h-5" viewBox="0 0 48 48" aria-hidden="true">
            <g>
              <path fill="#4285F4" d="M24 9.5c3.54 0 6.36 1.53 7.82 2.81l5.77-5.77C33.64 3.36 29.2 1.5 24 1.5 14.82 1.5 6.98 7.36 3.69 15.09l6.89 5.35C12.06 14.36 17.56 9.5 24 9.5z"/>
              <path fill="#34A853" d="M46.1 24.5c0-1.64-.15-3.22-.43-4.74H24v9.01h12.43c-.54 2.9-2.18 5.36-4.65 7.01l7.19 5.6C43.98 37.64 46.1 31.54 46.1 24.5z"/>
              <path fill="#FBBC05" d="M10.58 28.44A14.48 14.48 0 019.5 24c0-1.54.27-3.03.76-4.44l-6.89-5.35A23.93 23.93 0 000 24c0 3.77.9 7.34 2.5 10.44l8.08-6z"/>
              <path fill="#EA4335" d="M24 46.5c6.48 0 11.92-2.14 15.89-5.83l-7.19-5.6c-2.01 1.35-4.59 2.13-8.7 2.13-6.44 0-11.94-4.86-13.42-11.44l-8.08 6C6.98 40.64 14.82 46.5 24 46.5z"/>
              <path fill="none" d="M0 0h48v48H0z"/>
            </g>
          </svg>
          {loading ? "Redirecting..." : "Sign in with Google"}
        </button>
      </div>
    </div>
  );
}