"use client";
import { useEffect, useState, useRef } from "react";

export default function EmailConfirmation({ email }: { email: string }) {
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [timer, setTimer] = useState(60);
  const hasSentRef = useRef(false);

  // Send OTP automatically on mount (only once)
  useEffect(() => {
    if (!hasSentRef.current) {
      sendOtp();
      hasSentRef.current = true;
    }
    // eslint-disable-next-line
  }, []);

  // Countdown for resend button
  useEffect(() => {
    if (sent && timer > 0) {
      const interval = setInterval(() => setTimer((t) => t - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [sent, timer]);

  async function sendOtp() {
    setError("");
    setLoading(true);
    setTimer(60);
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send code.");
      setSent(true);
    } catch (err: any) {
      setError(err.message || "Failed to send code.");
    }
    setLoading(false);
  }

  async function handleResend() {
    setResending(true);
    await sendOtp();
    setResending(false);
  }

  async function handleConfirm(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Invalid confirmation code.");
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "Invalid confirmation code.");
    }
    setLoading(false);
  }

  return (
    <div className="max-w-md mx-auto bg-white/90 backdrop-blur-md rounded-2xl shadow p-8 border border-neutral-100 mt-8">
      <div className="flex flex-col items-center">
        <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-neutral-100 to-white shadow ring-1 ring-neutral-100 mb-2">
          <svg className="h-7 w-7 text-emerald-700" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M3 7l9 6 9-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <rect x="3" y="7" width="18" height="10" rx="2" stroke="currentColor" strokeWidth="1.5"/>
          </svg>
        </div>
        <h2 className="text-2xl font-bold mb-1 text-neutral-900 text-center">Check your email</h2>
        <p className="text-neutral-600 mb-4 text-center text-base">
          We sent a 6-digit confirmation code to <span className="font-semibold">{email}</span>.
        </p>
      </div>
      {!success ? (
        <form className="flex flex-col gap-4" onSubmit={handleConfirm}>
          <div>
            <label htmlFor="otp" className="block text-xs font-medium text-neutral-800 mb-1">
              Confirmation code
            </label>
            <input
              id="otp"
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={e => {
                setCode(e.target.value.replace(/\D/g, ""));
                if (error) setError("");
              }}
              placeholder="Enter 6-digit code"
              className="w-full rounded-md border px-3 py-2 text-lg tracking-widest text-center font-mono placeholder-neutral-400 focus:outline-none focus:ring-2 border-neutral-300 focus:ring-emerald-200"
              required
              autoFocus
            />
          </div>
          {error && (
            <p className="text-xs text-red-600 text-center" role="alert">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading || code.length !== 6}
            className="w-full rounded-md bg-emerald-700 px-4 py-2 text-base text-white font-semibold shadow hover:bg-emerald-800 disabled:opacity-50 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-200"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"></circle>
                  <path fill="currentColor" className="opacity-75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Verifying...
              </span>
            ) : (
              "Confirm email"
            )}
          </button>
        </form>
      ) : (
        <div className="mt-4 text-green-700 text-center font-semibold flex flex-col items-center gap-2">
          <svg className="w-8 h-8 text-emerald-700" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M5 12.5l4 4L19 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Email confirmed! You can now log in.
        </div>
      )}
      <div className="mt-6 flex flex-col items-center gap-2">
        <button
          type="button"
          disabled={timer > 0 || resending}
          onClick={handleResend}
          className="text-xs font-semibold text-emerald-700 hover:underline disabled:text-neutral-400 disabled:cursor-not-allowed"
        >
          {resending
            ? "Resending..."
            : timer > 0
              ? `Resend code in ${timer}s`
              : "Resend code"}
        </button>
        <p className="text-xs text-neutral-500 text-center">
          Didn&apos;t get the code? Check your spam or promotions folder.
        </p>
      </div>
    </div>
  );
}