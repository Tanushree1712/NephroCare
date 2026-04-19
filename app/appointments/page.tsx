"use client";

import { useEffect, useState } from "react";
import {
  Building2,
  CalendarClock,
  CheckCircle2,
  Clock3,
  NotebookTabs,
  UserRound,
} from "lucide-react";

type Center = {
  id: number;
  name: string;
  city: {
    name: string;
  };
};

type Patient = {
  id: number;
  name: string;
  centerId: number;
  center: Center;
};

type Appointment = {
  id: number;
  date: string;
  status: string;
  patient: {
    id: number;
    name: string;
  };
  center: Center;
};

type WorkspaceUser = {
  patientId?: number | null;
  centerId?: number | null;
  role?: string | null;
  center?: Center | null;
};

type AppointmentFormState = {
  patientId: string;
  centerId: string;
  date: string;
};

const inputClasses =
  "w-full rounded-[18px] border border-slate-200/80 bg-slate-50/90 px-4 py-3 text-sm font-medium text-slate-800 outline-none transition focus:border-cyan-400 focus:bg-white focus:ring-4 focus:ring-cyan-100";

const initialForm: AppointmentFormState = {
  patientId: "",
  centerId: "",
  date: "",
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

export default function AppointmentPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [centers, setCenters] = useState<Center[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [viewer, setViewer] = useState<WorkspaceUser | null>(null);
  const [form, setForm] = useState<AppointmentFormState>(initialForm);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    void (async () => {
      try {
        const [patientsResponse, centersResponse, appointmentsResponse, userResponse] =
          await Promise.all([
            fetch("/api/patients"),
            fetch("/api/centers"),
            fetch("/api/appointments"),
            fetch("/api/users/me"),
          ]);

        if (
          !patientsResponse.ok ||
          !centersResponse.ok ||
          !appointmentsResponse.ok ||
          !userResponse.ok
        ) {
          throw new Error("Failed to load appointment data.");
        }

        const [patientsData, centersData, appointmentsData, userData] = (await Promise.all([
          patientsResponse.json(),
          centersResponse.json(),
          appointmentsResponse.json(),
          userResponse.json(),
        ])) as [Patient[], Center[], Appointment[], WorkspaceUser];

        if (!active) {
          return;
        }

        setPatients(Array.isArray(patientsData) ? patientsData : []);
        setCenters(Array.isArray(centersData) ? centersData : []);
        setAppointments(Array.isArray(appointmentsData) ? appointmentsData : []);
        setViewer(userData);

        if (userData.centerId && !userData.patientId) {
          setForm((currentForm) => ({
            ...currentForm,
            centerId: currentForm.centerId || String(userData.centerId),
          }));
        }
      } catch {
        if (active) {
          setError("We could not load appointments right now.");
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

  async function refreshAppointments() {
    const response = await fetch("/api/appointments");
    if (!response.ok) {
      throw new Error("Failed to refresh appointments");
    }

    const data = (await response.json()) as Appointment[];
    setAppointments(Array.isArray(data) ? data : []);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/appointments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to create appointment.");
      }

      setForm(initialForm);
      await refreshAppointments();
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "Failed to create appointment."
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function updateStatus(id: number, status: string) {
    setError("");

    try {
      const response = await fetch(`/api/appointments/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        throw new Error("Failed to update status.");
      }

      await refreshAppointments();
    } catch (statusError) {
      setError(
        statusError instanceof Error ? statusError.message : "Failed to update status."
      );
    }
  }

  const scheduledCount = appointments.filter(
    (appointment) => appointment.status === "scheduled"
  ).length;
  const completedCount = appointments.filter(
    (appointment) => appointment.status === "completed"
  ).length;
  const centerScoped = Boolean(viewer?.centerId && !viewer?.patientId);
  const centerName = viewer?.center?.name ?? "your center";

  return (
    <div className="space-y-6">
      <section className="rounded-[34px] bg-[linear-gradient(135deg,#073d48_0%,#0f98a2_48%,#17bfd3_100%)] px-6 py-7 text-white shadow-[0_24px_80px_rgba(10,120,132,0.22)] md:px-8 md:py-8">
        <div className="grid gap-8 xl:grid-cols-[1.02fr_0.98fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-100/74">
              {centerScoped ? "Center bookings" : "Appointment planning"}
            </p>
            <h1 className="mt-4 font-display text-[2.8rem] leading-[0.95]">
              {centerScoped
                ? `Manage bookings for ${centerName}.`
                : "Schedule and manage dialysis visits."}
            </h1>
            <p className="mt-5 max-w-2xl text-sm leading-7 text-cyan-50/92">
              {centerScoped
                ? "Review bookings for your center, update their status, and add new sessions without leaving your center-scoped desk."
                : "Coordinate upcoming sessions across centers, keep patient records aligned, and update booking status in one place."}
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {[
                { label: "Scheduled", value: scheduledCount, icon: CalendarClock },
                { label: "Completed", value: completedCount, icon: CheckCircle2 },
                { label: "Total bookings", value: appointments.length, icon: NotebookTabs },
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
                <CalendarClock className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-100/72">
                  New appointment
                </p>
                <h2 className="mt-1 font-display text-[2rem] leading-none text-white">
                  Book a session
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
                  Patient
                </label>
                <select
                  className={inputClasses}
                  value={form.patientId}
                  onChange={(event) => {
                    const selectedPatient = patients.find(
                      (patient) => patient.id === Number(event.target.value)
                    );

                    setForm((currentForm) => ({
                      ...currentForm,
                      patientId: event.target.value,
                      centerId: selectedPatient ? String(selectedPatient.centerId) : "",
                    }));
                  }}
                >
                  <option value="">Select patient</option>
                  {patients.map((patient) => (
                    <option key={patient.id} value={patient.id}>
                      {patient.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.24em] text-cyan-100/72">
                    {centerScoped ? "Assigned center" : "Center"}
                  </label>
                  <select
                    className={inputClasses}
                    value={form.centerId}
                    disabled={centerScoped}
                    onChange={(event) =>
                      setForm((currentForm) => ({
                        ...currentForm,
                        centerId: event.target.value,
                      }))
                    }
                  >
                    <option value="">Select center</option>
                    {centers.map((center) => (
                      <option key={center.id} value={center.id}>
                        {center.name} ({center.city.name})
                      </option>
                    ))}
                  </select>
                  {centerScoped ? (
                    <p className="mt-2 text-xs leading-5 text-cyan-50/84">
                      New bookings created here stay linked to {centerName}.
                    </p>
                  ) : null}
                </div>
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.24em] text-cyan-100/72">
                    Date and time
                  </label>
                  <input
                    type="datetime-local"
                    className={inputClasses}
                    value={form.date}
                    onChange={(event) =>
                      setForm((currentForm) => ({ ...currentForm, date: event.target.value }))
                    }
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="inline-flex w-full items-center justify-center gap-2 rounded-[18px] bg-white px-5 py-3 text-sm font-semibold text-cyan-700 transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {submitting ? "Booking appointment..." : "Create appointment"}
              </button>
            </form>
          </div>
        </div>
      </section>

      <section className="rounded-[32px] border border-white/80 bg-white/82 p-6 shadow-[0_24px_80px_rgba(17,124,136,0.08)] backdrop-blur-xl md:p-7">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
            Appointment queue
          </p>
          <h2 className="mt-2 font-display text-[2rem] leading-none text-slate-900">
            Upcoming and recent bookings
          </h2>
        </div>

        {loading ? (
          <div className="mt-8 rounded-[24px] border border-dashed border-slate-200 px-5 py-10 text-center text-sm font-medium text-slate-500">
            Loading appointments...
          </div>
        ) : appointments.length === 0 ? (
          <div className="mt-8 rounded-[24px] border border-dashed border-slate-200 px-5 py-10 text-center text-sm font-medium text-slate-500">
            No appointments have been created yet.
          </div>
        ) : (
          <div className="mt-8 space-y-4">
            {appointments.map((appointment) => (
              <article
                key={appointment.id}
                className="grid gap-4 rounded-[28px] bg-slate-50 p-5 lg:grid-cols-[1.1fr_1fr_auto]"
              >
                <div>
                  <div className="flex items-center gap-2 text-slate-900">
                    <UserRound className="h-4 w-4 text-cyan-700" />
                    <h3 className="text-lg font-semibold">{appointment.patient.name}</h3>
                  </div>
                  <p className="mt-3 flex items-center gap-2 text-sm text-slate-600">
                    <Clock3 className="h-4 w-4 text-cyan-700" />
                    {formatDateTime(appointment.date)}
                  </p>
                </div>

                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-1">
                  <div className="rounded-[20px] bg-white px-4 py-3 text-sm text-slate-600">
                    <div className="flex items-center gap-2 text-slate-900">
                      <Building2 className="h-4 w-4 text-cyan-700" />
                      <span className="font-semibold">{appointment.center.name}</span>
                    </div>
                    <p className="mt-1">{appointment.center.city.name}</p>
                  </div>
                  <div className="rounded-[20px] bg-white px-4 py-3 text-sm text-slate-600">
                    <div className="flex items-center gap-2 text-slate-900">
                      <NotebookTabs className="h-4 w-4 text-cyan-700" />
                      <span className="font-semibold capitalize">{appointment.status}</span>
                    </div>
                    <p className="mt-1">Booking #{appointment.id}</p>
                  </div>
                </div>

                <div className="flex items-center">
                  <select
                    className={`${inputClasses} min-w-40 capitalize`}
                    value={appointment.status}
                    onChange={(event) => updateStatus(appointment.id, event.target.value)}
                  >
                    <option value="scheduled">Scheduled</option>
                    <option value="completed">Completed</option>
                    <option value="missed">Missed</option>
                  </select>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
