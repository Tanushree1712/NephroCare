import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Activity,
  ArrowRight,
  CalendarClock,
  ShieldPlus,
  Waves,
} from "lucide-react";
import { getCenterOperationsSummary } from "@/lib/center-capacity";
import { getIndiaDayRange } from "@/lib/appointment-slots";
import { getCurrentAppUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { getCenterScopeId } from "@/lib/user-access";

const statusClasses = {
  available: "bg-emerald-50 text-emerald-700 border border-emerald-100",
  maintenance: "bg-rose-50 text-rose-700 border border-rose-100",
  inactive: "bg-slate-100 text-slate-600 border border-slate-200",
} as const;

const statusLabels = {
  available: "Available",
  maintenance: "Maintenance",
  inactive: "Inactive",
} as const;

export default async function MachinesPage() {
  const currentUser = await getCurrentAppUser();

  if (!currentUser) {
    redirect("/center-login");
  }

  const centerScopeId = getCenterScopeId(currentUser);

  if (!centerScopeId) {
    redirect("/");
  }

  const now = new Date();
  const { start, end } = getIndiaDayRange(now);

  const [center, summary, machines, appointmentsToday] = await Promise.all([
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
    prisma.machine.findMany({
      where: {
        centerId: centerScopeId,
      },
      orderBy: {
        code: "asc",
      },
    }),
    prisma.appointment.findMany({
      where: {
        centerId: centerScopeId,
        status: "scheduled",
        date: {
          gte: start,
          lt: end,
        },
      },
      select: {
        machineId: true,
      },
    }),
  ]);

  if (!center) {
    redirect("/center-login");
  }

  const machineBookingsToday = appointmentsToday.reduce<Record<number, number>>((counts, appointment) => {
    if (appointment.machineId) {
      counts[appointment.machineId] = (counts[appointment.machineId] ?? 0) + 1;
    }

    return counts;
  }, {});

  const utilization =
    summary.readyMachines === 0
      ? 0
      : Math.round((summary.bookedMachinesToday / summary.readyMachines) * 100);

  return (
    <div className="space-y-6">
      <section className="rounded-[30px] bg-[linear-gradient(135deg,#073d48_0%,#0f98a2_48%,#17bfd3_100%)] px-5 py-6 text-white shadow-[0_24px_80px_rgba(10,120,132,0.22)] sm:rounded-[34px] sm:px-6 sm:py-7 md:px-8 md:py-8">
        <div className="grid gap-8 xl:grid-cols-[1.08fr_0.92fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-100/74">
              Machine management
            </p>
            <h1 className="mt-4 font-display text-[2.2rem] leading-[0.95] sm:text-[2.8rem]">
              Keep {center.name} machine-ready.
            </h1>
            <p className="mt-5 max-w-2xl text-sm leading-7 text-cyan-50/92">
              Review the live machine inventory for your center, see how much of today&apos;s
              queue is already assigned, and spot maintenance windows before they affect
              reception planning.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/appointments"
                className="inline-flex w-full items-center justify-center gap-2 rounded-[18px] bg-white px-5 py-3 text-sm font-semibold !text-black transition-transform hover:-translate-y-0.5 sm:w-auto"
              >
                Open bookings
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/staff"
                className="inline-flex w-full items-center justify-center gap-2 rounded-[18px] border border-white/18 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/16 sm:w-auto"
              >
                View on-duty staff
              </Link>
            </div>
          </div>

          <div className="rounded-[28px] border border-white/14 bg-white/10 p-4 backdrop-blur sm:rounded-[30px] sm:p-5 md:p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-white/14">
                <Waves className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-100/72">
                  Center capacity
                </p>
                <h2 className="mt-1 font-display text-[1.75rem] leading-none text-white sm:text-[2rem]">
                  {summary.readyMachines} ready today
                </h2>
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-[22px] bg-white/12 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-100/72">
                  Machines booked
                </p>
                <p className="mt-2 text-lg font-semibold text-white">
                  {summary.bookedMachinesToday} of {summary.readyMachines}
                </p>
                <p className="mt-1 text-sm text-cyan-50/84">
                  Based on today&apos;s scheduled appointment queue
                </p>
              </div>
              <div className="rounded-[22px] bg-white/12 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-100/72">
                  Utilization
                </p>
                <p className="mt-2 text-lg font-semibold text-white">{utilization}%</p>
                <p className="mt-1 text-sm text-cyan-50/84">
                  {summary.maintenanceMachines} under maintenance today
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Total machines", value: summary.totalMachines, icon: Waves },
          { label: "Ready", value: summary.readyMachines, icon: ShieldPlus },
          { label: "Booked today", value: summary.bookedMachinesToday, icon: CalendarClock },
          { label: "Maintenance", value: summary.maintenanceMachines, icon: Activity },
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
              Machine deck
            </p>
            <h2 className="mt-2 font-display text-[1.75rem] leading-none text-slate-900 sm:text-[2rem]">
              Center inventory
            </h2>
          </div>
          <p className="max-w-xl text-sm leading-6 text-slate-500">
            These machines are now database-backed, so center capacity and patient booking
            checks use the same source of truth.
          </p>
        </div>

        <div className="mt-8 grid gap-4 xl:grid-cols-2">
          {machines.map((machine) => {
            const bookingCount = machineBookingsToday[machine.id] ?? 0;
            const machineStatus =
              machine.status === "maintenance"
                ? "maintenance"
                : machine.isActive
                  ? "available"
                  : "inactive";

            return (
              <article
                key={machine.id}
                className="rounded-[28px] bg-slate-50 p-5 transition-transform hover:-translate-y-0.5"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                      {machine.code}
                    </p>
                    <h3 className="mt-2 text-xl font-semibold text-slate-900">{machine.model}</h3>
                    <p className="mt-1 text-sm text-slate-500">{machine.manufacturer}</p>
                  </div>
                  <span
                    className={`self-start rounded-full px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] ${statusClasses[machineStatus]}`}
                  >
                    {statusLabels[machineStatus]}
                  </span>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-[22px] bg-white px-4 py-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                      Notes
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-700">
                      {machine.notes || "No center note added yet."}
                    </p>
                  </div>
                  <div className="rounded-[22px] bg-white px-4 py-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                      Today&apos;s assignments
                    </p>
                    <p className="mt-2 text-3xl font-semibold text-slate-900">{bookingCount}</p>
                    <p className="mt-1 text-sm text-slate-500">
                      Scheduled booking{bookingCount === 1 ? "" : "s"} using this machine
                    </p>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
