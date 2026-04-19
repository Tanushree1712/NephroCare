"use client";

import { createClient } from "@/utils/supabase/client";
import { formatPatientId, getCenterLabel, getRecommendedCenter, type CenterOption } from "@/lib/patient-utils";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Activity, ArrowLeft, ArrowRight, MapPin, ShieldCheck } from "lucide-react";
import type { Session, SupabaseClient, User } from "@supabase/supabase-js";

type RegisterFormState = {
  name: string;
  email: string;
  password: string;
  age: string;
  gender: string;
  phone: string;
  location: string;
  centerId: string;
  bloodGroup: string;
  primaryDiagnosis: string;
  dialysisType: string;
  dialysisFrequency: string;
  vascularAccess: string;
  dialysisSince: string;
  preferredSlot: string;
  allergies: string;
  comorbidities: string;
  medicalHistory: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
};

type RegisterResponse = {
  id: number;
  createdAt: string;
  center?: {
    centerCode?: string | null;
    name: string;
    city?: {
      name: string;
    } | null;
  } | null;
};

type ResolvedAuthRegistration = {
  user: User;
  session: Session | null;
  recoveredExistingAccount: boolean;
  reusedCurrentSession: boolean;
};

const inputClasses =
  "w-full rounded-[20px] border border-slate-200/80 bg-slate-50/90 px-4 py-3.5 text-sm font-medium text-slate-800 outline-none transition focus:border-cyan-400 focus:bg-white focus:ring-4 focus:ring-cyan-100";

const textAreaClasses = `${inputClasses} min-h-28 resize-none`;

const initialForm: RegisterFormState = {
  name: "",
  email: "",
  password: "",
  age: "",
  gender: "female",
  phone: "",
  location: "",
  centerId: "",
  bloodGroup: "",
  primaryDiagnosis: "",
  dialysisType: "Hemodialysis",
  dialysisFrequency: "Thrice weekly",
  vascularAccess: "AV fistula",
  dialysisSince: "",
  preferredSlot: "Morning",
  allergies: "",
  comorbidities: "",
  medicalHistory: "",
  emergencyContactName: "",
  emergencyContactPhone: "",
};

async function resolveAuthRegistration(
  supabase: SupabaseClient,
  form: RegisterFormState
): Promise<
  | { data: ResolvedAuthRegistration; error: null }
  | { data: null; error: string }
> {
  const email = form.email.trim().toLowerCase();
  const password = form.password;

  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser();

  if (currentUser?.id) {
    const currentEmail = currentUser.email?.trim().toLowerCase();

    if (currentEmail && currentEmail !== email) {
      return {
        data: null,
        error:
          "You're already signed in with a different email. Sign out first or use that same email to finish registration.",
      };
    }

    const {
      data: { session },
    } = await supabase.auth.getSession();

    return {
      data: {
        user: currentUser,
        session,
        recoveredExistingAccount: false,
        reusedCurrentSession: true,
      },
      error: null,
    };
  }

  const signUpResult = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: form.name.trim(),
        phone: form.phone.trim(),
        role: "PATIENT",
      },
    },
  });

  if (!signUpResult.error && signUpResult.data.user?.id) {
    return {
      data: {
        user: signUpResult.data.user,
        session: signUpResult.data.session,
        recoveredExistingAccount: false,
        reusedCurrentSession: false,
      },
      error: null,
    };
  }

  const authErrorMessage = signUpResult.error?.message ?? "";
  const canRecoverExistingAccount =
    /already registered|already been registered|user already registered/i.test(
      authErrorMessage
    );

  if (!canRecoverExistingAccount) {
    return {
      data: null,
      error:
        authErrorMessage || "We could not create your secure account. Please try again.",
    };
  }

  const signInResult = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (signInResult.error || !signInResult.data.user?.id) {
    return {
      data: null,
      error:
        "This email is already registered. Sign in with the same password or reset it, then try again.",
    };
  }

  return {
    data: {
      user: signInResult.data.user,
      session: signInResult.data.session,
      recoveredExistingAccount: true,
      reusedCurrentSession: false,
    },
    error: null,
  };
}

async function syncAuthProfileMetadata(
  supabase: SupabaseClient,
  registration: ResolvedAuthRegistration,
  form: RegisterFormState
) {
  if (!registration.session) {
    return;
  }

  await supabase.auth.updateUser({
    data: {
      full_name: form.name.trim(),
      phone: form.phone.trim(),
      role: "PATIENT",
    },
  });
}

