import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Activity,
  ArrowRight,
  Building2,
  CalendarClock,
  HeartPulse,
  MapPin,
  ShieldPlus,
  Stethoscope,
  Waves,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCurrentAppUser } from "@/lib/current-user";
import { formatPatientId } from "@/lib/patient-utils";

function formatDateTime(value: Date) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(value);
}

export default async function DashboardPage() {
  const currentUser = await getCurrentAppUser();

  if (!currentUser) {
    redirect("/login");
  }

  if (currentUser.patientId) {
    const patient = await prisma.patient.findUnique({
      where: { id: currentUser.patientId },
      include: {
        center: {
          include: {
            city: true,
          },
        },
        appointments: {
          where: {
            date: {
              gte: new Date(),
            },
            status: "scheduled",
          },
          orderBy: {
            date: "asc",
          },
          take: 1,
        },
        sessions: {
          orderBy: {
            createdAt: "desc",
          },
          take: 1,
        },
      },
    });

    if (!patient) {
      redirect("/register");
    }

    const nextAppointment = patient.appointments[0] ?? null;
    const lastSession = patient.sessions[0] ?? null;
    const patientCode = formatPatientId(
      patient.id,
      patient.center.centerCode,
      patient.createdAt
    );

    return (
      <div className="space-y-6">
        <section className="overflow-hidden rounded-[34px] bg-[linear-gradient(135deg,#083f4a_0%,#0e8c98_45%,#20cadb_100%)] px-6 py-7 text-white shadow-[0_24px_80px_rgba(10,120,132,0.22)] md:px-8 md:py-8">
          <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.32em] text-cyan-100/72">
                Patient dashboard
              </p>
              <h1 className="mt-4 font-display text-[2.8rem] leading-[0.95] md:text-[3.4rem]">
                Hello, {patient.name.split(" ")[0]}.
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-cyan-50/92 md:text-base">
                Your care profile is ready. Use your patient ID to keep every booking,
                dialysis note, and location preference connected in one place.
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <span className="rounded-full border border-white/16 bg-white/12 px-4 py-2 text-sm font-semibold text-white">
                  Patient ID {patientCode}
                </span>
                <span className="rounded-full border border-white/16 bg-white/12 px-4 py-2 text-sm font-semibold text-white">
                  {patient.location || patient.center.city.name}
                </span>
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/book"
                  className="inline-flex items-center gap-2 rounded-[18px] bg-white px-5 py-3 text-sm font-semibold text-cyan-700 transition-transform hover:-translate-y-0.5"
                >
                  Book a session
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href={`/patients/${patient.id}`}
                  className="inline-flex items-center gap-2 rounded-[18px] border border-white/18 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/16"
                >
                  Open my profile
                </Link>
              </div>
            </div>

            <div className="rounded-[28px] border border-white/14 bg-white/10 p-5 backdrop-blur">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-white/16">
                  <CalendarClock className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-100/74">
                    Next dialysis session
                  </p>
                  <p className="mt-1 text-2xl font-semibold text-white">
                    {nextAppointment ? formatDateTime(nextAppointment.date) : "Not booked yet"}
                  </p>
                </div>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-[22px] bg-white/12 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-100/72">
                    Assigned center
                  </p>
                  <p className="mt-2 text-lg font-semibold text-white">{patient.center.name}</p>
                  <p className="mt-1 text-sm text-cyan-50/84">{patient.center.city.name}</p>
                </div>
                <div className="rounded-[22px] bg-white/12 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-100/72">
                    Preferred slot
                  </p>
                  <p className="mt-2 text-lg font-semibold text-white">
                    {patient.preferredSlot || "Morning"}
                  </p>
                  <p className="mt-1 text-sm text-cyan-50/84">
                    {patient.dialysisFrequency || "Session cadence not set"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            {
              label: "Diagnosis",
              value: patient.primaryDiagnosis || "Pending clinical review",
              icon: Stethoscope,
            },
            {
              label: "Dialysis type",
              value: patient.dialysisType || "Not recorded",
              icon: Waves,
            },
            {
              label: "Access",
              value: patient.vascularAccess || "To be assessed",
              icon: Activity,
            },
            {
              label: "Emergency contact",
              value: patient.emergencyContactName || "Add on profile",
              icon: ShieldPlus,
            },
          ].map((item) => {
            const Icon = item.icon;

            return (
              <article
                key={item.label}
                className="rounded-[28px] border border-white/80 bg-white/78 p-5 shadow-[0_24px_80px_rgba(17,124,136,0.08)] backdrop-blur-xl"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-cyan-50 text-cyan-700">
                  <Icon className="h-6 w-6" />
                </div>
                <p className="mt-5 text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                  {item.label}
                </p>
                <p className="mt-2 text-lg font-semibold leading-7 text-slate-900">
                  {item.value}
                </p>
              </article>
            );
          })}
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <article className="rounded-[32px] border border-white/80 bg-white/82 p-6 shadow-[0_24px_80px_rgba(17,124,136,0.08)] backdrop-blur-xl md:p-7">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-cyan-50 text-cyan-700">
                <HeartPulse className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                  Care snapshot
                </p>
                <h2 className="mt-1 font-display text-[2rem] leading-none text-slate-900">
                  Dialysis overview
                </h2>
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-[24px] bg-slate-50 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                  Blood group
                </p>
                <p className="mt-2 text-lg font-semibold text-slate-900">
                  {patient.bloodGroup || "Not provided"}
                </p>
              </div>
              <div className="rounded-[24px] bg-slate-50 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                  Dialysis since
                </p>
                <p className="mt-2 text-lg font-semibold text-slate-900">
                  {patient.dialysisSince
                    ? new Intl.DateTimeFormat("en-IN", {
                        month: "short",
                        year: "numeric",
                      }).format(patient.dialysisSince)
                    : "Not specified"}
                </p>
              </div>
              <div className="rounded-[24px] bg-slate-50 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                  Allergies
                </p>
                <p className="mt-2 text-base leading-7 text-slate-700">
                  {patient.allergies || "No allergies noted"}
                </p>
              </div>
              <div className="rounded-[24px] bg-slate-50 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                  Comorbidities
                </p>
                <p className="mt-2 text-base leading-7 text-slate-700">
                  {patient.comorbidities || "No additional conditions recorded"}
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-[24px] border border-dashed border-cyan-100 bg-cyan-50/70 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-700">
                Medical history note
              </p>
              <p className="mt-3 text-sm leading-7 text-cyan-900/80">
                {patient.medicalHistory ||
                  "Use your profile page to add more dialysis context, medications, and previous admissions."}
              </p>
            </div>
          </article>

          <article className="rounded-[32px] border border-white/80 bg-white/82 p-6 shadow-[0_24px_80px_rgba(17,124,136,0.08)] backdrop-blur-xl md:p-7">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-cyan-50 text-cyan-700">
                <MapPin className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                  Location and planning
                </p>
                <h2 className="mt-1 font-display text-[2rem] leading-none text-slate-900">
                  Center guidance
                </h2>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <div className="rounded-[24px] bg-slate-50 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                  Registered location
                </p>
                <p className="mt-2 text-lg font-semibold text-slate-900">
                  {patient.location || patient.center.city.name}
                </p>
              </div>
              <div className="rounded-[24px] bg-slate-50 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                  Assigned center
                </p>
                <p className="mt-2 text-lg font-semibold text-slate-900">{patient.center.name}</p>
                <p className="mt-1 text-sm text-slate-500">
                  {patient.center.address || patient.center.city.name}
                </p>
              </div>
              <div className="rounded-[24px] bg-[linear-gradient(135deg,#0f98a2_0%,#17bfd3_100%)] p-5 text-white">
                <div className="flex items-center gap-3">
                  <Building2 className="h-5 w-5" />
                  <p className="text-sm font-semibold">Booking tip</p>
                </div>
                <p className="mt-3 text-sm leading-7 text-cyan-50/92">
                  Your preferred location is stored now, so future center matching can steer
                  you toward the closest available dialysis slot.
                </p>
                <Link
                  href="/book"
                  className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-white"
                >
                  Choose my next slot
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
              <div className="rounded-[24px] border border-dashed border-slate-200 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                  Last recorded session
                </p>
                <p className="mt-2 text-lg font-semibold text-slate-900">
                  {lastSession
                    ? new Intl.DateTimeFormat("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      }).format(lastSession.createdAt)
                    : "No session logs yet"}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  {lastSession?.bp
                    ? `Blood pressure noted as ${lastSession.bp}`
                    : "Your future session readings will appear here."}
                </p>
              </div>
            </div>
          </article>
        </section>
      </div>
    );
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [totalPatients, totalSessions, appointmentsToday] = await Promise.all([
    prisma.patient.count(),
    prisma.session.count(),
    prisma.appointment.count({
      where: {
        date: { gte: today, lt: tomorrow },
        status: "scheduled",
      },
    }),
  ]);

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {[
        { label: "Patients", value: totalPatients, icon: Building2 },
        { label: "Session logs", value: totalSessions, icon: Activity },
        { label: "Appointments today", value: appointmentsToday, icon: CalendarClock },
      ].map((item) => {
        const Icon = item.icon;

        return (
          <article
            key={item.label}
            className="rounded-[28px] border border-white/80 bg-white/82 p-6 shadow-[0_24px_80px_rgba(17,124,136,0.08)] backdrop-blur-xl"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-cyan-50 text-cyan-700">
              <Icon className="h-6 w-6" />
            </div>
            <p className="mt-5 text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
              {item.label}
            </p>
            <p className="mt-2 text-4xl font-semibold text-slate-900">{item.value}</p>
          </article>
        );
      })}
    </div>
  );
}
