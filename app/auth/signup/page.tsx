"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { signIn, useSession } from "next-auth/react"; 
import { useRouter, useSearchParams } from "next/navigation";
import { HiOutlineEye, HiOutlineEyeSlash } from "react-icons/hi2";
import EmailConfirmation from "@/components/emailconfirmation";

function getPasswordStrength(password: string) {
  let strength = 0;
  if (password.length >= 8) strength++;
  if (/[A-Z]/.test(password)) strength++;
  if (/\d/.test(password) || /[^\w\s]/.test(password)) strength++; // Number or symbol

  // Fix: Only allow max strength to be 3, and map to 3 levels
  const levels = [
    { label: "Very Weak", color: "bg-red-500" },    // 0
    { label: "Weak", color: "bg-orange-500" },       // 1
    { label: "Fair", color: "bg-yellow-500" },       // 2
    { label: "Strong", color: "bg-green-500" },      // 3
  ];
  // Clamp strength to max index
  return levels[Math.min(strength, levels.length - 1)];
}

function validateEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePassword(password: string) {
  // At least 8 chars, 1 uppercase, 1 number or symbol
  return /^(?=.*[A-Z])(?=.*[\d\W]).{8,}$/.test(password);
}

export default function SignupPage() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const [firstNameError, setFirstNameError] = useState("");
  const [lastNameError, setLastNameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmError, setConfirmError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const passwordStrength = getPasswordStrength(password);

  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = (searchParams?.get("callbackUrl") as string) || "/dashboard";
  const { status } = useSession();

  useEffect(() => {
    if (status === "authenticated") {
      router.replace(callbackUrl);
    }
  }, [status, router, callbackUrl]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFirstNameError("");
    setLastNameError("");
    setEmailError("");
    setPasswordError("");
    setConfirmError("");
    let valid = true;

    if (!firstName.trim()) {
      setFirstNameError("First name is required.");
      valid = false;
    }
    if (!lastName.trim()) {
      setLastNameError("Last name is required.");
      valid = false;
    }
    if (!email || !validateEmail(email)) {
      setEmailError("Please enter a valid email address.");
      valid = false;
    }
    if (!password) {
      setPasswordError("Password is required.");
      valid = false;
    } else if (!validatePassword(password)) {
      setPasswordError(
        "Password must be at least 8 characters and include uppercase, lowercase, number, and symbol."
      );
      valid = false;
    }
    if (!confirm) {
      setConfirmError("Please confirm your password.");
      valid = false;
    } else if (password !== confirm) {
      setConfirmError("Passwords do not match.");
      valid = false;
    }
    if (!valid) return;

    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName, lastName, email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.error === "Email is already registered.") {
          setEmailError("This email is already registered.");
        } else {
          setEmailError(data.error || "Something went wrong. Please try again.");
        }
        setLoading(false);
        return;
      }
      setSent(true);
      setFirstName("");
      setLastName("");
      setPassword("");
      setConfirm("");
    } catch {
      setEmailError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // Add this handler for Google signup
  function handleGoogleSignup() {
    signIn("google", { callbackUrl });
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
            <Link href="/auth/login" passHref legacyBehavior>
              <a className="hidden sm:inline-flex items-center justify-center rounded-md px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-emerald-100 transition">
                Log in
              </a>
            </Link>
            <Link href="/auth/signup" passHref legacyBehavior>
              <a className="inline-flex items-center justify-center rounded-full bg-emerald-700 px-5 py-2 text-sm text-white font-semibold shadow hover:bg-emerald-800 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-200">
                Start for free
              </a>
            </Link>
          </nav>
        </div>
      </header>

      <main
        className="mx-auto max-w-3xl px-2 py-10 flex flex-col items-center justify-center min-h-[84vh]"
        role="main"
      >
        <div className="w-full rounded-2xl bg-white/90 backdrop-blur-md p-6 md:p-10 shadow border border-neutral-100">
          <h1 className="text-3xl font-bold mb-2 text-neutral-900 text-center">Create your account</h1>
          <p className="text-neutral-600 mb-6 text-center text-base">Sign up to unlock smarter home cooking.</p>
          {!sent ? (
            <form
              className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10"
              onSubmit={handleSubmit}
              aria-label="Signup form"
              noValidate
            >
              {/* Left column */}
              <div className="flex flex-col gap-3">
                <div>
                  <label htmlFor="firstName" className="block text-xs font-medium text-neutral-800 mb-1">
                    First name
                  </label>
                  <input
                    id="firstName"
                    type="text"
                    autoComplete="given-name"
                    value={firstName}
                    onChange={(e) => {
                      setFirstName(e.target.value);
                      if (firstNameError) setFirstNameError("");
                    }}
                    placeholder="Enter your first name"
                    required
                    aria-describedby={firstNameError ? "firstname-error" : undefined}
                    className={`w-full rounded-md border px-3 py-2 text-sm placeholder-neutral-400 focus:outline-none focus:ring-2 transition ${
                      firstNameError ? "border-red-300 focus:ring-red-200" : "border-neutral-300 focus:ring-emerald-200"
                    }`}
                  />
                  {firstNameError && (
                    <p id="firstname-error" className="mt-1 text-xs text-red-600" role="alert">
                      {firstNameError}
                    </p>
                  )}
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-xs font-medium text-neutral-800 mb-1">
                    Last name
                  </label>
                  <input
                    id="lastName"
                    type="text"
                    autoComplete="family-name"
                    value={lastName}
                    onChange={(e) => {
                      setLastName(e.target.value);
                      if (lastNameError) setLastNameError("");
                    }}
                    placeholder="Enter your last name"
                    required
                    aria-describedby={lastNameError ? "lastname-error" : undefined}
                    className={`w-full rounded-md border px-3 py-2 text-sm placeholder-neutral-400 focus:outline-none focus:ring-2 transition ${
                      lastNameError ? "border-red-300 focus:ring-red-200" : "border-neutral-300 focus:ring-emerald-200"
                    }`}
                  />
                  {lastNameError && (
                    <p id="lastname-error" className="mt-1 text-xs text-red-600" role="alert">
                      {lastNameError}
                    </p>
                  )}
                </div>
                <div>
                  <label htmlFor="email" className="block text-xs font-medium text-neutral-800 mb-1">
                    Email address
                  </label>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (emailError) setEmailError("");
                    }}
                    placeholder="Enter your email"
                    required
                    aria-describedby={emailError ? "email-error" : undefined}
                    className={`w-full rounded-md border px-3 py-2 text-sm placeholder-neutral-400 focus:outline-none focus:ring-2 transition ${
                      emailError ? "border-red-300 focus:ring-red-200" : "border-neutral-300 focus:ring-emerald-200"
                    }`}
                  />
                  {emailError && (
                    <p id="email-error" className="mt-1 text-xs text-red-600" role="alert">
                      {emailError}
                    </p>
                  )}
                </div>
              </div>
              {/* Right column */}
              <div className="flex flex-col gap-3">
                <div>
                  <label htmlFor="password" className="block text-xs font-medium text-neutral-800 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (passwordError) setPasswordError("");
                      }}
                      placeholder="Create a strong password"
                      required
                      aria-describedby={passwordError ? "password-error" : "password-help"}
                      className={`w-full rounded-md border px-3 py-2 pr-10 text-sm placeholder-neutral-400 focus:outline-none focus:ring-2 transition ${
                        passwordError ? "border-red-300 focus:ring-red-200" : "border-neutral-300 focus:ring-emerald-200"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-neutral-100 transition"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? (
                        <HiOutlineEyeSlash className="h-4 w-4 text-neutral-400" />
                      ) : (
                        <HiOutlineEye className="h-4 w-4 text-neutral-400" />
                      )}
                    </button>
                  </div>
                  {/* Show password requirements and strength only when typing */}
                  {password && (
                    <>
                      <ul id="password-help" className="mt-1 text-xs text-neutral-500 space-y-0.5">
                        <li>Password must contain:</li>
                        <li className={password.length >= 8 ? "text-emerald-700" : ""}>• At least 8 characters</li>
                        <li className={/[A-Z]/.test(password) ? "text-emerald-700" : ""}>• An uppercase letter</li>
                        <li className={(/\d/.test(password) || /[^\w\s]/.test(password)) ? "text-emerald-700" : ""}>• Number and Symbol</li>
                      </ul>
                      <div className="mt-1">
                        <div className="flex items-center gap-2">
                          <div className="w-full bg-gray-200 rounded-full h-1.5">
                            <div
                              className={`h-1.5 rounded-full transition-all duration-300 ${passwordStrength?.color}`}
                              style={{
                                width: `${((["Very Weak", "Weak", "Fair", "Strong"].indexOf(passwordStrength.label) + 1) / 4) * 100}%`
                              }}
                            ></div>
                          </div>
                          <span className={`text-xs font-semibold ${passwordStrength?.color?.replace("bg-", "text-")}`}>{passwordStrength?.label}</span>
                        </div>
                      </div>
                    </>
                  )}
                  {passwordError && (
                    <p id="password-error" className="mt-1 text-xs text-red-600" role="alert">
                      {passwordError}
                    </p>
                  )}
                </div>
                <div>
                  <label htmlFor="confirm" className="block text-xs font-medium text-neutral-800 mb-1">
                    Confirm password
                  </label>
                  <div className="relative">
                    <input
                      id="confirm"
                      type={showConfirm ? "text" : "password"}
                      autoComplete="new-password"
                      value={confirm}
                      onChange={(e) => {
                        setConfirm(e.target.value);
                        if (confirmError) setConfirmError("");
                      }}
                      placeholder="Re-enter your password"
                      required
                      aria-describedby={confirmError ? "confirm-error" : undefined}
                      className={`w-full rounded-md border px-3 py-2 pr-10 text-sm placeholder-neutral-400 focus:outline-none focus:ring-2 transition ${
                        confirmError ? "border-red-300 focus:ring-red-200" : "border-neutral-300 focus:ring-emerald-200"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-neutral-100 transition"
                      aria-label={showConfirm ? "Hide password" : "Show password"}
                    >
                      {showConfirm ? (
                        <HiOutlineEyeSlash className="h-4 w-4 text-neutral-400" />
                      ) : (
                        <HiOutlineEye className="h-4 w-4 text-neutral-400" />
                      )}
                    </button>
                  </div>
                  {confirmError && (
                    <p id="confirm-error" className="mt-1 text-xs text-red-600" role="alert">
                      {confirmError}
                    </p>
                  )}
                  {confirm && password === confirm && !confirmError && (
                    <p className="mt-1 text-xs text-green-600 flex items-center gap-1">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Passwords match
                    </p>
                  )}
                </div>
              </div>
              <div className="md:col-span-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-md bg-emerald-700 px-4 py-2 text-base text-white font-semibold shadow hover:bg-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-200"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"></circle>
                        <path fill="currentColor" className="opacity-75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Creating account...
                    </span>
                  ) : (
                    "Sign up"
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
                  className="w-full flex items-center justify-center gap-3 rounded-lg border border-neutral-200 bg-white px-4 py-3 text-sm font-semibold text-neutral-700 shadow hover:bg-neutral-50 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-200"
                  onClick={handleGoogleSignup} // <-- Use the handler here
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
                  Continue with Google
                </button>
              </div>
            </form>
          ) : (
            email && <EmailConfirmation email={email} />
          )}
          <div className="mt-4 text-xs text-neutral-700 text-center">
            Already have an account?{" "}
            <Link href="/auth/login" className="text-emerald-700 font-semibold hover:underline">
              Log in
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}