async function completePostRegistrationSignIn(
  supabase: SupabaseClient,
  registration: ResolvedAuthRegistration,
  form: RegisterFormState
) {
  if (registration.session || registration.reusedCurrentSession) {
    return true;
  }

  const signInResult = await supabase.auth.signInWithPassword({
    email: form.email.trim().toLowerCase(),
    password: form.password,
  });

  return !signInResult.error && Boolean(signInResult.data.session);
}

export default function RegisterPage() {
  const router = useRouter();
  const [centers, setCenters] = useState<CenterOption[]>([]);
  const [form, setForm] = useState<RegisterFormState>(initialForm);
  const [loadingCenters, setLoadingCenters] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [hasActiveSession, setHasActiveSession] = useState(false);
  const [manualCenterSelection, setManualCenterSelection] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadCenters() {
      try {
        const response = await fetch("/api/centers");
        const data: CenterOption[] = await response.json();

        if (isMounted) {
          setCenters(Array.isArray(data) ? data : []);
        }
      } catch {
        if (isMounted) {
          setError("We could not load dialysis centers right now.");
        }
      } finally {
        if (isMounted) {
          setLoadingCenters(false);
        }
      }
    }

    loadCenters();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    const supabase = createClient();

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (active) {
          setHasActiveSession(Boolean(data.session));
        }
      })
      .catch(() => {
        if (active) {
          setHasActiveSession(false);
        }
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active) {
        setHasActiveSession(Boolean(session));
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const recommendedCenter = getRecommendedCenter(centers, form.location);

  useEffect(() => {
    if (manualCenterSelection || !recommendedCenter) {
      return;
    }

    setForm((currentForm) => {
      if (currentForm.centerId === String(recommendedCenter.id)) {
        return currentForm;
      }

      return {
        ...currentForm,
        centerId: String(recommendedCenter.id),
      };
    });
  }, [manualCenterSelection, recommendedCenter]);

  function updateField<Key extends keyof RegisterFormState>(
    field: Key,
    value: RegisterFormState[Key]
  ) {
    setForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccessMessage("");

    const supabase = createClient();
    const authResult = await resolveAuthRegistration(supabase, form);

    if (authResult.error) {
      setSubmitting(false);
      setError(authResult.error);
      return;
    }

    if (!authResult.data) {
      setSubmitting(false);
      setError("We could not create your secure account. Please try again.");
      return;
    }

    const authData = authResult.data;
    const supabaseId = authData.user.id;

    if (!supabaseId) {
      setSubmitting(false);
      setError("We could not create your secure account. Please try again.");
      return;
    }

    try {
      await syncAuthProfileMetadata(supabase, authData, form);

      const response = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...form,
          age: Number(form.age),
          supabaseId,
        }),
      });

      const payload = (await response.json()) as RegisterResponse & { error?: string };

      if (!response.ok) {
        if (authData.session && !authData.reusedCurrentSession) {
          await supabase.auth.signOut();
        }
        setError(payload.error ?? "We could not finish your patient registration.");
        setSubmitting(false);
        return;
      }

      const patientCode = formatPatientId(
        payload.id,
        payload.center?.centerCode,
        payload.createdAt
      );

      const signedInAfterRegistration = await completePostRegistrationSignIn(
        supabase,
        authData,
        form
      );

      setSuccessMessage(`Profile created. Your patient ID is ${patientCode}.`);

      window.setTimeout(() => {
        router.push(
          authData.session || signedInAfterRegistration ? "/" : "/login?registered=1"
        );
        router.refresh();
      }, 1200);
    } catch {
      if (authData.session && !authData.reusedCurrentSession) {
        await supabase.auth.signOut();
      }
      setError(
        authData.recoveredExistingAccount
          ? "We found your Supabase account, but the patient profile could not be linked yet."
          : "Your account was created, but the patient profile could not be saved."
      );
      setSubmitting(false);
      return;
    }

    setSubmitting(false);
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-8">
      <div className="w-full max-w-[1280px] rounded-[40px] border border-white/80 bg-white/60 p-4 shadow-[0_24px_80px_rgba(17,124,136,0.12)] backdrop-blur-2xl md:p-6">
        <div className="grid gap-4 xl:grid-cols-[0.78fr_1.22fr]">
          <section className="rounded-[32px] bg-[linear-gradient(165deg,#0f98a2_0%,#19c1d5_56%,#a2f4f8_100%)] p-8 text-white">
            <div className="flex h-14 w-14 items-center justify-center rounded-[20px] bg-white/18">
              <Activity className="h-7 w-7" />
            </div>
            <p className="mt-8 text-xs font-semibold uppercase tracking-[0.32em] text-cyan-50/82">
              New patient onboarding
            </p>
            <h1 className="mt-4 font-display text-[2.7rem] leading-[0.95]">
              Build a profile that follows the patient, not the paperwork.
            </h1>
            <p className="mt-5 max-w-sm text-sm leading-7 text-cyan-50/92">
              We collect the essentials for dialysis planning now, then tie everything to a
              dedicated patient ID for future bookings, care history, and nearby center
              suggestions.
            </p>

            <div className="mt-10 space-y-4">
              <div className="rounded-[22px] border border-white/20 bg-white/12 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-50/72">
                  Registration includes
                </p>
                <ul className="mt-3 space-y-2 text-sm leading-6 text-white/92">
                  <li>Name, age, and contact details</li>
                  <li>Dialysis history, frequency, access type, and medical notes</li>
                  <li>Location plus center selection for future nearest-center matching</li>
                </ul>
              </div>

              <div className="rounded-[22px] border border-white/20 bg-slate-950/18 p-4">
                <div className="flex items-start gap-3">
                  <MapPin className="mt-0.5 h-5 w-5 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold">Location-aware care</p>
                    <p className="mt-1 text-sm leading-6 text-cyan-50/88">
                      Enter your area or city and we will preselect the closest known center
                      when we can.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <Link
              href="/login"
              className="mt-10 inline-flex items-center gap-2 text-sm font-semibold text-white/92"
            >
              <ArrowLeft className="h-4 w-4" />
              I already have an account
            </Link>
          </section>

          <section className="rounded-[32px] bg-white/92 p-6 md:p-8 xl:p-10">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                  Patient registration
                </p>
                <h2 className="mt-3 font-display text-[2.2rem] leading-none text-slate-900">
                  Create your care profile
                </h2>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full bg-cyan-50 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-700">
                <ShieldCheck className="h-4 w-4" />
                Secure onboarding
              </div>
            </div>

            {recommendedCenter ? (
              <div className="mt-6 rounded-[22px] border border-cyan-100 bg-cyan-50 px-4 py-3 text-sm text-cyan-700">
                Recommended center based on your location:{" "}
                <span className="font-semibold">{getCenterLabel(recommendedCenter)}</span>
              </div>
            ) : null}

            {error ? (
              <div className="mt-6 rounded-[22px] border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                {error}
              </div>
            ) : null}

            {successMessage ? (
              <div className="mt-6 rounded-[22px] border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                {successMessage}
              </div>
            ) : null}

            <form onSubmit={handleSubmit} className="mt-8 space-y-8">
              <div>
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-400">
                    Account
                  </h3>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                      Full name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Priya Sharma"
                      className={inputClasses}
                      value={form.name}
                      onChange={(event) => updateField("name", event.target.value)}
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                      Email
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="patient@example.com"
                      className={inputClasses}
                      value={form.email}
                      onChange={(event) => updateField("email", event.target.value)}
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                      Password
                    </label>
                    <input
                      type="password"
                      required={!hasActiveSession}
                      placeholder={
                        hasActiveSession
                          ? "Already signed in. Only needed if you want to re-authenticate."
                          : "Create a strong password"
                      }
                      className={inputClasses}
                      value={form.password}
                      onChange={(event) => updateField("password", event.target.value)}
                    />
                    {hasActiveSession ? (
                      <p className="mt-2 text-xs leading-5 text-slate-500">
                        Your active Supabase session will be reused for registration.
                      </p>
                    ) : null}
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                      Phone
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="+91 98765 43210"
                      className={inputClasses}
                      value={form.phone}
                      onChange={(event) => updateField("phone", event.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="mb-4 text-sm font-semibold uppercase tracking-[0.24em] text-slate-400">
                  Personal and location
                </h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                      Age
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="120"
                      required
                      className={inputClasses}
                      value={form.age}
                      onChange={(event) => updateField("age", event.target.value)}
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                      Gender
                    </label>
                    <select
                      className={inputClasses}
                      value={form.gender}
                      onChange={(event) => updateField("gender", event.target.value)}
                    >
                      <option value="female">Female</option>
                      <option value="male">Male</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                      Location
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Nagpur, Dharampeth"
                      className={inputClasses}
                      value={form.location}
                      onChange={(event) => {
                        setManualCenterSelection(false);
                        updateField("location", event.target.value);
                      }}
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                      Preferred center
                    </label>
                    <select
                      required
                      disabled={loadingCenters}
                      className={inputClasses}
                      value={form.centerId}
                      onChange={(event) => {
                        setManualCenterSelection(true);
                        updateField("centerId", event.target.value);
                      }}
                    >
                      <option value="">
                        {loadingCenters ? "Loading centers..." : "Select a center"}
                      </option>
                      {centers.map((center) => (
                        <option key={center.id} value={center.id}>
                          {getCenterLabel(center)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="mb-4 text-sm font-semibold uppercase tracking-[0.24em] text-slate-400">
                  Dialysis essentials
                </h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                      Blood group
                    </label>
                    <input
                      type="text"
                      placeholder="O+"
                      className={inputClasses}
                      value={form.bloodGroup}
                      onChange={(event) => updateField("bloodGroup", event.target.value)}
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                      Primary diagnosis
                    </label>
                    <input
                      type="text"
                      placeholder="Chronic kidney disease"
                      className={inputClasses}
                      value={form.primaryDiagnosis}
                      onChange={(event) => updateField("primaryDiagnosis", event.target.value)}
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                      Dialysis type
                    </label>
                    <select
                      className={inputClasses}
                      value={form.dialysisType}
                      onChange={(event) => updateField("dialysisType", event.target.value)}
                    >
                      <option>Hemodialysis</option>
                      <option>Peritoneal dialysis</option>
                      <option>Planning consultation</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                      Frequency
                    </label>
                    <select
                      className={inputClasses}
                      value={form.dialysisFrequency}
                      onChange={(event) => updateField("dialysisFrequency", event.target.value)}
                    >
                      <option>Twice weekly</option>
                      <option>Thrice weekly</option>
                      <option>As advised</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                      Vascular access
                    </label>
                    <select
                      className={inputClasses}
                      value={form.vascularAccess}
                      onChange={(event) => updateField("vascularAccess", event.target.value)}
                    >
                      <option>AV fistula</option>
                      <option>Catheter</option>
                      <option>Graft</option>
                      <option>To be assessed</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                      Dialysis since
                    </label>
                    <input
                      type="date"
                      className={inputClasses}
                      value={form.dialysisSince}
                      onChange={(event) => updateField("dialysisSince", event.target.value)}
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                      Preferred slot
                    </label>
                    <select
                      className={inputClasses}
                      value={form.preferredSlot}
                      onChange={(event) => updateField("preferredSlot", event.target.value)}
                    >
                      <option>Morning</option>
                      <option>Afternoon</option>
                      <option>Evening</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                      Emergency contact name
                    </label>
                    <input
                      type="text"
                      placeholder="Rohan Sharma"
                      className={inputClasses}
                      value={form.emergencyContactName}
                      onChange={(event) => updateField("emergencyContactName", event.target.value)}
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                      Emergency contact phone
                    </label>
                    <input
                      type="tel"
                      placeholder="+91 99887 76655"
                      className={inputClasses}
                      value={form.emergencyContactPhone}
                      onChange={(event) => updateField("emergencyContactPhone", event.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="mb-4 text-sm font-semibold uppercase tracking-[0.24em] text-slate-400">
                  Medical history
                </h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                      Allergies
                    </label>
                    <textarea
                      placeholder="Any medication, food, or material allergies"
                      className={textAreaClasses}
                      value={form.allergies}
                      onChange={(event) => updateField("allergies", event.target.value)}
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                      Comorbidities
                    </label>
                    <textarea
                      placeholder="Diabetes, hypertension, cardiac history..."
                      className={textAreaClasses}
                      value={form.comorbidities}
                      onChange={(event) => updateField("comorbidities", event.target.value)}
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                    Additional medical history
                  </label>
                  <textarea
                    placeholder="Recent admissions, ongoing medications, transplant history, or anything the dialysis team should know."
                    className={textAreaClasses}
                    value={form.medicalHistory}
                    onChange={(event) => updateField("medicalHistory", event.target.value)}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting || loadingCenters}
                className="inline-flex w-full items-center justify-center gap-2 rounded-[20px] bg-[linear-gradient(135deg,#17bfd3_0%,#0e9a9d_100%)] px-5 py-4 text-sm font-semibold text-white shadow-[0_18px_34px_rgba(20,190,211,0.28)] transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {submitting ? "Creating your patient profile..." : "Complete registration"}
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}
