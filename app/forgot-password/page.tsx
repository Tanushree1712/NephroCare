"use client";

import Link from "next/link";
import { useState } from "react";
import { Activity, ArrowLeft, ArrowRight, Mail, ShieldCheck } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

const inputClasses =
  "w-full rounded-[20px] border border-slate-200/80 bg-slate-50/90 px-4 py-3.5 text-sm font-medium text-slate-800 outline-none transition focus:border-cyan-400 focus:bg-white focus:ring-4 focus:ring-cyan-100";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const supabase = createClient();
      const redirectTo = `${window.location.origin}/update-password`;
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email.trim().toLowerCase(),
        { redirectTo }
      );

      if (resetError) {
        setError(resetError.message);
        setLoading(false);
        return;
      }

      setSuccess(
        "If that email exists in NephroCare+, a reset link has been sent. Open the email and continue from the link."
      );
    } catch {
      setError("We could not send the reset email right now.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-[1040px] rounded-[32px] border border-white/80 bg-white/60 p-3 shadow-[0_24px_80px_rgba(17,124,136,0.12)] backdrop-blur-2xl sm:rounded-[40px] sm:p-4 md:p-6">
        <div className="grid gap-4 md:grid-cols-[0.92fr_1.08fr]">
          <section className="rounded-[28px] bg-[linear-gradient(160deg,#0f98a2_0%,#17bfd3_54%,#95eef5_100%)] p-6 text-white sm:rounded-[32px] sm:p-8">
            <div className="flex h-14 w-14 items-center justify-center rounded-[20px] bg-white/18">
              <Activity className="h-7 w-7" />
            </div>
            <p className="mt-8 text-xs font-semibold uppercase tracking-[0.32em] text-cyan-50/82">
              Password recovery
            </p>
            <h1 className="mt-4 font-display text-[2.2rem] leading-[0.95] sm:text-[2.8rem]">
              Reset access without losing your care profile.
            </h1>
            <p className="mt-5 max-w-sm text-sm leading-7 text-cyan-50/92">
              We&apos;ll send a secure password reset link to the email tied to your patient
              account. Your profile and bookings stay exactly as they are.
            </p>

            <div className="mt-10 space-y-3">
              {[
                "Use the same email you registered with",
                "The reset link brings you back to this app to choose a new password",
                "If you request too many emails quickly, Supabase can rate-limit the mail send",
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
              <ShieldCheck className="h-8 w-8 text-cyan-600" />
            </div>

            <div className="mt-6 text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                Forgot password
              </p>
              <h2 className="mt-3 font-display text-[1.95rem] leading-none text-slate-900 sm:text-[2.2rem]">
                Send reset link
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-500">
                Enter your account email and we&apos;ll send password recovery instructions.
              </p>
            </div>

            {error ? (
              <div className="mt-6 rounded-[22px] border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                {error}
              </div>
            ) : null}

            {success ? (
              <div className="mt-6 rounded-[22px] border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                {success}
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

              <button
                type="submit"
                disabled={loading}
                className="inline-flex w-full items-center justify-center gap-2 rounded-[20px] bg-[linear-gradient(135deg,#17bfd3_0%,#0e9a9d_100%)] px-5 py-4 text-sm font-semibold text-white shadow-[0_18px_34px_rgba(20,190,211,0.28)] transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? "Sending reset link..." : "Email me a reset link"}
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>

            <p className="mt-8 text-center text-sm text-slate-500">
              Remembered it?{" "}
              <Link href="/login" className="font-semibold text-cyan-600">
                Back to login
              </Link>
            </p>

            <Link
              href="/login"
              className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-cyan-600"
            >
              <ArrowLeft className="h-4 w-4" />
              Return to sign in
            </Link>
          </section>
        </div>
      </div>
    </div>
  );
}
