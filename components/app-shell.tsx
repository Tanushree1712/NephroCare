"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  CalendarPlus2,
  CalendarRange,
  FileHeart,
  HeartHandshake,
  House,
  LogOut,
  Sparkles,
  Stethoscope,
  Users,
  Waves,
} from "lucide-react";
import type { CurrentAppUser } from "@/lib/current-user";
import { getUserPortalKind } from "@/lib/user-access";

type AppShellProps = {
  children: ReactNode;
  user: CurrentAppUser | null;
};

function isActiveRoute(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/";
  }

  return pathname.startsWith(href);
}

export function AppShell({ children, user }: AppShellProps) {
  const pathname = usePathname();
  const isAuthRoute =
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/forgot-password" ||
    pathname === "/update-password";

  if (!user || isAuthRoute) {
    return <>{children}</>;
  }

  const portalKind = getUserPortalKind(user);
  const isPatientPortal = portalKind === "patient";
  const isCenterPortal = portalKind === "center";

  const patientNavigation = [
    { href: "/", label: "Home", compactLabel: "Home", icon: House },
    { href: "/book", label: "Find a session", compactLabel: "Book", icon: CalendarPlus2 },
    user.patientId
      ? {
          href: `/patients/${user.patientId}`,
          label: "My profile",
          compactLabel: "Profile",
          icon: FileHeart,
        }
      : null,
  ].filter(Boolean) as Array<{
    href: string;
    label: string;
    compactLabel: string;
    icon: typeof House;
  }>;

  const centerNavigation = [
    { href: "/", label: "Dashboard", compactLabel: "Home", icon: House },
    { href: "/patients", label: "Patients", compactLabel: "Patients", icon: Users },
    {
      href: "/appointments",
      label: "Appointments",
      compactLabel: "Bookings",
      icon: CalendarRange,
    },
    { href: "/machines", label: "Machines", compactLabel: "Machines", icon: Waves },
    { href: "/staff", label: "Staff", compactLabel: "Staff", icon: Stethoscope },
  ];

  const adminNavigation = [
    { href: "/", label: "Dashboard", compactLabel: "Home", icon: House },
    { href: "/patients", label: "Patients", compactLabel: "Patients", icon: Users },
    {
      href: "/appointments",
      label: "Appointments",
      compactLabel: "Bookings",
      icon: CalendarRange,
    },
  ];

  const navigation = isPatientPortal
    ? patientNavigation
    : isCenterPortal
      ? centerNavigation
      : adminNavigation;
  const initials = user.name
    .split(" ")
    .map((name) => name[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const shellTitle = isPatientPortal
    ? "Patient App"
    : isCenterPortal
      ? "Center Desk"
      : "Operations";
  const shellEyebrow = isPatientPortal ? "NephroCare" : "NephroCare+";
  const headerEyebrow = isPatientPortal
    ? "Patient portal"
    : isCenterPortal
      ? "Center operations"
      : "Operations";
  const headerTitle = isPatientPortal
    ? "Your care hub"
    : isCenterPortal
      ? "Reception dashboard"
      : "Clinical workspace";
  const primaryActionHref = isPatientPortal ? "/book" : "/appointments";
  const primaryActionLabel = isPatientPortal
    ? "Book a session"
    : isCenterPortal
      ? "Open center bookings"
      : "Open schedule";
  const signOutRedirect = isCenterPortal ? "/center-login" : "/login";
  const promoCopy = isPatientPortal
    ? "Keep your dialysis details, bookings, and center preferences in one calm, patient-friendly space."
    : isCenterPortal
      ? "Review registrations, bookings, machine readiness, and on-duty staff for your assigned center without the noise of the wider network."
      : "Stay on top of registrations, appointments, and clinical coordination across the NephroCare network.";
  return (
    <div className="relative min-h-screen">
      <div className="mx-auto flex w-full max-w-[1480px] gap-4 px-3 py-4 sm:px-4 sm:py-5 lg:gap-6 lg:px-6 lg:py-6">
        <aside className="hidden w-[280px] shrink-0 flex-col gap-6 lg:flex">
          <div className="rounded-[30px] border border-white/70 bg-white/78 p-6 shadow-[0_24px_80px_rgba(17,124,136,0.12)] backdrop-blur-xl">
            <Link href="/" className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-[linear-gradient(135deg,#17bfd3_0%,#0e9a9d_100%)] text-white shadow-[0_14px_30px_rgba(20,190,211,0.25)]">
                <Activity className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                  {shellEyebrow}
                </p>
                <h1 className="font-display text-2xl text-slate-900">{shellTitle}</h1>
              </div>
            </Link>

            <nav className="mt-8 flex flex-col gap-2">
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = isActiveRoute(pathname, item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`group flex items-center gap-3 rounded-[22px] px-4 py-3 text-sm font-semibold transition-all ${
                      isActive
                        ? "bg-[linear-gradient(135deg,#1cc6d8_0%,#129aa1_100%)] text-white shadow-[0_16px_30px_rgba(18,154,161,0.22)]"
                        : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900"
                    }`}
                  >
                    <span
                      className={`flex h-10 w-10 items-center justify-center rounded-2xl ${
                        isActive
                          ? "bg-white/18 text-white"
                          : "bg-slate-100 text-slate-500 transition-colors group-hover:bg-white group-hover:text-teal-600"
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                    </span>
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="mt-8 rounded-[24px] bg-slate-950 px-5 py-5 text-white shadow-[0_24px_48px_rgba(15,23,42,0.2)]">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-sm font-bold">
                  {initials || "NC"}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-base font-bold">{user.name}</p>
                  <p className="text-xs uppercase tracking-[0.24em] text-cyan-200/80">
                    {user.role}
                  </p>
                </div>
              </div>

              <form action="/auth/signout" method="post" className="mt-5">
                <input type="hidden" name="redirectTo" value={signOutRedirect} />
                <button
                  type="submit"
                  className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
              </form>
            </div>
          </div>

          <div className="rounded-[30px] bg-[linear-gradient(135deg,#0f8f9d_0%,#1bc4d6_100%)] p-6 text-white shadow-[0_24px_80px_rgba(18,166,183,0.22)]">
            <div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-white/14">
              <HeartHandshake className="h-6 w-6" />
            </div>
            <h2 className="mt-5 font-display text-[1.75rem] leading-none">
              Care that feels personal.
            </h2>
            <p className="mt-3 text-sm leading-6 text-cyan-50/92">
              {promoCopy}
            </p>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="rounded-[24px] border border-white/70 bg-white/75 px-4 py-4 shadow-[0_24px_80px_rgba(20,139,152,0.08)] backdrop-blur-xl sm:rounded-[28px] sm:px-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[18px] bg-[linear-gradient(135deg,#17bfd3_0%,#0e9a9d_100%)] text-white shadow-[0_14px_30px_rgba(20,190,211,0.22)] lg:hidden">
                  <Activity className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                    {headerEyebrow}
                  </p>
                  <h2 className="font-display text-[1.55rem] leading-none text-slate-900 sm:text-[1.9rem]">
                    {headerTitle}
                  </h2>
                </div>
              </div>

              <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
                <Link
                  href={primaryActionHref}
                  className="inline-flex items-center justify-center gap-2 rounded-[18px] bg-[linear-gradient(135deg,#17bfd3_0%,#0e9a9d_100%)] px-4 py-3 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(20,190,211,0.25)] transition-transform hover:-translate-y-0.5"
                >
                  <Sparkles className="h-4 w-4" />
                  {primaryActionLabel}
                </Link>
                <div className="hidden rounded-[18px] border border-slate-200/80 bg-white/80 px-4 py-3 text-sm text-slate-600 sm:block">
                  Signed in as <span className="font-semibold text-slate-900">{user.email}</span>
                </div>
              </div>
            </div>
          </header>

          <main className="pb-28 pt-6 sm:pb-32 lg:pb-6">{children}</main>
        </div>
      </div>

      <div className="fixed bottom-3 left-1/2 z-40 w-[calc(100%-1rem)] max-w-[560px] -translate-x-1/2 rounded-[26px] border border-white/80 bg-white/88 p-2 shadow-[0_20px_60px_rgba(15,118,128,0.18)] backdrop-blur-xl lg:hidden sm:bottom-4 sm:w-[calc(100%-2rem)] sm:rounded-[28px]">
        <div className="scrollbar-hidden flex gap-2 overflow-x-auto">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = isActiveRoute(pathname, item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex min-w-[76px] flex-1 shrink-0 flex-col items-center gap-1 rounded-[20px] px-3 py-3 text-[11px] font-semibold transition-colors sm:text-xs ${
                  isActive
                    ? "bg-[linear-gradient(135deg,#17bfd3_0%,#0e9a9d_100%)] text-white"
                    : "text-slate-500"
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="whitespace-nowrap">{item.compactLabel}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
