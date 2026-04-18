import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const now = new Date();
    
    // Find scheduled appointments where the date is in the past
    // and no sessions were actually logged.
    const expiredAppointments = await prisma.appointment.findMany({
      where: {
        date: {
          lt: now
        },
        status: "scheduled",
        sessions: {
          none: {} // Must have NO related sessions
        }
      }
    });

    if (expiredAppointments.length === 0) {
      return NextResponse.json({ message: "System sweep complete: 0 expired appointments found." });
    }

    const ids = expiredAppointments.map((a) => a.id);

    const updated = await prisma.appointment.updateMany({
      where: {
        id: { in: ids }
      },
      data: {
        status: "missed"
      }
    });

    return NextResponse.json({ 
      message: `System sweep complete: Marked ${updated.count} expired appointments as missed.`,
      updatedIds: ids
    });

  } catch {
    return NextResponse.json({ error: "Failed to execute background sweep." }, { status: 500 });
  }
}
