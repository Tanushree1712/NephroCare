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
import { getCenterOperationsSummary } from "@/lib/center-capacity";
import { getCurrentAppUser, getCurrentAuthUser } from "@/lib/current-user";
import { getIndiaDayRange } from "@/lib/appointment-slots";
import { formatPatientId } from "@/lib/patient-utils";
import { getCenterScopeId, getUserPortalKind } from "@/lib/user-access";

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
    const authUser = await getCurrentAuthUser();
    redirect(authUser ? "/register" : "/login");
  }

  const portalKind = getUserPortalKind(currentUser);

  if (portalKind === "patient") {
    if (!currentUser.patientId) {
      redirect("/register");
    }

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
        <section className="overflow-hidden rounded-[30px] bg-[linear-gradient(135deg,#083f4a_0%,#0e8c98_45%,#20cadb_100%)] px-5 py-6 text-white shadow-[0_24px_80px_rgba(10,120,132,0.22)] sm:rounded-[34px] sm:px-6 sm:py-7 md:px-8 md:py-8">
          <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.32em] text-cyan-100/72">
                Patient dashboard
              </p>
              <h1 className="mt-4 font-display text-[2.2rem] leading-[0.95] sm:text-[2.8rem] md:text-[3.4rem]">
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
                  className="inline-flex w-full items-center justify-center gap-2 rounded-[18px] bg-white px-5 py-3 text-sm font-semibold !text-black transition-transform hover:-translate-y-0.5 sm:w-auto"
                >
                  Book a session
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href={`/patients/${patient.id}`}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-[18px] border border-white/18 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/16 sm:w-auto"
                >
                  Open my profile
                </Link>
              </div>
            </div>

            <div className="rounded-[26px] border border-white/14 bg-white/10 p-4 backdrop-blur sm:rounded-[28px] sm:p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-white/16">
                  <CalendarClock className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-100/74">
                    Next dialysis session
                  </p>
                  <p className="mt-1 text-xl font-semibold text-white sm:text-2xl">
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
          <article className="rounded-[30px] border border-white/80 bg-white/82 p-5 shadow-[0_24px_80px_rgba(17,124,136,0.08)] backdrop-blur-xl sm:rounded-[32px] sm:p-6 md:p-7">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-cyan-50 text-cyan-700">
                <HeartPulse className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                  Care snapshot
                </p>
                <h2 className="mt-1 font-display text-[1.75rem] leading-none text-slate-900 sm:text-[2rem]">
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

          <article className="rounded-[30px] border border-white/80 bg-white/82 p-5 shadow-[0_24px_80px_rgba(17,124,136,0.08)] backdrop-blur-xl sm:rounded-[32px] sm:p-6 md:p-7">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-cyan-50 text-cyan-700">
                <MapPin className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                  Location and planning
                </p>
                <h2 className="mt-1 font-display text-[1.75rem] leading-none text-slate-900 sm:text-[2rem]">
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

  const centerScopeId = getCenterScopeId(currentUser);

  if (centerScopeId) {
    const now = new Date();
    const { start: today, end: tomorrow } = getIndiaDayRange(now);

    const [
      center,
      totalPatients,
      totalSessions,
      appointmentsToday,
      recentPatients,
      upcomingAppointments,
    ] = await Promise.all([
      prisma.center.findUnique({
        where: { id: centerScopeId },
        include: {
          city: true,
        },
      }),
      prisma.patient.count({
        where: { centerId: centerScopeId },
      }),
      prisma.session.count({
        where: {
          appointment: {
            centerId: centerScopeId,
          },
        },
      }),
      prisma.appointment.count({
        where: {
          centerId: centerScopeId,
          date: { gte: today, lt: tomorrow },
          status: "scheduled",
        },
      }),
      prisma.patient.findMany({
        where: { centerId: centerScopeId },
        orderBy: {
          createdAt: "desc",
        },
        take: 4,
      }),
      prisma.appointment.findMany({
        where: {
          centerId: centerScopeId,
          date: {
            gte: now,
          },
        },
        orderBy: {
          date: "asc",
        },
        take: 5,
        include: {
          patient: true,
          center: {
            include: {
              city: true,
            },
          },
        },
      }),
    ]);

    if (!center) {
      redirect("/center-login");
    }

    const operations = await getCenterOperationsSummary(prisma, {
      centerId: center.id,
      referenceDate: now,
    });

    return (
      <div className="space-y-6">
        <section className="overflow-hidden rounded-[30px] bg-[linear-gradient(135deg,#083844_0%,#0f8797_44%,#21c7d9_100%)] px-5 py-6 text-white shadow-[0_24px_80px_rgba(10,120,132,0.22)] sm:rounded-[34px] sm:px-6 sm:py-7 md:px-8 md:py-8">
          <div className="grid gap-8 lg:grid-cols-[1.12fr_0.88fr]">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.32em] text-cyan-100/72">
                Reception workspace
              </p>
              <h1 className="mt-4 font-display text-[2.2rem] leading-[0.95] sm:text-[2.8rem] md:text-[3.3rem]">
                {center.name}
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-cyan-50/92 md:text-base">
                This view is scoped to your center only. Review new registrations,
                monitor today&apos;s bookings, and open patient records without seeing the
                rest of the network.
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <span className="rounded-full border border-white/16 bg-white/12 px-4 py-2 text-sm font-semibold text-white">
                  {center.centerCode}
                </span>
                <span className="rounded-full border border-white/16 bg-white/12 px-4 py-2 text-sm font-semibold text-white">
                  {center.city.name}
                </span>
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/patients"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-[18px] bg-white px-5 py-3 text-sm font-semibold !text-black transition-transform hover:-translate-y-0.5 sm:w-auto"
                >
                  Review registrations
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/appointments"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-[18px] border border-white/18 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/16 sm:w-auto"
                >
                  Open bookings
                </Link>
              </div>
            </div>

            <div className="rounded-[26px] border border-white/14 bg-white/10 p-4 backdrop-blur sm:rounded-[28px] sm:p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-white/16">
                  <CalendarClock className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-100/74">
                    Today at your center
                  </p>
                  <p className="mt-1 text-xl font-semibold text-white sm:text-2xl">
                    {appointmentsToday} booking{appointmentsToday === 1 ? "" : "s"} scheduled
                  </p>
                </div>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-[22px] bg-white/12 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-100/72">
                    Latest registration
                  </p>
                  <p className="mt-2 text-lg font-semibold text-white">
                    {recentPatients[0]?.name ?? "No new registrations yet"}
                  </p>
                  <p className="mt-1 text-sm text-cyan-50/84">
                    {recentPatients[0]
                      ? formatPatientId(
                          recentPatients[0].id,
                          center.centerCode,
                          recentPatients[0].createdAt
                        )
                      : "New patients will appear here"}
                  </p>
                </div>
                <div className="rounded-[22px] bg-white/12 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-100/72">
                    Next booking
                  </p>
                  <p className="mt-2 text-lg font-semibold text-white">
                    {upcomingAppointments[0]
                      ? formatDateTime(upcomingAppointments[0].date)
                      : "No future bookings"}
                  </p>
                  <p className="mt-1 text-sm text-cyan-50/84">
                    {upcomingAppointments[0]?.patient.name ?? "Your queue is clear for now"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            {
              label: "Machines available",
              value: operations.readyMachines,
              detail: `${operations.totalMachines} total in the center`,
              icon: Waves,
            },
            {
              label: "Machines booked",
              value: operations.bookedMachinesToday,
              detail: `${operations.maintenanceMachines} in maintenance`,
              icon: Activity,
            },
            {
              label: "Appointments today",
              value: appointmentsToday,
              detail: "Scheduled bookings linked to this center",
              icon: CalendarClock,
            },
            {
              label: "Staff available",
              value: operations.staffAvailableToday,
              detail: `${operations.totalStaff} on the active roster`,
              icon: Stethoscope,
            },
          ].map((item) => {
            const Icon = item.icon;

            return (
              <article
                key={item.label}
                className="rounded-[28px] border border-white/80 bg-white/82 p-5 shadow-[0_24px_80px_rgba(17,124,136,0.08)] backdrop-blur-xl sm:p-6"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-cyan-50 text-cyan-700">
                  <Icon className="h-6 w-6" />
                </div>
                <p className="mt-5 text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                  {item.label}
                </p>
                <p className="mt-2 text-3xl font-semibold text-slate-900 sm:text-4xl">
                  {item.value}
                </p>
                <p className="mt-2 text-sm text-slate-500">{item.detail}</p>
              </article>
            );
          })}
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <article className="rounded-[30px] border border-white/80 bg-white/82 p-5 shadow-[0_24px_80px_rgba(17,124,136,0.08)] backdrop-blur-xl sm:rounded-[32px] sm:p-6 md:p-7">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-cyan-50 text-cyan-700">
                <HeartPulse className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                  Registrations
                </p>
                <h2 className="mt-1 font-display text-[1.75rem] leading-none text-slate-900 sm:text-[2rem]">
                  Recent patient sign-ups
                </h2>
                <p className="mt-2 text-sm text-slate-500">
                  {totalPatients} registered patient{totalPatients === 1 ? "" : "s"} currently
                  linked to {center.name}.
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              {recentPatients.length === 0 ? (
                <div className="rounded-[24px] border border-dashed border-slate-200 px-5 py-8 text-sm text-slate-500">
                  No patient registrations have been created for this center yet.
                </div>
              ) : (
                recentPatients.map((patient) => (
                  <Link
                    key={patient.id}
                    href={`/patients/${patient.id}`}
                    className="flex flex-col gap-3 rounded-[24px] bg-slate-50 px-5 py-4 transition-colors hover:bg-cyan-50/70 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="text-base font-semibold text-slate-900">{patient.name}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        Registered{" "}
                        {new Intl.DateTimeFormat("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        }).format(patient.createdAt)}
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-cyan-700 sm:text-right">
                      {formatPatientId(patient.id, center.centerCode, patient.createdAt)}
                    </span>
                  </Link>
                ))
              )}
            </div>
          </article>

          <article className="rounded-[30px] border border-white/80 bg-white/82 p-5 shadow-[0_24px_80px_rgba(17,124,136,0.08)] backdrop-blur-xl sm:rounded-[32px] sm:p-6 md:p-7">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-cyan-50 text-cyan-700">
                <CalendarClock className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                  Bookings
                </p>
                <h2 className="mt-1 font-display text-[1.75rem] leading-none text-slate-900 sm:text-[2rem]">
                  Upcoming queue
                </h2>
                <p className="mt-2 text-sm text-slate-500">
                  {totalSessions} session log{totalSessions === 1 ? "" : "s"} recorded for this
                  center so far.
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              {upcomingAppointments.length === 0 ? (
                <div className="rounded-[24px] border border-dashed border-slate-200 px-5 py-8 text-sm text-slate-500">
                  No future bookings are scheduled for this center yet.
                </div>
              ) : (
                upcomingAppointments.map((appointment) => (
                  <Link
                    key={appointment.id}
                    href={`/patients/${appointment.patient.id}`}
                    className="block rounded-[24px] bg-slate-50 px-5 py-4 transition-colors hover:bg-cyan-50/70"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-base font-semibold text-slate-900">
                          {appointment.patient.name}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          {formatDateTime(appointment.date)}
                        </p>
                      </div>
                      <span className="self-start rounded-full bg-white px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-700 shadow-sm sm:self-auto">
                        {appointment.status}
                      </span>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </article>
        </section>
      </div>
    );
  }

  const { start: today, end: tomorrow } = getIndiaDayRange(new Date());

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
            className="rounded-[28px] border border-white/80 bg-white/82 p-5 shadow-[0_24px_80px_rgba(17,124,136,0.08)] backdrop-blur-xl sm:p-6"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-cyan-50 text-cyan-700">
              <Icon className="h-6 w-6" />
            </div>
            <p className="mt-5 text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
              {item.label}
            </p>
            <p className="mt-2 text-3xl font-semibold text-slate-900 sm:text-4xl">{item.value}</p>
          </article>
        );
      })}
    </div>
  );
}
