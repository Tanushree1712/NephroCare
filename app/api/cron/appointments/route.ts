import { NextResponse } from "next/server";
import { getCronSecret } from "@/lib/env";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const cronSecret = getCronSecret();
  const authHeader = request.headers.get("authorization");

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();

    const expiredAppointments = await prisma.appointment.findMany({
      where: {
        date: {
          lt: now,
        },
        status: "scheduled",
        sessions: {
          none: {},
        },
      },
    });

    if (expiredAppointments.length === 0) {
      return NextResponse.json({
        message: "System sweep complete: 0 expired appointments found.",
      });
    }

    const ids = expiredAppointments.map((appointment) => appointment.id);

    const updated = await prisma.appointment.updateMany({
      where: {
        id: { in: ids },
      },
      data: {
        status: "missed",
      },
    });

    return NextResponse.json({
      message: `System sweep complete: Marked ${updated.count} expired appointments as missed.`,
      updatedIds: ids,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to execute background sweep." },
      { status: 500 }
    );
  }
}
