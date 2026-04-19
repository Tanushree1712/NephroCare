import { getCurrentAppUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { getCenterScopeId, isPatientPortalUser } from "@/lib/user-access";
import { NextResponse } from "next/server";

// GET all appointments
export async function GET() {
  try {
    const currentUser = await getCurrentAppUser();

    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const centerScopeId = getCenterScopeId(currentUser);
    const appointments = await prisma.appointment.findMany({
      where:
        isPatientPortalUser(currentUser) && currentUser.patientId
          ? { patientId: currentUser.patientId }
          : centerScopeId
            ? { centerId: centerScopeId }
            : undefined,
      include: {
        patient: true,
        center: {
          include: { city: true },
        },
      },
      orderBy: {
        date: "asc",
      },
    });

    return NextResponse.json(appointments);
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

// CREATE appointment
export async function POST(req: Request) {
  try {
    const currentUser = await getCurrentAppUser();

    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const centerScopeId = getCenterScopeId(currentUser);
    const body = await req.json();
    const patientId = isPatientPortalUser(currentUser)
      ? currentUser.patientId
      : Number(body.patientId);
    const centerId = centerScopeId ?? Number(body.centerId);
    const appointmentDate = body.date ? new Date(body.date) : null;

    if (!patientId || !Number.isInteger(centerId) || !appointmentDate) {
      return NextResponse.json(
        { error: "Missing fields" },
        { status: 400 }
      );
    }

    if (Number.isNaN(appointmentDate.getTime())) {
      return NextResponse.json(
        { error: "A valid appointment date is required" },
        { status: 400 }
      );
    }

    if (centerScopeId) {
      const patient = await prisma.patient.findFirst({
        where: {
          id: patientId,
          centerId: centerScopeId,
        },
        select: { id: true },
      });

      if (!patient) {
        return NextResponse.json(
          { error: "You can only create bookings for your assigned center." },
          { status: 403 }
        );
      }
    }

    const appointment = await prisma.appointment.create({
      data: {
        patientId,
        centerId,
        date: appointmentDate,
      },
    });

    return NextResponse.json(appointment);
  } catch {
    return NextResponse.json({ error: "Failed to create" }, { status: 500 });
  }
}
