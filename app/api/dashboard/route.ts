import { NextResponse } from "next/server";
import { getCurrentAppUser } from "@/lib/current-user";
import { getCenterOperationsSummary } from "@/lib/center-capacity";
import { getIndiaDayRange } from "@/lib/appointment-slots";
import { prisma } from "@/lib/prisma";
import { getCenterScopeId, isPatientPortalUser } from "@/lib/user-access";

export async function GET() {
  try {
    const currentUser = await getCurrentAppUser();

    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (isPatientPortalUser(currentUser)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const centerScopeId = getCenterScopeId(currentUser);
    const now = new Date();
    const { start: today, end: tomorrow } = getIndiaDayRange(now);

    const [totalPatients, totalSessions, centerDistributionRaw, centers] = await Promise.all([
      prisma.patient.count({
        where: centerScopeId ? { centerId: centerScopeId } : undefined,
      }),
      prisma.session.count({
        where: centerScopeId
          ? {
              appointment: {
                centerId: centerScopeId,
              },
            }
          : undefined,
      }),
      prisma.patient.groupBy({
        by: ["centerId"],
        where: centerScopeId ? { centerId: centerScopeId } : undefined,
        _count: {
          id: true,
        },
        orderBy: {
          _count: { id: "desc" },
        },
      }),
      prisma.center.findMany({
        where: centerScopeId ? { id: centerScopeId } : undefined,
        include: { city: true },
      }),
    ]);

    const operations = centerScopeId
      ? await getCenterOperationsSummary(prisma, {
          centerId: centerScopeId,
          referenceDate: now,
        })
      : null;

    const centersMap = centers.reduce<Record<number, string>>((accumulator, center) => {
      accumulator[center.id] = `${center.name}, ${center.city.name}`;
      return accumulator;
    }, {});

    const centerDistribution = centerDistributionRaw.map((distribution) => ({
      name: centersMap[distribution.centerId] || "Unknown",
      count: distribution._count.id,
    }));

    const appointmentsToday =
      operations?.totalAppointmentsToday ??
      (await prisma.appointment.count({
        where: {
          ...(centerScopeId ? { centerId: centerScopeId } : {}),
          date: {
            gte: today,
            lt: tomorrow,
          },
          status: "scheduled",
        },
      }));

    return NextResponse.json({
      totalPatients,
      totalSessions,
      appointmentsToday,
      machineAvailability: operations
        ? {
            total: operations.totalMachines,
            ready: operations.readyMachines,
            bookedToday: operations.bookedMachinesToday,
            maintenance: operations.maintenanceMachines,
          }
        : null,
      staffAvailability: operations
        ? {
            total: operations.totalStaff,
            availableToday: operations.staffAvailableToday,
          }
        : null,
      centerDistribution,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to load dashboard data" },
      { status: 500 }
    );
  }
}
