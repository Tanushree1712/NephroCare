"use client";

import { useEffect, useState } from "react";
import {
  Activity,
  Clock3,
  HeartPulse,
  NotebookPen,
  Scale,
  ShieldAlert,
} from "lucide-react";

type Appointment = {
  id: number;
  date: string;
  status: string;
  patient: {
    id: number;
    name: string;
  };
  center: {
    name: string;
    city: {
      name: string;
    };
  };
};

type Session = {
  id: number;
  bp: string | null;
  weightBefore: number | null;
  weightAfter: number | null;
  notes: string | null;
  createdAt: string;
  patient: {
    name: string;
  };
  appointment: {
    center: {
      name: string;
      city: {
        name: string;
      };
    };
  };
};

type SessionFormState = {
  appointmentId: string;
  patientId: string;
  weightBefore: string;
  weightAfter: string;
  bp: string;
  notes: string;
};

const inputClasses =
  "w-full rounded-[18px] border border-slate-200/80 bg-slate-50/90 px-4 py-3 text-sm font-medium text-slate-800 outline-none transition focus:border-cyan-400 focus:bg-white focus:ring-4 focus:ring-cyan-100";

const initialForm: SessionFormState = {
  appointmentId: "",
  patientId: "",
  weightBefore: "",
  weightAfter: "",
  bp: "",
  notes: "",
};

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export default function SessionsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [form, setForm] = useState<SessionFormState>(initialForm);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    void (async () => {
      try {
        const [appointmentsResponse, sessionsResponse] = await Promise.all([
          fetch("/api/appointments"),
          fetch("/api/sessions"),
        ]);

        if (!appointmentsResponse.ok || !sessionsResponse.ok) {
          throw new Error("Failed to load session data.");
        }

        const [appointmentsData, sessionsData] = (await Promise.all([
          appointmentsResponse.json(),
          sessionsResponse.json(),
        ])) as [Appointment[], Session[]];

        if (!active) {
          return;
        }

        setAppointments(Array.isArray(appointmentsData) ? appointmentsData : []);
        setSessions(Array.isArray(sessionsData) ? sessionsData : []);
      } catch {
        if (active) {
          setError("We could not load session logs right now.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  async function refreshSessions() {
    const response = await fetch("/api/sessions");
    if (!response.ok) {
      throw new Error("Failed to refresh sessions");
    }

    const data = (await response.json()) as Session[];
    setSessions(Array.isArray(data) ? data : []);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to log dialysis session.");
      }

      setForm(initialForm);
      await refreshSessions();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Failed to log dialysis session."
      );
    } finally {
      setSubmitting(false);
    }
  }

  const scheduledAppointments = appointments.filter(
    (appointment) => appointment.status === "scheduled"
  );

  return (
    <div className="space-y-6">
      <section className="rounded-[34px] bg-[linear-gradient(135deg,#073d48_0%,#0f98a2_48%,#17bfd3_100%)] px-6 py-7 text-white shadow-[0_24px_80px_rgba(10,120,132,0.22)] md:px-8 md:py-8">
        <div className="grid gap-8 xl:grid-cols-[1.02fr_0.98fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-100/74">
              Session logging
            </p>
            <h1 className="mt-4 font-display text-[2.8rem] leading-[0.95]">
              Capture each dialysis session clearly.
            </h1>
            <p className="mt-5 max-w-2xl text-sm leading-7 text-cyan-50/92">
              Record post-treatment vitals, weights, and notes so the patient profile stays
              clinically useful for future visits.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {[
                { label: "Logged sessions", value: sessions.length, icon: Activity },
                {
                  label: "Ready appointments",
                  value: scheduledAppointments.length,
                  icon: Clock3,
                },
                { label: "Latest charting", value: sessions.length > 0 ? "Live" : "Pending", icon: NotebookPen },
              ].map((item) => {
                const Icon = item.icon;

                return (
                  <div key={item.label} className="rounded-[24px] bg-white/10 p-5">
                    <div className="flex h-11 w-11 items-center justify-center rounded-[16px] bg-white/14">
                      <Icon className="h-5 w-5" />
                    </div>
                    <p className="mt-4 text-xs font-semibold uppercase tracking-[0.24em] text-cyan-100/72">
                      {item.label}
                    </p>
                    <p className="mt-2 text-3xl font-semibold text-white">{item.value}</p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-[30px] border border-white/14 bg-white/10 p-5 backdrop-blur md:p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-white/14">
                <NotebookPen className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-100/72">
                  New session log
                </p>
                <h2 className="mt-1 font-display text-[2rem] leading-none text-white">
                  Chart treatment
                </h2>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              {error ? (
                <div className="rounded-[18px] border border-rose-200/70 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                  {error}
                </div>
              ) : null}

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.24em] text-cyan-100/72">
                  Appointment
                </label>
                <select
                  className={inputClasses}
                  value={form.appointmentId}
                  onChange={(event) => {
                    const selectedAppointment = appointments.find(
                      (appointment) => appointment.id === Number(event.target.value)
                    );

                    setForm((currentForm) => ({
                      ...currentForm,
                      appointmentId: event.target.value,
                      patientId: selectedAppointment
                        ? String(selectedAppointment.patient.id)
                        : "",
                    }));
                  }}
                >
                  <option value="">Select appointment</option>
                  {appointments.map((appointment) => (
                    <option key={appointment.id} value={appointment.id}>
                      {appointment.patient.name} - {formatDateTime(appointment.date)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <input
                  className={inputClasses}
                  placeholder="Weight before"
                  value={form.weightBefore}
                  onChange={(event) =>
                    setForm((currentForm) => ({
                      ...currentForm,
                      weightBefore: event.target.value,
                    }))
                  }
                />
                <input
                  className={inputClasses}
                  placeholder="Weight after"
                  value={form.weightAfter}
                  onChange={(event) =>
                    setForm((currentForm) => ({
                      ...currentForm,
                      weightAfter: event.target.value,
                    }))
                  }
                />
              </div>

              <input
                className={inputClasses}
                placeholder="Blood pressure, for example 120/80"
                value={form.bp}
                onChange={(event) =>
                  setForm((currentForm) => ({ ...currentForm, bp: event.target.value }))
                }
              />

              <textarea
                className={`${inputClasses} min-h-28 resize-none`}
                placeholder="Clinical notes"
                value={form.notes}
                onChange={(event) =>
                  setForm((currentForm) => ({ ...currentForm, notes: event.target.value }))
                }
              />

              <button
                type="submit"
                disabled={submitting}
                className="inline-flex w-full items-center justify-center gap-2 rounded-[18px] bg-white px-5 py-3 text-sm font-semibold text-cyan-700 transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {submitting ? "Saving session..." : "Save session"}
              </button>
            </form>
          </div>
        </div>
      </section>

      <section className="rounded-[32px] border border-white/80 bg-white/82 p-6 shadow-[0_24px_80px_rgba(17,124,136,0.08)] backdrop-blur-xl md:p-7">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
            Session timeline
          </p>
          <h2 className="mt-2 font-display text-[2rem] leading-none text-slate-900">
            Recent treatment entries
          </h2>
        </div>

        {loading ? (
          <div className="mt-8 rounded-[24px] border border-dashed border-slate-200 px-5 py-10 text-center text-sm font-medium text-slate-500">
            Loading session logs...
          </div>
        ) : sessions.length === 0 ? (
          <div className="mt-8 rounded-[24px] border border-dashed border-slate-200 px-5 py-10 text-center text-sm font-medium text-slate-500">
            No sessions have been logged yet.
          </div>
        ) : (
          <div className="mt-8 space-y-4">
            {sessions.map((session) => (
              <article
                key={session.id}
                className="grid gap-4 rounded-[28px] bg-slate-50 p-5 lg:grid-cols-[1.05fr_1fr]"
              >
                <div>
                  <div className="flex items-center gap-2 text-slate-900">
                    <HeartPulse className="h-4 w-4 text-cyan-700" />
                    <h3 className="text-lg font-semibold">{session.patient.name}</h3>
                  </div>
                  <p className="mt-3 flex items-center gap-2 text-sm text-slate-600">
                    <Clock3 className="h-4 w-4 text-cyan-700" />
                    {formatDateTime(session.createdAt)}
                  </p>
                  <p className="mt-2 text-sm text-slate-500">
                    {session.appointment.center.name} ({session.appointment.center.city.name})
                  </p>
                </div>

                <div className="grid gap-3 md:grid-cols-3">
                  <div className="rounded-[20px] bg-white px-4 py-3 text-sm text-slate-600">
                    <div className="flex items-center gap-2 text-slate-900">
                      <Scale className="h-4 w-4 text-cyan-700" />
                      <span className="font-semibold">Before</span>
                    </div>
                    <p className="mt-1">{session.weightBefore ?? "N/A"} kg</p>
                  </div>
                  <div className="rounded-[20px] bg-white px-4 py-3 text-sm text-slate-600">
                    <div className="flex items-center gap-2 text-slate-900">
                      <Scale className="h-4 w-4 text-cyan-700" />
                      <span className="font-semibold">After</span>
                    </div>
                    <p className="mt-1">{session.weightAfter ?? "N/A"} kg</p>
                  </div>
                  <div className="rounded-[20px] bg-white px-4 py-3 text-sm text-slate-600">
                    <div className="flex items-center gap-2 text-slate-900">
                      <ShieldAlert className="h-4 w-4 text-cyan-700" />
                      <span className="font-semibold">BP</span>
                    </div>
                    <p className="mt-1">{session.bp || "Not captured"}</p>
                  </div>
                </div>

                {session.notes ? (
                  <div className="rounded-[20px] bg-white px-4 py-3 text-sm leading-7 text-slate-600 lg:col-span-2">
                    {session.notes}
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
