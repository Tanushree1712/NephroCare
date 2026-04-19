"use client";

import Link from "next/link";
import { useState } from "react";
import { Activity, ArrowRight, Building2, LockKeyhole, Mail } from "lucide-react";

const inputClasses =
  "w-full rounded-[20px] border border-slate-200/80 bg-slate-50/90 px-4 py-3.5 text-sm font-medium text-slate-800 outline-none transition focus:border-cyan-400 focus:bg-white focus:ring-4 focus:ring-cyan-100";

export default function CenterLoginPage() {
  const [email, setEmail] = useState("");
  const [centerCode, setCenterCode] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    if (process.env.NODE_ENV !== "production") {
      try {
        const devResponse = await fetch("/api/dev-login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            identifier: email.trim(),
            email: email.trim(),
            centerCode: centerCode.trim().toUpperCase(),
            password,
          }),
        });

        if (devResponse.ok) {
          window.location.assign("/");
          return;
        }
      } catch {
        // Fall through to the regular center login path.
      }
    }

    const response = await fetch("/api/center-login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: email.trim(),
        centerCode: centerCode.trim().toUpperCase(),
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

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-[1080px] rounded-[32px] border border-white/80 bg-white/60 p-3 shadow-[0_24px_80px_rgba(17,124,136,0.12)] backdrop-blur-2xl sm:rounded-[40px] sm:p-4 md:p-6">
        <div className="grid gap-4 md:grid-cols-[0.95fr_1.05fr]">
          <section className="rounded-[28px] bg-[linear-gradient(160deg,#073d48_0%,#0f98a2_50%,#8ce8f1_100%)] p-6 text-white sm:rounded-[32px] sm:p-8">
            <div className="flex h-14 w-14 items-center justify-center rounded-[20px] bg-white/18">
              <Building2 className="h-7 w-7" />
            </div>
            <p className="mt-8 text-xs font-semibold uppercase tracking-[0.32em] text-cyan-50/82">
              Center access
            </p>
            <h1 className="mt-4 font-display text-[2.2rem] leading-[0.95] sm:text-[2.8rem]">
              Reception visibility, center by center.
            </h1>
            <p className="mt-5 max-w-sm text-sm leading-7 text-cyan-50/92">
              This portal is for reception and center staff. Sign in with your work
              email, center code, and password to review registrations and bookings for
              your assigned center only.
            </p>

            <div className="mt-10 space-y-3">
              {[
                "Only registrations from your own center are visible here",
                "Bookings stay filtered to your assigned center workspace",
                "Patient-facing flows remain separate and untouched",
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
                Reception sign in
              </p>
              <h2 className="mt-3 font-display text-[1.95rem] leading-none text-slate-900 sm:text-[2.2rem]">
                Open your center desk
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-500">
                Use the credentials issued for your center so we can scope the workspace
                to your registrations and bookings.
              </p>
            </div>

            {error ? (
              <div className="mt-6 rounded-[22px] border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                {error}
              </div>
            ) : null}

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                  Work email
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    required
                    autoComplete="username"
                    placeholder="reception@center.com"
                    className={`${inputClasses} pl-11`}
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                  Center code
                </label>
                <div className="relative">
                  <Building2 className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="NAG-C1"
                    className={`${inputClasses} pl-11 uppercase`}
                    value={centerCode}
                    onChange={(event) => setCenterCode(event.target.value)}
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

              <button
                type="submit"
                disabled={loading}
                className="inline-flex w-full items-center justify-center gap-2 rounded-[20px] bg-[linear-gradient(135deg,#17bfd3_0%,#0e9a9d_100%)] px-5 py-4 text-sm font-semibold text-white shadow-[0_18px_34px_rgba(20,190,211,0.28)] transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? "Opening your center desk..." : "Continue to center dashboard"}
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>

            <p className="mt-8 text-center text-sm text-slate-500">
              Looking for the patient portal?{" "}
              <Link href="/login" className="font-semibold text-cyan-600">
                Go to patient sign in
              </Link>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
