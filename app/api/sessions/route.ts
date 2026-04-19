import { getCurrentAppUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { getCenterScopeId, isPatientPortalUser } from "@/lib/user-access";
import { NextResponse } from "next/server";

// GET sessions
export async function GET() {
  try {
    const currentUser = await getCurrentAppUser();

    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const centerScopeId = getCenterScopeId(currentUser);
    const sessions = await prisma.session.findMany({
      where:
        isPatientPortalUser(currentUser) && currentUser.patientId
          ? { patientId: currentUser.patientId }
          : centerScopeId
            ? {
                appointment: {
                  centerId: centerScopeId,
                },
              }
            : undefined,
      include: {
        patient: true,
        appointment: {
          include: {
            center: {
              include: { city: true },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(sessions);
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

// CREATE session
export async function POST(req: Request) {
  try {
    const currentUser = await getCurrentAppUser();

    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (isPatientPortalUser(currentUser)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const centerScopeId = getCenterScopeId(currentUser);
    const body = await req.json();
    const patientId = Number(body.patientId);
    const appointmentId = Number(body.appointmentId);

    if (!Number.isInteger(patientId) || !Number.isInteger(appointmentId)) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      select: {
        patientId: true,
        centerId: true,
      },
    });

    if (!appointment) {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
    }

    if (appointment.patientId !== patientId) {
      return NextResponse.json(
        { error: "The selected appointment does not belong to this patient." },
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

      if (!patient || appointment.centerId !== centerScopeId) {
        return NextResponse.json(
          { error: "You can only add session logs for your assigned center." },
          { status: 403 }
        );
      }
    }

    const session = await prisma.session.create({
      data: {
        patientId,
        appointmentId,
        weightBefore: body.weightBefore
          ? Number(body.weightBefore)
          : null,
        weightAfter: body.weightAfter
          ? Number(body.weightAfter)
          : null,
        bp: body.bp,
        notes: body.notes,
      },
    });

    return NextResponse.json(session);
  } catch {
    return NextResponse.json({ error: "Failed to create" }, { status: 500 });
  }
}
