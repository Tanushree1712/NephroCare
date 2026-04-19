import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  CalendarClock,
  HeartPulse,
  ShieldPlus,
  Stethoscope,
  Users,
} from "lucide-react";
import { getCenterOperationsSummary } from "@/lib/center-capacity";
import { getAppointmentSlotOption, isAppointmentSlot } from "@/lib/appointment-slots";
import { getCurrentAppUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { getCenterScopeId } from "@/lib/user-access";

const availabilityClasses = {
  available: "bg-emerald-50 text-emerald-700 border border-emerald-100",
  away: "bg-slate-100 text-slate-600 border border-slate-200",
} as const;

export default async function StaffPage() {
  const currentUser = await getCurrentAppUser();

  if (!currentUser) {
    redirect("/center-login");
  }

  const centerScopeId = getCenterScopeId(currentUser);

  if (!centerScopeId) {
    redirect("/");
  }

  const now = new Date();

  const [center, summary, staff] = await Promise.all([
    prisma.center.findUnique({
      where: { id: centerScopeId },
      include: {
        city: true,
      },
    }),
    getCenterOperationsSummary(prisma, {
      centerId: centerScopeId,
      referenceDate: now,
    }),
    prisma.staffMember.findMany({
      where: {
        centerId: centerScopeId,
      },
      orderBy: {
        code: "asc",
      },
    }),
  ]);

  if (!center) {
    redirect("/center-login");
  }

  const cliniciansOnDuty = staff.filter(
    (member) =>
      member.isAvailableToday &&
      (member.role.toLowerCase().includes("doctor") ||
        member.role.toLowerCase().includes("nurse") ||
        member.role.toLowerCase().includes("nephrologist"))
  ).length;
  const supportOnDuty = summary.staffAvailableToday - cliniciansOnDuty;

  return (
    <div className="space-y-6">
      <section className="rounded-[30px] bg-[linear-gradient(135deg,#083844_0%,#0f8797_44%,#21c7d9_100%)] px-5 py-6 text-white shadow-[0_24px_80px_rgba(10,120,132,0.22)] sm:rounded-[34px] sm:px-6 sm:py-7 md:px-8 md:py-8">
        <div className="grid gap-8 xl:grid-cols-[1.08fr_0.92fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-100/74">
              Staff management
            </p>
            <h1 className="mt-4 font-display text-[2.2rem] leading-[0.95] sm:text-[2.8rem]">
              View the on-duty team for {center.name}.
            </h1>
            <p className="mt-5 max-w-2xl text-sm leading-7 text-cyan-50/92">
              Reception can now rely on the live staff roster behind the booking engine,
              so the team visible here is the same team used to validate patient slot
              capacity.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/appointments"
                className="inline-flex w-full items-center justify-center gap-2 rounded-[18px] bg-white px-5 py-3 text-sm font-semibold !text-black transition-transform hover:-translate-y-0.5 sm:w-auto"
              >
                Review appointments
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/machines"
                className="inline-flex w-full items-center justify-center gap-2 rounded-[18px] border border-white/18 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/16 sm:w-auto"
              >
                Open machines
              </Link>
            </div>
          </div>

          <div className="rounded-[28px] border border-white/14 bg-white/10 p-4 backdrop-blur sm:rounded-[30px] sm:p-5 md:p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-white/14">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-100/72">
                  Staff coverage
                </p>
                <h2 className="mt-1 font-display text-[1.75rem] leading-none text-white sm:text-[2rem]">
                  {summary.staffAvailableToday} on duty today
                </h2>
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-[22px] bg-white/12 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-100/72">
                  Clinicians
                </p>
                <p className="mt-2 text-lg font-semibold text-white">{cliniciansOnDuty}</p>
                <p className="mt-1 text-sm text-cyan-50/84">
                  Doctors and nurses currently marked available
                </p>
              </div>
              <div className="rounded-[22px] bg-white/12 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-100/72">
                  Support crew
                </p>
                <p className="mt-2 text-lg font-semibold text-white">
                  {Math.max(supportOnDuty, 0)}
                </p>
                <p className="mt-1 text-sm text-cyan-50/84">
                  Technicians, desk, and floor support
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Available today", value: summary.staffAvailableToday, icon: Users },
          { label: "Team members", value: summary.totalStaff, icon: ShieldPlus },
          { label: "Appointments today", value: summary.totalAppointmentsToday, icon: CalendarClock },
          { label: "Clinical cover", value: cliniciansOnDuty, icon: HeartPulse },
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
      </section>

      <section className="rounded-[30px] border border-white/80 bg-white/82 p-5 shadow-[0_24px_80px_rgba(17,124,136,0.08)] backdrop-blur-xl sm:rounded-[32px] sm:p-6 md:p-7">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
              Staff roster
            </p>
            <h2 className="mt-2 font-display text-[1.75rem] leading-none text-slate-900 sm:text-[2rem]">
              Today&apos;s availability
            </h2>
          </div>
          <p className="max-w-xl text-sm leading-6 text-slate-500">
            Each team member carries slot coverage information that is used by the booking
            engine, so this view stays aligned with the actual appointment rules.
          </p>
        </div>

        <div className="mt-8 space-y-4">
          {staff.map((member) => (
            <article
              key={member.id}
              className="grid gap-4 rounded-[28px] bg-slate-50 p-5 lg:grid-cols-[1.05fr_0.95fr_auto]"
            >
              <div>
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-white text-cyan-700 shadow-sm">
                    <Stethoscope className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-slate-900">{member.name}</p>
                    <p className="mt-1 text-sm text-slate-500">{member.role}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-400">
                      {member.code}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-1">
                <div className="rounded-[20px] bg-white px-4 py-3 text-sm text-slate-600">
                  <p className="font-semibold text-slate-900">Specialization</p>
                  <p className="mt-1">{member.specialization || "General dialysis support"}</p>
                </div>
                <div className="rounded-[20px] bg-white px-4 py-3 text-sm text-slate-600">
                  <p className="font-semibold text-slate-900">Shift</p>
                  <p className="mt-1">{member.shiftLabel}</p>
                  <p className="mt-2 text-xs uppercase tracking-[0.2em] text-slate-400">
                    {member.phone || "No contact number stored"}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {member.availableSlots.map((slot) =>
                      isAppointmentSlot(slot) ? (
                        <span
                          key={slot}
                          className="rounded-full bg-cyan-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-700"
                        >
                          {getAppointmentSlotOption(slot).label}
                        </span>
                      ) : null
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center">
                <span
                  className={`self-start rounded-full px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] ${
                    member.isAvailableToday
                      ? availabilityClasses.available
                      : availabilityClasses.away
                  }`}
                >
                  {member.isAvailableToday ? "Available" : "Off shift"}
                </span>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
