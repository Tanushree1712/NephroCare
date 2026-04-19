import { NextResponse } from "next/server";
import { getCurrentAppUser } from "@/lib/current-user";
import {
  getAppointmentSlotFromDate,
  getIndiaDayRange,
  isAppointmentSlot,
} from "@/lib/appointment-slots";
import { getCenterBookingAvailability } from "@/lib/center-capacity";
import { prisma } from "@/lib/prisma";
import { getCenterScopeId, isPatientPortalUser } from "@/lib/user-access";

function buildCapacityErrorMessage(machineCapacity: number, staffCapacity: number) {
  if (machineCapacity === 0) {
    return "No dialysis machines are currently available for that slot.";
  }

  if (staffCapacity === 0) {
    return "No staff are currently available for that slot.";
  }

  return "That slot is already full for the selected center.";
}

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
        machine: true,
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
    const slotValue =
      typeof body.slot === "string" && isAppointmentSlot(body.slot.trim().toUpperCase())
        ? body.slot.trim().toUpperCase()
        : appointmentDate
          ? getAppointmentSlotFromDate(appointmentDate)
          : null;

    if (!patientId || !Number.isInteger(centerId) || !appointmentDate || !slotValue) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    if (Number.isNaN(appointmentDate.getTime())) {
      return NextResponse.json(
        { error: "A valid appointment date is required" },
        { status: 400 }
      );
    }

    if (appointmentDate.getTime() < Date.now()) {
      return NextResponse.json(
        { error: "Appointments can only be created for future slots." },
        { status: 400 }
      );
    }

    const [patient, center] = await Promise.all([
      prisma.patient.findUnique({
        where: { id: patientId },
        select: { id: true, centerId: true },
      }),
      prisma.center.findUnique({
        where: { id: centerId },
        select: { id: true },
      }),
    ]);

    if (!patient) {
      return NextResponse.json({ error: "Patient not found." }, { status: 404 });
    }

    if (!center) {
      return NextResponse.json({ error: "Center not found." }, { status: 404 });
    }

    if (centerScopeId && (patient.centerId !== centerScopeId || centerId !== centerScopeId)) {
      return NextResponse.json(
        { error: "You can only create bookings for your assigned center." },
        { status: 403 }
      );
    }

    const { start, end } = getIndiaDayRange(appointmentDate);
    const existingBooking = await prisma.appointment.findFirst({
      where: {
        patientId,
        status: "scheduled",
        slot: slotValue,
        date: {
          gte: start,
          lt: end,
        },
      },
      select: { id: true },
    });

    if (existingBooking) {
      return NextResponse.json(
        { error: "This patient already has a scheduled appointment in that slot." },
        { status: 409 }
      );
    }

    const appointment = await prisma.$transaction(async (tx) => {
      const availability = await getCenterBookingAvailability(tx, {
        centerId,
        scheduledAt: appointmentDate,
        slot: slotValue,
      });

      if (!availability.canBook) {
        throw new Error(
          buildCapacityErrorMessage(
            availability.machineCapacity,
            availability.staffCapacity
          )
        );
      }

      return tx.appointment.create({
        data: {
          patientId,
          centerId,
          date: appointmentDate,
          slot: slotValue,
          machineId: availability.nextMachineId,
        },
        include: {
          patient: true,
          machine: true,
          center: {
            include: {
              city: true,
            },
          },
        },
      });
    });

    return NextResponse.json(appointment, { status: 201 });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }

    return NextResponse.json({ error: "Failed to create" }, { status: 500 });
  }
}
