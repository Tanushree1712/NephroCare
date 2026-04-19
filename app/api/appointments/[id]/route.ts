import { getCurrentAppUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { getCenterScopeId, isPatientPortalUser } from "@/lib/user-access";
import { NextResponse } from "next/server";

const allowedStatuses = new Set(["scheduled", "completed", "missed", "cancelled"]);

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentAppUser();

    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (isPatientPortalUser(currentUser)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const centerScopeId = getCenterScopeId(currentUser);
    const resolvedParams = await params;
    const appointmentId = Number(resolvedParams.id);
    const body = await req.json();

    if (!Number.isInteger(appointmentId) || appointmentId < 1) {
      return NextResponse.json({ error: "Invalid appointment ID" }, { status: 400 });
    }

    if (!body.status || typeof body.status !== "string") {
      return NextResponse.json(
        { error: "Status is required" },
        { status: 400 }
      );
    }

    const status = body.status.toLowerCase();

    if (!allowedStatuses.has(status)) {
      return NextResponse.json({ error: "Invalid status." }, { status: 400 });
    }

    if (centerScopeId) {
      const appointment = await prisma.appointment.findFirst({
        where: {
          id: appointmentId,
          centerId: centerScopeId,
        },
        select: { id: true },
      });

      if (!appointment) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }
    }

    const appointment = await prisma.appointment.update({
      where: { id: appointmentId },
      data: { status },
    });

    return NextResponse.json(appointment);
  } catch {
    return NextResponse.json({ error: "Failed to update appointment" }, { status: 500 });
  }
}
