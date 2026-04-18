"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  CalendarDays,
  Clock3,
  MapPin,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { getCenterLabel, getRecommendedCenter, type CenterOption } from "@/lib/patient-utils";

type LocalUserPayload = {
  patientId?: number | null;
  centerId?: number | null;
  patient?: {
    location?: string | null;
    preferredSlot?: string | null;
    dialysisFrequency?: string | null;
    center?: CenterOption | null;
  } | null;
};

export default function BookDialysisPage() {
  const router = useRouter();
  const [centers, setCenters] = useState<CenterOption[]>([]);
  const [localUser, setLocalUser] = useState<LocalUserPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({
    centerId: "",
    date: "",
    time: "08:00",
  });

  useEffect(() => {
    let active = true;

    async function loadData() {
      try {
        const [centersResponse, userResponse] = await Promise.all([
          fetch("/api/centers"),
          fetch("/api/users/me"),
        ]);

        if (userResponse.status === 401) {
          router.push("/login");
          router.refresh();
          return;
        }

        if (!centersResponse.ok || !userResponse.ok) {
          throw new Error("Failed to fetch booking details.");
        }

        const centersData: CenterOption[] = await centersResponse.json();
        const userData = (await userResponse.json()) as LocalUserPayload;

        if (!active) {
          return;
        }

        setCenters(Array.isArray(centersData) ? centersData : []);
        setLocalUser(userData);

        const preferredCenterId =
          userData.patient?.center?.id ?? userData.centerId ?? null;
        const recommendedCenter = getRecommendedCenter(
          centersData,
          userData.patient?.location ?? ""
        );

        setForm((currentForm) => ({
          ...currentForm,
          centerId: String(recommendedCenter?.id ?? preferredCenterId ?? ""),
          time:
            userData.patient?.preferredSlot === "Afternoon"
              ? "12:00"
              : userData.patient?.preferredSlot === "Evening"
                ? "16:00"
                : "08:00",
        }));
      } catch {
        if (active) {
          setError("We could not load your booking details right now.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      active = false;
    };
  }, [router]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!localUser?.patientId) {
      setError("This account is not linked to a patient profile yet.");
      return;
    }

    setSubmitting(true);
    setError("");

    const dateTime = new Date(`${form.date}T${form.time}:00`);

    try {
      const response = await fetch("/api/appointments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          patientId: localUser.patientId,
          centerId: Number(form.centerId),
          date: dateTime.toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error("Booking failed.");
      }

      setSuccess(true);
      window.setTimeout(() => {
        router.push("/");
        router.refresh();
      }, 1400);
    } catch {
      setError("We could not confirm the session. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="rounded-[32px] border border-white/80 bg-white/82 px-6 py-14 text-center text-sm font-semibold text-cyan-700 shadow-[0_24px_80px_rgba(17,124,136,0.08)] backdrop-blur-xl">
        Loading your booking portal...
      </div>
    );
  }

  if (!localUser?.patientId) {
    return (
      <div className="rounded-[32px] border border-rose-100 bg-white/82 px-6 py-14 text-center shadow-[0_24px_80px_rgba(17,124,136,0.08)] backdrop-blur-xl">
        <p className="text-lg font-semibold text-rose-700">
          Your login is not connected to a patient profile yet.
        </p>
        <p className="mt-3 text-sm text-slate-500">
          Please complete registration first so we can book dialysis against your patient ID.
        </p>
      </div>
    );
  }

  const recommendedCenter = getRecommendedCenter(
    centers,
    localUser.patient?.location ?? ""
  );

  return (
    <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
      <section className="rounded-[32px] bg-[linear-gradient(165deg,#0d3c44_0%,#0f98a2_42%,#17bfd3_100%)] p-6 text-white shadow-[0_24px_80px_rgba(10,120,132,0.22)] md:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-100/74">
          Book dialysis
        </p>
        <h1 className="mt-4 font-display text-[2.6rem] leading-[0.95]">
          Schedule your next care session.
        </h1>
        <p className="mt-5 text-sm leading-7 text-cyan-50/92">
          Choose a center, date, and preferred time. Your patient ID is used automatically
          so the booking stays connected to your profile and treatment history.
        </p>

        <div className="mt-8 space-y-4">
          <div className="rounded-[24px] border border-white/14 bg-white/10 p-5">
            <div className="flex items-start gap-3">
              <MapPin className="mt-1 h-5 w-5" />
              <div>
                <p className="text-sm font-semibold">Registered location</p>
                <p className="mt-1 text-sm leading-6 text-cyan-50/88">
                  {localUser.patient?.location || "Add your location in profile"}
                </p>
              </div>
            </div>
          </div>
          <div className="rounded-[24px] border border-white/14 bg-white/10 p-5">
            <div className="flex items-start gap-3">
              <Building2 className="mt-1 h-5 w-5" />
              <div>
                <p className="text-sm font-semibold">Recommended center</p>
                <p className="mt-1 text-sm leading-6 text-cyan-50/88">
                  {recommendedCenter
                    ? getCenterLabel(recommendedCenter)
                    : localUser.patient?.center
                      ? getCenterLabel(localUser.patient.center)
                      : "Select the center that works best for you"}
                </p>
              </div>
            </div>
          </div>
          <div className="rounded-[24px] border border-white/14 bg-white/10 p-5">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-1 h-5 w-5" />
              <div>
                <p className="text-sm font-semibold">Care rhythm</p>
                <p className="mt-1 text-sm leading-6 text-cyan-50/88">
                  {localUser.patient?.dialysisFrequency || "As advised by your nephrology team"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[32px] border border-white/80 bg-white/84 p-6 shadow-[0_24px_80px_rgba(17,124,136,0.08)] backdrop-blur-xl md:p-8">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
              Session planner
            </p>
            <h2 className="mt-3 font-display text-[2.1rem] leading-none text-slate-900">
              Pick your slot
            </h2>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full bg-cyan-50 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-700">
            <Sparkles className="h-4 w-4" />
            Patient-linked booking
          </div>
        </div>

        {success ? (
          <div className="mt-8 rounded-[24px] border border-emerald-100 bg-emerald-50 px-5 py-4 text-sm font-medium text-emerald-700">
            Booking confirmed. Redirecting you to the dashboard...
          </div>
        ) : null}

        {error ? (
          <div className="mt-8 rounded-[24px] border border-rose-100 bg-rose-50 px-5 py-4 text-sm font-medium text-rose-700">
            {error}
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
              Dialysis center
            </label>
            <div className="relative">
              <Building2 className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <select
                required
                className="w-full rounded-[20px] border border-slate-200/80 bg-slate-50/90 py-3.5 pl-11 pr-4 text-sm font-medium text-slate-800 outline-none transition focus:border-cyan-400 focus:bg-white focus:ring-4 focus:ring-cyan-100"
                value={form.centerId}
                onChange={(event) =>
                  setForm((currentForm) => ({
                    ...currentForm,
                    centerId: event.target.value,
                  }))
                }
              >
                <option value="">Select a center</option>
                {centers.map((center) => (
                  <option key={center.id} value={center.id}>
                    {getCenterLabel(center)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                Date
              </label>
              <div className="relative">
                <CalendarDays className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="date"
                  required
                  min={new Date().toISOString().split("T")[0]}
                  className="w-full rounded-[20px] border border-slate-200/80 bg-slate-50/90 py-3.5 pl-11 pr-4 text-sm font-medium text-slate-800 outline-none transition focus:border-cyan-400 focus:bg-white focus:ring-4 focus:ring-cyan-100"
                  value={form.date}
                  onChange={(event) =>
                    setForm((currentForm) => ({
                      ...currentForm,
                      date: event.target.value,
                    }))
                  }
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                Time window
              </label>
              <div className="relative">
                <Clock3 className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <select
                  required
                  className="w-full rounded-[20px] border border-slate-200/80 bg-slate-50/90 py-3.5 pl-11 pr-4 text-sm font-medium text-slate-800 outline-none transition focus:border-cyan-400 focus:bg-white focus:ring-4 focus:ring-cyan-100"
                  value={form.time}
                  onChange={(event) =>
                    setForm((currentForm) => ({
                      ...currentForm,
                      time: event.target.value,
                    }))
                  }
                >
                  <option value="08:00">Morning, 8:00 AM to 12:00 PM</option>
                  <option value="12:00">Afternoon, 12:00 PM to 4:00 PM</option>
                  <option value="16:00">Evening, 4:00 PM to 8:00 PM</option>
                </select>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="inline-flex w-full items-center justify-center gap-2 rounded-[20px] bg-[linear-gradient(135deg,#17bfd3_0%,#0e9a9d_100%)] px-5 py-4 text-sm font-semibold text-white shadow-[0_18px_34px_rgba(20,190,211,0.28)] transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {submitting ? "Confirming your session..." : "Confirm booking"}
            <Sparkles className="h-4 w-4" />
          </button>
        </form>
      </section>
    </div>
  );
}
