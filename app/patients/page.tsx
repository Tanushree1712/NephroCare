"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  Building2,
  HeartPulse,
  MapPin,
  Plus,
  Search,
  UserPlus2,
  Users,
} from "lucide-react";

type Center = {
  id: number;
  name: string;
  address?: string | null;
  city: {
    name: string;
  };
};

type Patient = {
  id: number;
  name: string;
  age: number;
  gender: string;
  phone: string;
  location?: string | null;
  primaryDiagnosis?: string | null;
  centerId: number;
  createdAt: string;
  center: Center;
};

type PatientFormState = {
  name: string;
  age: string;
  gender: string;
  phone: string;
  location: string;
  primaryDiagnosis: string;
  bloodGroup: string;
  centerId: string;
};

const inputClasses =
  "w-full rounded-[18px] border border-slate-200/80 bg-slate-50/90 px-4 py-3 text-sm font-medium text-slate-800 outline-none transition focus:border-cyan-400 focus:bg-white focus:ring-4 focus:ring-cyan-100";

const initialForm: PatientFormState = {
  name: "",
  age: "",
  gender: "female",
  phone: "",
  location: "",
  primaryDiagnosis: "",
  bloodGroup: "",
  centerId: "",
};

export default function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [centers, setCenters] = useState<Center[]>([]);
  const [form, setForm] = useState<PatientFormState>(initialForm);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    void (async () => {
      try {
        const [patientsResponse, centersResponse] = await Promise.all([
          fetch("/api/patients"),
          fetch("/api/centers"),
        ]);

        if (!patientsResponse.ok || !centersResponse.ok) {
          throw new Error("Failed to load patient data.");
        }

        const [patientsData, centersData] = (await Promise.all([
          patientsResponse.json(),
          centersResponse.json(),
        ])) as [Patient[], Center[]];

        if (!active) {
          return;
        }

        setPatients(Array.isArray(patientsData) ? patientsData : []);
        setCenters(Array.isArray(centersData) ? centersData : []);
      } catch {
        if (active) {
          setError("We could not load patients right now.");
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

  async function refreshPatients() {
    const response = await fetch("/api/patients");
    if (!response.ok) {
      throw new Error("Failed to refresh patients");
    }

    const data = (await response.json()) as Patient[];
    setPatients(Array.isArray(data) ? data : []);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/patients", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...form,
          age: Number(form.age),
        }),
      });

      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to create patient.");
      }

      setForm(initialForm);
      await refreshPatients();
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "Failed to create patient."
      );
    } finally {
      setSubmitting(false);
    }
  }

  const filteredPatients = patients.filter((patient) => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return true;
    }

    return [
      patient.name,
      patient.center.name,
      patient.center.city.name,
      patient.location ?? "",
      patient.primaryDiagnosis ?? "",
    ]
      .join(" ")
      .toLowerCase()
      .includes(query);
  });

  const centerCount = new Set(patients.map((patient) => patient.centerId)).size;

  return (
    <div className="space-y-6">
      <section className="rounded-[34px] bg-[linear-gradient(135deg,#073d48_0%,#0f98a2_48%,#17bfd3_100%)] px-6 py-7 text-white shadow-[0_24px_80px_rgba(10,120,132,0.22)] md:px-8 md:py-8">
        <div className="grid gap-8 xl:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-100/74">
              Admin workspace
            </p>
            <h1 className="mt-4 font-display text-[2.8rem] leading-[0.95]">
              Patient registry and onboarding.
            </h1>
            <p className="mt-5 max-w-2xl text-sm leading-7 text-cyan-50/92">
              Add new patients, review location and diagnosis at a glance, and jump directly
              into each patient profile for ongoing coordination.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {[
                { label: "Registered patients", value: patients.length, icon: Users },
                { label: "Active centers", value: centerCount, icon: Building2 },
                { label: "New intakes", value: filteredPatients.length, icon: HeartPulse },
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
                <UserPlus2 className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-100/72">
                  Quick create
                </p>
                <h2 className="mt-1 font-display text-[2rem] leading-none text-white">
                  Add patient
                </h2>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              {error ? (
                <div className="rounded-[18px] border border-rose-200/70 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                  {error}
                </div>
              ) : null}

              <div className="grid gap-4 md:grid-cols-2">
                <input
                  className={inputClasses}
                  placeholder="Full name"
                  value={form.name}
                  onChange={(event) =>
                    setForm((currentForm) => ({ ...currentForm, name: event.target.value }))
                  }
                />
                <input
                  className={inputClasses}
                  placeholder="Phone"
                  value={form.phone}
                  onChange={(event) =>
                    setForm((currentForm) => ({ ...currentForm, phone: event.target.value }))
                  }
                />
                <input
                  type="number"
                  min="1"
                  max="120"
                  className={inputClasses}
                  placeholder="Age"
                  value={form.age}
                  onChange={(event) =>
                    setForm((currentForm) => ({ ...currentForm, age: event.target.value }))
                  }
                />
                <select
                  className={inputClasses}
                  value={form.gender}
                  onChange={(event) =>
                    setForm((currentForm) => ({ ...currentForm, gender: event.target.value }))
                  }
                >
                  <option value="female">Female</option>
                  <option value="male">Male</option>
                  <option value="other">Other</option>
                </select>
                <input
                  className={inputClasses}
                  placeholder="Location"
                  value={form.location}
                  onChange={(event) =>
                    setForm((currentForm) => ({ ...currentForm, location: event.target.value }))
                  }
                />
                <input
                  className={inputClasses}
                  placeholder="Primary diagnosis"
                  value={form.primaryDiagnosis}
                  onChange={(event) =>
                    setForm((currentForm) => ({
                      ...currentForm,
                      primaryDiagnosis: event.target.value,
                    }))
                  }
                />
                <input
                  className={inputClasses}
                  placeholder="Blood group"
                  value={form.bloodGroup}
                  onChange={(event) =>
                    setForm((currentForm) => ({
                      ...currentForm,
                      bloodGroup: event.target.value,
                    }))
                  }
                />
                <select
                  className={inputClasses}
                  value={form.centerId}
                  onChange={(event) =>
                    setForm((currentForm) => ({ ...currentForm, centerId: event.target.value }))
                  }
                >
                  <option value="">Select center</option>
                  {centers.map((center) => (
                    <option key={center.id} value={center.id}>
                      {center.name} ({center.city.name})
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="inline-flex w-full items-center justify-center gap-2 rounded-[18px] bg-white px-5 py-3 text-sm font-semibold text-cyan-700 transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
              >
                <Plus className="h-4 w-4" />
                {submitting ? "Creating patient..." : "Create patient"}
              </button>
            </form>
          </div>
        </div>
      </section>

      <section className="rounded-[32px] border border-white/80 bg-white/82 p-6 shadow-[0_24px_80px_rgba(17,124,136,0.08)] backdrop-blur-xl md:p-7">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
              Patient list
            </p>
            <h2 className="mt-2 font-display text-[2rem] leading-none text-slate-900">
              Search and review
            </h2>
          </div>
          <div className="relative w-full max-w-md">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              className={`${inputClasses} pl-11`}
              placeholder="Search name, center, city, or diagnosis"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="mt-8 rounded-[24px] border border-dashed border-slate-200 px-5 py-10 text-center text-sm font-medium text-slate-500">
            Loading patient registry...
          </div>
        ) : filteredPatients.length === 0 ? (
          <div className="mt-8 rounded-[24px] border border-dashed border-slate-200 px-5 py-10 text-center text-sm font-medium text-slate-500">
            No patients match your current search.
          </div>
        ) : (
          <div className="mt-8 grid gap-4 xl:grid-cols-2">
            {filteredPatients.map((patient) => (
              <article
                key={patient.id}
                className="rounded-[28px] bg-slate-50 p-5 transition-transform hover:-translate-y-0.5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                      Patient profile
                    </p>
                    <h3 className="mt-2 text-xl font-semibold text-slate-900">{patient.name}</h3>
                    <p className="mt-1 text-sm text-slate-500">
                      {patient.age} years, {patient.gender}
                    </p>
                  </div>
                  <div className="rounded-full bg-white px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-700 shadow-sm">
                    #{patient.id}
                  </div>
                </div>

                <div className="mt-5 grid gap-3 md:grid-cols-2">
                  <div className="rounded-[20px] bg-white px-4 py-3 text-sm text-slate-600">
                    <div className="flex items-center gap-2 text-slate-900">
                      <Building2 className="h-4 w-4 text-cyan-700" />
                      <span className="font-semibold">{patient.center.name}</span>
                    </div>
                    <p className="mt-1">{patient.center.city.name}</p>
                  </div>
                  <div className="rounded-[20px] bg-white px-4 py-3 text-sm text-slate-600">
                    <div className="flex items-center gap-2 text-slate-900">
                      <MapPin className="h-4 w-4 text-cyan-700" />
                      <span className="font-semibold">Location</span>
                    </div>
                    <p className="mt-1">{patient.location || "Not recorded"}</p>
                  </div>
                  <div className="rounded-[20px] bg-white px-4 py-3 text-sm text-slate-600 md:col-span-2">
                    <div className="flex items-center gap-2 text-slate-900">
                      <HeartPulse className="h-4 w-4 text-cyan-700" />
                      <span className="font-semibold">Diagnosis</span>
                    </div>
                    <p className="mt-1">
                      {patient.primaryDiagnosis || "No diagnosis captured yet"}
                    </p>
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-between gap-4">
                  <p className="text-sm text-slate-500">{patient.phone}</p>
                  <Link
                    href={`/patients/${patient.id}`}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-cyan-700"
                  >
                    Open profile
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
