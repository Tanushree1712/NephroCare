"use client";

import { createClient } from "@/utils/supabase/client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Activity, ArrowRight, LockKeyhole, Mail } from "lucide-react";

const inputClasses =
  "w-full rounded-[20px] border border-slate-200/80 bg-slate-50/90 px-4 py-3.5 text-sm font-medium text-slate-800 outline-none transition focus:border-cyan-400 focus:bg-white focus:ring-4 focus:ring-cyan-100";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
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
            email: email.trim(),
            password,
          }),
        });

        if (devResponse.ok) {
          router.push("/");
          router.refresh();
          return;
        }
      } catch {
        // Fall through to the Supabase login path.
      }
    }

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (signInError) {
      setLoading(false);
      setError(signInError.message);
      return;
    }

    router.push("/");
    router.refresh();
  }

  const registered = searchParams.get("registered") === "1";

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-[1040px] rounded-[40px] border border-white/80 bg-white/60 p-4 shadow-[0_24px_80px_rgba(17,124,136,0.12)] backdrop-blur-2xl md:p-6">
        <div className="grid gap-4 md:grid-cols-[0.92fr_1.08fr]">
          <section className="rounded-[32px] bg-[linear-gradient(160deg,#0f98a2_0%,#17bfd3_54%,#95eef5_100%)] p-8 text-white">
            <div className="flex h-14 w-14 items-center justify-center rounded-[20px] bg-white/18">
              <Activity className="h-7 w-7" />
            </div>
            <p className="mt-8 text-xs font-semibold uppercase tracking-[0.32em] text-cyan-50/82">
              NephroCare+
            </p>
            <h1 className="mt-4 font-display text-[2.8rem] leading-[0.95]">
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

          <section className="rounded-[32px] bg-white/92 p-8 md:p-10">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-cyan-50 shadow-inner">
              <Activity className="h-8 w-8 text-cyan-600" />
            </div>

            <div className="mt-6 text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                Patient sign in
              </p>
              <h2 className="mt-3 font-display text-[2.2rem] leading-none text-slate-900">
                Welcome back
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-500">
                Use your registered email and password to continue to your care hub.
              </p>
            </div>

            {registered ? (
              <div className="mt-6 rounded-[22px] border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                Registration completed. Please sign in with your new account.
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
                  Email
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    required
                    placeholder="patient@example.com"
                    className={`${inputClasses} pl-11`}
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
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
                    placeholder="Enter your password"
                    className={`${inputClasses} pl-11`}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Secure access to your care plan</span>
                <span className="font-semibold text-cyan-600">Forgot password?</span>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="inline-flex w-full items-center justify-center gap-2 rounded-[20px] bg-[linear-gradient(135deg,#17bfd3_0%,#0e9a9d_100%)] px-5 py-4 text-sm font-semibold text-white shadow-[0_18px_34px_rgba(20,190,211,0.28)] transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? "Signing you in..." : "Continue to my dashboard"}
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>

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
