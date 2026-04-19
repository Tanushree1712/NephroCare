"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { EmailOtpType } from "@supabase/supabase-js";
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  KeyRound,
  ShieldCheck,
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";

const inputClasses =
  "w-full rounded-[20px] border border-slate-200/80 bg-slate-50/90 px-4 py-3.5 text-sm font-medium text-slate-800 outline-none transition focus:border-cyan-400 focus:bg-white focus:ring-4 focus:ring-cyan-100";

export default function UpdatePasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [ready, setReady] = useState(false);
  const [checking, setChecking] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let active = true;
    const supabase = createClient();

    async function hydrateRecoverySession() {
      const currentUrl = new URL(window.location.href);
      const tokenHash = currentUrl.searchParams.get("token_hash");
      const type = currentUrl.searchParams.get("type") as EmailOtpType | null;

      if (tokenHash && type === "recovery") {
        const { error: verifyError } = await supabase.auth.verifyOtp({
          type,
          token_hash: tokenHash,
        });

        if (verifyError) {
          if (active) {
            setError("This password reset link is invalid or has expired.");
            setChecking(false);
          }
          return;
        }

        currentUrl.searchParams.delete("token_hash");
        currentUrl.searchParams.delete("type");
        window.history.replaceState({}, "", currentUrl.pathname + currentUrl.search);
      }

      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
      const accessToken = hashParams.get("access_token");
      const refreshToken = hashParams.get("refresh_token");

      if (accessToken && refreshToken) {
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (sessionError) {
          if (active) {
            setError("This password reset link is invalid or has expired.");
            setChecking(false);
          }
          return;
        }

        window.history.replaceState({}, "", currentUrl.pathname + currentUrl.search);
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!active) {
        return;
      }

      if (session) {
        setReady(true);
      } else {
        setError("Open this page from a valid password reset email.");
      }

      setChecking(false);
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) {
        return;
      }

      if (event === "PASSWORD_RECOVERY" || session) {
        setReady(true);
        setChecking(false);
        setError("");
      }
    });

    void hydrateRecoverySession();

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Use at least 8 characters for the new password.");
      return;
    }

    if (password !== confirmPassword) {
      setError("The passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });

      if (updateError) {
        setError(updateError.message);
        setLoading(false);
        return;
      }

      setSuccess("Password updated. Redirecting you back to login...");
      await supabase.auth.signOut();

      window.setTimeout(() => {
        router.push("/login?reset=1");
        router.refresh();
      }, 1000);
    } catch {
      setError("We could not update your password right now.");
      setLoading(false);
      return;
    }

    setLoading(false);
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-[1040px] rounded-[40px] border border-white/80 bg-white/60 p-4 shadow-[0_24px_80px_rgba(17,124,136,0.12)] backdrop-blur-2xl md:p-6">
        <div className="grid gap-4 md:grid-cols-[0.92fr_1.08fr]">
          <section className="rounded-[32px] bg-[linear-gradient(160deg,#0f98a2_0%,#17bfd3_54%,#95eef5_100%)] p-8 text-white">
            <div className="flex h-14 w-14 items-center justify-center rounded-[20px] bg-white/18">
              <Activity className="h-7 w-7" />
            </div>
            <p className="mt-8 text-xs font-semibold uppercase tracking-[0.32em] text-cyan-50/82">
              Choose a new password
            </p>
            <h1 className="mt-4 font-display text-[2.8rem] leading-[0.95]">
              Keep your account secure and easy to access.
            </h1>
            <p className="mt-5 max-w-sm text-sm leading-7 text-cyan-50/92">
              Create a new password for your NephroCare+ patient account, then sign back in
              normally with the updated credentials.
            </p>

            <div className="mt-10 space-y-3">
              {[
                "Use at least 8 characters",
                "Choose something you have not reused elsewhere",
                "After saving, you’ll be sent back to the login page",
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
              {success ? (
                <CheckCircle2 className="h-8 w-8 text-emerald-600" />
              ) : (
                <ShieldCheck className="h-8 w-8 text-cyan-600" />
              )}
            </div>

            <div className="mt-6 text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                Reset password
              </p>
              <h2 className="mt-3 font-display text-[2.2rem] leading-none text-slate-900">
                Set a new password
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-500">
                {checking
                  ? "Validating your recovery link..."
                  : "Enter a new password to finish the reset process."}
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

            {ready ? (
              <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                    New password
                  </label>
                  <div className="relative">
                    <KeyRound className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="password"
                      required
                      placeholder="Enter a strong new password"
                      className={`${inputClasses} pl-11`}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                    Confirm password
                  </label>
                  <div className="relative">
                    <KeyRound className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="password"
                      required
                      placeholder="Re-enter the new password"
                      className={`${inputClasses} pl-11`}
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-[20px] bg-[linear-gradient(135deg,#17bfd3_0%,#0e9a9d_100%)] px-5 py-4 text-sm font-semibold text-white shadow-[0_18px_34px_rgba(20,190,211,0.28)] transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {loading ? "Saving new password..." : "Update password"}
                  <ArrowRight className="h-4 w-4" />
                </button>
              </form>
            ) : (
              <div className="mt-8 rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
                {checking
                  ? "Checking your recovery session..."
                  : "Request a fresh reset link if this one is expired."}
              </div>
            )}

            <div className="mt-8 text-center text-sm text-slate-500">
              Need a new link?{" "}
              <Link href="/forgot-password" className="font-semibold text-cyan-600">
                Request another reset email
              </Link>
            </div>

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
