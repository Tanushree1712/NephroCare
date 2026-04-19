"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { Activity, ArrowRight, LockKeyhole, Mail } from "lucide-react";

const inputClasses =
  "w-full rounded-[20px] border border-slate-200/80 bg-slate-50/90 px-4 py-3.5 text-sm font-medium text-slate-800 outline-none transition focus:border-cyan-400 focus:bg-white focus:ring-4 focus:ring-cyan-100";

export default function LoginPage() {
  const searchParams = useSearchParams();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const cleanedIdentifier = identifier.trim();

    if (process.env.NODE_ENV !== "production") {
      try {
        const devResponse = await fetch("/api/dev-login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            identifier: cleanedIdentifier,
            password,
          }),
        });

        if (devResponse.ok) {
          window.location.assign("/");
          return;
        }
      } catch {
        // Fall through to the Supabase login path.
      }
    }

    const response = await fetch("/api/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        identifier: cleanedIdentifier,
        password,
      }),
    });
    const payload = (await response.json()) as {
      error?: string;
      redirectTo?: string;
    };

    if (!response.ok) {
      setLoading(false);
      setError(payload.error ?? "We could not sign you in.");
      return;
    }

    window.location.assign(payload.redirectTo ?? "/");
  }

  const registered = searchParams.get("registered") === "1";
  const passwordReset = searchParams.get("reset") === "1";

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-[1040px] rounded-[32px] border border-white/80 bg-white/60 p-3 shadow-[0_24px_80px_rgba(17,124,136,0.12)] backdrop-blur-2xl sm:rounded-[40px] sm:p-4 md:p-6">
        <div className="grid gap-4 md:grid-cols-[0.92fr_1.08fr]">
          <section className="rounded-[28px] bg-[linear-gradient(160deg,#0f98a2_0%,#17bfd3_54%,#95eef5_100%)] p-6 text-white sm:rounded-[32px] sm:p-8">
            <div className="flex h-14 w-14 items-center justify-center rounded-[20px] bg-white/18">
              <Activity className="h-7 w-7" />
            </div>
            <p className="mt-8 text-xs font-semibold uppercase tracking-[0.32em] text-cyan-50/82">
              NephroCare+
            </p>
            <h1 className="mt-4 font-display text-[2.2rem] leading-[0.95] sm:text-[2.8rem]">
              A calmer way to manage dialysis care.
            </h1>
            <p className="mt-5 max-w-sm text-sm leading-7 text-cyan-50/92">
              Sign in to view your patient ID, update your profile, and book the nearest
              dialysis session with less friction.
            </p>

            <div className="mt-10 space-y-3">
              {[
                "Patient-first dashboard for upcoming sessions and care notes",
                "Registration links every user to a dedicated patient ID",
                "Location-aware onboarding for future center recommendations",
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-[20px] border border-white/20 bg-white/12 px-4 py-3 text-sm leading-6 text-white/92"
                >
                  {item}
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[28px] bg-white/92 p-6 sm:rounded-[32px] sm:p-8 md:p-10">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-cyan-50 shadow-inner">
              <Activity className="h-8 w-8 text-cyan-600" />
            </div>

            <div className="mt-6 text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                Patient sign in
              </p>
              <h2 className="mt-3 font-display text-[1.95rem] leading-none text-slate-900 sm:text-[2.2rem]">
                Welcome back
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-500">
                Use your registered email or profile name with your password to continue
                to the home page.
              </p>
            </div>

            {registered ? (
              <div className="mt-6 rounded-[22px] border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                Registration completed. Please sign in with your new account.
              </div>
            ) : null}

            {passwordReset ? (
              <div className="mt-6 rounded-[22px] border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                Password updated. Sign in with your new password.
              </div>
            ) : null}

            {error ? (
              <div className="mt-6 rounded-[22px] border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                {error}
              </div>
            ) : null}

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                  Email or name
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    required
                    autoComplete="username"
                    placeholder="patient@example.com or Priya Sharma"
                    className={`${inputClasses} pl-11`}
                    value={identifier}
                    onChange={(event) => setIdentifier(event.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                  Password
                </label>
                <div className="relative">
                  <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="password"
                    required
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    className={`${inputClasses} pl-11`}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Secure access to your care plan</span>
                <Link href="/forgot-password" className="font-semibold text-cyan-600">
                  Forgot password?
                </Link>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="inline-flex w-full items-center justify-center gap-2 rounded-[20px] bg-[linear-gradient(135deg,#17bfd3_0%,#0e9a9d_100%)] px-5 py-4 text-sm font-semibold text-white shadow-[0_18px_34px_rgba(20,190,211,0.28)] transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? "Signing you in..." : "Continue to home"}
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>

            <div className="mt-6 rounded-[22px] border border-slate-200/80 bg-slate-50 px-4 py-4 text-sm text-slate-600">
              Reception or center staff?{" "}
              <Link href="/center-login" className="font-semibold text-cyan-600">
                Use the center login
              </Link>{" "}
              to open a center-scoped workspace for registrations and bookings.
            </div>

            <p className="mt-8 text-center text-sm text-slate-500">
              New to NephroCare+?{" "}
              <Link href="/register" className="font-semibold text-cyan-600">
                Create your patient profile
              </Link>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
