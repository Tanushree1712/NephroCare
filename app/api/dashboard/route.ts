import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // 1. Overall Totals
    const totalPatients = await prisma.patient.count();
    const totalSessions = await prisma.session.count();

    // 2. Appointments Today
    const appointmentsToday = await prisma.appointment.count({
      where: {
        date: {
          gte: today,
          lt: tomorrow,
        },
        status: "scheduled"
      },
    });

    // 3. Center/City Patient Distribution
    const centerDistributionRaw = await prisma.patient.groupBy({
      by: ['centerId'],
      _count: {
        id: true,
      },
      orderBy: {
        _count: { id: 'desc' }
      }
    });

    const centers = await prisma.center.findMany({
      include: { city: true }
    });

    const centersMap = centers.reduce<Record<number, string>>((acc, center) => {
      acc[center.id] = `${center.name}, ${center.city.name}`;
      return acc;
    }, {});

    const centerDistribution = centerDistributionRaw.map((distribution) => ({
      name: centersMap[distribution.centerId] || 'Unknown',
      count: distribution._count.id
    }));

    return NextResponse.json({
      totalPatients,
      totalSessions,
      appointmentsToday,
      centerDistribution
    });

  } catch {
    return NextResponse.json(
      { error: "Failed to load dashboard data" },
      { status: 500 }
    );
  }
}
